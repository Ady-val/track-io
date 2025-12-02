import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AreaTorretaConfigService } from '../application/services/area-torreta-config.service';
import {
  CreateAreaTorretaConfigDto,
  UpdateAreaTorretaConfigDto,
} from '../application/dtos/area-torreta-config.dto';
import { AreaTorretaConfig } from '../domain/entities/area-torreta-config.entity';

@Controller('area-torreta-configs')
export class AreaTorretaConfigController {
  constructor(
    private readonly areaTorretaConfigService: AreaTorretaConfigService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateAreaTorretaConfigDto): Promise<{
    message: string;
    data: AreaTorretaConfig;
  }> {
    const config = await this.areaTorretaConfigService.create(createDto);
    return {
      message: 'Area torreta config created successfully',
      data: config,
    };
  }

  @Get('area/:areaId')
  async findAllByArea(@Param('areaId', ParseIntPipe) areaId: number): Promise<{
    message: string;
    data: AreaTorretaConfig[];
  }> {
    const configs = await this.areaTorretaConfigService.findAllByArea(areaId);
    return {
      message: 'Area torreta configs retrieved successfully',
      data: configs,
    };
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: AreaTorretaConfig;
  }> {
    const config = await this.areaTorretaConfigService.findById(id);
    return {
      message: 'Area torreta config retrieved successfully',
      data: config,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAreaTorretaConfigDto
  ): Promise<{
    message: string;
    data: AreaTorretaConfig;
  }> {
    const config = await this.areaTorretaConfigService.update(id, updateDto);
    return {
      message: 'Area torreta config updated successfully',
      data: config,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.areaTorretaConfigService.delete(id);
  }
}
