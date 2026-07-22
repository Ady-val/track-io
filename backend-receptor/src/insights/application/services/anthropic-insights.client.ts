import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type { AggregatedInsightsPayload } from '../../domain/types/aggregated-insights-payload.type';
import type { RawFinding } from '../../domain/types/insight-finding.type';
import type { InsightLanguage } from '../dtos/analyze-insights.dto';
import { buildInsightsSystemPrompt } from './prompts';

const DEFAULT_MODEL = 'claude-sonnet-5';
// Sonnet 5 corre con "adaptive thinking" prendido por defecto si no se
// desactiva explícitamente — ese razonamiento invisible consume presupuesto
// de max_tokens antes de llegar al JSON visible. Se desactiva abajo (esta
// tarea es resumir/priorizar un payload ya agregado, no razonar en varios
// pasos), y el default aquí deja margen amplio para 5 hallazgos completos.
const DEFAULT_MAX_TOKENS = 4000;
const REQUEST_TIMEOUT_MS = 60_000;

export class InsightsApiKeyMissingError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY no está configurada');
    this.name = 'InsightsApiKeyMissingError';
  }
}

export class InsightsRateLimitError extends Error {
  constructor() {
    super('Rate limit de la API de Anthropic alcanzado');
    this.name = 'InsightsRateLimitError';
  }
}

export class InsightsUpstreamError extends Error {
  constructor(message = 'No se pudo generar el análisis') {
    super(message);
    this.name = 'InsightsUpstreamError';
  }
}

/**
 * Encapsula toda la interacción con la API de Anthropic. Sin lógica de
 * negocio: recibe un payload ya agregado y devuelve hallazgos crudos
 * (RawFinding[]), sin resolver contra el payload — eso lo hace
 * InsightsService.resolveAndValidate().
 */
@Injectable()
export class AnthropicInsightsClient {
  private readonly logger = new Logger(AnthropicInsightsClient.name);
  private client: Anthropic | null = null;

  private get apiKey(): string | undefined {
    return process.env['ANTHROPIC_API_KEY'];
  }

  get model(): string {
    return process.env['ANTHROPIC_MODEL'] || DEFAULT_MODEL;
  }

  private get maxTokens(): number {
    const raw = process.env['INSIGHTS_MAX_TOKENS'];
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_TOKENS;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  private getClient(): Anthropic {
    if (!this.apiKey) {
      throw new InsightsApiKeyMissingError();
    }
    if (!this.client) {
      this.client = new Anthropic({
        apiKey: this.apiKey,
        timeout: REQUEST_TIMEOUT_MS,
        maxRetries: 1,
      });
    }
    return this.client;
  }

  async findPatterns(
    payload: AggregatedInsightsPayload,
    language: InsightLanguage
  ): Promise<{ findings: RawFinding[]; model: string }> {
    const system = buildInsightsSystemPrompt(language);
    const userContent = JSON.stringify(payload);

    // 1 reintento si la respuesta llega pero no se puede parsear (JSON
    // truncado, cortado por max_tokens, etc.) — el reintento de red del SDK
    // (maxRetries: 1) no cubre este caso porque la llamada en sí fue exitosa.
    const response = await this.requestMessage(system, userContent);
    try {
      const findings = this.parseFindings(response);
      return { findings, model: response.model };
    } catch (error) {
      if (!(error instanceof InsightsUpstreamError)) throw error;
      this.logger.warn('Reintentando tras respuesta no parseable del modelo');
      const retryResponse = await this.requestMessage(system, userContent);
      const findings = this.parseFindings(retryResponse);
      return { findings, model: retryResponse.model };
    }
  }

  private async requestMessage(
    system: string,
    userContent: string
  ): Promise<Anthropic.Message> {
    const client = this.getClient();
    try {
      return await client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        // Tarea acotada de resumir/priorizar un payload ya agregado: no
        // necesita razonamiento multi-paso, y dejarlo en automático le resta
        // presupuesto de tokens al JSON de salida (ver nota en DEFAULT_MAX_TOKENS).
        thinking: { type: 'disabled' },
        system,
        messages: [{ role: 'user', content: userContent }],
      });
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) {
        throw new InsightsRateLimitError();
      }
      this.logger.error(
        `Fallo llamando a la API de Anthropic: ${(error as Error).message}`
      );
      throw new InsightsUpstreamError();
    }
  }

  /** Extrae el texto, quita fences ```json si aparecen, y parsea el array. */
  private parseFindings(response: Anthropic.Message): RawFinding[] {
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    if (!textBlock) {
      this.logger.warn('Respuesta del modelo sin bloque de texto');
      throw new InsightsUpstreamError();
    }

    const cleaned = textBlock.text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (error) {
      this.logger.warn(
        `No se pudo parsear la respuesta del modelo como JSON. ` +
          `stop_reason=${response.stop_reason} length=${cleaned.length} ` +
          `error=${(error as Error).message}\n--- inicio ---\n${cleaned.slice(0, 500)}\n--- fin ---\n${cleaned.slice(-500)}`
      );
      throw new InsightsUpstreamError();
    }

    if (!Array.isArray(parsed)) {
      this.logger.warn('La respuesta del modelo no es un array JSON');
      throw new InsightsUpstreamError();
    }

    return parsed.filter(isRawFindingShape);
  }
}

function isRawFindingShape(value: unknown): value is RawFinding {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['title'] === 'string' &&
    typeof candidate['description'] === 'string' &&
    typeof candidate['severity'] === 'string' &&
    typeof candidate['category'] === 'string' &&
    typeof candidate['supportMetricLabel'] === 'string' &&
    typeof candidate['supportMetricValue'] === 'string'
  );
}
