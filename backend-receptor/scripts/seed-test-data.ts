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

dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Datos de prueba para el pipeline de señales: RawSignal -> ProcessedSignal
 * -> DeviceSignal (catálogo) -> Event (paro registrado por área/departamento).
 *
 * Todo el contenido es estático salvo las fechas, que se calculan en tiempo
 * de ejecución a partir de "hoy" hacia atrás (ventana de 2 meses / 60 días),
 * tal como pide el negocio para poder probar reportes y dashboards con datos
 * recientes sin tener que regenerar el script cada vez.
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

// daysAgo: antigüedad del evento respecto a "hoy" (0-60 -> ventana de 2 meses).
// areaIndex / deptIndex: posición dentro de AREA_NAMES / DEPARTMENTS.
// status: estado final del evento de prueba.
// durationMinutes: sólo aplica a eventos "closed".
const EVENT_SCENARIOS: Array<{
  daysAgo: number;
  hour: number;
  areaIndex: number;
  deptIndex: number;
  status: EventStatus;
  durationMinutes?: number;
}> = [
  { daysAgo: 60, hour: 8, areaIndex: 0, deptIndex: 0, status: EventStatus.CLOSED, durationMinutes: 45 },
  { daysAgo: 57, hour: 14, areaIndex: 1, deptIndex: 2, status: EventStatus.CLOSED, durationMinutes: 20 },
  { daysAgo: 54, hour: 9, areaIndex: 2, deptIndex: 1, status: EventStatus.CLOSED, durationMinutes: 90 },
  { daysAgo: 51, hour: 22, areaIndex: 3, deptIndex: 3, status: EventStatus.CLOSED, durationMinutes: 15 },
  { daysAgo: 48, hour: 11, areaIndex: 4, deptIndex: 0, status: EventStatus.CLOSED, durationMinutes: 60 },
  { daysAgo: 45, hour: 6, areaIndex: 0, deptIndex: 2, status: EventStatus.CLOSED, durationMinutes: 30 },
  { daysAgo: 42, hour: 16, areaIndex: 1, deptIndex: 1, status: EventStatus.CLOSED, durationMinutes: 25 },
  { daysAgo: 39, hour: 10, areaIndex: 2, deptIndex: 3, status: EventStatus.CLOSED, durationMinutes: 50 },
  { daysAgo: 36, hour: 13, areaIndex: 3, deptIndex: 0, status: EventStatus.CLOSED, durationMinutes: 120 },
  { daysAgo: 33, hour: 7, areaIndex: 4, deptIndex: 2, status: EventStatus.CLOSED, durationMinutes: 18 },
  { daysAgo: 30, hour: 15, areaIndex: 0, deptIndex: 1, status: EventStatus.CLOSED, durationMinutes: 40 },
  { daysAgo: 27, hour: 19, areaIndex: 1, deptIndex: 3, status: EventStatus.CLOSED, durationMinutes: 22 },
  { daysAgo: 24, hour: 8, areaIndex: 2, deptIndex: 0, status: EventStatus.CLOSED, durationMinutes: 75 },
  { daysAgo: 21, hour: 12, areaIndex: 3, deptIndex: 2, status: EventStatus.CLOSED, durationMinutes: 33 },
  { daysAgo: 18, hour: 17, areaIndex: 4, deptIndex: 1, status: EventStatus.CLOSED, durationMinutes: 55 },
  { daysAgo: 15, hour: 9, areaIndex: 0, deptIndex: 3, status: EventStatus.CLOSED, durationMinutes: 10 },
  { daysAgo: 12, hour: 20, areaIndex: 1, deptIndex: 0, status: EventStatus.CLOSED, durationMinutes: 65 },
  { daysAgo: 9, hour: 14, areaIndex: 2, deptIndex: 2, status: EventStatus.CLOSED, durationMinutes: 28 },
  { daysAgo: 7, hour: 8, areaIndex: 3, deptIndex: 1, status: EventStatus.CLOSED, durationMinutes: 42 },
  { daysAgo: 5, hour: 11, areaIndex: 4, deptIndex: 3, status: EventStatus.CLOSED, durationMinutes: 19 },
  { daysAgo: 4, hour: 16, areaIndex: 0, deptIndex: 0, status: EventStatus.CLOSED, durationMinutes: 37 },
  { daysAgo: 3, hour: 10, areaIndex: 1, deptIndex: 2, status: EventStatus.CLOSED, durationMinutes: 24 },
  { daysAgo: 2, hour: 13, areaIndex: 2, deptIndex: 1, status: EventStatus.IN_PROGRESS },
  { daysAgo: 1, hour: 9, areaIndex: 3, deptIndex: 3, status: EventStatus.IN_PROGRESS },
  { daysAgo: 0, hour: 7, areaIndex: 4, deptIndex: 0, status: EventStatus.OPEN },
  { daysAgo: 0, hour: 12, areaIndex: 0, deptIndex: 2, status: EventStatus.OPEN },
];

