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
import { AreaService } from '../application/services/area.service';
import { CreateAreaDto, UpdateAreaDto } from '../application/dtos/area.dto';
import { Area } from '../domain/entities/area.entity';
import { AreaFilters } from '../domain/repositories/area.repository';

@Controller('areas')
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAreaDto: CreateAreaDto): Promise<{
    message: string;
    data: Area;
  }> {
    const area = await this.areaService.create(createAreaDto);

    return {
      message: 'Area created successfully',
      data: area,
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
    data: Area[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: AreaFilters = {};
    if (name) filters.name = name;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (includeDeleted) filters.includeDeleted = includeDeleted;

    const result = await this.areaService.findAll(filters);

    return {
      message: 'Areas retrieved successfully',
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
    const count = await this.areaService.getCount();

    return {
      message: 'Areas count retrieved successfully',
      count,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: Area;
  }> {
    const area = await this.areaService.findById(id);

    return {
      message: 'Area retrieved successfully',
      data: area,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAreaDto: UpdateAreaDto
  ): Promise<{
    message: string;
    data: Area;
  }> {
    const area = await this.areaService.update(id, updateAreaDto);

    return {
      message: 'Area updated successfully',
      data: area,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.areaService.remove(id);

    return {
      message: 'Area deleted successfully',
    };
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: Area;
  }> {
    const area = await this.areaService.restore(id);

    return {
      message: 'Area restored successfully',
      data: area,
    };
  }
}
