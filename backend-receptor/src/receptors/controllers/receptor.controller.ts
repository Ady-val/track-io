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
import { ReceptorService } from '../application/services/receptor.service';
import { Receptor } from '../domain/entities/receptor.entity';
import {
  CreateReceptorDto,
  UpdateReceptorDto,
} from '../application/dtos/receptor.dto';

@Controller('receptors')
export class ReceptorController {
  constructor(private readonly receptorService: ReceptorService) {}

  @Get()
  async getAllReceptors(@Query('active') active?: string): Promise<{
    message: string;
    data: Receptor[];
  }> {
    const receptors =
      active === 'true'
        ? await this.receptorService.getActiveReceptors()
        : await this.receptorService.getAllReceptors();

    return {
      message: 'Receptors retrieved successfully',
      data: receptors,
    };
  }

  @Get(':id')
  async getReceptorById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: Receptor;
  }> {
    const receptor = await this.receptorService.getReceptorById(id);

    return {
      message: 'Receptor found',
      data: receptor,
    };
  }

  @Get('external/:externalId')
  async getReceptorByExternalId(
    @Param('externalId') externalId: string
  ): Promise<{
    message: string;
    data: Receptor;
  }> {
    const receptor =
      await this.receptorService.getReceptorByExternalId(externalId);

    return {
      message: 'Receptor found',
      data: receptor,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReceptor(@Body() createDto: CreateReceptorDto): Promise<{
    message: string;
    data: Receptor;
  }> {
    const receptor = await this.receptorService.createReceptor(createDto);

    return {
      message: 'Receptor created successfully',
      data: receptor,
    };
  }

  @Put(':id')
  async updateReceptor(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateReceptorDto
  ): Promise<{
    message: string;
    data: Receptor;
  }> {
    const receptor = await this.receptorService.updateReceptor(id, updateDto);

    return {
      message: 'Receptor updated successfully',
      data: receptor,
    };
  }

  @Patch(':id/toggle')
  async toggleReceptor(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: Receptor;
  }> {
    const receptor = await this.receptorService.toggleReceptor(id);

    return {
      message: `Receptor ${receptor.isActive ? 'activated' : 'deactivated'} successfully`,
      data: receptor,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReceptor(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.receptorService.deleteReceptor(id);
  }
}
