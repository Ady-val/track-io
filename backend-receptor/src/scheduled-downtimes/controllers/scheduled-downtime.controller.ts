import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ScheduledDowntimeService } from '../application/services/scheduled-downtime.service';
import { ScheduledDowntimeCalculatorService } from '../application/services/scheduled-downtime-calculator.service';
import type { ScheduledDowntimeDiscount } from '../application/services/scheduled-downtime-calculator.service';
import { ScheduledDowntimeRecalculateService } from '../application/services/scheduled-downtime-recalculate.service';
import { RecalculateDto } from '../application/dtos/recalculate.dto';
import type { RecalculateResult } from '../application/dtos/recalculate.dto';
import {
  CreateScheduledDowntimeDto,
  UpdateScheduledDowntimeDto,
  ScheduledDowntimeResponseDto,
} from '../application/dtos/scheduled-downtime.dto';
import { ScheduledDowntimeFilters } from '../domain/repositories/scheduled-downtime.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';
import { SystemModuleTag } from 'src/common/decorators/system-module.decorator';
import { SystemModule } from 'src/common/enums/system-module.enum';

@SystemModuleTag(SystemModule.SIGNALS)
@Controller('scheduled-downtimes')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ScheduledDowntimeController {
  constructor(
    private readonly scheduledDowntimeService: ScheduledDowntimeService,
    private readonly scheduledDowntimeCalculatorService: ScheduledDowntimeCalculatorService,
    private readonly scheduledDowntimeRecalculateService: ScheduledDowntimeRecalculateService
  ) {}

  /**
   * Recálculo retroactivo de descuentos e histórico de rebanadas (§6).
   * `dryRun` (default true) no escribe: reporta cuántas filas cambiarían y el
   * delta agregado. Permiso: scheduled-downtimes:update.
   */
  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.UPDATE)
  async recalculate(
    @Body() dto: RecalculateDto
  ): Promise<{ message: string; data: RecalculateResult }> {
    const from = new Date(dto.from);
    const to = new Date(dto.to);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException(
        'from y to deben ser fechas ISO 8601 válidas'
      );
    }
    if (to.getTime() <= from.getTime()) {
      throw new BadRequestException('to debe ser posterior a from');
    }

    const data =
      await this.scheduledDowntimeRecalculateService.recalculate(dto);

    return {
      message: data.dryRun
        ? 'Recalculation preview (dry run) computed successfully'
        : 'Recalculation applied successfully',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.CREATE)
  async create(
    @Body() createDto: CreateScheduledDowntimeDto
  ): Promise<{ message: string; data: ScheduledDowntimeResponseDto }> {
    const scheduledDowntime =
      await this.scheduledDowntimeService.create(createDto);
    const data = plainToInstance(
      ScheduledDowntimeResponseDto,
      scheduledDowntime,
      { excludeExtraneousValues: true, enableImplicitConversion: true }
    );

    return { message: 'Scheduled downtime created successfully', data };
  }

  @Get()
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.READ)
  async findAll(
    @Query('areaId', new ParseIntPipe({ optional: true })) areaId?: number,
    @Query('isActive', new DefaultValuePipe(undefined)) isActive?: string,
    @Query('name') name?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('includeDeleted', new DefaultValuePipe(false))
    includeDeleted?: boolean
  ): Promise<{
    message: string;
    data: ScheduledDowntimeResponseDto[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: ScheduledDowntimeFilters = {};
    if (areaId) filters.areaId = areaId;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (name) filters.name = name;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (includeDeleted) filters.includeDeleted = includeDeleted;

    const { data, total } =
      await this.scheduledDowntimeService.findAll(filters);
    const responses = plainToInstance(ScheduledDowntimeResponseDto, data, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Scheduled downtimes retrieved successfully',
      data: responses,
      total,
      pagination: { limit: limit ?? 10, offset: offset ?? 0, total },
    };
  }

  @Get('count')
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.READ)
  async getCount(): Promise<{ message: string; count: number }> {
    const count = await this.scheduledDowntimeService.getCount();
    return {
      message: 'Scheduled downtimes count retrieved successfully',
      count,
    };
  }

  /**
   * Utilidad de verificación/QA: crudo, descuento y efectivo para un área y un
   * rango de fecha/hora. Permite a QA y a Fase 2 (Reportes) validar el cálculo
   * sin releer la lógica de traslape.
   *
   * `start` y `end` en ISO 8601 con offset explícito, ej.
   * 2026-07-13T11:30:00-06:00
   */
  @Get('area/:areaId/effective-seconds')
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.READ)
  async getEffectiveSeconds(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Query('start') start: string,
    @Query('end') end: string
  ): Promise<{
    message: string;
    data: {
      rawSeconds: number;
      discountedSeconds: number;
      effectiveSeconds: number;
      discount: ScheduledDowntimeDiscount;
    };
  }> {
    const rangeStart = new Date(start);
    const rangeEnd = new Date(end);

    if (
      Number.isNaN(rangeStart.getTime()) ||
      Number.isNaN(rangeEnd.getTime())
    ) {
      throw new BadRequestException(
        'start y end deben ser fechas ISO 8601 válidas'
      );
    }

    const rawSeconds = Math.max(
      0,
      Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / 1000)
    );

    const discount = await this.scheduledDowntimeCalculatorService.getDiscount(
      areaId,
      rangeStart,
      rangeEnd
    );

    return {
      message: 'Effective seconds calculated successfully',
      data: {
        rawSeconds,
        discountedSeconds: discount.totalDiscountedSeconds,
        effectiveSeconds: Math.max(
          0,
          rawSeconds - discount.totalDiscountedSeconds
        ),
        discount,
      },
    };
  }

  @Get(':id')
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.READ)
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ message: string; data: ScheduledDowntimeResponseDto }> {
    const scheduledDowntime = await this.scheduledDowntimeService.findById(id);
    const data = plainToInstance(
      ScheduledDowntimeResponseDto,
      scheduledDowntime,
      { excludeExtraneousValues: true, enableImplicitConversion: true }
    );

    return { message: 'Scheduled downtime retrieved successfully', data };
  }

  @Patch(':id')
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateScheduledDowntimeDto
  ): Promise<{ message: string; data: ScheduledDowntimeResponseDto }> {
    const scheduledDowntime = await this.scheduledDowntimeService.update(
      id,
      updateDto
    );
    const data = plainToInstance(
      ScheduledDowntimeResponseDto,
      scheduledDowntime,
      { excludeExtraneousValues: true, enableImplicitConversion: true }
    );

    return { message: 'Scheduled downtime updated successfully', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.scheduledDowntimeService.remove(id);
    return { message: 'Scheduled downtime deleted successfully' };
  }

  @Patch(':id/restore')
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.UPDATE)
  async restore(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ message: string; data: ScheduledDowntimeResponseDto }> {
    const scheduledDowntime = await this.scheduledDowntimeService.restore(id);
    const data = plainToInstance(
      ScheduledDowntimeResponseDto,
      scheduledDowntime,
      { excludeExtraneousValues: true, enableImplicitConversion: true }
    );

    return { message: 'Scheduled downtime restored successfully', data };
  }
}
