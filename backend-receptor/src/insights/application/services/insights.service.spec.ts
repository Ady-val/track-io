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
      groupBy: 'day',
      bucketCount: 7,
      timezone: 'America/Mexico_City',
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
    byPeriod: [],
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
    delete process.env['INSIGHTS_MIN_SAMPLE'];
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

  describe('agrupación (groupBy) — §ajuste de agrupación, caché y muestras chicas', () => {
    it('pasa el groupBy explícito al aggregator y lo refleja en meta', async () => {
      const { service, aggregator } = buildService({
        payload: buildPayload({
          range: {
            startDate: validDto.startDate,
            endDate: validDto.endDate,
            days: 7,
            groupBy: 'week',
            bucketCount: 2,
            timezone: 'America/Mexico_City',
          },
        }),
      });

      const result = await service.analyze({ ...validDto, groupBy: 'week' });

      expect(aggregator.build).toHaveBeenCalledWith(
        expect.objectContaining({ groupBy: 'week' })
      );
      expect(result.meta.groupBy).toBe('week');
    });

    it('deriva groupBy=day para rangos cortos (<=14 días) cuando no viene en el request', async () => {
      const { service, aggregator } = buildService({ payload: buildPayload() });

      await service.analyze(validDto); // 7 días

      expect(aggregator.build).toHaveBeenCalledWith(
        expect.objectContaining({ groupBy: 'day' })
      );
    });

    it('deriva groupBy=month para rangos largos (>60 días) cuando no viene en el request', async () => {
      const { service, aggregator } = buildService({ payload: buildPayload() });

      await service.analyze({
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-03-15T00:00:00.000Z', // ~73 días (<=90, >60)
      });

      expect(aggregator.build).toHaveBeenCalledWith(
        expect.objectContaining({ groupBy: 'month' })
      );
    });

    it('dos análisis con las mismas fechas pero distinta agrupación producen cacheKey distinta', async () => {
      const { service, cache } = buildService({ payload: buildPayload() });

      await service.analyze({ ...validDto, groupBy: 'day' });
      await service.analyze({ ...validDto, groupBy: 'week' });

      expect(cache.upsert).toHaveBeenCalledTimes(2);
      const keys = cache.upsert.mock.calls.map(
        call => (call[0] as { cacheKey: string }).cacheKey
      );
      expect(keys[0]).not.toBe(keys[1]);
    });

    it('agrega notice DEGENERATE_GROUPING cuando bucketCount < 2', async () => {
      const { service } = buildService({
        payload: buildPayload({
          range: {
            startDate: validDto.startDate,
            endDate: validDto.endDate,
            days: 7,
            groupBy: 'month',
            bucketCount: 1,
            timezone: 'America/Mexico_City',
          },
        }),
      });

      const result = await service.analyze({ ...validDto, groupBy: 'month' });

      expect(result.meta.notices).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'DEGENERATE_GROUPING' }),
        ])
      );
    });

    it('no agrega notice DEGENERATE_GROUPING cuando bucketCount >= 2', async () => {
      const { service } = buildService({ payload: buildPayload() }); // bucketCount: 7

      const result = await service.analyze(validDto);

      expect(result.meta.notices ?? []).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'DEGENERATE_GROUPING' }),
        ])
      );
    });

    it('agrega notice SMALL_SAMPLE cuando totalEvents < INSIGHTS_MIN_SAMPLE', async () => {
      process.env['INSIGHTS_MIN_SAMPLE'] = '20';
      const { service } = buildService({ payload: buildPayload() }); // totalEvents: 10

      const result = await service.analyze(validDto);

      expect(result.meta.notices).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'SMALL_SAMPLE' }),
        ])
      );
    });

    it('no agrega notice SMALL_SAMPLE cuando totalEvents >= INSIGHTS_MIN_SAMPLE', async () => {
      process.env['INSIGHTS_MIN_SAMPLE'] = '5';
      const { service } = buildService({ payload: buildPayload() }); // totalEvents: 10

      const result = await service.analyze(validDto);

      expect(result.meta.notices ?? []).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'SMALL_SAMPLE' }),
        ])
      );
    });

    it('no agrega notices cuando el periodo no tiene eventos (ya lo comunica el estado vacío)', async () => {
      const { service } = buildService({
        payload: buildPayload({
          range: {
            startDate: validDto.startDate,
            endDate: validDto.endDate,
            days: 7,
            groupBy: 'month',
            bucketCount: 1,
            timezone: 'America/Mexico_City',
          },
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
        }),
      });

      const result = await service.analyze(validDto);

      expect(result.meta.notices).toBeUndefined();
    });

    it('incluye un mini-resumen del periodo (summary) que refleja el payload real', async () => {
      const { service } = buildService({ payload: buildPayload() });

      const result = await service.analyze(validDto);

      expect(result.meta.summary).toEqual({
        totalEventsAnalyzed: 10,
        totalDowntimeMinutes: 300,
        topDepartment: { name: 'Línea 1 · Mantenimiento', minutes: 200 },
        topSignal: { name: 'Botón 1', minutes: 150 },
      });
    });

    it('un cache-hit conserva groupBy, notices y summary guardados junto con los hallazgos', async () => {
      const cached = {
        findingsJson: [],
        metaJson: {
          notices: [{ code: 'SMALL_SAMPLE', message: 'poca muestra' }],
          summary: {
            totalEventsAnalyzed: 7,
            totalDowntimeMinutes: 42,
            topDepartment: null,
            topSignal: null,
          },
        },
        totalEventsAnalyzed: 7,
        model: 'claude-sonnet-5',
        createdAt: new Date('2026-07-01T00:00:00.000Z'),
      };
      const { service } = buildService({ payload: buildPayload(), cached });

      const result = await service.analyze({ ...validDto, groupBy: 'week' });

      expect(result.meta.groupBy).toBe('week');
      expect(result.meta.notices).toEqual([
        { code: 'SMALL_SAMPLE', message: 'poca muestra' },
      ]);
      expect(result.meta.summary.totalDowntimeMinutes).toBe(42);
    });
  });
});
