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
import { AreaService } from '../application/services/area.service';
import {
  CreateAreaDto,
  UpdateAreaDto,
  AreaResponseDto,
} from '../application/dtos/area.dto';
import { AreaFilters } from '../domain/repositories/area.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';
import { SystemModuleTag } from 'src/common/decorators/system-module.decorator';
import { SystemModule } from 'src/common/enums/system-module.enum';

@SystemModuleTag(SystemModule.SIGNALS)
@Controller('areas')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.CATALOGS, Action.CREATE)
  async create(@Body() createAreaDto: CreateAreaDto): Promise<{
    message: string;
    data: AreaResponseDto;
  }> {
    const area = await this.areaService.create(createAreaDto);
    const areaResponse = plainToInstance(AreaResponseDto, area, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Area created successfully',
      data: areaResponse,
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
    data: AreaResponseDto[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: AreaFilters = {};
    if (name) filters.name = name;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (includeDeleted) filters.includeDeleted = includeDeleted;

    const { data, total } = await this.areaService.findAll(filters);
    const areaResponses = plainToInstance(AreaResponseDto, data, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Areas retrieved successfully',
      data: areaResponses,
      total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total,
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
    data: AreaResponseDto;
  }> {
    const area = await this.areaService.findById(id);
    const areaResponse = plainToInstance(AreaResponseDto, area, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Area retrieved successfully',
      data: areaResponse,
    };
  }

  @Patch(':id')
  @RequirePermission(Module.CATALOGS, Action.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAreaDto: UpdateAreaDto
  ): Promise<{
    message: string;
    data: AreaResponseDto;
  }> {
    const area = await this.areaService.update(id, updateAreaDto);
    const areaResponse = plainToInstance(AreaResponseDto, area, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Area updated successfully',
      data: areaResponse,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.CATALOGS, Action.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.areaService.remove(id);

    return {
      message: 'Area deleted successfully',
    };
  }

  @Patch(':id/restore')
  @RequirePermission(Module.CATALOGS, Action.UPDATE)
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: AreaResponseDto;
  }> {
    const area = await this.areaService.restore(id);
    const areaResponse = plainToInstance(AreaResponseDto, area, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Area restored successfully',
      data: areaResponse,
    };
  }
}
