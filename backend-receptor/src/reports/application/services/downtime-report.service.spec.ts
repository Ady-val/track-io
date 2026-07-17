import { DowntimeReportService } from './downtime-report.service';
import { plantTimeBuckets } from './plant-time.util';
import type { Event } from '../../../events/domain/entities/event.entity';
import { EventStatus } from '../../../events/domain/entities/event.entity';
import type { AreaDowntime } from '../../../area-downtime/domain/entities/area-downtime.entity';

/**
 * TZ=UTC forzado por jest.config.js; la planta es America/Chihuahua (UTC-6, sin
 * DST en 2026). Si el servicio agrupara en UTC en vez de hora de planta, la
 * Trampa 4 fallaría.
 */
const PLANT_TZ = 'America/Chihuahua';

/** Hora de pared de la planta (UTC-6) → instante absoluto. */
function plant(dateTime: string): Date {
  return new Date(`${dateTime}-06:00`);
}

interface Mocks {
  eventRows: Event[];
  downtimeRows: AreaDowntime[];
  areas: Array<{ id: number; name: string }>;
  getDiscountedSeconds: jest.Mock;
  configured: boolean;
}

function chainableQb(rows: unknown[]): Record<string, jest.Mock> {
  const qb: Record<string, jest.Mock> = {};
  for (const m of [
    'where',
    'andWhere',
    'orderBy',
    'skip',
    'take',
    'limit',
    'offset',
  ]) {
    qb[m] = jest.fn(() => qb);
  }
  qb['getMany'] = jest.fn().mockResolvedValue(rows);
  qb['getCount'] = jest.fn().mockResolvedValue(rows.length);
  return qb;
}

function buildService(mocks: Mocks): DowntimeReportService {
  const eventRepository = {
    createQueryBuilder: jest.fn(() => chainableQb(mocks.eventRows)),
  };
  const areaDowntimeRepository = {
    createQueryBuilder: jest.fn(() => chainableQb(mocks.downtimeRows)),
  };
  const areaRepository = {
    findById: jest.fn((id: number) => {
      const found = mocks.areas.find(a => a.id === id);
      return Promise.resolve(found ? { id: found.id, name: found.name } : null);
    }),
    findAll: jest.fn().mockResolvedValue({
      data: mocks.areas,
      total: mocks.areas.length,
    }),
  };
  const calculator = { getDiscountedSeconds: mocks.getDiscountedSeconds };
  const scheduledDowntimeRepository = {
    findActiveByAreaId: jest
      .fn()
      .mockResolvedValue(mocks.configured ? [{ id: 1 }] : []),
  };
  const eventSliceRepository = {
    findByEventIds: jest.fn().mockResolvedValue([]),
  };
  const configService = { get: jest.fn(() => PLANT_TZ) };

  return new DowntimeReportService(
    eventRepository as never,
    areaDowntimeRepository as never,
    areaRepository as never,
    calculator as never,
    scheduledDowntimeRepository as never,
    eventSliceRepository as never,
    configService as never
  );
}

function buildEvent(overrides: Partial<Event>): Event {
  return {
    id: overrides.id ?? 1,
    areaId: overrides.areaId ?? 1,
    areaName: overrides.areaName ?? 'A1',
    departmentId: overrides.departmentId ?? 1,
    departmentName: overrides.departmentName ?? 'Mantenimiento',
    status: EventStatus.CLOSED,
    createdAt: overrides.createdAt ?? plant('2026-07-13T12:00:00'),
    inProgressAt: overrides.inProgressAt,
    closedAt: overrides.closedAt ?? plant('2026-07-13T12:40:00'),
    durationSeconds: overrides.durationSeconds ?? 2400,
    scheduledDowntimeDiscountSeconds:
      overrides.scheduledDowntimeDiscountSeconds,
    responseDiscountSeconds: overrides.responseDiscountSeconds,
    effectiveDurationSeconds: overrides.effectiveDurationSeconds,
    virtualDevice: overrides.virtualDevice ?? false,
    reason: overrides.reason,
    comment: overrides.comment,
  } as Event;
}

function buildDowntime(overrides: Partial<AreaDowntime>): AreaDowntime {
  return {
    id: overrides.id ?? 1,
    areaId: overrides.areaId ?? 1,
    startAt: overrides.startAt ?? plant('2026-07-13T12:00:00'),
    endsAt: overrides.endsAt,
    isActive: overrides.isActive ?? false,
    durationSeconds: overrides.durationSeconds,
    effectiveDurationSeconds: overrides.effectiveDurationSeconds,
    scheduledDowntimeDiscountSeconds:
      overrides.scheduledDowntimeDiscountSeconds,
  } as AreaDowntime;
}

