import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Device } from '../../domain/entities/device.entity';
import {
  DeviceRepository,
  CreateDeviceDto,
  UpdateDeviceDto,
  DeviceFilters,
} from '../../domain/repositories/device.repository';
import { AreaRepository } from '../../../areas/domain/repositories/area.repository';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly areaRepository: AreaRepository
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    this.logger.log(`Creating device with name: ${createDeviceDto.name}`);

    // Check if area exists
    const area = await this.areaRepository.findById(createDeviceDto.areaId);
    if (!area) {
      throw new NotFoundException(
        `Area with ID ${createDeviceDto.areaId} not found`
      );
    }

    // Check if device with same externalId already exists
    const existingDevice = await this.deviceRepository.findByExternalId(
      createDeviceDto.externalId
    );
    if (existingDevice) {
      throw new ConflictException(
        `Device with externalId '${createDeviceDto.externalId}' already exists`
      );
    }

    try {
      const device = await this.deviceRepository.create(createDeviceDto);
      this.logger.log(`Device created successfully with ID: ${device.id}`);
      return device;
    } catch (error) {
      this.logger.error(
        `Error creating device: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findAll(
    filters?: DeviceFilters
  ): Promise<{ data: Device[]; total: number }> {
    try {
      return await this.deviceRepository.findAll(filters);
    } catch (error) {
      this.logger.error(
        `Error retrieving devices: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findById(id: number): Promise<Device> {
    try {
      const device = await this.deviceRepository.findById(id);
      if (!device) {
        throw new NotFoundException(`Device with ID ${id} not found`);
      }
      return device;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving device by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findByExternalId(externalId: string): Promise<Device> {
    try {
      const device = await this.deviceRepository.findByExternalId(externalId);
      if (!device) {
        throw new NotFoundException(
          `Device with externalId '${externalId}' not found`
        );
      }
      return device;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving device by externalId '${externalId}': ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findByAreaId(areaId: number): Promise<Device[]> {
    try {
      // Check if area exists
      const area = await this.areaRepository.findById(areaId);
      if (!area) {
        throw new NotFoundException(`Area with ID ${areaId} not found`);
      }

      return await this.deviceRepository.findByAreaId(areaId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving devices by area ID ${areaId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async update(id: number, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
    this.logger.log(`Updating device with ID: ${id}`);

    try {
      // Check if device exists
      await this.findById(id);

      // Check if area exists (if areaId is being updated)
      if (updateDeviceDto.areaId) {
        const area = await this.areaRepository.findById(updateDeviceDto.areaId);
        if (!area) {
          throw new NotFoundException(
            `Area with ID ${updateDeviceDto.areaId} not found`
          );
        }
      }

      // Check if new externalId conflicts with existing device
      if (updateDeviceDto.externalId) {
        const existingDevice = await this.deviceRepository.findByExternalId(
          updateDeviceDto.externalId
        );
        if (existingDevice && existingDevice.id !== id) {
          throw new ConflictException(
            `Device with externalId '${updateDeviceDto.externalId}' already exists`
          );
        }
      }

      const updatedDevice = await this.deviceRepository.update(
        id,
        updateDeviceDto
      );
      if (!updatedDevice) {
        throw new NotFoundException(`Device with ID ${id} not found`);
      }

      this.logger.log(`Device updated successfully with ID: ${id}`);
      return updatedDevice;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Error updating device with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Soft deleting device with ID: ${id}`);

    try {
      // Check if device exists
      await this.findById(id);

      const deleted = await this.deviceRepository.softDelete(id);
      if (!deleted) {
        throw new NotFoundException(`Device with ID ${id} not found`);
      }

      this.logger.log(`Device soft deleted successfully with ID: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error deleting device with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async restore(id: number): Promise<Device> {
    this.logger.log(`Restoring device with ID: ${id}`);

    try {
      const restored = await this.deviceRepository.restore(id);
      if (!restored) {
        throw new NotFoundException(
          `Device with ID ${id} not found or not deleted`
        );
      }

      const device = await this.deviceRepository.findById(id);
      if (!device) {
        throw new NotFoundException(`Device with ID ${id} not found`);
      }

      this.logger.log(`Device restored successfully with ID: ${id}`);
      return device;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error restoring device with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCount(): Promise<number> {
    try {
      return await this.deviceRepository.count();
    } catch (error) {
      this.logger.error(
        `Error getting devices count: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCountByAreaId(areaId: number): Promise<number> {
    try {
      // Check if area exists
      const area = await this.areaRepository.findById(areaId);
      if (!area) {
        throw new NotFoundException(`Area with ID ${areaId} not found`);
      }

      return await this.deviceRepository.countByAreaId(areaId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error getting devices count for area ID ${areaId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}
