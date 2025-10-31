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
} from '@nestjs/common';
import { TorretaService } from '../application/services/torreta.service';
import { Torreta } from '../domain/entities/torreta.entity';
import {
  CreateTorretaDto,
  UpdateTorretaDto,
} from '../application/dtos/torreta.dto';

@Controller('torretas')
export class TorretaController {
  constructor(private readonly torretaService: TorretaService) {}

  @Get()
  async getAllTorretas(@Query('active') active?: string): Promise<{
    message: string;
    data: Torreta[];
  }> {
    const torretas =
      active === 'true'
        ? await this.torretaService.getActiveTorretas()
        : await this.torretaService.getAllTorretas();

    return {
      message: 'Torretas retrieved successfully',
      data: torretas,
    };
  }

  @Get(':id')
  async getTorretaById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: Torreta;
  }> {
    const torreta = await this.torretaService.getTorretaById(id);

    return {
      message: 'Torreta found',
      data: torreta,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTorreta(@Body() createDto: CreateTorretaDto): Promise<{
    message: string;
    data: Torreta;
  }> {
    const torreta = await this.torretaService.createTorreta(createDto);

    return {
      message: 'Torreta created successfully',
      data: torreta,
    };
  }

  @Put(':id')
  async updateTorreta(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTorretaDto
  ): Promise<{
    message: string;
    data: Torreta;
  }> {
    const torreta = await this.torretaService.updateTorreta(id, updateDto);

    return {
      message: 'Torreta updated successfully',
      data: torreta,
    };
  }

  @Patch(':id/toggle')
  async toggleTorreta(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: Torreta;
  }> {
    const torreta = await this.torretaService.toggleTorreta(id);

    return {
      message: `Torreta ${torreta.isActive ? 'activated' : 'deactivated'} successfully`,
      data: torreta,
    };
  }

  @Post(':id/banner-color')
  @HttpCode(HttpStatus.OK)
  async setBannerColor(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { color: 'green' | 'yellow' | 'red' }
  ) {
    await this.torretaService.setBannerColor(id, body.color);
    return { ok: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTorreta(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.torretaService.deleteTorreta(id);
  }
}
