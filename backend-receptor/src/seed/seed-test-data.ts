import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { join } from 'path';

import { Area } from '../areas/domain/entities/area.entity';
import { Department } from '../departments/domain/entities/department.entity';
import { Device } from '../devices/domain/entities/device.entity';
import { DeviceSignal } from '../device-signals/domain/entities/device-signal.entity';
import { RawSignal } from '../signals/domain/entities/raw-signal.entity';
import { ProcessedSignal } from '../signals/domain/entities/processed-signal.entity';
import { Event, EventStatus } from '../events/domain/entities/event.entity';
import {
  EventScheduledDowntimeSlice,
  SliceSegment,
} from '../events/domain/entities/event-scheduled-downtime-slice.entity';
import { AreaDowntime } from '../area-downtime/domain/entities/area-downtime.entity';
import { AreaDowntimeEvent } from '../area-downtime/domain/entities/area-downtime-event.entity';
import { ScheduledDowntime } from '../scheduled-downtimes/domain/entities/scheduled-downtime.entity';
import { ScheduledDowntimeRepository } from '../scheduled-downtimes/domain/repositories/scheduled-downtime.repository';
import { ScheduledDowntimeCacheService } from '../scheduled-downtimes/application/services/scheduled-downtime-cache.service';
import {
  ScheduledDowntimeCalculatorService,
  type ScheduledDowntimeDiscount,
} from '../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';

// Carga .env sólo en desarrollo local (dos niveles arriba: src/seed -> raíz del
// paquete). En el contenedor de producción no existe ese archivo y las
// variables llegan del entorno; dotenv simplemente no hace nada si falta.
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

/**
 * Datos de prueba para el pipeline completo:
 *
 *   RawSignal -> ProcessedSignal -> DeviceSignal (catálogo) -> Event (paro)
 *                                        -> AreaDowntime (línea detenida)
 *                                        -> descuento por ScheduledDowntime
 *
 * El patrón de generación (frecuencia diaria, solapes, duraciones) es
 * estático y determinista; sólo las fechas se calculan en tiempo de
 * ejecución a partir de "hoy" hacia atrás (ventana de 2 meses / 60 días),
 * así que el script produce siempre el mismo resultado relativo sin
 * necesidad de tocarlo cada vez que se corre.
 *
 * ## Paros programados
 *
 * El seed siembra el catálogo de paros programados (los tres tiempos de
 * alimentos, de lunes a domingo) y luego genera los eventos SIN tenerlos en
 * cuenta: un paro real ocurre cuando ocurre, se traslape o no con una ventana
 * programada. Ese traslape es justamente lo que hay que demostrar.
 *
 * Para cada evento cerrado, el seed llama al MOTOR DE CÁLCULO REAL
 * (`ScheduledDowntimeCalculatorService`, el mismo que usa `SignalService` al
 * cerrar en vivo) y persiste crudo + descuento + efectivo + las rebanadas de
 * trazabilidad. Los números sembrados no son inventados: salen del mismo
 * código que corre en producción.
 *
 * ## Zona horaria (la trampa)
 *
 * `scheduled_downtimes.start_time` es HORA DE PARED DE LA PLANTA, y los
 * contenedores corren en UTC. Por eso los eventos se construyen con
 * `plantDateAt()` (hora de planta -> instante absoluto) y no con
 * `Date.setHours()`, que usaría la hora local del servidor: en Docker un
 * evento "de las 12:00" caería a las 06:00 de planta y no se traslaparía
 * nunca con la comida.
 *
 * ## Escenarios de demostración
 *
 * Además del histórico de relleno, se siembran cinco escenarios deterministas
 * (DEMOS) que ejercitan cada caso interesante — dos de ellos encadenan 2
 * eventos traslapados en vez de uno solo, porque en producción ningún evento
 * individual dura más de 3h — y al terminar el script imprime el desglose de
 * cada uno: evento(s), tiempo detenido del área, lapso de paro programado y,
 * como resultado final, el tiempo de paro NO programado.
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
    comment:
      'Línea detenida en espera de reabastecimiento desde almacén central.',
  },
  CAL: {
    reason: 'Retención por control de calidad',
    comment: 'Lote retenido para inspección dimensional antes de continuar.',
  },
};

const SEED_MARKER = '[SEED-TEST-DATA]';
const TOTAL_DAYS = 60;

/**
 * Zona horaria de la planta. Debe coincidir con `PLANT_TIMEZONE` del backend
 * (`src/config/plant-timezone.config.ts`), o los descuentos que siembre este
 * script no cuadrarán con los que calcule el backend en vivo.
 */
const PLANT_TZ = process.env['PLANT_TIMEZONE'] ?? 'America/Mexico_City';

