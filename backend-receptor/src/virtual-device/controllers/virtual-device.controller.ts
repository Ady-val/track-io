import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AreaDowntimeService } from '../../area-downtime/application/services/area-downtime.service';
import { DeviceService } from '../../devices/application/services/device.service';
import { DeviceMapper } from '../../devices/application/mappers/device.mapper';
import { DeviceResponseDto } from '../../devices/application/dtos/device-response.dto';
import { DepartmentService } from '../../departments/application/services/department.service';
import { TypeOrmEventRepository } from '../../events/domain/repositories/typeorm-event.repository';
import { EventFilters } from '../../events/domain/repositories/event.repository';
import { EventStatus } from '../../events/domain/entities/event.entity';
import { SignalService } from '../../signals/application/services/signal.service';
import { VirtualDeviceSignalDto } from '../../signals/application/dtos/signal.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import { Action, Module } from '../../permissions/constants/permissions.constants';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../../auth/decorators/current-user.decorator';

@Controller('virtual-device')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission(Module.VIRTUAL_DEVICE, Action.CREATE)
export class VirtualDeviceController {
  constructor(
    private readonly areaDowntimeService: AreaDowntimeService,
    private readonly deviceService: DeviceService,
    private readonly departmentService: DepartmentService,
    private readonly eventRepository: TypeOrmEventRepository,
    private readonly signalService: SignalService
  ) {}

  @Get('devices')
  async getVirtualDevices(
    @Query('limit', new DefaultValuePipe(1000), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number
  ): Promise<{ message: string; data: DeviceResponseDto[]; total: number }> {
    const { data } = await this.deviceService.findAll({ limit, offset });
    const virtualDevices = data.filter(device => device.isVirtualDevice);
    const dtos = DeviceMapper.toResponseDtoArray(virtualDevices);
    const response = plainToInstance(DeviceResponseDto, dtos, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Virtual devices retrieved successfully',
      data: response,
      total: virtualDevices.length,
    };
  }

  @Get('devices/:id')
  async getVirtualDeviceById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ message: string; data: DeviceResponseDto }> {
    const device = await this.deviceService.findById(id);
    const dto = DeviceMapper.toResponseDto(device);
    const response = plainToInstance(DeviceResponseDto, dto, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
    return {
      message: 'Virtual device retrieved successfully',
      data: response,
    };
  }

  @Get('departments')
  async getDepartments(): Promise<{ message: string; data: unknown[]; total: number }> {
    const { data, total } = await this.departmentService.findAll({
      limit: 1000,
      offset: 0,
    });
    return {
      message: 'Departments retrieved successfully',
      data,
      total,
    };
  }

  @Get('events')
  async getEvents(
    @Query('deviceId') deviceId?: string,
    @Query('deviceSignalId') deviceSignalId?: string,
    @Query('status') status?: string
  ): Promise<unknown[] | { message: string; data: unknown[]; total: number }> {
    const filters: EventFilters = {};

    if (deviceId) filters.deviceId = parseInt(deviceId, 10);
    if (deviceSignalId) filters.deviceSignalId = parseInt(deviceSignalId, 10);

    if (status) {
      const statuses = status.split(',');
      if (statuses.length === 1) {
        filters.status = status as EventStatus;
      } else {
        const allEvents = await this.eventRepository.findAll(filters);
        const filtered = allEvents.filter(event => statuses.includes(event.status));
        return {
          message: 'Events retrieved successfully',
          data: filtered,
          total: filtered.length,
        };
      }
    }

    const events = await this.eventRepository.findAll(filters);
    return {
      message: 'Events retrieved successfully',
      data: events,
      total: events.length,
    };
  }

  @Get('line-stop/:areaId')
  async getLineStopForArea(
    @Param('areaId', ParseIntPipe) areaId: number
  ): Promise<{
    message: string;
    data: { startAt: string | null };
  }> {
    const activeDowntime =
      await this.areaDowntimeService.getActiveDowntimeForArea(areaId);

    if (activeDowntime?.startAt) {
      return {
        message: 'Line stop start time retrieved',
        data: { startAt: activeDowntime.startAt.toISOString() },
      };
    }

    const activeEvents =
      await this.eventRepository.findActiveByArea(areaId);

    if (activeEvents.length === 0) {
      return {
        message: 'No active line stop for area',
        data: { startAt: null },
      };
    }

    const firstActive = activeEvents[0]!;
    const minActiveCreatedAt = activeEvents.reduce(
      (min, e) => (e.createdAt < min ? e.createdAt : min),
      firstActive.createdAt
    );

    const closedEvents = await this.eventRepository.findAll({
      areaId,
      status: EventStatus.CLOSED,
    });

    const overlappingClosed = closedEvents.filter(
      (e) => e.closedAt && e.closedAt >= minActiveCreatedAt
    );

    const allInChain = [...activeEvents, ...overlappingClosed];
    const firstInChain = allInChain[0]!;
    const outageStart = allInChain.reduce(
      (min, e) => (e.createdAt < min ? e.createdAt : min),
      firstInChain.createdAt
    );

    return {
      message: 'Line stop start computed from event chain',
      data: { startAt: outageStart.toISOString() },
    };
  }

  @Post('signals')
  @HttpCode(HttpStatus.CREATED)
  async createVirtualDeviceSignal(
    @Body() signalDto: VirtualDeviceSignalDto,
    @CurrentUser() user: CurrentUserType
  ): Promise<{ message: string; data: unknown }> {
    const savedSignal = await this.signalService.processVirtualDeviceSignal(
      signalDto.id,
      signalDto.value,
      signalDto.reason,
      signalDto.comment,
      user.username
    );

    return {
      message: 'Virtual device signal processed successfully',
      data: savedSignal,
    };
  }
}
