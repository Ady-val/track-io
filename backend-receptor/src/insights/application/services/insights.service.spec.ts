import { BadRequestException } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { InsightsApiKeyMissingError } from './anthropic-insights.client';
import type { AggregatedInsightsPayload } from '../../domain/types/aggregated-insights-payload.type';
import type { RawFinding } from '../../domain/types/insight-finding.type';

function buildPayload(
  overrides?: Partial<AggregatedInsightsPayload>
): AggregatedInsightsPayload {
  return {
    range: {
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-08T00:00:00.000Z',
      days: 7,
    },
    totals: {
      totalEvents: 10,
      totalActiveMinutes: 1000,
      totalDowntimeMinutes: 300,
      totalDowntimeMinutesExcludingScheduled: 250,
      escalatedToAlertPct: 20,
      escalatedToLevel2Pct: 10,
    },
    byAreaDepartment: [
      {
        areaId: 1,
        areaName: 'Línea 1',
        departmentId: 2,
        departmentName: 'Mantenimiento',
        eventCount: 5,
        totalMinutes: 200,
        avgMinutes: 40,
        escalatedToAlertPct: 20,
      },
    ],
    byHourOfDay: [],
    byDayOfWeek: [],
    byReason: [],
    topSignalsByDuration: [
      {
        signalId: 9,
        signalName: 'Botón 1',
        areaName: 'Línea 1',
        departmentName: 'Mantenimiento',
        totalMinutes: 150,
        eventCount: 3,
        escalatedToAlertPct: 33.3,
      },
    ],
    virtualDeviceSummary: null,
    ...overrides,
  };
}

function buildService(opts: {
  payload: AggregatedInsightsPayload;
  rawFindings?: RawFinding[];
  configured?: boolean;
  cached?: unknown;
}) {
  const aggregator = { build: jest.fn().mockResolvedValue(opts.payload) };
  const anthropic = {
    isConfigured: jest.fn().mockReturnValue(opts.configured ?? true),
    model: 'claude-sonnet-5',
    findPatterns: jest.fn().mockResolvedValue({
      findings: opts.rawFindings ?? [],
      model: 'claude-sonnet-5',
    }),
  };
  const cache = {
    findValidByCacheKey: jest.fn().mockResolvedValue(opts.cached ?? null),
    upsert: jest.fn().mockResolvedValue(undefined),
  };

  const service = new InsightsService(
    aggregator as never,
    anthropic as never,
    cache as never
  );
  return { service, aggregator, anthropic, cache };
}