/** Todos los días de la semana. `Date.getDay()`: 0 = domingo … 6 = sábado. */
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/**
 * Catálogo de paros programados sembrado en TODAS las áreas: los tres tiempos
 * de alimentos, de lunes a domingo.
 *
 * La planta opera de continuo, así que lo único programado son las comidas: el
 * tiempo productivo planeado es el calendario menos estas dos horas por día.
 * Ninguna ventana se traslapa con otra ni cruza medianoche.
 */
const SCHEDULED_DOWNTIMES = [
  {
    name: 'Desayuno',
    startTime: '08:00',
    endTime: '08:30',
    daysOfWeek: EVERY_DAY,
  },
  {
    name: 'Comida',
    startTime: '12:00',
    endTime: '13:00',
    daysOfWeek: EVERY_DAY,
  },
  {
    name: 'Cena',
    startTime: '19:00',
    endTime: '19:30',
    daysOfWeek: EVERY_DAY,
  },
];

/** Fecha de calendario de la planta (sin hora, sin zona). month: 1-12. */
interface PlantDate {
  year: number;
  month: number;
  day: number;
}

/** Offset (ms) de una zona IANA en un instante dado. */
function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map: Record<string, number> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = Number(part.value);
  }

  const asUTC = Date.UTC(
    map['year']!,
    map['month']! - 1,
    map['day'],
    map['hour']! % 24,
    map['minute'],
    map['second']
  );

  return asUTC - date.getTime();
}

/** Fecha de calendario de la planta correspondiente a un instante absoluto. */
function plantDateOf(instant: Date): PlantDate {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: PLANT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const map: Record<string, number> = {};
  for (const part of dtf.formatToParts(instant)) {
    if (part.type !== 'literal') map[part.type] = Number(part.value);
  }

  return { year: map['year']!, month: map['month']!, day: map['day']! };
}

