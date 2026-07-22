import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  ServiceUnavailableException,
  BadGatewayException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InsightsService } from '../application/services/insights.service';
import {
  InsightsApiKeyMissingError,
  InsightsRateLimitError,
  InsightsUpstreamError,
} from '../application/services/anthropic-insights.client';
import { AnalyzeInsightsDto } from '../application/dtos/analyze-insights.dto';
import type {
  InsightAnalysisResponseDto,
  InsightsHealthDto,
} from '../application/dtos/insight-analysis-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';
import { SystemModuleTag } from 'src/common/decorators/system-module.decorator';
import { SystemModule } from 'src/common/enums/system-module.enum';

@SystemModuleTag(SystemModule.INSIGHTS)
@Controller('insights')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  /**
   * Sin permiso: el front la usa para decidir si oculta el botón, así que no
   * requiere @RequirePermission — solo estar autenticado.
   */
  @Get('health')
  getHealth(): InsightsHealthDto {
    return this.insightsService.getHealth();
  }

  @Post('analyze')
  @RequirePermission(Module.INSIGHTS, Action.READ)
  async analyze(
    @Body() dto: AnalyzeInsightsDto
  ): Promise<{ message: string; data: InsightAnalysisResponseDto }> {
    try {
      const data = await this.insightsService.analyze(dto);
      return { message: 'Insight analysis generated successfully', data };
    } catch (error) {
      if (error instanceof InsightsApiKeyMissingError) {
        throw new ServiceUnavailableException(
          'El módulo de insights no está configurado (falta ANTHROPIC_API_KEY)'
        );
      }
      if (error instanceof InsightsRateLimitError) {
        throw new HttpException(
          'Límite de solicitudes a la API de Anthropic alcanzado, intenta más tarde',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
      if (error instanceof InsightsUpstreamError) {
        throw new BadGatewayException(
          'No se pudo generar el análisis, intenta de nuevo'
        );
      }
      throw error;
    }
  }
}