const SEED_MARKER = '[SEED-TEST-DATA]';

function daysAgoAt(daysAgo: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date;
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

    // 4. Limpieza de datos de prueba previos (idempotencia) antes de re-sembrar
    //    el histórico de señales/eventos, sin tocar los catálogos anteriores.
    const eventRepo = dataSource.getRepository(Event);
    const rawSignalRepo = dataSource.getRepository(RawSignal);
    const processedSignalRepo = dataSource.getRepository(ProcessedSignal);

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

    // 5. Pipeline de señales + eventos para cada escenario estático, con
    //    fechas calculadas dinámicamente sobre los últimos 2 meses.
    let created = 0;
    for (const scenario of EVENT_SCENARIOS) {
      const area = areas[scenario.areaIndex]!;
      const department = departments[scenario.deptIndex]!;
      const device = devices[scenario.areaIndex]!;
      const deptCode = DEPARTMENTS[scenario.deptIndex]!.code;
      const signal = signalsByAreaDept.get(`${scenario.areaIndex}-${scenario.deptIndex}`)!;
      const texts = REASONS[deptCode]!;

      const createdAt = daysAgoAt(scenario.daysAgo, scenario.hour);

      // Señal cruda ingerida por el receptor.
      const rawSignal = await rawSignalRepo.save(
        rawSignalRepo.create({
          externalId: `SEED-${signal.externalValueId}-${scenario.daysAgo}-${scenario.hour}`,
          value: '1',
          createdAt,
        })
      );
      // createdAt/updatedAt son columnas auto-gestionadas; se fuerza el valor
      // histórico deseado con un UPDATE directo tras el insert.
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
        status: scenario.status,
        virtualDevice: false,
        reason: texts.reason,
        comment: `${SEED_MARKER} ${texts.comment}`,
        createdAt,
      };

      if (scenario.status === EventStatus.IN_PROGRESS) {
        eventData.inProgressAt = new Date(createdAt.getTime() + 10 * 60 * 1000);
      }

      if (scenario.status === EventStatus.CLOSED) {
        const durationMs = (scenario.durationMinutes ?? 30) * 60 * 1000;
        eventData.inProgressAt = new Date(createdAt.getTime() + 5 * 60 * 1000);
        eventData.closedAt = new Date(createdAt.getTime() + durationMs);
        eventData.durationSeconds = Math.round(durationMs / 1000);
      }

      const event = eventRepo.create(eventData);
      await eventRepo.save(event);
      // createdAt es @CreateDateColumn (se sobreescribe al guardar); se fuerza
      // el valor histórico deseado con un UPDATE directo tras el insert.
      await eventRepo
        .createQueryBuilder()
        .update()
        .set({ createdAt })
        .where('id = :id', { id: event.id })
        .execute();

      created++;
    }

    console.log(`Áreas: ${areas.length}`);
    console.log(`Departamentos: ${departments.length}`);
    console.log(`Dispositivos: ${devices.length}`);
    console.log(`Señales de dispositivo: ${signalsByAreaDept.size}`);
    console.log(`Escenarios de señal/evento creados: ${created}`);
    console.log('Seed de datos de prueba completado.');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch(error => {
  console.error('Error al ejecutar el seed de datos de prueba:', error);
  process.exit(1);
});
