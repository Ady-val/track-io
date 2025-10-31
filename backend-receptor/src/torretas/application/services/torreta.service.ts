import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { TorretaRepository } from '../../domain/repositories/torreta.repository';
import { Torreta } from '../../domain/entities/torreta.entity';
import { CreateTorretaDto, UpdateTorretaDto } from '../dtos/torreta.dto';
import { ModbusService } from './modbus.service';

@Injectable()
export class TorretaService {
  private readonly logger = new Logger(TorretaService.name);
  private lastColorByTorretaId = new Map<number, 'green'|'yellow'|'red'>();

  constructor(
    private readonly torretaRepository: TorretaRepository,
    private readonly modbusService: ModbusService
  ) {}

  async getAllTorretas(): Promise<Torreta[]> {
    return this.torretaRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getActiveTorretas(): Promise<Torreta[]> {
    return this.torretaRepository.findAllActive();
  }

  async getTorretaById(id: number): Promise<Torreta> {
    const torreta = await this.torretaRepository.findOne({ where: { id } });

    if (!torreta) {
      throw new NotFoundException(`Torreta with ID ${id} not found`);
    }

    return torreta;
  }

  async createTorreta(createDto: CreateTorretaDto): Promise<Torreta> {
    const existing = await this.torretaRepository.findByName(createDto.name);

    if (existing) {
      throw new ConflictException(
        `Torreta with name "${createDto.name}" already exists`
      );
    }

    const torreta = this.torretaRepository.create(createDto);
    return this.torretaRepository.save(torreta);
  }

  async updateTorreta(
    id: number,
    updateDto: UpdateTorretaDto
  ): Promise<Torreta> {
    const torreta = await this.getTorretaById(id);

    if (updateDto.name && updateDto.name !== torreta.name) {
      const existing = await this.torretaRepository.findByName(updateDto.name);
      if (existing) {
        throw new ConflictException(
          `Torreta with name "${updateDto.name}" already exists`
        );
      }
    }

    Object.assign(torreta, updateDto);
    return this.torretaRepository.save(torreta);
  }

  async setBannerColor(id: number, color: 'green' | 'yellow' | 'red'): Promise<void> {
    const torreta = await this.getTorretaById(id);
    if (torreta.type !== 'BANNER') return;
    // Evitar escrituras redundantes
    const last = this.lastColorByTorretaId.get(id);
    if (last === color) {
      this.logger.debug?.(`Torreta ${id} color already ${color}, skipping write`);
      return;
    }
    const start = torreta.startRegister ?? 1;
    const count = torreta.registerCount ?? 3;
    // Build color array
    // Mapeo correcto del PLC:
    // - Verde: registro 1 = 1 -> [1,0,0]
    // - Amarillo: registro 2 = 1 -> [0,1,0]
    // - Rojo: registro 3 = 1 -> [0,0,1]
    const map: Record<typeof color, number[]> = {
      green: [1, 0, 0],   // registro 1 = 1
      yellow: [0, 1, 0],  // registro 2 = 1
      red: [0, 0, 1],     // registro 3 = 1
    } as const;
    const values = map[color];
    const slice = values.slice(0, count);
    this.logger.log(
      `Setting banner color for torreta ${id}: ${color} -> values=[${slice.join(',')}] starting at register ${start}`
    );
    await this.modbusService.writeMultipleRegisters(start, slice);
    this.lastColorByTorretaId.set(id, color);
  }

  async toggleTorreta(id: number): Promise<Torreta> {
    const torreta = await this.getTorretaById(id);
    torreta.isActive = !torreta.isActive;
    const saved = await this.torretaRepository.save(torreta);

    const register = Number(process.env['TORRETA_REGISTER'] ?? 1);
    const value = saved.isActive ? 1 : 0;
    try {
      await this.modbusService.writeSingleRegister(register, value);
    } catch (error) {
      this.logger.error(
        `Failed to write Modbus register ${register}=${value}: ${(error as Error).message}`
      );
    }

    return saved;
  }

  async deleteTorreta(id: number): Promise<void> {
    await this.getTorretaById(id);
    await this.torretaRepository.softDelete(id);
  }
}
