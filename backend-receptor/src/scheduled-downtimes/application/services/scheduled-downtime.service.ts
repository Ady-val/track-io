import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ScheduledDowntime } from '../../domain/entities/scheduled-downtime.entity';
import {
  ScheduledDowntimeRepository,
  CreateScheduledDowntimeDto,
  UpdateScheduledDowntimeDto,
  ScheduledDowntimeFilters,
} from '../../domain/repositories/scheduled-downtime.repository';
import { AreaRepository } from '../../../areas/domain/repositories/area.repository';
import { ScheduledDowntimeCacheService } from './scheduled-downtime-cache.service';

@Injectable()
export class ScheduledDowntimeService {
  private readonly logger = new Logger(ScheduledDowntimeService.name);

  constructor(
    private readonly scheduledDowntimeRepository: ScheduledDowntimeRepository,
    private readonly areaRepository: AreaRepository,
    private readonly cache: ScheduledDowntimeCacheService
  ) {}

  /**
   * `endTime < startTime` es VÁLIDO: significa que la ventana cruza medianoche
   * y cierra al día siguiente (ej. 23:00 -> 02:00). Ver PLAN §1.4b.
   * Lo único inválido es que sean iguales, porque es ambiguo (¿0 h o 24 h?).
   */
  private assertValidTimeRange(startTime: string, endTime: string): void {
    if (startTime === endTime) {
      throw new BadRequestException(
        'startTime y endTime no pueden ser iguales. Para una ventana de día ' +
          'completo usa 00:00 a 23:59; para una que cruza medianoche usa ' +
          'por ejemplo 23:00 a 02:00.'
      );
    }
  }

  async create(
    createDto: CreateScheduledDowntimeDto
  ): Promise<ScheduledDowntime> {
    this.logger.log(
      `Creating scheduled downtime with name: ${createDto.name} for area ${createDto.areaId}`
    );

    const area = await this.areaRepository.findById(createDto.areaId);
    if (!area) {
      throw new NotFoundException(`Area with ID ${createDto.areaId} not found`);
    }

    this.assertValidTimeRange(createDto.startTime, createDto.endTime);

    try {
      const scheduledDowntime =
        await this.scheduledDowntimeRepository.create(createDto);
      this.cache.invalidate(scheduledDowntime.areaId);
      this.logger.log(
        `Scheduled downtime created successfully with ID: ${scheduledDowntime.id}`
      );
      return scheduledDowntime;
    } catch (error) {
      this.logger.error(
        `Error creating scheduled downtime: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findAll(
    filters?: ScheduledDowntimeFilters
  ): Promise<{ data: ScheduledDowntime[]; total: number }> {
    try {
      return await this.scheduledDowntimeRepository.findAll(filters);
    } catch (error) {
      this.logger.error(
        `Error retrieving scheduled downtimes: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findById(id: number): Promise<ScheduledDowntime> {
    try {
      const scheduledDowntime =
        await this.scheduledDowntimeRepository.findById(id);
      if (!scheduledDowntime) {
        throw new NotFoundException(
          `Scheduled downtime with ID ${id} not found`
        );
      }
      return scheduledDowntime;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving scheduled downtime by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateScheduledDowntimeDto
  ): Promise<ScheduledDowntime> {
    this.logger.log(`Updating scheduled downtime with ID: ${id}`);

    try {
      const existing = await this.findById(id);

      if (updateDto.areaId) {
        const area = await this.areaRepository.findById(updateDto.areaId);
        if (!area) {
          throw new NotFoundException(
            `Area with ID ${updateDto.areaId} not found`
          );
        }
      }

      const nextStartTime = updateDto.startTime ?? existing.startTime;
      const nextEndTime = updateDto.endTime ?? existing.endTime;
      this.assertValidTimeRange(nextStartTime, nextEndTime);

      const updated = await this.scheduledDowntimeRepository.update(
        id,
        updateDto
      );
      if (!updated) {
        throw new NotFoundException(
          `Scheduled downtime with ID ${id} not found`
        );
      }

      // invalidateAll y no invalidate(areaId): un update puede mover el paro
      // programado de un área a otra, dejando obsoletas las dos entradas.
      this.cache.invalidateAll();

      this.logger.log(`Scheduled downtime updated successfully with ID: ${id}`);
      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error updating scheduled downtime with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Soft deleting scheduled downtime with ID: ${id}`);

    try {
      const existing = await this.findById(id);

      const deleted = await this.scheduledDowntimeRepository.softDelete(id);
      if (!deleted) {
        throw new NotFoundException(
          `Scheduled downtime with ID ${id} not found`
        );
      }

      this.cache.invalidate(existing.areaId);

      this.logger.log(
        `Scheduled downtime soft deleted successfully with ID: ${id}`
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error deleting scheduled downtime with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async restore(id: number): Promise<ScheduledDowntime> {
    this.logger.log(`Restoring scheduled downtime with ID: ${id}`);

    try {
      const restored = await this.scheduledDowntimeRepository.restore(id);
      if (!restored) {
        throw new NotFoundException(
          `Scheduled downtime with ID ${id} not found or not deleted`
        );
      }

      const scheduledDowntime =
        await this.scheduledDowntimeRepository.findById(id);
      if (!scheduledDowntime) {
        throw new NotFoundException(
          `Scheduled downtime with ID ${id} not found`
        );
      }

      this.cache.invalidate(scheduledDowntime.areaId);

      this.logger.log(
        `Scheduled downtime restored successfully with ID: ${id}`
      );
      return scheduledDowntime;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error restoring scheduled downtime with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCount(): Promise<number> {
    try {
      return await this.scheduledDowntimeRepository.count();
    } catch (error) {
      this.logger.error(
        `Error getting scheduled downtimes count: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}
