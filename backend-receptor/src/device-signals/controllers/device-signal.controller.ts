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
import { plainToInstance } from 'class-transformer';
import { DeviceSignalService } from '../application/services/device-signal.service';
import {
  CreateDeviceSignalDto,
  UpdateDeviceSignalDto,
  DeviceSignalResponseDto,
} from '../application/dtos/device-signal.dto';
import { DeviceSignalFilters } from '../domain/repositories/device-signal.repository';

@Controller('device-signals')
export class DeviceSignalController {
  constructor(private readonly deviceSignalService: DeviceSignalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDeviceSignalDto: CreateDeviceSignalDto): Promise<{
    message: string;
    data: DeviceSignalResponseDto;
  }> {
    const deviceSignal = await this.deviceSignalService.create(
      createDeviceSignalDto
    );
    const deviceSignalResponse = plainToInstance(
      DeviceSignalResponseDto,
      deviceSignal,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Device signal created successfully',
      data: deviceSignalResponse,
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
    data: DeviceSignalResponseDto[];
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

    const { data, total } = await this.deviceSignalService.findAll(filters);
    const deviceSignalResponses = plainToInstance(
      DeviceSignalResponseDto,
      data,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Device signals retrieved successfully',
      data: deviceSignalResponses,
      total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total,
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
    data: DeviceSignalResponseDto[];
  }> {
    const deviceSignals =
      await this.deviceSignalService.findByDeviceId(deviceId);
    const deviceSignalResponses = plainToInstance(
      DeviceSignalResponseDto,
      deviceSignals,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Device signals by device retrieved successfully',
      data: deviceSignalResponses,
    };
  }

  @Get('department/:departmentId')
  async findByDepartmentId(
    @Param('departmentId', ParseIntPipe) departmentId: number
  ): Promise<{
    message: string;
    data: DeviceSignalResponseDto[];
  }> {
    const deviceSignals =
      await this.deviceSignalService.findByDepartmentId(departmentId);
    const deviceSignalResponses = plainToInstance(
      DeviceSignalResponseDto,
      deviceSignals,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Device signals by department retrieved successfully',
      data: deviceSignalResponses,
    };
  }

  @Get('external/:externalValueId')
  async findByExternalValueId(
    @Param('externalValueId') externalValueId: string
  ): Promise<{
    message: string;
    data: DeviceSignalResponseDto;
  }> {
    const deviceSignal =
      await this.deviceSignalService.findByExternalValueId(externalValueId);
    const deviceSignalResponse = plainToInstance(
      DeviceSignalResponseDto,
      deviceSignal,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Device signal retrieved successfully',
      data: deviceSignalResponse,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: DeviceSignalResponseDto;
  }> {
    const deviceSignal = await this.deviceSignalService.findById(id);
    const deviceSignalResponse = plainToInstance(
      DeviceSignalResponseDto,
      deviceSignal,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Device signal retrieved successfully',
      data: deviceSignalResponse,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDeviceSignalDto: UpdateDeviceSignalDto
  ): Promise<{
    message: string;
    data: DeviceSignalResponseDto;
  }> {
    const deviceSignal = await this.deviceSignalService.update(
      id,
      updateDeviceSignalDto
    );
    const deviceSignalResponse = plainToInstance(
      DeviceSignalResponseDto,
      deviceSignal,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Device signal updated successfully',
      data: deviceSignalResponse,
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
    data: DeviceSignalResponseDto;
  }> {
    const deviceSignal = await this.deviceSignalService.restore(id);
    const deviceSignalResponse = plainToInstance(
      DeviceSignalResponseDto,
      deviceSignal,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Device signal restored successfully',
      data: deviceSignalResponse,
    };
  }
}
