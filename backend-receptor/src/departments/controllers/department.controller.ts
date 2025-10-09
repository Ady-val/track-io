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
import { DepartmentService } from '../application/services/department.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '../application/dtos/department.dto';
import { Department } from '../domain/entities/department.entity';
import { DepartmentFilters } from '../domain/repositories/department.repository';

@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDepartmentDto: CreateDepartmentDto): Promise<{
    message: string;
    data: Department;
  }> {
    const department = await this.departmentService.create(createDepartmentDto);

    return {
      message: 'Department created successfully',
      data: department,
    };
  }

  @Get()
  async findAll(
    @Query('name') name?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('includeDeleted', new DefaultValuePipe(false))
    includeDeleted?: boolean
  ): Promise<{
    message: string;
    data: Department[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: DepartmentFilters = {};
    if (name) filters.name = name;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (includeDeleted) filters.includeDeleted = includeDeleted;

    const result = await this.departmentService.findAll(filters);

    return {
      message: 'Departments retrieved successfully',
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
    const count = await this.departmentService.getCount();

    return {
      message: 'Departments count retrieved successfully',
      count,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: Department;
  }> {
    const department = await this.departmentService.findById(id);

    return {
      message: 'Department retrieved successfully',
      data: department,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto
  ): Promise<{
    message: string;
    data: Department;
  }> {
    const department = await this.departmentService.update(
      id,
      updateDepartmentDto
    );

    return {
      message: 'Department updated successfully',
      data: department,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.departmentService.remove(id);

    return {
      message: 'Department deleted successfully',
    };
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: Department;
  }> {
    const department = await this.departmentService.restore(id);

    return {
      message: 'Department restored successfully',
      data: department,
    };
  }
}
