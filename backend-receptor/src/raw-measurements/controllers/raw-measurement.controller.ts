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
} from '@nestjs/common';
import { RawMeasurementDto } from '../application/dtos/raw-measurement.dto';
import { RawMeasurementService } from '../application/services/raw-measurement.service';
import { RawMeasurement } from '../domain/entities/raw-measurement.entity';
import { RawMeasurementFilters } from '../domain/repositories/raw-measurement.repository';

@Controller('raw-measurements')
export class RawMeasurementController {
  constructor(private readonly rawMeasurementService: RawMeasurementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMeasurement(
    @Body() rawMeasurementDto: RawMeasurementDto
  ): Promise<{
    message: string;
    data: RawMeasurement;
  }> {
    const savedMeasurement =
      await this.rawMeasurementService.processMeasurement(
        rawMeasurementDto.id,
        rawMeasurementDto.value
      );

    return {
      message: 'Measurement processed successfully',
      data: savedMeasurement,
    };
  }

  @Get()
  async getAllMeasurements(
    @Query('externalId') externalId?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<{
    message: string;
    data: RawMeasurement[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: RawMeasurementFilters = {};

    if (externalId) filters.externalId = externalId;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const result = await this.rawMeasurementService.getAllMeasurements(filters);

    return {
      message: 'Measurements retrieved successfully',
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
  async getMeasurementsCount(): Promise<{
    message: string;
    count: number;
  }> {
    const count = await this.rawMeasurementService.getMeasurementsCount();

    return {
      message: 'Measurements count retrieved successfully',
      count,
    };
  }

  @Get(':id')
  async getMeasurementById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: RawMeasurement | null;
  }> {
    const measurement = await this.rawMeasurementService.getMeasurementById(id);

    return {
      message: measurement ? 'Measurement found' : 'Measurement not found',
      data: measurement,
    };
  }

  @Get('external/:externalId')
  async getMeasurementsByExternalId(
    @Param('externalId') externalId: string
  ): Promise<{
    message: string;
    data: RawMeasurement[];
  }> {
    const measurements =
      await this.rawMeasurementService.getMeasurementsByExternalId(externalId);

    return {
      message: 'Measurements retrieved successfully',
      data: measurements,
    };
  }
}
