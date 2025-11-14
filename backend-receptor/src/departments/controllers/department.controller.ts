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
import { DepartmentService } from '../application/services/department.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentResponseDto,
} from '../application/dtos/department.dto';
import { DepartmentFilters } from '../domain/repositories/department.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import { Module, Action } from '../../permissions/constants/permissions.constants';

@Controller('departments')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.DEPARTMENTS, Action.CREATE)
  async create(@Body() createDepartmentDto: CreateDepartmentDto): Promise<{
    message: string;
    data: DepartmentResponseDto;
  }> {
    const department = await this.departmentService.create(createDepartmentDto);
    const departmentResponse = plainToInstance(DepartmentResponseDto, department, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Department created successfully',
      data: departmentResponse,
    };
  }

  @Get()
  @RequirePermission(Module.DEPARTMENTS, Action.READ)
  async findAll(
    @Query('name') name?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('includeDeleted', new DefaultValuePipe(false))
    includeDeleted?: boolean
  ): Promise<{
    message: string;
    data: DepartmentResponseDto[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: DepartmentFilters = {};
    if (name) filters.name = name;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (includeDeleted) filters.includeDeleted = includeDeleted;

    const { data, total } = await this.departmentService.findAll(filters);
    const departmentResponses = plainToInstance(DepartmentResponseDto, data, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Departments retrieved successfully',
      data: departmentResponses,
      total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total,
      },
    };
  }

  @Get('count')
  @RequirePermission(Module.DEPARTMENTS, Action.READ)
  async getCount(): Promise<{
    message: string;
    count: number;
  }> {
    const count = await this.departmentService.getCount();

    return {
      message: 'Departments count retrieved successfully',
      count,
    };
  }

  @Get(':id')
  @RequirePermission(Module.DEPARTMENTS, Action.READ)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: DepartmentResponseDto;
  }> {
    const department = await this.departmentService.findById(id);
    const departmentResponse = plainToInstance(DepartmentResponseDto, department, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Department retrieved successfully',
      data: departmentResponse,
    };
  }

  @Patch(':id')
  @RequirePermission(Module.DEPARTMENTS, Action.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto
  ): Promise<{
    message: string;
    data: DepartmentResponseDto;
  }> {
    const department = await this.departmentService.update(
      id,
      updateDepartmentDto
    );
    const departmentResponse = plainToInstance(DepartmentResponseDto, department, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Department updated successfully',
      data: departmentResponse,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.DEPARTMENTS, Action.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.departmentService.remove(id);

    return {
      message: 'Department deleted successfully',
    };
  }

  @Patch(':id/restore')
  @RequirePermission(Module.DEPARTMENTS, Action.UPDATE)
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: DepartmentResponseDto;
  }> {
    const department = await this.departmentService.restore(id);
    const departmentResponse = plainToInstance(DepartmentResponseDto, department, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Department restored successfully',
      data: departmentResponse,
    };
  }
}
