import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TorretaColorService } from '../application/services/torreta-color.service';
import { TorretaColor } from '../domain/entities/torreta-color.entity';
import {
  CreateTorretaColorDto,
  UpdateTorretaColorDto,
} from '../application/dtos/torreta-color.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';

@Controller('torreta-colors')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TorretaColorController {
  constructor(private readonly torretaColorService: TorretaColorService) {}

  @Get()
  async getAllTorretaColors(): Promise<{
    message: string;
    data: TorretaColor[];
  }> {
    const colors = await this.torretaColorService.getAllTorretaColors();

    return {
      message: 'Torreta colors retrieved successfully',
      data: colors,
    };
  }

  @Get(':id')
  async getTorretaColorById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: TorretaColor;
  }> {
    const color = await this.torretaColorService.getTorretaColorById(id);

    return {
      message: 'Torreta color found',
      data: color,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.CATALOGS, Action.CREATE)
  async createTorretaColor(@Body() createDto: CreateTorretaColorDto): Promise<{
    message: string;
    data: TorretaColor;
  }> {
    const color = await this.torretaColorService.createTorretaColor(createDto);

    return {
      message: 'Torreta color created successfully',
      data: color,
    };
  }

  @Put(':id')
  @RequirePermission(Module.CATALOGS, Action.UPDATE)
  async updateTorretaColor(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTorretaColorDto
  ): Promise<{
    message: string;
    data: TorretaColor;
  }> {
    const color = await this.torretaColorService.updateTorretaColor(
      id,
      updateDto
    );

    return {
      message: 'Torreta color updated successfully',
      data: color,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.CATALOGS, Action.DELETE)
  async deleteTorretaColor(
    @Param('id', ParseIntPipe) id: number
  ): Promise<void> {
    await this.torretaColorService.deleteTorretaColor(id);
  }
}
