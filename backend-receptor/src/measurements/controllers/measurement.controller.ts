import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Put,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { MeasurementService } from '../application/services/measurement.service';
import { MeasurementValue } from '../domain/entities/measurement-value.entity';
import { MeasurementFilters } from '../domain/repositories/measurement.repository';
import {
  CreateMeasurementDto,
  UpdateMeasurementDto,
  MeasurementResponseDto,
} from '../application/dtos/measurement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';

@Controller('measurements')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MeasurementController {
  constructor(private readonly measurementService: MeasurementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.MEASUREMENTS, Action.CREATE)
  async createMeasurement(
    @Body() createMeasurementDto: CreateMeasurementDto
  ): Promise<{
    message: string;
    data: MeasurementResponseDto;
  }> {
    const measurement =
      await this.measurementService.createMeasurement(createMeasurementDto);
    const measurementResponse = plainToInstance(
      MeasurementResponseDto,
      measurement,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Measurement created successfully',
      data: measurementResponse,
    };
  }

  @Get()
  @RequirePermission(Module.MEASUREMENTS, Action.READ)
  async getAllMeasurements(
    @Query('externalId') externalId?: string,
    @Query('type') type?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number
  ): Promise<{
    message: string;
    data: MeasurementResponseDto[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: MeasurementFilters = {};

    if (externalId) filters.externalId = externalId;
    if (type) filters.type = type;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;

    const { data, total } =
      await this.measurementService.getAllMeasurements(filters);
    const measurementResponses = plainToInstance(MeasurementResponseDto, data, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Measurements retrieved successfully',
      data: measurementResponses,
      total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total,
      },
    };
  }

  @Get('count')
  @RequirePermission(Module.MEASUREMENTS, Action.READ)
  async getMeasurementsCount(): Promise<{
    message: string;
    count: number;
  }> {
    const count = await this.measurementService.getMeasurementsCount();

    return {
      message: 'Measurements count retrieved successfully',
      count,
    };
  }

  @Get(':id')
  @RequirePermission(Module.MEASUREMENTS, Action.READ)
  async getMeasurementById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: MeasurementResponseDto;
  }> {
    const measurement = await this.measurementService.getMeasurementById(id);
    const measurementResponse = plainToInstance(
      MeasurementResponseDto,
      measurement,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Measurement found',
      data: measurementResponse,
    };
  }

  @Put(':id')
  @RequirePermission(Module.MEASUREMENTS, Action.UPDATE)
  async updateMeasurement(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMeasurementDto: UpdateMeasurementDto
  ): Promise<{
    message: string;
    data: MeasurementResponseDto;
  }> {
    const measurement = await this.measurementService.updateMeasurement(
      id,
      updateMeasurementDto
    );
    const measurementResponse = plainToInstance(
      MeasurementResponseDto,
      measurement,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Measurement updated successfully',
      data: measurementResponse,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.MEASUREMENTS, Action.DELETE)
  async deleteMeasurement(
    @Param('id', ParseIntPipe) id: number
  ): Promise<void> {
    await this.measurementService.deleteMeasurement(id);
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.MEASUREMENTS, Action.UPDATE)
  async restoreMeasurement(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.measurementService.restoreMeasurement(id);

    return {
      message: 'Measurement restored successfully',
    };
  }

  @Get(':id/values')
  @RequirePermission(Module.MEASUREMENTS, Action.READ)
  async getMeasurementValues(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number
  ): Promise<{
    message: string;
    data: MeasurementValue[];
    count: number;
    limit: number;
  }> {
    const values = await this.measurementService.getMeasurementValues(
      id,
      limit ?? 10
    );

    return {
      message: 'Measurement values retrieved successfully',
      data: values,
      count: values.length,
      limit: limit ?? 10,
    };
  }
}
