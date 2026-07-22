import { EventInsightsAggregator } from './event-insights-aggregator.service';
import {
  EventStatus,
  type Event,
} from '../../../events/domain/entities/event.entity';
import { AlertLevel } from '../../../alert-escalation/domain/entities/alert-escalation-message.entity';
import type { EventAlertLog } from '../../../alert-escalation/domain/entities/event-alert-log.entity';

const PLANT_TZ = 'America/Chihuahua';

function plant(dateTime: string): Date {
  return new Date(`${dateTime}-06:00`);
}

function chainableQb(rows: unknown[]): Record<string, jest.Mock> {
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['where', 'andWhere', 'orderBy']) {
    qb[m] = jest.fn(() => qb);
  }
  qb['getMany'] = jest.fn().mockResolvedValue(rows);
  return qb;
}

function buildEvent(overrides: Partial<Event>): Event {
  return {
    id: overrides.id ?? 1,
    areaId: overrides.areaId ?? 1,
    areaName: overrides.areaName ?? 'Línea 1',
    departmentId: overrides.departmentId ?? 1,
    departmentName: overrides.departmentName ?? 'Mantenimiento',
    deviceId: overrides.deviceId ?? 1,
    deviceName: overrides.deviceName ?? 'Botonera 1',
    deviceSignalId: overrides.deviceSignalId ?? 1,
    deviceSignalName: overrides.deviceSignalName ?? 'Botón 1',
    status: EventStatus.CLOSED,
    createdAt: overrides.createdAt ?? plant('2026-07-13T12:00:00'),
    updatedAt: overrides.updatedAt ?? plant('2026-07-13T12:40:00'),
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
    virtualUserName: overrides.virtualUserName,
    progressComment: overrides.progressComment,
    closeComment: overrides.closeComment,
  } as Event;
}

interface BuildOpts {
  events: Event[];
  alertLogs?: EventAlertLog[];
  areas?: Array<{ id: number; name: string }>;
  discountedSecondsByArea?: Record<number, number>;
}

function buildAggregator(opts: BuildOpts): EventInsightsAggregator {
  const eventRepository = {
    createQueryBuilder: jest.fn(() => chainableQb(opts.events)),
  };
  const eventAlertLogRepository = {
    find: jest.fn().mockResolvedValue(opts.alertLogs ?? []),
  };
  const areas = opts.areas ?? [{ id: 1, name: 'Línea 1' }];
  const areaRepository = {
    findById: jest.fn((id: number) => {
      const found = areas.find(a => a.id === id);
      return Promise.resolve(found ?? null);
    }),
    findAll: jest.fn().mockResolvedValue({ data: areas, total: areas.length }),
  };
  const calculator = {
    getDiscountedSeconds: jest.fn((areaId: number) =>
      Promise.resolve(opts.discountedSecondsByArea?.[areaId] ?? 0)
    ),
  };
  const configService = { get: jest.fn(() => PLANT_TZ) };

  return new EventInsightsAggregator(
    eventRepository as never,
    eventAlertLogRepository as never,
    areaRepository as never,
    calculator as never,
    configService as never
  );
}

