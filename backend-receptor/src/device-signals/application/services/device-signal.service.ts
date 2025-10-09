import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DeviceSignal } from '../../domain/entities/device-signal.entity';
import {
  DeviceSignalRepository,
  CreateDeviceSignalDto,
  UpdateDeviceSignalDto,
  DeviceSignalFilters,
} from '../../domain/repositories/device-signal.repository';
import { DeviceRepository } from '../../../devices/domain/repositories/device.repository';
import { DepartmentRepository } from '../../../departments/domain/repositories/department.repository';

@Injectable()
export class DeviceSignalService {
  private readonly logger = new Logger(DeviceSignalService.name);

  constructor(
    private readonly deviceSignalRepository: DeviceSignalRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly departmentRepository: DepartmentRepository
  ) {}

  async create(
    createDeviceSignalDto: CreateDeviceSignalDto
  ): Promise<DeviceSignal> {
    this.logger.log(
      `Creating device signal with name: ${createDeviceSignalDto.name}`
    );

    // Check if device exists
    const device = await this.deviceRepository.findById(
      createDeviceSignalDto.deviceId
    );
    if (!device) {
      throw new NotFoundException(
        `Device with ID ${createDeviceSignalDto.deviceId} not found`
      );
    }

    // Check if department exists
    const department = await this.departmentRepository.findById(
      createDeviceSignalDto.departmentId
    );
    if (!department) {
      throw new NotFoundException(
        `Department with ID ${createDeviceSignalDto.departmentId} not found`
      );
    }

    // Check if device signal with same externalValueId already exists
    const existingDeviceSignal =
      await this.deviceSignalRepository.findByExternalValueId(
        createDeviceSignalDto.externalValueId
      );
    if (existingDeviceSignal) {
      throw new ConflictException(
        `Device signal with externalValueId '${createDeviceSignalDto.externalValueId}' already exists`
      );
    }

    try {
      const deviceSignal = await this.deviceSignalRepository.create(
        createDeviceSignalDto
      );
      this.logger.log(
        `Device signal created successfully with ID: ${deviceSignal.id}`
      );
      return deviceSignal;
    } catch (error) {
      this.logger.error(
        `Error creating device signal: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findAll(
    filters?: DeviceSignalFilters
  ): Promise<{ data: DeviceSignal[]; total: number }> {
    try {
      return await this.deviceSignalRepository.findAll(filters);
    } catch (error) {
      this.logger.error(
        `Error retrieving device signals: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findById(id: number): Promise<DeviceSignal> {
    try {
      const deviceSignal = await this.deviceSignalRepository.findById(id);
      if (!deviceSignal) {
        throw new NotFoundException(`Device signal with ID ${id} not found`);
      }
      return deviceSignal;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving device signal by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findByExternalValueId(externalValueId: string): Promise<DeviceSignal> {
    try {
      const deviceSignal =
        await this.deviceSignalRepository.findByExternalValueId(
          externalValueId
        );
      if (!deviceSignal) {
        throw new NotFoundException(
          `Device signal with externalValueId '${externalValueId}' not found`
        );
      }
      return deviceSignal;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving device signal by externalValueId '${externalValueId}': ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findByDeviceId(deviceId: number): Promise<DeviceSignal[]> {
    try {
      // Check if device exists
      const device = await this.deviceRepository.findById(deviceId);
      if (!device) {
        throw new NotFoundException(`Device with ID ${deviceId} not found`);
      }

      return await this.deviceSignalRepository.findByDeviceId(deviceId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving device signals by device ID ${deviceId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findByDepartmentId(departmentId: number): Promise<DeviceSignal[]> {
    try {
      // Check if department exists
      const department = await this.departmentRepository.findById(departmentId);
      if (!department) {
        throw new NotFoundException(
          `Department with ID ${departmentId} not found`
        );
      }

      return await this.deviceSignalRepository.findByDepartmentId(departmentId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving device signals by department ID ${departmentId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDeviceSignalDto: UpdateDeviceSignalDto
  ): Promise<DeviceSignal> {
    this.logger.log(`Updating device signal with ID: ${id}`);

    try {
      // Check if device signal exists
      await this.findById(id);

      // Check if device exists (if deviceId is being updated)
      if (updateDeviceSignalDto.deviceId) {
        const device = await this.deviceRepository.findById(
          updateDeviceSignalDto.deviceId
        );
        if (!device) {
          throw new NotFoundException(
            `Device with ID ${updateDeviceSignalDto.deviceId} not found`
          );
        }
      }

      // Check if department exists (if departmentId is being updated)
      if (updateDeviceSignalDto.departmentId) {
        const department = await this.departmentRepository.findById(
          updateDeviceSignalDto.departmentId
        );
        if (!department) {
          throw new NotFoundException(
            `Department with ID ${updateDeviceSignalDto.departmentId} not found`
          );
        }
      }

      // Check if new externalValueId conflicts with existing device signal
      if (updateDeviceSignalDto.externalValueId) {
        const existingDeviceSignal =
          await this.deviceSignalRepository.findByExternalValueId(
            updateDeviceSignalDto.externalValueId
          );
        if (existingDeviceSignal && existingDeviceSignal.id !== id) {
          throw new ConflictException(
            `Device signal with externalValueId '${updateDeviceSignalDto.externalValueId}' already exists`
          );
        }
      }

      const updatedDeviceSignal = await this.deviceSignalRepository.update(
        id,
        updateDeviceSignalDto
      );
      if (!updatedDeviceSignal) {
        throw new NotFoundException(`Device signal with ID ${id} not found`);
      }

      this.logger.log(`Device signal updated successfully with ID: ${id}`);
      return updatedDeviceSignal;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Error updating device signal with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Soft deleting device signal with ID: ${id}`);

    try {
      // Check if device signal exists
      await this.findById(id);

      const deleted = await this.deviceSignalRepository.softDelete(id);
      if (!deleted) {
        throw new NotFoundException(`Device signal with ID ${id} not found`);
      }

      this.logger.log(`Device signal soft deleted successfully with ID: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error deleting device signal with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async restore(id: number): Promise<DeviceSignal> {
    this.logger.log(`Restoring device signal with ID: ${id}`);

    try {
      const restored = await this.deviceSignalRepository.restore(id);
      if (!restored) {
        throw new NotFoundException(
          `Device signal with ID ${id} not found or not deleted`
        );
      }

      const deviceSignal = await this.deviceSignalRepository.findById(id);
      if (!deviceSignal) {
        throw new NotFoundException(`Device signal with ID ${id} not found`);
      }

      this.logger.log(`Device signal restored successfully with ID: ${id}`);
      return deviceSignal;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error restoring device signal with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCount(): Promise<number> {
    try {
      return await this.deviceSignalRepository.count();
    } catch (error) {
      this.logger.error(
        `Error getting device signals count: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCountByDeviceId(deviceId: number): Promise<number> {
    try {
      // Check if device exists
      const device = await this.deviceRepository.findById(deviceId);
      if (!device) {
        throw new NotFoundException(`Device with ID ${deviceId} not found`);
      }

      return await this.deviceSignalRepository.countByDeviceId(deviceId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error getting device signals count for device ID ${deviceId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCountByDepartmentId(departmentId: number): Promise<number> {
    try {
      // Check if department exists
      const department = await this.departmentRepository.findById(departmentId);
      if (!department) {
        throw new NotFoundException(
          `Department with ID ${departmentId} not found`
        );
      }

      return await this.deviceSignalRepository.countByDepartmentId(
        departmentId
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error getting device signals count for department ID ${departmentId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}
