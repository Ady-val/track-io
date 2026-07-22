import {
  ServiceUnavailableException,
  BadGatewayException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InsightsController } from './insights.controller';
import {
  InsightsApiKeyMissingError,
  InsightsRateLimitError,
  InsightsUpstreamError,
} from '../application/services/anthropic-insights.client';

function buildController(analyzeImpl: () => Promise<unknown>) {
  const insightsService = {
    getHealth: jest
      .fn()
      .mockReturnValue({ enabled: true, modelConfigured: true }),
    analyze: jest.fn(analyzeImpl),
  };
  return {
    controller: new InsightsController(insightsService as never),
    insightsService,
  };
}

describe('InsightsController', () => {
  it('GET /insights/health delega en el service', () => {
    const { controller } = buildController(() => Promise.resolve({}));
    expect(controller.getHealth()).toEqual({
      enabled: true,
      modelConfigured: true,
    });
  });

  it('traduce InsightsApiKeyMissingError a 503', async () => {
    const { controller } = buildController(() =>
      Promise.reject(new InsightsApiKeyMissingError())
    );
    await expect(
      controller.analyze({ startDate: 'a', endDate: 'b' })
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('traduce InsightsRateLimitError a 429', async () => {
    const { controller } = buildController(() =>
      Promise.reject(new InsightsRateLimitError())
    );
    let caught: unknown;
    try {
      await controller.analyze({ startDate: 'a', endDate: 'b' });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(HttpException);
    expect((caught as HttpException).getStatus()).toBe(
      HttpStatus.TOO_MANY_REQUESTS
    );
  });

  it('traduce InsightsUpstreamError a 502', async () => {
    const { controller } = buildController(() =>
      Promise.reject(new InsightsUpstreamError())
    );
    await expect(
      controller.analyze({ startDate: 'a', endDate: 'b' })
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('propaga otros errores sin traducir', async () => {
    const { controller } = buildController(() =>
      Promise.reject(new Error('boom'))
    );
    await expect(
      controller.analyze({ startDate: 'a', endDate: 'b' })
    ).rejects.toThrow('boom');
  });
});
