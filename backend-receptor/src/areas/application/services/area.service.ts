import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Area } from '../../domain/entities/area.entity';
import {
  AreaRepository,
  CreateAreaDto,
  UpdateAreaDto,
  AreaFilters,
} from '../../domain/repositories/area.repository';

@Injectable()
export class AreaService {
  private readonly logger = new Logger(AreaService.name);

  constructor(private readonly areaRepository: AreaRepository) {}

  async create(createAreaDto: CreateAreaDto): Promise<Area> {
    this.logger.log(`Creating area with name: ${createAreaDto.name}`);

    const existingArea = await this.areaRepository.findByName(
      createAreaDto.name
    );
    if (existingArea) {
      throw new ConflictException(
        `Area with name '${createAreaDto.name}' already exists`
      );
    }

    try {
      const area = await this.areaRepository.create(createAreaDto);
      this.logger.log(`Area created successfully with ID: ${area.id}`);
      return area;
    } catch (error) {
      this.logger.error(
        `Error creating area: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findAll(
    filters?: AreaFilters
  ): Promise<{ data: Area[]; total: number }> {
    try {
      return await this.areaRepository.findAll(filters);
    } catch (error) {
      this.logger.error(
        `Error retrieving areas: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findById(id: number): Promise<Area> {
    try {
      const area = await this.areaRepository.findById(id);
      if (!area) {
        throw new NotFoundException(`Area with ID ${id} not found`);
      }
      return area;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving area by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async update(id: number, updateAreaDto: UpdateAreaDto): Promise<Area> {
    this.logger.log(`Updating area with ID: ${id}`);

    try {
      await this.findById(id);

      if (updateAreaDto.name) {
        const existingArea = await this.areaRepository.findByName(
          updateAreaDto.name
        );
        if (existingArea && existingArea.id !== id) {
          throw new ConflictException(
            `Area with name '${updateAreaDto.name}' already exists`
          );
        }
      }

      const updatedArea = await this.areaRepository.update(id, updateAreaDto);
      if (!updatedArea) {
        throw new NotFoundException(`Area with ID ${id} not found`);
      }

      this.logger.log(`Area updated successfully with ID: ${id}`);
      return updatedArea;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Error updating area with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Soft deleting area with ID: ${id}`);

    try {
      await this.findById(id);

      const deleted = await this.areaRepository.softDelete(id);
      if (!deleted) {
        throw new NotFoundException(`Area with ID ${id} not found`);
      }

      this.logger.log(`Area soft deleted successfully with ID: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error deleting area with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async restore(id: number): Promise<Area> {
    this.logger.log(`Restoring area with ID: ${id}`);

    try {
      const restored = await this.areaRepository.restore(id);
      if (!restored) {
        throw new NotFoundException(
          `Area with ID ${id} not found or not deleted`
        );
      }

      const area = await this.areaRepository.findById(id);
      if (!area) {
        throw new NotFoundException(`Area with ID ${id} not found`);
      }

      this.logger.log(`Area restored successfully with ID: ${id}`);
      return area;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error restoring area with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCount(): Promise<number> {
    try {
      return await this.areaRepository.count();
    } catch (error) {
      this.logger.error(
        `Error getting areas count: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}
