import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { TorretaService } from '../application/services/torreta.service';
import {
  CreateTorretaDto,
  UpdateTorretaDto,
  TorretaResponseDto,
} from '../application/dtos/torreta.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';

@Controller('torretas')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TorretaController {
  constructor(private readonly torretaService: TorretaService) {}

  @Get()
  async getAllTorretas(@Query('active') active?: string): Promise<{
    message: string;
    data: TorretaResponseDto[];
  }> {
    const torretas =
      active === 'true'
        ? await this.torretaService.getActiveTorretas()
        : await this.torretaService.getAllTorretas();
    const torretaResponses = plainToInstance(TorretaResponseDto, torretas, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Torretas retrieved successfully',
      data: torretaResponses,
    };
  }

  @Get(':id')
  async getTorretaById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: TorretaResponseDto;
  }> {
    const torreta = await this.torretaService.getTorretaById(id);
    const torretaResponse = plainToInstance(TorretaResponseDto, torreta, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Torreta found',
      data: torretaResponse,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.CATALOGS, Action.CREATE)
  async createTorreta(@Body() createDto: CreateTorretaDto): Promise<{
    message: string;
    data: TorretaResponseDto;
  }> {
    const torreta = await this.torretaService.createTorreta(createDto);
    const torretaResponse = plainToInstance(TorretaResponseDto, torreta, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Torreta created successfully',
      data: torretaResponse,
    };
  }

  @Put(':id')
  @RequirePermission(Module.CATALOGS, Action.UPDATE)
  async updateTorreta(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTorretaDto
  ): Promise<{
    message: string;
    data: TorretaResponseDto;
  }> {
    const torreta = await this.torretaService.updateTorreta(id, updateDto);
    const torretaResponse = plainToInstance(TorretaResponseDto, torreta, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Torreta updated successfully',
      data: torretaResponse,
    };
  }

  @Patch(':id/toggle')
  @RequirePermission(Module.CATALOGS, Action.UPDATE)
  async toggleTorreta(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: TorretaResponseDto;
  }> {
    const torreta = await this.torretaService.toggleTorreta(id);
    const torretaResponse = plainToInstance(TorretaResponseDto, torreta, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: `Torreta ${torreta.isActive ? 'activated' : 'deactivated'} successfully`,
      data: torretaResponse,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.CATALOGS, Action.DELETE)
  async deleteTorreta(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.torretaService.deleteTorreta(id);
  }
}
