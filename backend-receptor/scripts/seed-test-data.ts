import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

import { Area } from '../src/areas/domain/entities/area.entity';
import { Department } from '../src/departments/domain/entities/department.entity';
import { Device } from '../src/devices/domain/entities/device.entity';
import { DeviceSignal } from '../src/device-signals/domain/entities/device-signal.entity';
import { RawSignal } from '../src/signals/domain/entities/raw-signal.entity';
import { ProcessedSignal } from '../src/signals/domain/entities/processed-signal.entity';
import { Event, EventStatus } from '../src/events/domain/entities/event.entity';
import { AreaDowntime } from '../src/area-downtime/domain/entities/area-downtime.entity';
import { AreaDowntimeEvent } from '../src/area-downtime/domain/entities/area-downtime-event.entity';

dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Datos de prueba para el pipeline de señales: RawSignal -> ProcessedSignal
 * -> DeviceSignal (catálogo) -> Event (paro registrado por área/departamento)
 * -> AreaDowntime (tiempo real de línea detenida).
 *
 * El patrón de generación (frecuencia diaria, solapes, duraciones) es
 * estático y determinista; sólo las fechas se calculan en tiempo de
 * ejecución a partir de "hoy" hacia atrás (ventana de 2 meses / 60 días),
 * así que el script produce siempre el mismo resultado relativo sin
 * necesidad de tocarlo cada vez que se corre.
 *
 * Volumen objetivo: hasta 3 eventos por día, la mayoría de días con 1-2,
 * pocos días sin eventos.
 *
 * Escenario de solape (2-3 veces por semana): dos eventos de la misma área
 * pero distinto departamento se traslapan en el tiempo (el segundo empieza
 * antes de que cierre el primero). El motor de AreaDowntime del backend
 * (ver area-downtime.service.ts) fusiona ambos en un único AreaDowntime
 * cuyo `startAt` es el inicio del primer evento y `endsAt` es el cierre del
 * último evento en cerrarse -- no la suma de los dos paros por separado.
 * Como este script inserta el histórico directamente en la base de datos
 * (sin pasar por el handler en vivo), calcula y siembra ese mismo resultado
 * en `area_downtimes` / `area_downtime_events` para que el escenario quede
 * demostrado también en esas tablas.
 */

const AREA_NAMES = ['Linea 1', 'Linea 2', 'Linea 3', 'Linea 4', 'Linea 5'];

const DEPARTMENTS = [
  { name: 'Mantenimiento', htmlColor: '#3b82f6', code: 'MAN' },
  { name: 'Ingenieria', htmlColor: '#a855f7', code: 'ING' },
  { name: 'Materiales', htmlColor: '#f97316', code: 'MAT' },
  { name: 'Calidad', htmlColor: '#22c55e', code: 'CAL' },
];

const REASONS: Record<string, { reason: string; comment: string }> = {
  MAN: {
    reason: 'Falla mecánica en banda transportadora',
    comment: 'Se requirió cambio de rodamiento y ajuste de tensión de banda.',
  },
  ING: {
    reason: 'Ajuste de parámetros de proceso',
    comment: 'Recalibración de sensores de posición por cambio de producto.',
  },
  MAT: {
    reason: 'Desabasto de materia prima',
    comment: 'Línea detenida en espera de reabastecimiento desde almacén central.',
  },
  CAL: {
    reason: 'Retención por control de calidad',
    comment: 'Lote retenido para inspección dimensional antes de continuar.',
  },
};

const SEED_MARKER = '[SEED-TEST-DATA]';
const TOTAL_DAYS = 60;

