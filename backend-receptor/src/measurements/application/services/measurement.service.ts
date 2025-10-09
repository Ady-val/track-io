import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  MeasurementRepository,
  MeasurementFilters,
} from '../../domain/repositories/measurement.repository';
import { Measurement } from '../../domain/entities/measurement.entity';
import { MeasurementValue } from '../../domain/entities/measurement-value.entity';
import { MeasurementValueRepository } from '../../domain/repositories/measurement-value.repository';
import {
  CreateMeasurementDto,
  UpdateMeasurementDto,
} from '../dtos/measurement.dto';

@Injectable()
export class MeasurementService {
  private readonly logger = new Logger(MeasurementService.name);

  constructor(
    private readonly measurementRepository: MeasurementRepository,
    private readonly measurementValueRepository: MeasurementValueRepository
  ) {}

  async createMeasurement(
    createMeasurementDto: CreateMeasurementDto
  ): Promise<Measurement> {
    try {
      const measurement =
        await this.measurementRepository.create(createMeasurementDto);
      this.logger.log(
        `Measurement created successfully with ID: ${measurement.id}`
      );
      return measurement;
    } catch (error) {
      this.logger.error(
        `Error creating measurement: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getAllMeasurements(
    filters?: MeasurementFilters
  ): Promise<{ data: Measurement[]; total: number }> {
    try {
      return await this.measurementRepository.findAll(filters);
    } catch (error) {
      this.logger.error(
        `Error retrieving measurements: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getMeasurementById(id: number): Promise<Measurement> {
    try {
      const measurement = await this.measurementRepository.findById(id);
      if (!measurement) {
        throw new NotFoundException(`Measurement with ID ${id} not found`);
      }
      return measurement;
    } catch (error) {
      this.logger.error(
        `Error retrieving measurement by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getMeasurementByExternalId(
    externalId: string
  ): Promise<Measurement | null> {
    try {
      return await this.measurementRepository.findByExternalId(externalId);
    } catch (error) {
      this.logger.error(
        `Error retrieving measurement by external ID ${externalId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async updateMeasurement(
    id: number,
    updateMeasurementDto: UpdateMeasurementDto
  ): Promise<Measurement> {
    try {
      const measurement = await this.measurementRepository.update(
        id,
        updateMeasurementDto
      );
      if (!measurement) {
        throw new NotFoundException(`Measurement with ID ${id} not found`);
      }
      this.logger.log(`Measurement with ID ${id} updated successfully`);
      return measurement;
    } catch (error) {
      this.logger.error(
        `Error updating measurement with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async deleteMeasurement(id: number): Promise<void> {
    try {
      const deleted = await this.measurementRepository.softDelete(id);
      if (!deleted) {
        throw new NotFoundException(`Measurement with ID ${id} not found`);
      }
      this.logger.log(`Measurement with ID ${id} deleted successfully`);
    } catch (error) {
      this.logger.error(
        `Error deleting measurement with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async restoreMeasurement(id: number): Promise<void> {
    try {
      const restored = await this.measurementRepository.restore(id);
      if (!restored) {
        throw new NotFoundException(`Measurement with ID ${id} not found`);
      }
      this.logger.log(`Measurement with ID ${id} restored successfully`);
    } catch (error) {
      this.logger.error(
        `Error restoring measurement with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getMeasurementsCount(): Promise<number> {
    try {
      return await this.measurementRepository.count();
    } catch (error) {
      this.logger.error(
        `Error getting measurements count: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getMeasurementValues(
    id: number,
    limit: number = 10
  ): Promise<MeasurementValue[]> {
    try {
      // Validate limit
      if (limit > 100) {
        throw new BadRequestException(
          'Limit cannot exceed 100. Please request 100 or fewer values.'
        );
      }

      if (limit < 1) {
        throw new BadRequestException('Limit must be at least 1.');
      }

      // Verify measurement exists
      const measurement = await this.measurementRepository.findById(id);
      if (!measurement) {
        throw new NotFoundException(`Measurement with ID ${id} not found`);
      }

      const values =
        await this.measurementValueRepository.findLatestByMeasurementId(
          id,
          limit
        );

      this.logger.log(
        `Retrieved ${values.length} values for measurement ID ${id}`
      );

      return values;
    } catch (error) {
      this.logger.error(
        `Error retrieving measurement values for ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}
