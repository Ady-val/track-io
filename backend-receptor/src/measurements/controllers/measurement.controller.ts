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
} from '@nestjs/common';
import { MeasurementService } from '../application/services/measurement.service';
import { Measurement } from '../domain/entities/measurement.entity';
import { MeasurementValue } from '../domain/entities/measurement-value.entity';
import { MeasurementFilters } from '../domain/repositories/measurement.repository';
import {
  CreateMeasurementDto,
  UpdateMeasurementDto,
} from '../application/dtos/measurement.dto';

@Controller('measurements')
export class MeasurementController {
  constructor(private readonly measurementService: MeasurementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMeasurement(
    @Body() createMeasurementDto: CreateMeasurementDto
  ): Promise<{
    message: string;
    data: Measurement;
  }> {
    const measurement =
      await this.measurementService.createMeasurement(createMeasurementDto);

    return {
      message: 'Measurement created successfully',
      data: measurement,
    };
  }

  @Get()
  async getAllMeasurements(
    @Query('externalId') externalId?: string,
    @Query('type') type?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number
  ): Promise<{
    message: string;
    data: Measurement[];
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

    return {
      message: 'Measurements retrieved successfully',
      data,
      total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total,
      },
    };
  }

  @Get('count')
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
  async getMeasurementById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: Measurement;
  }> {
    const measurement = await this.measurementService.getMeasurementById(id);

    return {
      message: 'Measurement found',
      data: measurement,
    };
  }

  @Put(':id')
  async updateMeasurement(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMeasurementDto: UpdateMeasurementDto
  ): Promise<{
    message: string;
    data: Measurement;
  }> {
    const measurement = await this.measurementService.updateMeasurement(
      id,
      updateMeasurementDto
    );

    return {
      message: 'Measurement updated successfully',
      data: measurement,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMeasurement(
    @Param('id', ParseIntPipe) id: number
  ): Promise<void> {
    await this.measurementService.deleteMeasurement(id);
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restoreMeasurement(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.measurementService.restoreMeasurement(id);

    return {
      message: 'Measurement restored successfully',
    };
  }

  @Get(':id/values')
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
