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
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { DeviceService } from '../application/services/device.service';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
} from '../application/dtos/device.dto';
import { DeviceResponseDto } from '../application/dtos/device-response.dto';
import { DeviceFilters } from '../domain/repositories/device.repository';
import { DeviceMapper } from '../application/mappers/device.mapper';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import { Module, Action } from '../../permissions/constants/permissions.constants';

@Controller('devices')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.DEVICES, Action.CREATE)
  async create(@Body() createDeviceDto: CreateDeviceDto): Promise<{
    message: string;
    data: DeviceResponseDto;
  }> {
    const device = await this.deviceService.create(createDeviceDto);
    const deviceResponseDto = DeviceMapper.toResponseDto(device);
    const deviceResponse = plainToInstance(DeviceResponseDto, deviceResponseDto, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Device created successfully',
      data: deviceResponse,
    };
  }

  @Get()
  @RequirePermission(Module.DEVICES, Action.READ)
  async findAll(
    @Query('name') name?: string,
    @Query('areaId', new ParseIntPipe({ optional: true })) areaId?: number,
    @Query('externalId') externalId?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('includeDeleted', new DefaultValuePipe(false))
    includeDeleted?: boolean
  ): Promise<{
    message: string;
    data: DeviceResponseDto[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: DeviceFilters = {};
    if (name) filters.name = name;
    if (areaId) filters.areaId = areaId;
    if (externalId) filters.externalId = externalId;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (includeDeleted) filters.includeDeleted = includeDeleted;

    const { data, total } = await this.deviceService.findAll(filters);
    const deviceResponseDtos = DeviceMapper.toResponseDtoArray(data);
    const deviceResponses = plainToInstance(DeviceResponseDto, deviceResponseDtos, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Devices retrieved successfully',
      data: deviceResponses,
      total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total,
      },
    };
  }

  @Get('count')
  @RequirePermission(Module.DEVICES, Action.READ)
  async getCount(): Promise<{
    message: string;
    count: number;
  }> {
    const count = await this.deviceService.getCount();

    return {
      message: 'Devices count retrieved successfully',
      count,
    };
  }

  @Get('area/:areaId/count')
  @RequirePermission(Module.DEVICES, Action.READ)
  async getCountByAreaId(
    @Param('areaId', ParseIntPipe) areaId: number
  ): Promise<{
    message: string;
    count: number;
  }> {
    const count = await this.deviceService.getCountByAreaId(areaId);

    return {
      message: 'Devices count by area retrieved successfully',
      count,
    };
  }

  @Get('area/:areaId')
  @RequirePermission(Module.DEVICES, Action.READ)
  async findByAreaId(@Param('areaId', ParseIntPipe) areaId: number): Promise<{
    message: string;
    data: DeviceResponseDto[];
  }> {
    const devices = await this.deviceService.findByAreaId(areaId);
    const deviceResponseDtos = DeviceMapper.toResponseDtoArray(devices);
    const deviceResponses = plainToInstance(DeviceResponseDto, deviceResponseDtos, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Devices by area retrieved successfully',
      data: deviceResponses,
    };
  }

  @Get('external/:externalId')
  @RequirePermission(Module.DEVICES, Action.READ)
  async findByExternalId(@Param('externalId') externalId: string): Promise<{
    message: string;
    data: DeviceResponseDto;
  }> {
    const device = await this.deviceService.findByExternalId(externalId);
    const deviceResponseDto = DeviceMapper.toResponseDto(device);
    const deviceResponse = plainToInstance(DeviceResponseDto, deviceResponseDto, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Device retrieved successfully',
      data: deviceResponse,
    };
  }

  @Get(':id')
  @RequirePermission(Module.DEVICES, Action.READ)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: DeviceResponseDto;
  }> {
    const device = await this.deviceService.findById(id);
    const deviceResponseDto = DeviceMapper.toResponseDto(device);
    const deviceResponse = plainToInstance(DeviceResponseDto, deviceResponseDto, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Device retrieved successfully',
      data: deviceResponse,
    };
  }

  @Patch(':id')
  @RequirePermission(Module.DEVICES, Action.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDeviceDto: UpdateDeviceDto
  ): Promise<{
    message: string;
    data: DeviceResponseDto;
  }> {
    const device = await this.deviceService.update(id, updateDeviceDto);
    const deviceResponseDto = DeviceMapper.toResponseDto(device);
    const deviceResponse = plainToInstance(DeviceResponseDto, deviceResponseDto, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Device updated successfully',
      data: deviceResponse,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.DEVICES, Action.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.deviceService.remove(id);

    return {
      message: 'Device deleted successfully',
    };
  }

  @Patch(':id/restore')
  @RequirePermission(Module.DEVICES, Action.UPDATE)
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: DeviceResponseDto;
  }> {
    const device = await this.deviceService.restore(id);
    const deviceResponseDto = DeviceMapper.toResponseDto(device);
    const deviceResponse = plainToInstance(DeviceResponseDto, deviceResponseDto, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Device restored successfully',
      data: deviceResponse,
    };
  }
}
