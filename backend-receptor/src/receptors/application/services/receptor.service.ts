import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ReceptorRepository } from '../../domain/repositories/receptor.repository';
import { Receptor } from '../../domain/entities/receptor.entity';
import { CreateReceptorDto, UpdateReceptorDto } from '../dtos/receptor.dto';

@Injectable()
export class ReceptorService {
  constructor(private readonly receptorRepository: ReceptorRepository) {}

  async getAllReceptors(): Promise<Receptor[]> {
    return this.receptorRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getActiveReceptors(): Promise<Receptor[]> {
    return this.receptorRepository.findAllActive();
  }

  async getReceptorById(id: number): Promise<Receptor> {
    const receptor = await this.receptorRepository.findOne({ where: { id } });

    if (!receptor) {
      throw new NotFoundException(`Receptor with ID ${id} not found`);
    }

    return receptor;
  }

  async getReceptorByExternalId(externalId: string): Promise<Receptor> {
    const receptor = await this.receptorRepository.findByExternalId(externalId);

    if (!receptor) {
      throw new NotFoundException(
        `Receptor with external ID ${externalId} not found`
      );
    }

    return receptor;
  }

  async createReceptor(createDto: CreateReceptorDto): Promise<Receptor> {
    const existing = await this.receptorRepository.findByExternalId(
      createDto.externalId
    );

    if (existing) {
      throw new ConflictException(
        `Receptor with external ID "${createDto.externalId}" already exists`
      );
    }

    const receptor = this.receptorRepository.create(createDto);
    return this.receptorRepository.save(receptor);
  }

  async updateReceptor(
    id: number,
    updateDto: UpdateReceptorDto
  ): Promise<Receptor> {
    const receptor = await this.getReceptorById(id);

    if (updateDto.externalId && updateDto.externalId !== receptor.externalId) {
      const existing = await this.receptorRepository.findByExternalId(
        updateDto.externalId
      );
      if (existing) {
        throw new ConflictException(
          `Receptor with external ID "${updateDto.externalId}" already exists`
        );
      }
    }

    Object.assign(receptor, updateDto);
    return this.receptorRepository.save(receptor);
  }

  async toggleReceptor(id: number): Promise<Receptor> {
    const receptor = await this.getReceptorById(id);
    receptor.isActive = !receptor.isActive;
    return this.receptorRepository.save(receptor);
  }

  async deleteReceptor(id: number): Promise<void> {
    await this.getReceptorById(id);
    await this.receptorRepository.softDelete(id);
  }
}
