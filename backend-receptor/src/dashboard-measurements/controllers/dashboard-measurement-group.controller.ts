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
  UseGuards,
} from '@nestjs/common';
import { DashboardMeasurementGroupService } from '../application/services/dashboard-measurement-group.service';
import {
  CreateDashboardMeasurementGroupDto,
  UpdateDashboardMeasurementGroupDto,
} from '../application/dtos/dashboard-measurement-group.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';
import { SystemModuleTag } from 'src/common/decorators/system-module.decorator';
import { SystemModule } from 'src/common/enums/system-module.enum';

@SystemModuleTag(SystemModule.MEASUREMENTS)
@Controller('dashboard-measurement-groups')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DashboardMeasurementGroupController {
  constructor(
    private readonly dashboardMeasurementGroupService: DashboardMeasurementGroupService
  ) {}

  @Get()
  @RequirePermission(Module.MEASUREMENTS, Action.READ)
  async getAllGroups() {
    const groups = await this.dashboardMeasurementGroupService.getAllGroups();
    return {
      message: 'Dashboard measurement groups retrieved successfully',
      data: groups,
      total: groups.length,
    };
  }

  @Get(':id')
  @RequirePermission(Module.MEASUREMENTS, Action.READ)
  async getGroupById(@Param('id', ParseIntPipe) id: number) {
    const group = await this.dashboardMeasurementGroupService.getGroupById(id);
    return {
      message: 'Dashboard measurement group retrieved successfully',
      data: group,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.MEASUREMENTS, Action.CREATE)
  async createGroup(@Body() createDto: CreateDashboardMeasurementGroupDto) {
    const group =
      await this.dashboardMeasurementGroupService.createGroup(createDto);
    return {
      message: 'Dashboard measurement group created successfully',
      data: group,
    };
  }

  @Put(':id')
  @RequirePermission(Module.MEASUREMENTS, Action.UPDATE)
  async updateGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDashboardMeasurementGroupDto
  ) {
    const group = await this.dashboardMeasurementGroupService.updateGroup(
      id,
      updateDto
    );
    return {
      message: 'Dashboard measurement group updated successfully',
      data: group,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.MEASUREMENTS, Action.DELETE)
  async deleteGroup(@Param('id', ParseIntPipe) id: number) {
    await this.dashboardMeasurementGroupService.deleteGroup(id);
  }
}
