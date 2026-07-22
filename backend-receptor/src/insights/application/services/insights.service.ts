import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { EventInsightsAggregator } from './event-insights-aggregator.service';
import {
  AnthropicInsightsClient,
  InsightsApiKeyMissingError,
} from './anthropic-insights.client';
import { InsightAnalysisCacheRepository } from '../../domain/repositories/insight-analysis-cache.repository';
import type { AggregatedInsightsPayload } from '../../domain/types/aggregated-insights-payload.type';
import type { RawFinding } from '../../domain/types/insight-finding.type';
import type {
  AnalyzeInsightsDto,
  InsightLanguage,
} from '../dtos/analyze-insights.dto';
import type {
  InsightAnalysisResponseDto,
  InsightFindingDto,
  InsightSupportingMetric,
  InsightsHealthDto,
} from '../dtos/insight-analysis-response.dto';

const DEFAULT_MAX_RANGE_DAYS = 90;
const DEFAULT_CACHE_TTL_MINUTES = 1440;
const MAX_FINDINGS = 5;

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    private readonly aggregator: EventInsightsAggregator,
    private readonly anthropic: AnthropicInsightsClient,
    private readonly cache: InsightAnalysisCacheRepository
  ) {}

  getHealth(): InsightsHealthDto {
    return {
      enabled: true,
      modelConfigured: this.anthropic.isConfigured(),
    };
  }

  async analyze(dto: AnalyzeInsightsDto): Promise<InsightAnalysisResponseDto> {
    const { from, to } = this.validateRange(dto.startDate, dto.endDate);
    const language: InsightLanguage = dto.language ?? 'es';

    if (!this.anthropic.isConfigured()) {
      throw new InsightsApiKeyMissingError();
    }

    const cacheKey = this.buildCacheKey(dto, language);
    const ttlMinutes = this.cacheTtlMinutes();
    if (ttlMinutes > 0) {
      const cached = await this.cache.findValidByCacheKey(cacheKey);
      if (cached) {
        return {
          findings: cached.findingsJson as InsightFindingDto[],
          meta: {
            startDate: from.toISOString(),
            endDate: to.toISOString(),
            totalEventsAnalyzed: cached.totalEventsAnalyzed,
            generatedAt: cached.createdAt.toISOString(),
            model: cached.model,
            cached: true,
          },
        };
      }
    }

    const payload = await this.aggregator.build({
      startDate: from.toISOString(),
      endDate: to.toISOString(),
      ...(dto.areaId !== undefined && { areaId: dto.areaId }),
    });

    this.logger.log(
      `Insights: rango=${from.toISOString()}..${to.toISOString()} areaId=${dto.areaId ?? 'todas'} totalEvents=${payload.totals.totalEvents} payloadBytes=${JSON.stringify(payload).length}`
    );

    if (payload.totals.totalEvents === 0) {
      return this.buildResponse([], payload, this.anthropic.model, false);
    }

    const { findings: rawFindings, model } = await this.anthropic.findPatterns(
      payload,
      language
    );
    const findings = this.resolveAndValidate(rawFindings, payload, language);

    if (ttlMinutes > 0) {
      await this.cache.upsert({
        cacheKey,
        startDate: from,
        endDate: to,
        ...(dto.areaId !== undefined && { areaId: dto.areaId }),
        findingsJson: findings,
        totalEventsAnalyzed: payload.totals.totalEvents,
        model,
        expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
      });
    }

    return this.buildResponse(findings, payload, model, false);
  }

  private buildResponse(
    findings: InsightFindingDto[],
    payload: AggregatedInsightsPayload,
    model: string,
    cached: boolean
  ): InsightAnalysisResponseDto {
    return {
      findings,
      meta: {
        startDate: payload.range.startDate,
        endDate: payload.range.endDate,
        totalEventsAnalyzed: payload.totals.totalEvents,
        generatedAt: new Date().toISOString(),
        model,
        cached,
      },
    };
  }

  private validateRange(
    startDate: string,
    endDate: string
  ): { from: Date; to: Date } {
    const from = new Date(startDate);
    const to = new Date(endDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException(
        'startDate y endDate deben ser fechas ISO 8601 válidas'
      );
    }
    if (to.getTime() <= from.getTime()) {
      throw new BadRequestException('endDate debe ser posterior a startDate');
    }
    const maxRangeMs = this.maxRangeDays() * 24 * 60 * 60 * 1000;
    if (to.getTime() - from.getTime() > maxRangeMs) {
      throw new BadRequestException(
        `El rango no puede exceder ${this.maxRangeDays()} días`
      );
    }
    return { from, to };
  }

  private maxRangeDays(): number {
    const raw = process.env['INSIGHTS_MAX_RANGE_DAYS'];
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_MAX_RANGE_DAYS;
  }

  private cacheTtlMinutes(): number {
    const raw = process.env['INSIGHTS_CACHE_TTL_MINUTES'];
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed >= 0
      ? parsed
      : DEFAULT_CACHE_TTL_MINUTES;
  }

  private buildCacheKey(dto: AnalyzeInsightsDto, language: string): string {
    const raw = [
      dto.startDate,
      dto.endDate,
      dto.areaId ?? 'all',
      language,
      this.anthropic.model,
    ].join('|');
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Re-resuelve cada hallazgo contra el payload real: nunca confía en la
   * cifra que trajo el modelo. Descarta hallazgos cuyos ids no existan en el
   * payload (§4.7 / §9 del spec).
   */
  private resolveAndValidate(
    raw: RawFinding[],
    payload: AggregatedInsightsPayload,
    language: InsightLanguage
  ): InsightFindingDto[] {
    const payloadText = JSON.stringify(payload);
    const overallAvgMinutes =
      payload.totals.totalEvents > 0
        ? payload.totals.totalDowntimeMinutes / payload.totals.totalEvents
        : 0;

    const resolved: InsightFindingDto[] = [];

    for (const finding of raw) {
      if (resolved.length >= MAX_FINDINGS) break;
      if (!this.isValidShape(finding)) continue;

      const metric = this.resolveSupportingMetric(
        finding,
        payload,
        payloadText,
        overallAvgMinutes,
        language
      );
      if (!metric) continue;

      resolved.push({
        id: randomUUID(),
        title: finding.title,
        description: finding.description,
        severity: finding.severity,
        category: finding.category,
        supportingMetric: metric,
        ...(finding.relatedAreaId !== undefined && {
          relatedAreaId: finding.relatedAreaId,
        }),
        ...(finding.relatedDepartmentId !== undefined && {
          relatedDepartmentId: finding.relatedDepartmentId,
        }),
        ...(finding.relatedSignalId !== undefined && {
          relatedSignalId: finding.relatedSignalId,
        }),
      });
    }

    return resolved;
  }

  private isValidShape(finding: RawFinding): boolean {
    const validSeverities = ['info', 'warning', 'critical'];
    const validCategories = [
      'departamento',
      'area',
      'señal',
      'motivo',
      'horario',
      'escalamiento',
    ];
    return (
      validSeverities.includes(finding.severity) &&
      validCategories.includes(finding.category) &&
      finding.title.trim().length > 0 &&
      finding.description.trim().length > 0
    );
  }

  private resolveSupportingMetric(
    finding: RawFinding,
    payload: AggregatedInsightsPayload,
    payloadText: string,
    overallAvgMinutes: number,
    language: InsightLanguage
  ): InsightSupportingMetric | null {
    if (finding.relatedSignalId !== undefined) {
      const row = payload.topSignalsByDuration.find(
        s => s.signalId === finding.relatedSignalId
      );
      if (!row) return null;
      const avg = row.eventCount > 0 ? row.totalMinutes / row.eventCount : 0;
      const comparison = this.buildRatioComparison(
        avg,
        overallAvgMinutes,
        language
      );
      return {
        label: finding.supportMetricLabel,
        value: this.formatMinutes(row.totalMinutes),
        ...(comparison !== undefined && { comparison }),
      };
    }

    if (
      finding.relatedAreaId !== undefined ||
      finding.relatedDepartmentId !== undefined
    ) {
      const row = payload.byAreaDepartment.find(
        r =>
          (finding.relatedAreaId === undefined ||
            r.areaId === finding.relatedAreaId) &&
          (finding.relatedDepartmentId === undefined ||
            r.departmentId === finding.relatedDepartmentId)
      );
      if (!row) return null;
      const comparison = this.buildRatioComparison(
        row.avgMinutes,
        overallAvgMinutes,
        language
      );
      return {
        label: finding.supportMetricLabel,
        value: this.formatMinutes(row.totalMinutes),
        ...(comparison !== undefined && { comparison }),
      };
    }

    // Sin id relacionado (p. ej. categoría 'horario' o 'motivo'): solo se
    // acepta si el valor que cita el modelo aparece literalmente en el
    // payload — evita colar una cifra inventada.
    if (payloadText.includes(finding.supportMetricValue)) {
      const result: InsightSupportingMetric = {
        label: finding.supportMetricLabel,
        value: finding.supportMetricValue,
      };
      if (
        finding.supportComparison &&
        payloadText.includes(finding.supportComparison)
      ) {
        result.comparison = finding.supportComparison;
      }
      return result;
    }

    return null;
  }

  private formatMinutes(minutes: number): string {
    const rounded = Math.round(minutes * 10) / 10;
    return `${rounded} min`;
  }

  private buildRatioComparison(
    value: number,
    baseline: number,
    language: InsightLanguage
  ): string | undefined {
    if (baseline <= 0 || value <= 0) return undefined;
    const ratio = Math.round((value / baseline) * 10) / 10;
    return language === 'en'
      ? `${ratio}x vs overall average`
      : `${ratio}x vs promedio general`;
  }
}
