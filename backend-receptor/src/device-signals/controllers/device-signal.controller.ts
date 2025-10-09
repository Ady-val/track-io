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
} from '@nestjs/common';
import { DeviceSignalService } from '../application/services/device-signal.service';
import {
  CreateDeviceSignalDto,
  UpdateDeviceSignalDto,
} from '../application/dtos/device-signal.dto';
import { DeviceSignal } from '../domain/entities/device-signal.entity';
import { DeviceSignalFilters } from '../domain/repositories/device-signal.repository';

@Controller('device-signals')
export class DeviceSignalController {
  constructor(private readonly deviceSignalService: DeviceSignalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDeviceSignalDto: CreateDeviceSignalDto): Promise<{
    message: string;
    data: DeviceSignal;
  }> {
    const deviceSignal = await this.deviceSignalService.create(
      createDeviceSignalDto
    );

    return {
      message: 'Device signal created successfully',
      data: deviceSignal,
    };
  }

  @Get()
  async findAll(
    @Query('name') name?: string,
    @Query('deviceId', new ParseIntPipe({ optional: true })) deviceId?: number,
    @Query('departmentId', new ParseIntPipe({ optional: true }))
    departmentId?: number,
    @Query('externalValueId') externalValueId?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('includeDeleted', new DefaultValuePipe(false))
    includeDeleted?: boolean
  ): Promise<{
    message: string;
    data: DeviceSignal[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: DeviceSignalFilters = {};
    if (name) filters.name = name;
    if (deviceId) filters.deviceId = deviceId;
    if (departmentId) filters.departmentId = departmentId;
    if (externalValueId) filters.externalValueId = externalValueId;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (includeDeleted) filters.includeDeleted = includeDeleted;

    const result = await this.deviceSignalService.findAll(filters);

    return {
      message: 'Device signals retrieved successfully',
      data: result.data,
      total: result.total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total: result.total,
      },
    };
  }

  @Get('count')
  async getCount(): Promise<{
    message: string;
    count: number;
  }> {
    const count = await this.deviceSignalService.getCount();

    return {
      message: 'Device signals count retrieved successfully',
      count,
    };
  }

  @Get('device/:deviceId/count')
  async getCountByDeviceId(
    @Param('deviceId', ParseIntPipe) deviceId: number
  ): Promise<{
    message: string;
    count: number;
  }> {
    const count = await this.deviceSignalService.getCountByDeviceId(deviceId);

    return {
      message: 'Device signals count by device retrieved successfully',
      count,
    };
  }

  @Get('department/:departmentId/count')
  async getCountByDepartmentId(
    @Param('departmentId', ParseIntPipe) departmentId: number
  ): Promise<{
    message: string;
    count: number;
  }> {
    const count =
      await this.deviceSignalService.getCountByDepartmentId(departmentId);

    return {
      message: 'Device signals count by department retrieved successfully',
      count,
    };
  }

  @Get('device/:deviceId')
  async findByDeviceId(
    @Param('deviceId', ParseIntPipe) deviceId: number
  ): Promise<{
    message: string;
    data: DeviceSignal[];
  }> {
    const deviceSignals =
      await this.deviceSignalService.findByDeviceId(deviceId);

    return {
      message: 'Device signals by device retrieved successfully',
      data: deviceSignals,
    };
  }

  @Get('department/:departmentId')
  async findByDepartmentId(
    @Param('departmentId', ParseIntPipe) departmentId: number
  ): Promise<{
    message: string;
    data: DeviceSignal[];
  }> {
    const deviceSignals =
      await this.deviceSignalService.findByDepartmentId(departmentId);

    return {
      message: 'Device signals by department retrieved successfully',
      data: deviceSignals,
    };
  }

  @Get('external/:externalValueId')
  async findByExternalValueId(
    @Param('externalValueId') externalValueId: string
  ): Promise<{
    message: string;
    data: DeviceSignal;
  }> {
    const deviceSignal =
      await this.deviceSignalService.findByExternalValueId(externalValueId);

    return {
      message: 'Device signal retrieved successfully',
      data: deviceSignal,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: DeviceSignal;
  }> {
    const deviceSignal = await this.deviceSignalService.findById(id);

    return {
      message: 'Device signal retrieved successfully',
      data: deviceSignal,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDeviceSignalDto: UpdateDeviceSignalDto
  ): Promise<{
    message: string;
    data: DeviceSignal;
  }> {
    const deviceSignal = await this.deviceSignalService.update(
      id,
      updateDeviceSignalDto
    );

    return {
      message: 'Device signal updated successfully',
      data: deviceSignal,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.deviceSignalService.remove(id);

    return {
      message: 'Device signal deleted successfully',
    };
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: DeviceSignal;
  }> {
    const deviceSignal = await this.deviceSignalService.restore(id);

    return {
      message: 'Device signal restored successfully',
      data: deviceSignal,
    };
  }
}
