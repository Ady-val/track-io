import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DashboardMeasurementService } from '../application/services/dashboard-measurement.service';
import {
  CreateDashboardMeasurementDto,
  UpdateDashboardMeasurementDto,
} from '../application/dtos/dashboard-measurement.dto';

@Controller('dashboard-measurements')
export class DashboardMeasurementController {
  constructor(
    private readonly dashboardMeasurementService: DashboardMeasurementService
  ) {}

  @Get()
  async getAllDashboardMeasurements() {
    const dashboards =
      await this.dashboardMeasurementService.getAllDashboardMeasurements();
    return {
      message: 'Dashboard measurements retrieved successfully',
      data: dashboards,
      total: dashboards.length,
    };
  }

  @Get(':id')
  async getDashboardMeasurementById(@Param('id', ParseIntPipe) id: number) {
    const dashboard =
      await this.dashboardMeasurementService.getDashboardMeasurementById(id);
    return {
      message: 'Dashboard measurement retrieved successfully',
      data: dashboard,
    };
  }

  @Get('measurement/:measurementId')
  async getDashboardMeasurementByMeasurementId(
    @Param('measurementId', ParseIntPipe) measurementId: number
  ) {
    const dashboard =
      await this.dashboardMeasurementService.getDashboardMeasurementByMeasurementId(
        measurementId
      );
    return {
      message: 'Dashboard measurement retrieved successfully',
      data: dashboard,
    };
  }

  @Post()
  async createDashboardMeasurement(
    @Body() createDto: CreateDashboardMeasurementDto
  ) {
    const dashboard =
      await this.dashboardMeasurementService.createDashboardMeasurement(
        createDto
      );
    return {
      message: 'Dashboard measurement created successfully',
      data: dashboard,
    };
  }

  @Put(':id')
  async updateDashboardMeasurement(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDashboardMeasurementDto
  ) {
    const dashboard =
      await this.dashboardMeasurementService.updateDashboardMeasurement(
        id,
        updateDto
      );
    return {
      message: 'Dashboard measurement updated successfully',
      data: dashboard,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDashboardMeasurement(@Param('id', ParseIntPipe) id: number) {
    await this.dashboardMeasurementService.deleteDashboardMeasurement(id);
  }
}
