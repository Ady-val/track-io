import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  SignalDto,
  VirtualDeviceSignalDto,
} from '../application/dtos/signal.dto';
import { SignalService } from '../application/services/signal.service';
import { RawSignal } from '../domain/entities/raw-signal.entity';
import { RawSignalFilters } from '../domain/repositories/raw-signal.repository';

@Controller('signals')
export class SignalController {
  constructor(private readonly signalService: SignalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSignal(@Body() signalDto: SignalDto): Promise<{
    message: string;
    data: RawSignal;
  }> {
    const savedSignal = await this.signalService.processSignal(
      signalDto.id,
      signalDto.value
    );

    return {
      message: 'Signal processed successfully',
      data: savedSignal,
    };
  }

  @Post('virtual-device')
  @HttpCode(HttpStatus.CREATED)
  async createVirtualDeviceSignal(
    @Body() signalDto: VirtualDeviceSignalDto
  ): Promise<{
    message: string;
    data: RawSignal;
  }> {
    const savedSignal = await this.signalService.processVirtualDeviceSignal(
      signalDto.id,
      signalDto.value,
      signalDto.reason,
      signalDto.comment
    );

    return {
      message: 'Virtual device signal processed successfully',
      data: savedSignal,
    };
  }

  @Get()
  async getAllSignals(
    @Query('externalId') externalId?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<{
    message: string;
    data: RawSignal[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: RawSignalFilters = {};

    if (externalId) filters.externalId = externalId;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const { data, total } = await this.signalService.getAllSignals(filters);

    return {
      message: 'Signals retrieved successfully',
      data,
      total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total,
      },
    };
  }

  @Get('count')
  async getSignalsCount(): Promise<{
    message: string;
    count: number;
  }> {
    const count = await this.signalService.getSignalsCount();

    return {
      message: 'Signals count retrieved successfully',
      count,
    };
  }

  @Get(':id')
  async getSignalById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: RawSignal | null;
  }> {
    const signal = await this.signalService.getSignalById(id);

    return {
      message: signal ? 'Signal found' : 'Signal not found',
      data: signal,
    };
  }

  @Get('external/:externalId')
  async getSignalsByExternalId(
    @Param('externalId') externalId: string
  ): Promise<{
    message: string;
    data: RawSignal[];
  }> {
    const signals = await this.signalService.getSignalsByExternalId(externalId);

    return {
      message: 'Signals retrieved successfully',
      data: signals,
    };
  }
}
