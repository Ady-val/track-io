import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AreaDowntimeService } from '../application/services/area-downtime.service';
import { AreaDowntimeMappingService } from '../application/services/area-downtime-mapping.service';
import { TypeOrmAreaDowntimeRepository } from '../domain/repositories/typeorm-area-downtime.repository';
import { AreaDowntimeResponseDto } from '../application/dtos/area-downtime-response.dto';
import type { AreaDowntimeFilters } from '../domain/repositories/area-downtime.repository';
import type {
  AreaDowntimeResponse,
  DowntimeEvent,
} from '../application/types/area-downtime.types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';

@Controller('area-downtime')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AreaDowntimeController {
  constructor(
    private readonly areaDowntimeService: AreaDowntimeService,
    private readonly areaDowntimeMappingService: AreaDowntimeMappingService,
    private readonly areaDowntimeRepository: TypeOrmAreaDowntimeRepository
  ) {}

  @Get()
  @RequirePermission(Module.AREA_DOWNTIME, Action.READ)
  async getAllAreaDowntimes(
    @Query('areaId', new DefaultValuePipe(undefined)) areaId?: number,
    @Query('isActive', new DefaultValuePipe(undefined)) isActive?: boolean,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number
  ): Promise<{
    message: string;
    data: AreaDowntimeResponse[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: AreaDowntimeFilters = {};

    if (areaId) filters.areaId = areaId;
    if (isActive !== undefined) filters.isActive = isActive;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;

    const { data, total } =
      await this.areaDowntimeService.getAllAreaDowntimesWithEvents(filters);

    return {
      message: 'Area downtime records retrieved successfully',
      data,
      total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total,
      },
    };
  }

  @Get('area/:areaId')
  @RequirePermission(Module.AREA_DOWNTIME, Action.READ)
  async getDowntimeHistoryForArea(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number = 0
  ): Promise<{
    message: string;
    data: AreaDowntimeResponseDto[];
    total: number;
  }> {
    const { data, total } =
      await this.areaDowntimeService.getDowntimeHistoryForArea(
        areaId,
        limit,
        offset
      );

    const responseData =
      await this.areaDowntimeMappingService.enrichDowntimesWithEvents(data);

    return {
      message: `Downtime history for area ${areaId} retrieved successfully`,
      data: responseData,
      total,
    };
  }

  @Get('area/:areaId/active')
  @RequirePermission(Module.AREA_DOWNTIME, Action.READ)
  async getActiveDowntimeForArea(
    @Param('areaId', ParseIntPipe) areaId: number
  ): Promise<{
    message: string;
    data: AreaDowntimeResponse | null;
    isInDowntime: boolean;
  }> {
    const activeDowntime =
      await this.areaDowntimeService.getActiveDowntimeForAreaWithEvents(areaId);
    const isInDowntime =
      await this.areaDowntimeService.isAreaInDowntime(areaId);

    return {
      message: isInDowntime
        ? `Area ${areaId} is currently in downtime`
        : `Area ${areaId} is not in downtime`,
      data: activeDowntime,
      isInDowntime,
    };
  }

  @Get('area/:areaId/status')
  @RequirePermission(Module.AREA_DOWNTIME, Action.READ)
  async checkAreaDowntimeStatus(
    @Param('areaId', ParseIntPipe) areaId: number
  ): Promise<{
    message: string;
    isInDowntime: boolean;
  }> {
    const isInDowntime =
      await this.areaDowntimeService.isAreaInDowntime(areaId);

    return {
      message: isInDowntime
        ? `Area ${areaId} is in downtime`
        : `Area ${areaId} is not in downtime`,
      isInDowntime,
    };
  }

  @Post('area/:areaId/start')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.AREA_DOWNTIME, Action.CREATE)
  async startDowntime(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Body() body: { relatedEventIds?: number[] }
  ): Promise<{
    message: string;
    data: AreaDowntimeResponse;
  }> {
    const areaDowntime = await this.areaDowntimeService.startDowntimeWithEvents(
      areaId,
      body.relatedEventIds ?? []
    );

    return {
      message: `Downtime started for area ${areaId}`,
      data: areaDowntime,
    };
  }

  @Post('area/:areaId/end')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.AREA_DOWNTIME, Action.UPDATE)
  async endDowntime(@Param('areaId', ParseIntPipe) areaId: number): Promise<{
    message: string;
    success: boolean;
  }> {
    const success = await this.areaDowntimeService.endDowntime(areaId);

    return {
      message: success
        ? `Downtime ended for area ${areaId}`
        : `No active downtime found for area ${areaId}`,
      success,
    };
  }

  @Get('count')
  @RequirePermission(Module.AREA_DOWNTIME, Action.READ)
  async getAreaDowntimeCount(
    @Query('areaId', new DefaultValuePipe(undefined)) areaId?: number,
    @Query('isActive', new DefaultValuePipe(undefined)) isActive?: boolean
  ): Promise<{
    message: string;
    count: number;
  }> {
    const filters: AreaDowntimeFilters = {};
    if (areaId) filters.areaId = areaId;
    if (isActive !== undefined) filters.isActive = isActive;

    const count = await this.areaDowntimeRepository.count(filters);

    return {
      message: 'Area downtime count retrieved successfully',
      count,
    };
  }

  @Get(':downtimeId/events')
  @RequirePermission(Module.AREA_DOWNTIME, Action.READ)
  async getRelatedEventsForDowntime(
    @Param('downtimeId', ParseIntPipe) downtimeId: number
  ): Promise<{
    message: string;
    data: DowntimeEvent[];
    description: string;
  }> {
    const allEvents =
      await this.areaDowntimeService.getAllEventsForDowntime(downtimeId);

    return {
      message: `All events that kept downtime ${downtimeId} open retrieved successfully`,
      data: allEvents,
      description:
        'This includes all events (active and closed) that were related to this downtime period',
    };
  }

  @Get('event/:eventId/downtime')
  @RequirePermission(Module.AREA_DOWNTIME, Action.READ)
  async getDowntimeForEvent(
    @Param('eventId', ParseIntPipe) eventId: number
  ): Promise<{
    message: string;
    data: AreaDowntimeResponse[];
  }> {
    const downtimeEvents =
      await this.areaDowntimeService.getDowntimeForEventWithEvents(eventId);

    return {
      message: `Downtime information for event ${eventId} retrieved successfully`,
      data: downtimeEvents,
    };
  }
}