function addPlantDays(date: PlantDate, days: number): PlantDate {
  const shifted = new Date(
    Date.UTC(date.year, date.month - 1, date.day + days)
  );
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** Hora de pared de la planta (fecha + hora + minuto) -> instante absoluto. */
function plantWallToInstant(
  date: PlantDate,
  hour: number,
  minute: number
): Date {
  const guess = Date.UTC(date.year, date.month - 1, date.day, hour, minute);

  const offset1 = timeZoneOffsetMs(new Date(guess), PLANT_TZ);
  let result = guess - offset1;

  // Segunda pasada: cubre transiciones de horario de verano.
  const offset2 = timeZoneOffsetMs(new Date(result), PLANT_TZ);
  if (offset2 !== offset1) {
    result = guess - offset2;
  }

  return new Date(result);
}

/**
 * Instante absoluto de "hace N días, a tal hora DE PLANTA".
 *
 * Sustituye al viejo `dateAt()` basado en `Date.setHours()`, que usaba la hora
 * local del proceso: en el contenedor (UTC) las 12:00 caían a las 06:00 de
 * planta y ningún evento se traslapaba con la comida.
 */
function plantDateAt(daysAgo: number, hour: number, minute: number): Date {
  const today = plantDateOf(new Date());
  return plantWallToInstant(addPlantDays(today, -daysAgo), hour, minute);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/** Formatea un instante en hora de planta: '13/jul 12:00'. */
function fmtPlant(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: PLANT_TZ,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** Segundos -> '2h 30m'. */
function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
  /** Etiqueta del escenario de demostración al que pertenece, si aplica. */
  demoKey?: string;
}

interface DemoScenario {
  key: string;
  title: string;
  expectation: string;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    key: 'aceptacion',
    title: 'Caso de aceptación: el paro se come la comida',
    expectation:
      'Paro 11:30-13:30 (2h) contra Comida 12:00-13:00 → 1h de paro NO programado, no 2h.',
  },
  {
    key: 'sin-traslape',
    title: 'Sin traslape: el descuento no inventa tiempo',
    expectation:
      'Paro 09:00-09:45 en pleno turno productivo → descuento 0, el paro real se reporta completo.',
  },
  {
    key: 'medianoche',
    title: '2 eventos encadenados cruzan la medianoche (ningún evento >3h)',
    expectation:
      'Evento 1: 18:45-21:30 (2h45m, toca Cena 19:00-19:30). Evento 2: 21:15-00:15 del día ' +
      'siguiente (3h, arranca 15m antes de que cierre el 1º). Se fusionan en UN AreaDowntime ' +
      '18:45 → 00:15 (5h30m) que cruza de un día a otro → 30m de descuento → 5h de paro NO programado.',
  },
  {
    key: 'varias-ventanas',
    title: '2 eventos encadenados cruzan Desayuno y Comida (ningún evento >3h)',
    expectation:
      'Evento 1: 07:45-10:15 (2h30m, toca Desayuno 08:00-08:30). Evento 2: 10:00-13:00 ' +
      '(3h, arranca 15m antes de que cierre el 1º, toca Comida 12:00-13:00). Se fusionan en UN ' +
      'AreaDowntime 07:45 → 13:00 (5h15m) → descuento 1h30m (30m + 1h) → 3h45m de paro NO programado.',
  },
  {
    key: 'atencion',
    title: 'Descuento repartido entre atención y solución',
    expectation:
      'Paro 11:45, atendido 12:30, cerrado 13:15. 1h 30m de reloj, pero sólo 30m productivos ' +
      '(la comida parte el paro en dos). Es lo mismo que cuenta el escalamiento.',
  },
];

/**
 * Los cinco escenarios de demostración. Cada uno reserva su(s) propio(s)
 * día(s) y área (ver `buildEventSlots`), de modo que su AreaDowntime no se
 * mezcle con el ruido del histórico de relleno y los números del reporte
 * final sean exactamente los del escenario. Dos de ellos ("medianoche" y
 * "varias-ventanas") encadenan 2 eventos traslapados en vez de uno solo:
 * ningún evento individual dura más de 3h, igual que en producción — es el
 * AreaDowntime fusionado el que puede durar más.
 */
function buildDemoSlots(startGroupId: number): {
  slots: EventSlot[];
  nextGroupId: number;
} {
  let groupId = startGroupId;
  const slots: EventSlot[] = [];

  // 1. Caso de aceptación — Linea 1, Mantenimiento. 11:30 → 13:30.
  const acceptanceStart = plantDateAt(3, 11, 30);
  slots.push({
    groupId: groupId++,
    daysAgo: 3,
    areaIndex: 0,
    deptIndex: 0,
    createdAt: acceptanceStart,
    status: EventStatus.CLOSED,
    inProgressAt: addMinutes(acceptanceStart, 5),
    closedAt: addMinutes(acceptanceStart, 120),
    demoKey: 'aceptacion',
  });

  // 2. Sin traslape — Linea 3, Calidad. 09:00 → 09:45, entre el desayuno y la
  //    comida: ninguna ventana lo toca.
  const cleanStart = plantDateAt(4, 9, 0);
  slots.push({
    groupId: groupId++,
    daysAgo: 4,
    areaIndex: 2,
    deptIndex: 3,
    createdAt: cleanStart,
    status: EventStatus.CLOSED,
    inProgressAt: addMinutes(cleanStart, 5),
    closedAt: addMinutes(cleanStart, 45),
    demoKey: 'sin-traslape',
  });

  // 3. Paro que cruza la medianoche — Linea 2, Materiales. En producción
  //    ningún evento individual dura más de 3h; lo que sí es normal es que
  //    2-3 eventos se traslapen y el ÁREA quede detenida más tiempo. Dos
  //    eventos encadenados (18:45→21:30 y 21:15→00:15, 15 min de traslape)
  //    se fusionan en un solo AreaDowntime que cruza de un día al otro y
  //    toca la Cena (19:00-19:30) en el primer tramo.
  const midnightEvent1Start = plantDateAt(7, 18, 45);
  const midnightGroupId = groupId++;
  slots.push({
    groupId: midnightGroupId,
    daysAgo: 7,
    areaIndex: 1,
    deptIndex: 2,
    createdAt: midnightEvent1Start,
    status: EventStatus.CLOSED,
    inProgressAt: addMinutes(midnightEvent1Start, 5),
    closedAt: addMinutes(midnightEvent1Start, 165), // 18:45 + 2h45m = 21:30
    demoKey: 'medianoche',
  });
  const midnightEvent2Start = plantDateAt(7, 21, 15); // arranca antes de que cierre el 1º
  slots.push({
    groupId: midnightGroupId,
    daysAgo: 7,
    areaIndex: 1,
    deptIndex: 2,
    createdAt: midnightEvent2Start,
    status: EventStatus.CLOSED,
    inProgressAt: addMinutes(midnightEvent2Start, 5),
    closedAt: addMinutes(midnightEvent2Start, 180), // 21:15 + 3h = 00:15 del día siguiente
    demoKey: 'medianoche',
  });

  // 4. Paro que cruza dos ventanas de paro programado — Linea 1, Ingeniería.
  //    Mismo principio: dos eventos ≤3h encadenados (07:45→10:15 y
  //    10:00→13:00, 15 min de traslape) en vez de un evento-maratón de
  //    12h+. El primero toca Desayuno (08:00-08:30), el segundo toca Comida
  //    (12:00-13:00); juntos, el AreaDowntime muestra el descuento de ambas
  //    ventanas sin que ningún evento individual sea irreal.
  const windowsEvent1Start = plantDateAt(5, 7, 45);
  const windowsGroupId = groupId++;
  slots.push({
    groupId: windowsGroupId,
    daysAgo: 5,
    areaIndex: 0,
    deptIndex: 1,
    createdAt: windowsEvent1Start,
    status: EventStatus.CLOSED,
    inProgressAt: addMinutes(windowsEvent1Start, 10),
    closedAt: addMinutes(windowsEvent1Start, 150), // 07:45 + 2h30m = 10:15
    demoKey: 'varias-ventanas',
  });
  const windowsEvent2Start = plantDateAt(5, 10, 0); // arranca antes de que cierre el 1º
  slots.push({
    groupId: windowsGroupId,
    daysAgo: 5,
    areaIndex: 0,
    deptIndex: 1,
    createdAt: windowsEvent2Start,
    status: EventStatus.CLOSED,
    inProgressAt: addMinutes(windowsEvent2Start, 10),
    closedAt: addMinutes(windowsEvent2Start, 180), // 10:00 + 3h = 13:00
    demoKey: 'varias-ventanas',
  });

  // 5. Atención vs solución — Linea 4, Mantenimiento. La comida parte el paro
  //    justo en medio: 11:45 → atendido 12:30 → cerrado 13:15.
  slots.push({
    groupId: groupId++,
    daysAgo: 6,
    areaIndex: 3,
    deptIndex: 0,
    createdAt: plantDateAt(6, 11, 45),
    status: EventStatus.CLOSED,
    inProgressAt: plantDateAt(6, 12, 30),
    closedAt: plantDateAt(6, 13, 15),
    demoKey: 'atencion',
  });

  return { slots, nextGroupId: groupId };
}

/**
 * Construye el calendario completo de eventos de prueba:
 *  - Escenarios de demostración (arriba), que reservan su día en exclusiva.
 *  - Incidentes de solape: cada ~3-4 días (2-3 veces por semana) una misma
 *    área recibe dos eventos que se traslapan, siguiendo el patrón descrito
 *    por negocio (el segundo entra antes de que cierre el primero).
 *  - El incidente más reciente (hoy) se deja activo (sin cerrar) para
 *    demostrar también el caso de un AreaDowntime en curso con 2 eventos.
 *  - Días "triples": un puñado de días sin solape con 3 eventos
 *    independientes en áreas distintas.
 *  - Relleno regular: patrón cíclico de 0-2 eventos independientes por día
 *    para el resto de la ventana de 60 días.
 *
 * Los eventos se generan SIN mirar el catálogo de paros programados: un paro
 * real cae donde cae. Que algunos coincidan con la comida, el turno nocturno o
 * el fin de semana es justamente lo que se quiere demostrar.
 */
function buildEventSlots(): EventSlot[] {
  const demo = buildDemoSlots(1);
  const slots: EventSlot[] = [...demo.slots];
  let nextGroupId = demo.nextGroupId;

  // Los días de demostración quedan reservados: el relleno no los toca, para
  // que su AreaDowntime contenga exactamente el evento del escenario.
  const usedDays = new Set<number>(demo.slots.map(s => s.daysAgo));

  // --- 1. Incidentes de solape (2 eventos de la misma área entrelazados) ---
  const incidentStepPattern = [3, 4, 3, 4]; // ~3.5 días de separación => 2-3/semana
  const incidentDays: number[] = [];
  for (
    let d = 2, i = 0;
    d <= TOTAL_DAYS - 1;
    d += incidentStepPattern[i % incidentStepPattern.length]!, i++
  ) {
    if (!usedDays.has(d)) incidentDays.push(d);
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
    const aStart = plantDateAt(daysAgo, baseHour, baseMinute);

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
      const createdAt = plantDateAt(daysAgo, hour, minute);
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
      const createdAt = plantDateAt(daysAgo, hour, minute);
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

async function findOrCreateArea(
  dataSource: DataSource,
  name: string
): Promise<Area> {
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

  // Una sola botonera por área en este seed: si ya existe una para el área
  // (p. ej. sembrada por una corrida previa con el nombre/external_id
  // antiguo "Torreta"), se corrige en lugar de duplicarla.
  const existingByArea = await repo.findOneBy({ areaId });
  if (existingByArea) {
    if (
      existingByArea.name !== name ||
      existingByArea.externalId !== externalId
    ) {
      existingByArea.name = name;
      existingByArea.externalId = externalId;
      await repo.save(existingByArea);
    }
    return existingByArea;
  }

  const existingByExternalId = await repo.findOneBy({ externalId });
  if (existingByExternalId) return existingByExternalId;

  return repo.save(
    repo.create({ name, externalId, areaId, isVirtualDevice: false })
  );
}

async function findOrCreateDeviceSignal(
  dataSource: DataSource,
  name: string,
  deviceId: number,
  departmentId: number,
  externalValueId: string
): Promise<DeviceSignal> {
  const repo = dataSource.getRepository(DeviceSignal);

  // Se busca por (deviceId, name) para sobrevivir a un cambio de
  // externalId del dispositivo (p. ej. el prefijo TORRETA- -> BOTONERA-);
  // si cambió, se actualiza en lugar de crear una señal duplicada.
  const existing = await repo.findOneBy({ deviceId, name });
  if (existing) {
    if (
      existing.externalValueId !== externalValueId ||
      existing.departmentId !== departmentId
    ) {
      existing.externalValueId = externalValueId;
      existing.departmentId = departmentId;
      await repo.save(existing);
    }
    return existing;
  }

  return repo.save(
    repo.create({ name, deviceId, departmentId, externalValueId })
  );
}

/**
 * Idempotente por (areaId, name): si el paro programado ya existe se
 * actualizan sus horas/días en lugar de duplicarlo, de modo que reejecutar el
 * seed tras cambiar `SCHEDULED_DOWNTIMES` deje el catálogo al día.
 */
async function findOrCreateScheduledDowntime(
  dataSource: DataSource,
  areaId: number,
  config: {
    name: string;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  }
): Promise<ScheduledDowntime> {
  const repo = dataSource.getRepository(ScheduledDowntime);
  const existing = await repo.findOne({
    where: { areaId, name: config.name },
    withDeleted: true,
  });

  if (existing) {
    existing.startTime = config.startTime;
    existing.endTime = config.endTime;
    existing.daysOfWeek = config.daysOfWeek;
    existing.isActive = true;
    if (existing.deletedAt) await repo.restore(existing.id);
    return repo.save(existing);
  }

  return repo.save(
    repo.create({
      areaId,
      name: config.name,
      startTime: config.startTime,
      endTime: config.endTime,
      daysOfWeek: config.daysOfWeek,
      isActive: true,
    })
  );
}

/**
 * Instancia el motor de cálculo real fuera del contenedor de Nest.
 *
 * El seed no arranca la app (es un script suelto contra la BD), pero tampoco
 * debe reimplementar el cálculo del descuento: sería una segunda fuente de
 * verdad que se desincronizaría del backend en cuanto cambiara la lógica. Se
 * construyen las tres piezas a mano y se usa el mismo servicio que
 * `SignalService.closeEvent()`.
 */
function buildCalculator(
  dataSource: DataSource
): ScheduledDowntimeCalculatorService {
  const repository = new ScheduledDowntimeRepository(
    dataSource.getRepository(ScheduledDowntime)
  );
  const cache = new ScheduledDowntimeCacheService(repository);
  const configStub = {
    get: (key: string): string | undefined =>
      key === 'plant.timezone' ? PLANT_TZ : undefined,
  } as unknown as ConfigService;

  return new ScheduledDowntimeCalculatorService(cache, configStub);
}

/** Datos que el reporte final necesita de cada escenario de demostración. */
interface DemoEventSummary {
  eventId: number;
  areaName: string;
  departmentName: string;
  createdAt: Date;
  inProgressAt: Date;
  closedAt: Date;
  durationSeconds: number;
  discountSeconds: number;
  responseDiscountSeconds: number;
  effectiveSeconds: number;
  slices: Array<{
    name: string;
    configuredStartTime: string;
    configuredEndTime: string;
    from: Date;
    to: Date;
    seconds: number;
    segment: SliceSegment;
  }>;
}

/**
 * Resultado de un escenario de demostración. `events` tiene más de un
 * elemento cuando el escenario encadena varios eventos realistas (ninguno
 * mayor a 3h — igual que en producción) que se traslapan entre sí y se
 * fusionan en UN solo AreaDowntime, en vez de simular un único evento-maratón.
 */
interface DemoResult {
  events: DemoEventSummary[];
  downtime: {
    startAt: Date;
    endsAt: Date;
    durationSeconds: number;
    discountSeconds: number;
    effectiveSeconds: number;
  };
}

function printDemoReport(results: Map<string, DemoResult>): void {
  console.log('');
  console.log('='.repeat(78));
  console.log(`  DEMOSTRACIÓN — paros programados vs. paros reales`);
  console.log(
    `  Zona horaria de planta: ${PLANT_TZ} (todas las horas de abajo)`
  );
  console.log('='.repeat(78));

  for (const scenario of DEMO_SCENARIOS) {
    const r = results.get(scenario.key);
    if (!r) continue;

    console.log('');
    console.log(`▸ ${scenario.title}`);
    console.log(`  Esperado: ${scenario.expectation}`);

    for (const [index, ev] of r.events.entries()) {
      const label =
        r.events.length > 1
          ? ` (evento ${index + 1}/${r.events.length} del grupo)`
          : '';
      console.log('');
      console.log(
        `  Evento #${ev.eventId}${label} — ${ev.areaName} / ${ev.departmentName}`
      );
      console.log(
        `    Inicio ${fmtPlant(ev.createdAt)} → Atendido ${fmtPlant(ev.inProgressAt)} ` +
          `→ Cierre ${fmtPlant(ev.closedAt)}`
      );
      console.log('');
      console.log(
        `    Tiempo detenido (crudo) .......... ${String(ev.durationSeconds).padStart(6)} s  (${fmtDuration(ev.durationSeconds)})`
      );
      console.log(
        `    Paro programado dentro del paro .. ${String(ev.discountSeconds).padStart(6)} s  (${fmtDuration(ev.discountSeconds)})`
      );

      if (ev.slices.length === 0) {
        console.log('        · (ninguna ventana programada se traslapó)');
      }
      for (const s of ev.slices) {
        const tramo =
          s.segment === SliceSegment.RESPONSE ? 'atención' : 'solución';
        console.log(
          `        · ${s.name} (${s.configuredStartTime}–${s.configuredEndTime}) · ` +
            `${fmtPlant(s.from)} → ${fmtPlant(s.to)} · ${s.seconds} s · durante la ${tramo}`
        );
      }

      console.log(`    ${'─'.repeat(34)}  ${'─'.repeat(8)}`);
      console.log(
        `    PARO NO PROGRAMADO (resultado) ... ${String(ev.effectiveSeconds).padStart(6)} s  (${fmtDuration(ev.effectiveSeconds)})`
      );

      // La invariante que hace auditable el número: la suma de las rebanadas
      // es exactamente el descuento, incluso con ventanas traslapadas entre sí.
      const sliceSum = ev.slices.reduce((sum, s) => sum + s.seconds, 0);
      const ok =
        sliceSum === ev.discountSeconds &&
        ev.effectiveSeconds === ev.durationSeconds - ev.discountSeconds;
      console.log(
        `    Comprobación: Σ rebanadas = ${sliceSum} s = descuento; ` +
          `${ev.durationSeconds} − ${ev.discountSeconds} = ${ev.effectiveSeconds}  ${ok ? '✓' : '✗ INCONSISTENTE'}`
      );
    }

    console.log('');
    if (r.events.length > 1) {
      console.log(
        `  Los ${r.events.length} eventos se traslapan y se fusionan en UN solo ` +
          `AreaDowntime (igual que en producción):`
      );
    }
    console.log(
      `    Tiempo detenido del ÁREA (AreaDowntime): ` +
        `${fmtPlant(r.downtime.startAt)} → ${fmtPlant(r.downtime.endsAt)}`
    );
    console.log(
      `      crudo ${r.downtime.durationSeconds} s − programado ${r.downtime.discountSeconds} s ` +
        `= NO programado ${r.downtime.effectiveSeconds} s (${fmtDuration(r.downtime.effectiveSeconds)})`
    );
  }

  console.log('');
  console.log('='.repeat(78));
  console.log('');
}

async function seed(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env['DATABASE_HOST'] ?? 'localhost',
    port: parseInt(process.env['DATABASE_PORT'] ?? '5432', 10),
    username: process.env['DATABASE_USERNAME'] ?? 'postgres',
    password: process.env['DATABASE_PASSWORD'] ?? 'postgres',
    database: process.env['DATABASE_NAME'] ?? 'track_io',
    // Un nivel arriba de src/seed cubre todo el árbol de entidades, tanto en
    // desarrollo (ts-node -> src/**/*.entity.ts) como compilado en el
    // contenedor (node -> dist/**/*.entity.js).
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  console.log('Conectado a la base de datos.');
  console.log(`Zona horaria de planta: ${PLANT_TZ}`);

  try {
    // 1. Catálogos: áreas y departamentos.
    const areas: Area[] = [];
    for (const name of AREA_NAMES) {
      areas.push(await findOrCreateArea(dataSource, name));
    }

    const departments: Department[] = [];
    for (const dept of DEPARTMENTS) {
      departments.push(
        await findOrCreateDepartment(dataSource, dept.name, dept.htmlColor)
      );
    }

    // 2. Dispositivos: una botonera por área (dispositivo físico con
    //    botones que el operario configura para hacer las llamadas de
    //    paro). Las torretas son un catálogo aparte, dado de alta en el
    //    panel de catálogos, y no se siembran aquí.
    const devices: Device[] = [];
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i]!;
      const externalId = `BOTONERA-L${i + 1}`;
      const device = await findOrCreateDevice(
        dataSource,
        `Botonera ${area.name}`,
        externalId,
        area.id
      );
      devices.push(device);
    }

    // 3. Señales de dispositivo: una por departamento en cada botonera.
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

    // 4. Catálogo de paros programados. Se siembra ANTES de los eventos
    //    porque el motor de cálculo lo lee para descontar, pero los eventos se
    //    generan sin mirarlo: un paro real ocurre cuando ocurre.
    let scheduledDowntimesSeeded = 0;
    for (const area of areas) {
      for (const config of SCHEDULED_DOWNTIMES) {
        await findOrCreateScheduledDowntime(dataSource, area.id, config);
        scheduledDowntimesSeeded++;
      }
    }

    // Purga de ventanas de corridas anteriores que ya no están en el catálogo:
    // `findOrCreateScheduledDowntime` sólo crea o actualiza, así que sin esto
    // un paro programado retirado del seed seguiría vivo en la BD y seguiría
    // descontando tiempo.
    const removedScheduled = await dataSource
      .getRepository(ScheduledDowntime)
      .createQueryBuilder()
      .delete()
      .where('area_id IN (:...areaIds)', { areaIds: areas.map(a => a.id) })
      .andWhere('name NOT IN (:...names)', {
        names: SCHEDULED_DOWNTIMES.map(s => s.name),
      })
      .execute();

    // 5. Limpieza de datos de prueba previos (idempotencia) antes de
    //    re-sembrar el histórico, sin tocar los catálogos.
    const eventRepo = dataSource.getRepository(Event);
    const sliceRepo = dataSource.getRepository(EventScheduledDowntimeSlice);
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
    // Las rebanadas cuelgan de los eventos por FK lógica (sin constraint DDL):
    // hay que borrarlas explícitamente ANTES que sus eventos, o quedan huérfanas
    // y el reporte de trazabilidad las mostraría contra eventos inexistentes.
    await sliceRepo
      .createQueryBuilder()
      .delete()
      .where('event_id IN (SELECT id FROM events WHERE comment LIKE :marker)', {
        marker: `${SEED_MARKER}%`,
      })
      .execute();
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

    // 6. Pipeline de señales + eventos para cada slot generado, agrupado por
    //    groupId para poder calcular el AreaDowntime resultante.
    const calculator = buildCalculator(dataSource);
    const slots = buildEventSlots();
    const eventIdsByGroup = new Map<number, number[]>();
    const slotsByGroup = new Map<number, EventSlot[]>();
    const demoResults = new Map<string, DemoResult>();
    const demoGroupKey = new Map<number, string>();
    let slicesCreated = 0;
    let discountedEvents = 0;

    for (const slot of slots) {
      const area = areas[slot.areaIndex]!;
      const department = departments[slot.deptIndex]!;
      const device = devices[slot.areaIndex]!;
      const deptCode = DEPARTMENTS[slot.deptIndex]!.code;
      const signal = signalsByAreaDept.get(
        `${slot.areaIndex}-${slot.deptIndex}`
      )!;
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

      // Descuento por paros programados, calculado con el MOTOR REAL y
      // repartido en los dos tramos del ciclo (atención / solución) igual que
      // hace SignalService.closeEvent(). Los eventos abiertos no llevan
      // descuento: se congela al cerrar.
      let responseDiscount: ScheduledDowntimeDiscount | null = null;
      let resolutionDiscount: ScheduledDowntimeDiscount | null = null;

      if (slot.closedAt) {
        const durationSeconds = Math.round(
          (slot.closedAt.getTime() - createdAt.getTime()) / 1000
        );

        if (slot.inProgressAt) {
          responseDiscount = await calculator.getDiscount(
            area.id,
            createdAt,
            slot.inProgressAt
          );
          resolutionDiscount = await calculator.getDiscount(
            area.id,
            slot.inProgressAt,
            slot.closedAt
          );
        } else {
          resolutionDiscount = await calculator.getDiscount(
            area.id,
            createdAt,
            slot.closedAt
          );
        }

        // Los dos tramos son contiguos y disjuntos, así que el total es la
        // suma exacta — no hace falta recalcular sobre el rango completo.
        const discountTotal =
          (responseDiscount?.totalDiscountedSeconds ?? 0) +
          resolutionDiscount.totalDiscountedSeconds;

        if (slot.inProgressAt) eventData.inProgressAt = slot.inProgressAt;
        eventData.closedAt = slot.closedAt;
        eventData.durationSeconds = durationSeconds;
        eventData.scheduledDowntimeDiscountSeconds = discountTotal;
        eventData.effectiveDurationSeconds = Math.max(
          0,
          durationSeconds - discountTotal
        );
        if (responseDiscount) {
          eventData.responseDiscountSeconds =
            responseDiscount.totalDiscountedSeconds;
        }
        if (discountTotal > 0) discountedEvents++;
      } else if (slot.inProgressAt) {
        eventData.inProgressAt = slot.inProgressAt;
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

      // Rebanadas de trazabilidad: el "de qué hora a qué hora" influyó cada
      // paro programado, con nombre y ventana congelados.
      const sliceRows = [
        ...(responseDiscount
          ? responseDiscount.slices.map(s => ({
              discount: responseDiscount,
              slice: s,
              segment: SliceSegment.RESPONSE,
            }))
          : []),
        ...(resolutionDiscount
          ? resolutionDiscount.slices.map(s => ({
              discount: resolutionDiscount,
              slice: s,
              segment: SliceSegment.RESOLUTION,
            }))
          : []),
      ];

      if (sliceRows.length > 0) {
        await sliceRepo.save(
          sliceRepo.create(
            sliceRows.map(({ discount, slice, segment }) => ({
              eventId: event.id,
              scheduledDowntimeId: slice.scheduledDowntimeId,
              name: slice.name,
              configuredStartTime: slice.configuredStartTime,
              configuredEndTime: slice.configuredEndTime,
              occurredFrom: slice.from,
              occurredTo: slice.to,
              seconds: slice.seconds,
              segment,
              timezone: discount.timezone,
            }))
          )
        );
        slicesCreated += sliceRows.length;
      }

      if (slot.demoKey && slot.inProgressAt && slot.closedAt) {
        demoGroupKey.set(slot.groupId, slot.demoKey);

        const eventSummary: DemoEventSummary = {
          eventId: event.id,
          areaName: area.name,
          departmentName: department.name,
          createdAt,
          inProgressAt: slot.inProgressAt,
          closedAt: slot.closedAt,
          durationSeconds: eventData.durationSeconds!,
          discountSeconds: eventData.scheduledDowntimeDiscountSeconds!,
          responseDiscountSeconds: eventData.responseDiscountSeconds ?? 0,
          effectiveSeconds: eventData.effectiveDurationSeconds!,
          slices: sliceRows.map(({ slice, segment }) => ({
            name: slice.name,
            configuredStartTime: slice.configuredStartTime,
            configuredEndTime: slice.configuredEndTime,
            from: slice.from,
            to: slice.to,
            seconds: slice.seconds,
            segment,
          })),
        };

        // Un escenario puede encadenar varios eventos (mismo demoKey, mismo
        // groupId) que se traslapan y se fusionan en un solo AreaDowntime:
        // se acumulan en `events` en vez de sobreescribir.
        const existingResult = demoResults.get(slot.demoKey);
        if (existingResult) {
          existingResult.events.push(eventSummary);
        } else {
          demoResults.set(slot.demoKey, {
            events: [eventSummary],
            // Se rellena al construir el AreaDowntime del grupo, más abajo.
            downtime: {
              startAt: createdAt,
              endsAt: slot.closedAt,
              durationSeconds: 0,
              discountSeconds: 0,
              effectiveSeconds: 0,
            },
          });
        }
      }

      const groupEventIds = eventIdsByGroup.get(slot.groupId) ?? [];
      groupEventIds.push(event.id);
      eventIdsByGroup.set(slot.groupId, groupEventIds);

      const groupSlots = slotsByGroup.get(slot.groupId) ?? [];
      groupSlots.push(slot);
      slotsByGroup.set(slot.groupId, groupSlots);
    }

    // 7. AreaDowntime por grupo: replica la lógica de negocio
    //    (area-downtime.service.ts) sin pasar por el handler en vivo --
    //    startAt = inicio del primer evento del grupo, endsAt = cierre del
    //    último evento del grupo en cerrarse, isActive si alguno sigue abierto.
    //    El descuento se calcula sobre el intervalo del ÁREA, no sumando el de
    //    los eventos: dos eventos traslapados detienen la línea una sola vez.
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

      const downtimeData: Partial<AreaDowntime> = {
        areaId,
        startAt,
        isActive: stillActive,
      };

      if (endsAt) {
        const durationSeconds = Math.max(
          0,
          Math.round((endsAt.getTime() - startAt.getTime()) / 1000)
        );
        const discount = await calculator.getDiscount(areaId, startAt, endsAt);

        downtimeData.endsAt = endsAt;
        downtimeData.durationSeconds = durationSeconds;
        downtimeData.scheduledDowntimeDiscountSeconds =
          discount.totalDiscountedSeconds;
        downtimeData.effectiveDurationSeconds = Math.max(
          0,
          durationSeconds - discount.totalDiscountedSeconds
        );
        downtimeData.scheduledDowntimeSnapshot = discount;

        const demoKey = demoGroupKey.get(groupId);
        const demoResult = demoKey ? demoResults.get(demoKey) : undefined;
        if (demoResult) {
          demoResult.downtime = {
            startAt,
            endsAt,
            durationSeconds,
            discountSeconds: discount.totalDiscountedSeconds,
            effectiveSeconds: downtimeData.effectiveDurationSeconds,
          };
        }
      }

      const areaDowntime = await areaDowntimeRepo.save(
        areaDowntimeRepo.create(downtimeData)
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

    const overlapGroups = [...slotsByGroup.values()].filter(
      g => g.length > 1
    ).length;

    console.log(`Áreas: ${areas.length}`);
    console.log(`Departamentos: ${departments.length}`);
    console.log(`Dispositivos: ${devices.length}`);
    console.log(`Señales de dispositivo: ${signalsByAreaDept.size}`);
    console.log(
      `Paros programados: ${scheduledDowntimesSeeded}` +
        (removedScheduled.affected
          ? ` (${removedScheduled.affected} obsoletos eliminados)`
          : '')
    );
    console.log(`Eventos creados: ${slots.length}`);
    console.log(
      `  de los cuales con descuento por paro programado: ${discountedEvents}`
    );
    console.log(`Rebanadas de trazabilidad creadas: ${slicesCreated}`);
    console.log(`AreaDowntimes creados: ${downtimesCreated}`);
    console.log(
      `  de los cuales con eventos entrelazados (2+ eventos): ${overlapGroups}`
    );

    printDemoReport(demoResults);

    console.log('Seed de datos de prueba completado.');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch(error => {
  console.error('Error al ejecutar el seed de datos de prueba:', error);
  process.exit(1);
});
