import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TorretaColorRepository } from '../../domain/repositories/torreta-color.repository';
import { TorretaColor } from '../../domain/entities/torreta-color.entity';
import {
  CreateTorretaColorDto,
  UpdateTorretaColorDto,
} from '../dtos/torreta-color.dto';

@Injectable()
export class TorretaColorService {
  constructor(
    private readonly torretaColorRepository: TorretaColorRepository
  ) {}

  async getAllTorretaColors(): Promise<TorretaColor[]> {
    return this.torretaColorRepository.findAllOrderedByOrder();
  }

  async getTorretaColorById(id: number): Promise<TorretaColor> {
    const color = await this.torretaColorRepository.findOne({
      where: { id },
    });

    if (!color) {
      throw new NotFoundException(`Torreta color with ID ${id} not found`);
    }

    return color;
  }

  async createTorretaColor(
    createDto: CreateTorretaColorDto
  ): Promise<TorretaColor> {
    const existing = await this.torretaColorRepository.findByName(
      createDto.name
    );

    if (existing) {
      throw new ConflictException(
        `Torreta color with name "${createDto.name}" already exists`
      );
    }

    const color = this.torretaColorRepository.create(createDto);
    return this.torretaColorRepository.save(color);
  }

  async updateTorretaColor(
    id: number,
    updateDto: UpdateTorretaColorDto
  ): Promise<TorretaColor> {
    const color = await this.getTorretaColorById(id);

    if (updateDto.name && updateDto.name !== color.name) {
      const existing = await this.torretaColorRepository.findByName(
        updateDto.name
      );
      if (existing) {
        throw new ConflictException(
          `Torreta color with name "${updateDto.name}" already exists`
        );
      }
    }

    Object.assign(color, updateDto);
    return this.torretaColorRepository.save(color);
  }

  async deleteTorretaColor(id: number): Promise<void> {
    const color = await this.getTorretaColorById(id);
    await this.torretaColorRepository.remove(color);
  }

  async getTorretaColorByHtmlColor(
    htmlColor: string
  ): Promise<TorretaColor | null> {
    return this.torretaColorRepository.findByHtmlColor(htmlColor);
  }
}