describe('EventInsightsAggregator', () => {
  const range = {
    startDate: plant('2026-07-13T00:00:00').toISOString(),
    endDate: plant('2026-07-14T00:00:00').toISOString(),
  };

  it('nunca expone eventos individuales — solo agregados', async () => {
    const events = [
      buildEvent({
        id: 1,
        durationSeconds: 600,
        effectiveDurationSeconds: 600,
      }),
      buildEvent({
        id: 2,
        durationSeconds: 1200,
        effectiveDurationSeconds: 1200,
      }),
    ];
    const aggregator = buildAggregator({ events });

    const payload = await aggregator.build(range);
    const serialized = JSON.stringify(payload);

    expect(payload.totals.totalEvents).toBe(2);
    // No debe filtrarse ningún campo propio de un evento individual (id).
    expect(serialized).not.toMatch(/"eventId":1/);
  });

  it('calcula totalDowntimeMinutes y totalDowntimeMinutesExcludingScheduled en minutos', async () => {
    const events = [
      buildEvent({
        id: 1,
        durationSeconds: 600,
        effectiveDurationSeconds: 300,
      }),
      buildEvent({
        id: 2,
        durationSeconds: 1200,
        effectiveDurationSeconds: 1200,
      }),
    ];
    const aggregator = buildAggregator({ events });

    const payload = await aggregator.build(range);

    expect(payload.totals.totalDowntimeMinutes).toBeCloseTo(30, 5); // (600+1200)/60
    expect(payload.totals.totalDowntimeMinutesExcludingScheduled).toBeCloseTo(
      25,
      5
    ); // (300+1200)/60
  });

  it('calcula escalatedToAlertPct y escalatedToLevel2Pct a partir de event_alert_logs', async () => {
    const events = [
      buildEvent({ id: 1 }),
      buildEvent({ id: 2 }),
      buildEvent({ id: 3 }),
      buildEvent({ id: 4 }),
    ];
    const alertLogs = [
      { eventId: 1, level: AlertLevel.ALERT },
      { eventId: 2, level: AlertLevel.ALERT },
      { eventId: 2, level: AlertLevel.ESCALATION2 },
    ] as EventAlertLog[];
    const aggregator = buildAggregator({ events, alertLogs });

    const payload = await aggregator.build(range);

    expect(payload.totals.escalatedToAlertPct).toBeCloseTo(50, 5); // 2/4
    expect(payload.totals.escalatedToLevel2Pct).toBeCloseTo(25, 5); // 1/4
  });

  it('agrupa byAreaDepartment y ordena por totalMinutes descendente', async () => {
    const events = [
      buildEvent({
        id: 1,
        areaId: 1,
        areaName: 'Línea 1',
        departmentId: 1,
        departmentName: 'Mantenimiento',
        durationSeconds: 600,
      }),
      buildEvent({
        id: 2,
        areaId: 2,
        areaName: 'Línea 2',
        departmentId: 3,
        departmentName: 'Calidad',
        durationSeconds: 3000,
      }),
    ];
    const aggregator = buildAggregator({ events });

    const payload = await aggregator.build(range);

    expect(payload.byAreaDepartment).toHaveLength(2);
    expect(payload.byAreaDepartment[0]?.departmentName).toBe('Calidad');
    expect(payload.byAreaDepartment[0]?.totalMinutes).toBeCloseTo(50, 5);
    expect(payload.byAreaDepartment[1]?.departmentName).toBe('Mantenimiento');
  });

  it('byReason ignora eventos sin motivo capturado (degrada con gracia)', async () => {
    const events = [
      buildEvent({ id: 1, reason: 'Falta material' }),
      buildEvent({ id: 2, reason: undefined }),
      buildEvent({ id: 3, reason: '   ' }),
    ];
    const aggregator = buildAggregator({ events });

    const payload = await aggregator.build(range);

    expect(payload.byReason).toHaveLength(1);
    expect(payload.byReason[0]?.reason).toBe('Falta material');
  });

  it('virtualDeviceSummary es null cuando no hubo eventos de botonera virtual', async () => {
    const events = [buildEvent({ id: 1, virtualDevice: false })];
    const aggregator = buildAggregator({ events });

    const payload = await aggregator.build(range);

    expect(payload.virtualDeviceSummary).toBeNull();
  });

  it('virtualDeviceSummary agrega withReasonPct/withCloseCommentPct cuando sí hubo', async () => {
    const events = [
      buildEvent({
        id: 1,
        virtualDevice: true,
        reason: 'Falta material',
        closeComment: 'Resuelto',
      }),
      buildEvent({ id: 2, virtualDevice: true }),
    ];
    const aggregator = buildAggregator({ events });

    const payload = await aggregator.build(range);

    expect(payload.virtualDeviceSummary).toEqual({
      eventCount: 2,
      withReasonPct: 50,
      withCloseCommentPct: 50,
    });
  });

  it('topSignalsByDuration respeta INSIGHTS_TOP_SIGNALS', async () => {
    const previous = process.env['INSIGHTS_TOP_SIGNALS'];
    process.env['INSIGHTS_TOP_SIGNALS'] = '1';
    try {
      const events = [
        buildEvent({ id: 1, deviceSignalId: 1, durationSeconds: 100 }),
        buildEvent({ id: 2, deviceSignalId: 2, durationSeconds: 500 }),
      ];
      const aggregator = buildAggregator({ events });

      const payload = await aggregator.build(range);

      expect(payload.topSignalsByDuration).toHaveLength(1);
      expect(payload.topSignalsByDuration[0]?.signalId).toBe(2);
    } finally {
      if (previous === undefined) delete process.env['INSIGHTS_TOP_SIGNALS'];
      else process.env['INSIGHTS_TOP_SIGNALS'] = previous;
    }
  });

  it('totals quedan en cero sin llamar a nada más cuando no hay eventos', async () => {
    const aggregator = buildAggregator({ events: [] });

    const payload = await aggregator.build(range);

    expect(payload.totals.totalEvents).toBe(0);
    expect(payload.totals.escalatedToAlertPct).toBe(0);
    expect(payload.byAreaDepartment).toEqual([]);
    expect(payload.topSignalsByDuration).toEqual([]);
    expect(payload.virtualDeviceSummary).toBeNull();
  });
});
