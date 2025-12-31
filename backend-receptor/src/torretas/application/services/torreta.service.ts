import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TorretaRepository } from '../../domain/repositories/torreta.repository';
import { Torreta } from '../../domain/entities/torreta.entity';
import { CreateTorretaDto, UpdateTorretaDto } from '../dtos/torreta.dto';

@Injectable()
export class TorretaService {
  constructor(private readonly torretaRepository: TorretaRepository) {}

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

    if (createDto.externalId) {
      const existingByExternalId =
        await this.torretaRepository.findByExternalId(
          createDto.externalId,
          false
        );

      if (existingByExternalId) {
        throw new ConflictException(
          `Torreta with external ID "${createDto.externalId}" already exists`
        );
      }
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

    if (updateDto.externalId && updateDto.externalId !== torreta.externalId) {
      const existingByExternalId =
        await this.torretaRepository.findByExternalId(
          updateDto.externalId,
          false
        );
      if (existingByExternalId) {
        throw new ConflictException(
          `Torreta with external ID "${updateDto.externalId}" already exists`
        );
      }
    }

    Object.assign(torreta, updateDto);
    return this.torretaRepository.save(torreta);
  }

  async toggleTorreta(id: number): Promise<Torreta> {
    const torreta = await this.getTorretaById(id);
    torreta.isActive = !torreta.isActive;
    return this.torretaRepository.save(torreta);
  }

  async deleteTorreta(id: number): Promise<void> {
    await this.getTorretaById(id);
    await this.torretaRepository.softDelete(id);
  }
}
