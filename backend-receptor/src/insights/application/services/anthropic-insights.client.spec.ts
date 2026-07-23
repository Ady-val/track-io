import type Anthropic from '@anthropic-ai/sdk';
import {
  AnthropicInsightsClient,
  InsightsApiKeyMissingError,
  InsightsUpstreamError,
} from './anthropic-insights.client';
import type { AggregatedInsightsPayload } from '../../domain/types/aggregated-insights-payload.type';
import type { RawFinding } from '../../domain/types/insight-finding.type';

/** Expone el método privado parseFindings() solo para el test, sin `any`. */
interface ParseFindingsAccessor {
  parseFindings: (response: Anthropic.Message) => RawFinding[];
}

/**
 * Tests de AnthropicInsightsClient sin pegarle a la API real:
 *  - findPatterns() nunca llega a la red cuando falta la API key.
 *  - parseFindings() (llamado internamente vía findPatterns con un mensaje
 *    fabricado a mano) cubre el parseo defensivo: fences, JSON inválido,
 *    hallazgos mal formados.
 */
describe('AnthropicInsightsClient', () => {
  const previousKey = process.env['ANTHROPIC_API_KEY'];

  afterEach(() => {
    if (previousKey === undefined) delete process.env['ANTHROPIC_API_KEY'];
    else process.env['ANTHROPIC_API_KEY'] = previousKey;
  });

  const payload = {} as AggregatedInsightsPayload;

  function textMessage(text: string): Anthropic.Message {
    return {
      id: 'msg_1',
      model: 'claude-sonnet-5',
      content: [{ type: 'text', text, citations: [] }],
    } as unknown as Anthropic.Message;
  }

  it('isConfigured() es false sin ANTHROPIC_API_KEY', () => {
    delete process.env['ANTHROPIC_API_KEY'];
    const client = new AnthropicInsightsClient();
    expect(client.isConfigured()).toBe(false);
  });

  const defaultPromptOptions = { groupBy: 'day' as const, smallSample: false };

  it('findPatterns() lanza InsightsApiKeyMissingError sin llegar a la red cuando falta la API key', async () => {
    delete process.env['ANTHROPIC_API_KEY'];
    const client = new AnthropicInsightsClient();
    await expect(
      client.findPatterns(payload, 'es', defaultPromptOptions)
    ).rejects.toBeInstanceOf(InsightsApiKeyMissingError);
  });

  it('usa ANTHROPIC_MODEL cuando está definido, y el default si no', () => {
    delete process.env['ANTHROPIC_MODEL'];
    const client = new AnthropicInsightsClient();
    expect(client.model).toBe('claude-sonnet-5');

    process.env['ANTHROPIC_MODEL'] = 'claude-opus-4-8';
    expect(new AnthropicInsightsClient().model).toBe('claude-opus-4-8');
    delete process.env['ANTHROPIC_MODEL'];
  });

  describe('parseFindings (vía acceso directo al método privado)', () => {
    function parse(text: string): RawFinding[] {
      const client =
        new AnthropicInsightsClient() as unknown as ParseFindingsAccessor;
      return client.parseFindings(textMessage(text));
    }

    it('parsea un array JSON limpio', () => {
      const findings = parse(
        JSON.stringify([
          {
            title: 't',
            description: 'd',
            severity: 'warning',
            category: 'area',
            supportMetricLabel: 'l',
            supportMetricValue: 'v',
          },
        ])
      );
      expect(findings).toHaveLength(1);
    });

    it('quita fences ```json antes de parsear', () => {
      const findings = parse(
        '```json\n' +
          JSON.stringify([
            {
              title: 't',
              description: 'd',
              severity: 'info',
              category: 'motivo',
              supportMetricLabel: 'l',
              supportMetricValue: 'v',
            },
          ]) +
          '\n```'
      );
      expect(findings).toHaveLength(1);
    });

    it('devuelve array vacío si el modelo responde []', () => {
      expect(parse('[]')).toEqual([]);
    });

    it('lanza InsightsUpstreamError con JSON inválido', () => {
      expect(() => parse('esto no es json')).toThrow(InsightsUpstreamError);
    });

    it('lanza InsightsUpstreamError si la respuesta no es un array', () => {
      expect(() => parse('{"foo": "bar"}')).toThrow(InsightsUpstreamError);
    });

    it('filtra elementos del array que no tienen la forma de un RawFinding', () => {
      const findings = parse(
        JSON.stringify([
          {
            title: 't',
            description: 'd',
            severity: 'critical',
            category: 'escalamiento',
            supportMetricLabel: 'l',
            supportMetricValue: 'v',
          },
          { title: 'incompleto' }, // le faltan campos requeridos
          'no es un objeto',
        ])
      );
      expect(findings).toHaveLength(1);
    });
  });

  describe('findPatterns (reintento ante respuesta no parseable)', () => {
    /** Inyecta un cliente Anthropic falso, evitando pegarle a la red real. */
    function withFakeClient(create: jest.Mock): AnthropicInsightsClient {
      process.env['ANTHROPIC_API_KEY'] = 'test-key';
      const client = new AnthropicInsightsClient();
      (client as unknown as { client: unknown }).client = {
        messages: { create },
      };
      return client;
    }

    const validArrayText = JSON.stringify([
      {
        title: 't',
        description: 'd',
        severity: 'info',
        category: 'area',
        supportMetricLabel: 'l',
        supportMetricValue: 'v',
      },
    ]);

    const defaultPromptOptions = {
      groupBy: 'day' as const,
      smallSample: false,
    };

    it('reintenta una vez si la primera respuesta llega truncada, y devuelve los hallazgos si la segunda es válida', async () => {
      const create = jest
        .fn()
        .mockResolvedValueOnce(textMessage('{"title": "truncado sin cerrar'))
        .mockResolvedValueOnce(textMessage(validArrayText));
      const client = withFakeClient(create);

      const result = await client.findPatterns(
        payload,
        'es',
        defaultPromptOptions
      );

      expect(create).toHaveBeenCalledTimes(2);
      expect(result.findings).toHaveLength(1);
    });

    it('lanza InsightsUpstreamError si ambos intentos vienen no parseables, sin un tercer intento', async () => {
      const create = jest
        .fn()
        .mockResolvedValue(textMessage('{"title": "siempre truncado'));
      const client = withFakeClient(create);

      await expect(
        client.findPatterns(payload, 'es', defaultPromptOptions)
      ).rejects.toBeInstanceOf(InsightsUpstreamError);
      expect(create).toHaveBeenCalledTimes(2);
    });

    it('desactiva thinking explícitamente para no gastar el presupuesto de max_tokens en razonamiento invisible', async () => {
      const create = jest
        .fn()
        .mockResolvedValueOnce(textMessage(validArrayText));
      const client = withFakeClient(create);

      await client.findPatterns(payload, 'es', defaultPromptOptions);

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ thinking: { type: 'disabled' } })
      );
    });

    it('el system prompt enmarca el análisis al nivel de agrupación pedido', async () => {
      const create = jest
        .fn()
        .mockResolvedValueOnce(textMessage(validArrayText));
      const client = withFakeClient(create);

      await client.findPatterns(payload, 'es', {
        groupBy: 'week',
        smallSample: false,
      });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('esta semana vs la anterior'),
        })
      );
    });

    it('el system prompt advierte sobre muestra chica cuando smallSample es true', async () => {
      const create = jest
        .fn()
        .mockResolvedValueOnce(textMessage(validArrayText));
      const client = withFakeClient(create);

      await client.findPatterns(payload, 'es', {
        groupBy: 'day',
        smallSample: true,
      });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('MUESTRA CHICA'),
        })
      );
    });

    it('el system prompt NO incluye la advertencia de muestra chica cuando smallSample es false', async () => {
      const create = jest
        .fn()
        .mockResolvedValueOnce(textMessage(validArrayText));
      const client = withFakeClient(create);

      await client.findPatterns(payload, 'es', defaultPromptOptions);

      const call = create.mock.calls[0]?.[0] as { system: string };
      expect(call.system).not.toContain('MUESTRA CHICA');
    });
  });
});