describe('DowntimeReportService', () => {
  it('Trampa 1: rango con paros programados pero SIN paros reales → scheduled>0, unplanned=0, availability=1', async () => {
    const service = buildService({
      areas: [{ id: 1, name: 'A1' }],
      eventRows: [],
      downtimeRows: [],
      getDiscountedSeconds: jest.fn().mockResolvedValue(3600),
      configured: true,
    });

    const report = await service.getDowntimeReport({
      from: plant('2026-07-13T12:00:00').toISOString(),
      to: plant('2026-07-13T14:00:00').toISOString(),
    });

    expect(report.summary.scheduledDowntimeSeconds).toBeGreaterThan(0);
    expect(report.summary.unplannedDowntimeSeconds).toBe(0);
    expect(report.summary.availability).toBe(1);
  });

  it('Trampa 2: downtime que empieza antes de `from` y cierra dentro → solo la parte del rango', async () => {
    const service = buildService({
      areas: [{ id: 1, name: 'A1' }],
      eventRows: [],
      downtimeRows: [
        buildDowntime({
          startAt: plant('2026-07-13T11:00:00'), // antes de from
          endsAt: plant('2026-07-13T12:30:00'), // dentro
          effectiveDurationSeconds: 999999, // "completo": NO debe usarse
        }),
      ],
      getDiscountedSeconds: jest.fn().mockResolvedValue(0),
      configured: true,
    });

    const report = await service.getDowntimeReport({
      from: plant('2026-07-13T12:00:00').toISOString(),
      to: plant('2026-07-13T14:00:00').toISOString(),
    });

    // Recortado: 12:00 → 12:30 = 1800 s, no los 999999 del downtime completo.
    expect(report.summary.unplannedDowntimeSeconds).toBe(1800);
  });

  it('Trampa 3: downtime activo (ends_at null) → cuenta recortado al fin del rango', async () => {
    const service = buildService({
      areas: [{ id: 1, name: 'A1' }],
      eventRows: [],
      downtimeRows: [
        buildDowntime({
          startAt: plant('2026-07-13T12:15:00'),
          // endsAt omitido = activo
        }),
      ],
      getDiscountedSeconds: jest.fn().mockResolvedValue(0),
      configured: true,
    });

    // Rango en el pasado (hoy es 2026-07-16): min(now, to) = to.
    const report = await service.getDowntimeReport({
      from: plant('2026-07-13T12:00:00').toISOString(),
      to: plant('2026-07-13T13:00:00').toISOString(),
    });

    // 12:15 → 13:00 = 2700 s.
    expect(report.summary.unplannedDowntimeSeconds).toBe(2700);
  });

  it('Trampa 4: bucketing en hora de planta, no UTC (plantTimeBuckets)', () => {
    const buckets = plantTimeBuckets(
      plant('2026-07-13T00:00:00'),
      plant('2026-07-15T00:00:00'),
      PLANT_TZ,
      'day'
    );
    expect(buckets.map(b => b.label)).toEqual(['2026-07-13', '2026-07-14']);

    // Un rango que cruza medianoche de planta cae en los días de PLANTA.
    const crossing = plantTimeBuckets(
      plant('2026-07-13T23:00:00'),
      plant('2026-07-14T01:00:00'),
      PLANT_TZ,
      'day'
    );
    expect(crossing.map(b => b.label)).toEqual(['2026-07-13', '2026-07-14']);
  });

  it('Trampa 5: disponibilidad agregada es PONDERADA, no el promedio de porcentajes', async () => {
    // A1: planeado 36000, corriendo 36000 (100%). A2: planeado 18000,
    // corriendo 9000 (50%). Ponderada = 45000/54000 ≈ 0.833, no 0.75.
    const service = buildService({
      areas: [
        { id: 1, name: 'A1' },
        { id: 2, name: 'A2' },
      ],
      eventRows: [],
      downtimeRows: [
        buildDowntime({
          id: 2,
          areaId: 2,
          startAt: plant('2026-07-13T02:00:00'),
          endsAt: plant('2026-07-13T04:30:00'),
          effectiveDurationSeconds: 9000, // contenido
        }),
      ],
      // Calendario/área = 10 h = 36000. A2 tiene 18000 de paro programado.
      getDiscountedSeconds: jest.fn((areaId: number) =>
        Promise.resolve(areaId === 2 ? 18000 : 0)
      ),
      configured: true,
    });

    const report = await service.getDowntimeReport({
      from: plant('2026-07-13T00:00:00').toISOString(),
      to: plant('2026-07-13T10:00:00').toISOString(),
    });

    expect(report.summary.availability).toBeCloseTo(45000 / 54000, 6);
    expect(report.summary.availability).not.toBeCloseTo(0.75, 6);
  });

  it('Caso borde: rango completamente cubierto por paro programado → availability null', async () => {
    const service = buildService({
      areas: [{ id: 1, name: 'A1' }],
      eventRows: [],
      downtimeRows: [],
      getDiscountedSeconds: jest.fn().mockResolvedValue(3600), // == calendario
      configured: true,
    });

    const report = await service.getDowntimeReport({
      from: plant('2026-07-13T12:00:00').toISOString(),
      to: plant('2026-07-13T13:00:00').toISOString(),
    });

    expect(report.summary.plannedProductionSeconds).toBe(0);
    expect(report.summary.availability).toBeNull();
  });

  it('Doble atribución: Σ byDepartment > summary.unplanned y el summary no cuenta doble', async () => {
    const service = buildService({
      areas: [{ id: 1, name: 'A1' }],
      eventRows: [
        buildEvent({ id: 1, departmentId: 1, effectiveDurationSeconds: 600 }),
        buildEvent({ id: 2, departmentId: 2, effectiveDurationSeconds: 600 }),
      ],
      downtimeRows: [
        buildDowntime({
          startAt: plant('2026-07-13T12:00:00'),
          endsAt: plant('2026-07-13T12:10:00'),
          effectiveDurationSeconds: 600, // la LÍNEA se detuvo una sola vez
        }),
      ],
      getDiscountedSeconds: jest.fn().mockResolvedValue(0),
      configured: true,
    });

    const report = await service.getDowntimeReport({
      from: plant('2026-07-13T00:00:00').toISOString(),
      to: plant('2026-07-13T23:00:00').toISOString(),
    });

    const sumByDept = report.byDepartment.reduce(
      (s, d) => s + d.unplannedDowntimeSeconds,
      0
    );
    expect(sumByDept).toBe(1200);
    expect(report.summary.unplannedDowntimeSeconds).toBe(600);
    expect(sumByDept).toBeGreaterThan(report.summary.unplannedDowntimeSeconds);
  });

  it('Medias: excluye los eventos con in_progress_at null (no los cuenta como 0)', async () => {
    const service = buildService({
      areas: [{ id: 1, name: 'A1' }],
      eventRows: [
        buildEvent({
          id: 1,
          createdAt: plant('2026-07-13T12:00:00'),
          inProgressAt: plant('2026-07-13T12:10:00'), // 600 s atención
          closedAt: plant('2026-07-13T12:40:00'), // 1800 s solución
          scheduledDowntimeDiscountSeconds: 0,
          responseDiscountSeconds: 0,
        }),
        buildEvent({
          id: 2,
          // inProgressAt omitido = NO atendido → excluido
        }),
      ],
      downtimeRows: [],
      getDiscountedSeconds: jest.fn().mockResolvedValue(0),
      configured: true,
    });

    const report = await service.getDowntimeReport({
      from: plant('2026-07-13T00:00:00').toISOString(),
      to: plant('2026-07-13T23:00:00').toISOString(),
    });

    expect(report.summary.avgResponseSeconds).toBe(600);
    expect(report.summary.avgResolutionSeconds).toBe(1800);
  });

  it('Buckets sin eventos aparecen con disponibilidad 100%, no se omiten', async () => {
    const service = buildService({
      areas: [{ id: 1, name: 'A1' }],
      eventRows: [],
      downtimeRows: [],
      getDiscountedSeconds: jest.fn().mockResolvedValue(0),
      configured: true,
    });

    const report = await service.getDowntimeReport({
      from: plant('2026-07-13T00:00:00').toISOString(),
      to: plant('2026-07-15T00:00:00').toISOString(),
      groupBy: 'day',
    });

    expect(report.trend).toHaveLength(2);
    for (const bucket of report.trend) {
      expect(bucket.availability).toBe(1);
    }
  });

  it('runSeconds nunca es negativo', async () => {
    const service = buildService({
      areas: [{ id: 1, name: 'A1' }],
      eventRows: [],
      downtimeRows: [
        buildDowntime({
          startAt: plant('2026-07-13T12:00:00'),
          endsAt: plant('2026-07-13T13:00:00'),
          effectiveDurationSeconds: 999999, // paro absurdo > planeado
        }),
      ],
      getDiscountedSeconds: jest.fn().mockResolvedValue(0),
      configured: true,
    });

    const report = await service.getDowntimeReport({
      from: plant('2026-07-13T12:00:00').toISOString(),
      to: plant('2026-07-13T13:00:00').toISOString(),
    });

    expect(report.summary.runSeconds).toBe(0);
    expect(report.summary.runSeconds).toBeGreaterThanOrEqual(0);
  });

  it('hasScheduledDowntimeConfigured refleja si el área tiene ventanas activas', async () => {
    const service = buildService({
      areas: [{ id: 1, name: 'A1' }],
      eventRows: [],
      downtimeRows: [],
      getDiscountedSeconds: jest.fn().mockResolvedValue(0),
      configured: false,
    });

    const report = await service.getDowntimeReport({
      from: plant('2026-07-13T12:00:00').toISOString(),
      to: plant('2026-07-13T13:00:00').toISOString(),
    });

    expect(report.summary.hasScheduledDowntimeConfigured).toBe(false);
  });
});