function dateAt(daysAgo: number, hour: number, minute: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// Un "slot" es un evento individual, potencialmente parte de un grupo que
// se solapa en el tiempo dentro de la misma área (mismo `groupId`).
interface EventSlot {
  groupId: number;
  daysAgo: number;
  areaIndex: number;
  deptIndex: number;
  createdAt: Date;
  status: EventStatus;
  inProgressAt?: Date;
  closedAt?: Date;
}

/**
 * Construye el calendario completo de eventos de prueba:
 *  - Incidentes de solape: cada ~3-4 días (2-3 veces por semana) una misma
 *    área recibe dos eventos que se traslapan, siguiendo el patrón descrito
 *    por negocio (el segundo entra antes de que cierre el primero).
 *  - El incidente más reciente (hoy) se deja activo (sin cerrar) para
 *    demostrar también el caso de un AreaDowntime en curso con 2 eventos.
 *  - Días "triples": un puñado de días sin solape con 3 eventos
 *    independientes en áreas distintas.
 *  - Relleno regular: patrón cíclico de 0-2 eventos independientes por día
 *    para el resto de la ventana de 60 días.
 */
function buildEventSlots(): EventSlot[] {
  const slots: EventSlot[] = [];
  let nextGroupId = 1;
  const usedDays = new Set<number>();

  // --- 1. Incidentes de solape (2 eventos de la misma área entrelazados) ---
  const incidentStepPattern = [3, 4, 3, 4]; // ~3.5 días de separación => 2-3/semana
  const incidentDays: number[] = [];
  for (let d = 2, i = 0; d <= TOTAL_DAYS - 1; d += incidentStepPattern[i % incidentStepPattern.length]!, i++) {
    incidentDays.push(d);
  }
  incidentDays.push(0); // el incidente más reciente queda activo (hoy)

  incidentDays.forEach((daysAgo, i) => {
    usedDays.add(daysAgo);
    const groupId = nextGroupId++;
    const areaIndex = i % AREA_NAMES.length;
    const deptA = i % DEPARTMENTS.length;
    const deptB = (deptA + 2) % DEPARTMENTS.length; // siempre distinto (4 deptos)

    const baseHour = 7 + ((i * 2) % 10); // 7..16
    const baseMinute = (i % 4) * 15; // 0,15,30,45
    const aStart = dateAt(daysAgo, baseHour, baseMinute);

    if (daysAgo === 0) {
      // Incidente en curso: el primer evento ya está siendo atendido, el
      // segundo acaba de entrar. Ninguno tiene cierre todavía.
      const bStart = addMinutes(aStart, 20);
      slots.push({
        groupId,
        daysAgo,
        areaIndex,
        deptIndex: deptA,
        createdAt: aStart,
        status: EventStatus.IN_PROGRESS,
        inProgressAt: addMinutes(aStart, 10),
      });
      slots.push({
        groupId,
        daysAgo,
        areaIndex,
        deptIndex: deptB,
        createdAt: bStart,
        status: EventStatus.OPEN,
      });
      return;
    }

    // Dos perfiles de tiempos alternados: en uno cierra último el segundo
    // evento (como en el ejemplo de negocio), en el otro cierra último el
    // primero -- así se comprueba que el fin del paro es el MÁXIMO de los
    // cierres, no simplemente "el último evento creado".
    const delayMinutes = i % 2 === 0 ? 45 : 30;
    const bStart = addMinutes(aStart, delayMinutes);
    const aDurationMinutes = i % 2 === 0 ? 60 : 90;
    const bDurationMinutes = i % 2 === 0 ? 45 : 20;
    const aClose = addMinutes(aStart, aDurationMinutes);
    const bClose = addMinutes(bStart, bDurationMinutes);

    slots.push({
      groupId,
      daysAgo,
      areaIndex,
      deptIndex: deptA,
      createdAt: aStart,
      status: EventStatus.CLOSED,
      inProgressAt: addMinutes(aStart, 5),
      closedAt: aClose,
    });
    slots.push({
      groupId,
      daysAgo,
      areaIndex,
      deptIndex: deptB,
      createdAt: bStart,
      status: EventStatus.CLOSED,
      inProgressAt: addMinutes(bStart, 5),
      closedAt: bClose,
    });
  });

  // --- 2. Días "triples": 3 eventos independientes (áreas distintas) ---
  const tripleDays = [8, 17, 26, 35, 44, 53].filter(d => !usedDays.has(d));
  tripleDays.forEach((daysAgo, i) => {
    usedDays.add(daysAgo);
    for (let slot = 0; slot < 3; slot++) {
      const groupId = nextGroupId++;
      const areaIndex = (i + slot) % AREA_NAMES.length;
      const deptIndex = (i + slot * 2) % DEPARTMENTS.length;
      const hour = 7 + slot * 5;
      const minute = (slot * 20) % 60;
      const createdAt = dateAt(daysAgo, hour, minute);
      const durationMinutes = 20 + ((i + slot) % 5) * 15;

      slots.push({
        groupId,
        daysAgo,
        areaIndex,
        deptIndex,
        createdAt,
        status: EventStatus.CLOSED,
        inProgressAt: addMinutes(createdAt, 5),
        closedAt: addMinutes(createdAt, durationMinutes),
      });
    }
  });

  // --- 3. Relleno regular para el resto de días (0-2 eventos, patrón cíclico) ---
  const fillerPattern = [1, 0, 1, 2, 1, 0, 1];
  let fillerIndex = 0;
  for (let daysAgo = TOTAL_DAYS - 1; daysAgo >= 0; daysAgo--) {
    if (usedDays.has(daysAgo)) continue;

    const count = fillerPattern[daysAgo % fillerPattern.length]!;
    for (let slot = 0; slot < count; slot++) {
      const groupId = nextGroupId++;
      const areaIndex = (fillerIndex + slot) % AREA_NAMES.length;
      const deptIndex = (fillerIndex + slot * 3) % DEPARTMENTS.length;
      const hour = 6 + ((fillerIndex + slot * 4) % 15); // 6..20
      const minute = (slot * 25) % 60;
      const createdAt = dateAt(daysAgo, hour, minute);
      const durationMinutes = 15 + ((fillerIndex + slot) % 6) * 15;

      slots.push({
        groupId,
        daysAgo,
        areaIndex,
        deptIndex,
        createdAt,
        status: EventStatus.CLOSED,
        inProgressAt: addMinutes(createdAt, 5),
        closedAt: addMinutes(createdAt, durationMinutes),
      });
    }
    fillerIndex++;
  }

  return slots;
}

async function findOrCreateArea(dataSource: DataSource, name: string): Promise<Area> {
  const repo = dataSource.getRepository(Area);
  const existing = await repo.findOneBy({ name });
  if (existing) return existing;
  return repo.save(repo.create({ name }));
}

async function findOrCreateDepartment(
  dataSource: DataSource,
  name: string,
  htmlColor: string
): Promise<Department> {
  const repo = dataSource.getRepository(Department);
  const existing = await repo.findOneBy({ name });
  if (existing) return existing;
  return repo.save(repo.create({ name, htmlColor }));
}

async function findOrCreateDevice(
  dataSource: DataSource,
  name: string,
  externalId: string,
  areaId: number
): Promise<Device> {
  const repo = dataSource.getRepository(Device);
  const existing = await repo.findOneBy({ externalId });
  if (existing) return existing;
  return repo.save(repo.create({ name, externalId, areaId, isVirtualDevice: false }));
}

async function findOrCreateDeviceSignal(
  dataSource: DataSource,
  name: string,
  deviceId: number,
  departmentId: number,
  externalValueId: string
): Promise<DeviceSignal> {
  const repo = dataSource.getRepository(DeviceSignal);
  const existing = await repo.findOneBy({ deviceId, externalValueId });
  if (existing) return existing;
  return repo.save(repo.create({ name, deviceId, departmentId, externalValueId }));
}

async function seed(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env['DATABASE_HOST'] ?? 'localhost',
    port: parseInt(process.env['DATABASE_PORT'] ?? '5432', 10),
    username: process.env['DATABASE_USERNAME'] ?? 'postgres',
    password: process.env['DATABASE_PASSWORD'] ?? 'postgres',
    database: process.env['DATABASE_NAME'] ?? 'track_io',
    entities: [join(__dirname, '../src/**/*.entity{.ts,.js}')],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  console.log('Conectado a la base de datos.');

  try {
    // 1. Catálogos: áreas y departamentos.
    const areas: Area[] = [];
    for (const name of AREA_NAMES) {
      areas.push(await findOrCreateArea(dataSource, name));
    }

    const departments: Department[] = [];
    for (const dept of DEPARTMENTS) {
      departments.push(await findOrCreateDepartment(dataSource, dept.name, dept.htmlColor));
    }

    // 2. Dispositivos: una torreta por área.
    const devices: Device[] = [];
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i]!;
      const externalId = `TORRETA-L${i + 1}`;
      const device = await findOrCreateDevice(
        dataSource,
        `Torreta ${area.name}`,
        externalId,
        area.id
      );
      devices.push(device);
    }

    // 3. Señales de dispositivo: una por departamento en cada torreta.
    const signalsByAreaDept = new Map<string, DeviceSignal>();
    for (let a = 0; a < devices.length; a++) {
      const device = devices[a]!;
      for (let d = 0; d < DEPARTMENTS.length; d++) {
        const dept = DEPARTMENTS[d]!;
        const department = departments[d]!;
        const externalValueId = `${device.externalId}-${dept.code}`;
        const signal = await findOrCreateDeviceSignal(
          dataSource,
          `Paro - ${dept.name}`,
          device.id,
          department.id,
          externalValueId
        );
        signalsByAreaDept.set(`${a}-${d}`, signal);
      }
    }

    // 4. Limpieza de datos de prueba previos (idempotencia) antes de
    //    re-sembrar el histórico, sin tocar los catálogos.
    const eventRepo = dataSource.getRepository(Event);
    const rawSignalRepo = dataSource.getRepository(RawSignal);
    const processedSignalRepo = dataSource.getRepository(ProcessedSignal);
    const areaDowntimeRepo = dataSource.getRepository(AreaDowntime);
    const areaDowntimeEventRepo = dataSource.getRepository(AreaDowntimeEvent);

    const seededAreaIds = areas.map(a => a.id);
    if (seededAreaIds.length > 0) {
      await areaDowntimeEventRepo
        .createQueryBuilder()
        .delete()
        .where(
          'area_downtime_id IN (SELECT id FROM area_downtimes WHERE area_id IN (:...areaIds))',
          { areaIds: seededAreaIds }
        )
        .execute();
      await areaDowntimeRepo
        .createQueryBuilder()
        .delete()
        .where('area_id IN (:...areaIds)', { areaIds: seededAreaIds })
        .execute();
    }
    await eventRepo
      .createQueryBuilder()
      .delete()
      .where('comment LIKE :marker', { marker: `${SEED_MARKER}%` })
      .execute();
    await rawSignalRepo
      .createQueryBuilder()
      .delete()
      .where('external_id LIKE :marker', { marker: 'SEED-%' })
      .execute();
    await processedSignalRepo
      .createQueryBuilder()
      .delete()
      .where('device_signal_name LIKE :marker', { marker: `%${SEED_MARKER}` })
      .execute();

    // 5. Pipeline de señales + eventos para cada slot generado, agrupado por
    //    groupId para poder calcular el AreaDowntime resultante.
    const slots = buildEventSlots();
    const eventIdsByGroup = new Map<number, number[]>();
    const slotsByGroup = new Map<number, EventSlot[]>();

    for (const slot of slots) {
      const area = areas[slot.areaIndex]!;
      const department = departments[slot.deptIndex]!;
      const device = devices[slot.areaIndex]!;
      const deptCode = DEPARTMENTS[slot.deptIndex]!.code;
      const signal = signalsByAreaDept.get(`${slot.areaIndex}-${slot.deptIndex}`)!;
      const texts = REASONS[deptCode]!;
      const createdAt = slot.createdAt;

      // Señal cruda ingerida por el receptor.
      const rawSignal = await rawSignalRepo.save(
        rawSignalRepo.create({
          externalId: `SEED-${signal.externalValueId}-${slot.groupId}`,
          value: '1',
          createdAt,
        })
      );
      await rawSignalRepo
        .createQueryBuilder()
        .update()
        .set({ createdAt })
        .where('id = :id', { id: rawSignal.id })
        .execute();

      // Señal procesada, ya vinculada al dispositivo/señal de catálogo.
      const processedSignal = await processedSignalRepo.save(
        processedSignalRepo.create({
          deviceId: device.id,
          deviceName: device.name,
          deviceSignalId: signal.id,
          deviceSignalName: `${signal.name} ${SEED_MARKER}`,
          createdAt,
        })
      );
      await processedSignalRepo
        .createQueryBuilder()
        .update()
        .set({ createdAt })
        .where('id = :id', { id: processedSignal.id })
        .execute();

      // Evento de negocio derivado de la señal (paro registrado).
      const eventData: Partial<Event> = {
        areaId: area.id,
        areaName: area.name,
        departmentId: department.id,
        departmentName: department.name,
        deviceId: device.id,
        deviceName: device.name,
        deviceSignalId: signal.id,
        deviceSignalName: signal.name,
        status: slot.status,
        virtualDevice: false,
        reason: texts.reason,
        comment: `${SEED_MARKER} ${texts.comment}`,
        createdAt,
      };
      if (slot.inProgressAt) eventData.inProgressAt = slot.inProgressAt;
      if (slot.closedAt) {
        eventData.closedAt = slot.closedAt;
        eventData.durationSeconds = Math.round(
          (slot.closedAt.getTime() - createdAt.getTime()) / 1000
        );
      }

      const event = await eventRepo.save(eventRepo.create(eventData));
      // createdAt es @CreateDateColumn (se sobreescribe al guardar); se fuerza
      // el valor histórico deseado con un UPDATE directo tras el insert.
      await eventRepo
        .createQueryBuilder()
        .update()
        .set({ createdAt })
        .where('id = :id', { id: event.id })
        .execute();

      const groupEventIds = eventIdsByGroup.get(slot.groupId) ?? [];
      groupEventIds.push(event.id);
      eventIdsByGroup.set(slot.groupId, groupEventIds);

      const groupSlots = slotsByGroup.get(slot.groupId) ?? [];
      groupSlots.push(slot);
      slotsByGroup.set(slot.groupId, groupSlots);
    }

    // 6. AreaDowntime por grupo: replica la lógica de negocio
    //    (area-downtime.service.ts) sin pasar por el handler en vivo --
    //    startAt = inicio del primer evento del grupo, endsAt = cierre del
    //    último evento del grupo en cerrarse, isActive si alguno sigue abierto.
    let downtimesCreated = 0;
    for (const [groupId, groupSlots] of slotsByGroup.entries()) {
      const eventIds = eventIdsByGroup.get(groupId)!;
      const areaId = areas[groupSlots[0]!.areaIndex]!.id;

      const startAt = groupSlots.reduce(
        (min, s) => (s.createdAt < min ? s.createdAt : min),
        groupSlots[0]!.createdAt
      );
      const stillActive = groupSlots.some(s => !s.closedAt);
      const endsAt = stillActive
        ? undefined
        : groupSlots.reduce(
            (max, s) => (s.closedAt! > max ? s.closedAt! : max),
            groupSlots[0]!.closedAt!
          );

      const areaDowntime = await areaDowntimeRepo.save(
        areaDowntimeRepo.create({
          areaId,
          startAt,
          isActive: stillActive,
          ...(endsAt ? { endsAt } : {}),
        })
      );

      for (const eventId of eventIds) {
        await areaDowntimeEventRepo.save(
          areaDowntimeEventRepo.create({
            areaDowntimeId: areaDowntime.id,
            eventId,
          })
        );
      }
      downtimesCreated++;
    }

    const overlapGroups = [...slotsByGroup.values()].filter(g => g.length > 1).length;

    console.log(`Áreas: ${areas.length}`);
    console.log(`Departamentos: ${departments.length}`);
    console.log(`Dispositivos: ${devices.length}`);
    console.log(`Señales de dispositivo: ${signalsByAreaDept.size}`);
    console.log(`Eventos creados: ${slots.length}`);
    console.log(`AreaDowntimes creados: ${downtimesCreated}`);
    console.log(`  de los cuales con eventos entrelazados (2+ eventos): ${overlapGroups}`);
    console.log('Seed de datos de prueba completado.');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch(error => {
  console.error('Error al ejecutar el seed de datos de prueba:', error);
  process.exit(1);
});