describe('InsightsService', () => {
  const validDto = {
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-07-08T00:00:00.000Z',
  };

  afterEach(() => {
    delete process.env['INSIGHTS_MAX_RANGE_DAYS'];
    delete process.env['INSIGHTS_CACHE_TTL_MINUTES'];
  });

  it('rechaza fechas inválidas', async () => {
    const { service } = buildService({ payload: buildPayload() });
    await expect(
      service.analyze({ startDate: 'not-a-date', endDate: validDto.endDate })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza endDate <= startDate', async () => {
    const { service } = buildService({ payload: buildPayload() });
    await expect(
      service.analyze({
        startDate: validDto.endDate,
        endDate: validDto.startDate,
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza rangos que excedan INSIGHTS_MAX_RANGE_DAYS', async () => {
    process.env['INSIGHTS_MAX_RANGE_DAYS'] = '3';
    const { service } = buildService({ payload: buildPayload() });
    await expect(service.analyze(validDto)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('lanza InsightsApiKeyMissingError si el cliente no está configurado', async () => {
    const { service } = buildService({
      payload: buildPayload(),
      configured: false,
    });
    await expect(service.analyze(validDto)).rejects.toBeInstanceOf(
      InsightsApiKeyMissingError
    );
  });

  it('no llama al modelo cuando el periodo no tiene eventos (corto-circuito)', async () => {
    const emptyPayload = buildPayload({
      totals: {
        totalEvents: 0,
        totalActiveMinutes: 1000,
        totalDowntimeMinutes: 0,
        totalDowntimeMinutesExcludingScheduled: 0,
        escalatedToAlertPct: 0,
        escalatedToLevel2Pct: 0,
      },
      byAreaDepartment: [],
      topSignalsByDuration: [],
    });
    const { service, anthropic } = buildService({ payload: emptyPayload });

    const result = await service.analyze(validDto);

    expect(anthropic.findPatterns).not.toHaveBeenCalled();
    expect(result.findings).toEqual([]);
    expect(result.meta.totalEventsAnalyzed).toBe(0);
    expect(result.meta.cached).toBe(false);
  });

  it('descarta hallazgos cuyo relatedSignalId no existe en el payload', async () => {
    const payload = buildPayload();
    const rawFindings: RawFinding[] = [
      {
        title: 'Señal inventada',
        description: 'x',
        severity: 'warning',
        category: 'señal',
        supportMetricLabel: 'Duración total',
        supportMetricValue: '999 min',
        relatedSignalId: 12345, // no existe en payload.topSignalsByDuration
      },
    ];
    const { service } = buildService({ payload, rawFindings });

    const result = await service.analyze(validDto);

    expect(result.findings).toEqual([]);
  });

  it('conserva y re-resuelve un hallazgo con relatedSignalId válido usando el número real', async () => {
    const payload = buildPayload();
    const rawFindings: RawFinding[] = [
      {
        title: 'Botón 1 concentra el paro',
        description: 'x',
        severity: 'critical',
        category: 'señal',
        supportMetricLabel: 'Duración total',
        supportMetricValue: '999999 min', // cifra inventada por el modelo — debe ignorarse
        relatedSignalId: 9,
      },
    ];
    const { service } = buildService({ payload, rawFindings });

    const result = await service.analyze(validDto);

    expect(result.findings).toHaveLength(1);
    // El valor final viene del payload real (150 min), no de lo que dijo el modelo.
    expect(result.findings[0]?.supportingMetric.value).toBe('150 min');
    expect(result.findings[0]?.relatedSignalId).toBe(9);
  });

  it('limita a 5 hallazgos como máximo', async () => {
    const payload = buildPayload();
    const rawFindings: RawFinding[] = Array.from({ length: 8 }, (_, i) => ({
      title: `Hallazgo ${i}`,
      description: 'x',
      severity: 'info' as const,
      category: 'señal' as const,
      supportMetricLabel: 'Duración total',
      supportMetricValue: '150 min',
      relatedSignalId: 9,
    }));
    const { service } = buildService({ payload, rawFindings });

    const result = await service.analyze(validDto);

    expect(result.findings.length).toBeLessThanOrEqual(5);
  });

  it('usa la caché vigente y no llama al aggregator ni al modelo', async () => {
    const cached = {
      findingsJson: [],
      totalEventsAnalyzed: 7,
      model: 'claude-sonnet-5',
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
    };
    const { service, aggregator, anthropic } = buildService({
      payload: buildPayload(),
      cached,
    });

    const result = await service.analyze(validDto);

    expect(aggregator.build).not.toHaveBeenCalled();
    expect(anthropic.findPatterns).not.toHaveBeenCalled();
    expect(result.meta.cached).toBe(true);
    expect(result.meta.totalEventsAnalyzed).toBe(7);
  });

  it('no consulta la caché cuando INSIGHTS_CACHE_TTL_MINUTES=0', async () => {
    process.env['INSIGHTS_CACHE_TTL_MINUTES'] = '0';
    const { service, cache } = buildService({
      payload: buildPayload({
        totals: {
          totalEvents: 0,
          totalActiveMinutes: 0,
          totalDowntimeMinutes: 0,
          totalDowntimeMinutesExcludingScheduled: 0,
          escalatedToAlertPct: 0,
          escalatedToLevel2Pct: 0,
        },
      }),
    });

    await service.analyze(validDto);

    expect(cache.findValidByCacheKey).not.toHaveBeenCalled();
  });
});
