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
import { DashboardMeasurementGroupService } from '../application/services/dashboard-measurement-group.service';
import {
  CreateDashboardMeasurementGroupDto,
  UpdateDashboardMeasurementGroupDto,
} from '../application/dtos/dashboard-measurement-group.dto';

@Controller('dashboard-measurement-groups')
export class DashboardMeasurementGroupController {
  constructor(
    private readonly dashboardMeasurementGroupService: DashboardMeasurementGroupService
  ) {}

  @Get()
  async getAllGroups() {
    const groups =
      await this.dashboardMeasurementGroupService.getAllGroups();
    return {
      message: 'Dashboard measurement groups retrieved successfully',
      data: groups,
      total: groups.length,
    };
  }

  @Get(':id')
  async getGroupById(@Param('id', ParseIntPipe) id: number) {
    const group = await this.dashboardMeasurementGroupService.getGroupById(id);
    return {
      message: 'Dashboard measurement group retrieved successfully',
      data: group,
    };
  }

  @Post()
  async createGroup(@Body() createDto: CreateDashboardMeasurementGroupDto) {
    const group = await this.dashboardMeasurementGroupService.createGroup(
      createDto
    );
    return {
      message: 'Dashboard measurement group created successfully',
      data: group,
    };
  }

  @Put(':id')
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
  async deleteGroup(@Param('id', ParseIntPipe) id: number) {
    await this.dashboardMeasurementGroupService.deleteGroup(id);
  }
}


