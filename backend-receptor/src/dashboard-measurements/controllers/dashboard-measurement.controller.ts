import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DashboardMeasurementService } from '../application/services/dashboard-measurement.service';
import {
  CreateDashboardMeasurementDto,
  UpdateDashboardMeasurementDto,
} from '../application/dtos/dashboard-measurement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';

@Controller('dashboard-measurements')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DashboardMeasurementController {
  constructor(
    private readonly dashboardMeasurementService: DashboardMeasurementService
  ) {}

  @Get()
  @RequirePermission(Module.MEASUREMENTS, Action.READ)
  async getAllDashboardMeasurements(@Query('groupId') groupId?: string) {
    const groupIdNumber = groupId ? parseInt(groupId, 10) : undefined;
    const dashboards =
      await this.dashboardMeasurementService.getAllDashboardMeasurements(
        groupIdNumber
      );
    return {
      message: 'Dashboard measurements retrieved successfully',
      data: dashboards,
      total: dashboards.length,
    };
  }

  @Get('available')
  @RequirePermission(Module.MEASUREMENTS, Action.READ)
  async getAvailableDashboardMeasurements() {
    const dashboards =
      await this.dashboardMeasurementService.getAvailableDashboardMeasurements();
    return {
      message: 'Available dashboard measurements retrieved successfully',
      data: dashboards,
      total: dashboards.length,
    };
  }

  @Get(':id')
  @RequirePermission(Module.MEASUREMENTS, Action.READ)
  async getDashboardMeasurementById(@Param('id', ParseIntPipe) id: number) {
    const dashboard =
      await this.dashboardMeasurementService.getDashboardMeasurementById(id);
    return {
      message: 'Dashboard measurement retrieved successfully',
      data: dashboard,
    };
  }

  @Get('measurement/:measurementId')
  @RequirePermission(Module.MEASUREMENTS, Action.READ)
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
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.MEASUREMENTS, Action.CREATE)
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
  @RequirePermission(Module.MEASUREMENTS, Action.UPDATE)
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
  @RequirePermission(Module.MEASUREMENTS, Action.DELETE)
  async deleteDashboardMeasurement(@Param('id', ParseIntPipe) id: number) {
    await this.dashboardMeasurementService.deleteDashboardMeasurement(id);
  }
}
