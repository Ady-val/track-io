import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Department } from '../../domain/entities/department.entity';
import {
  DepartmentRepository,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentFilters,
} from '../../domain/repositories/department.repository';

@Injectable()
export class DepartmentService {
  private readonly logger = new Logger(DepartmentService.name);

  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    this.logger.log(
      `Creating department with name: ${createDepartmentDto.name}`
    );

    const existingDepartment = await this.departmentRepository.findByName(
      createDepartmentDto.name
    );
    if (existingDepartment) {
      throw new ConflictException(
        `Department with name '${createDepartmentDto.name}' already exists`
      );
    }

    try {
      const department =
        await this.departmentRepository.create(createDepartmentDto);
      this.logger.log(
        `Department created successfully with ID: ${department.id}`
      );
      return department;
    } catch (error) {
      this.logger.error(
        `Error creating department: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findAll(
    filters?: DepartmentFilters
  ): Promise<{ data: Department[]; total: number }> {
    try {
      return await this.departmentRepository.findAll(filters);
    } catch (error) {
      this.logger.error(
        `Error retrieving departments: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findById(id: number): Promise<Department> {
    try {
      const department = await this.departmentRepository.findById(id);
      if (!department) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }
      return department;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving department by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto
  ): Promise<Department> {
    this.logger.log(`Updating department with ID: ${id}`);

    try {
      await this.findById(id);

      if (updateDepartmentDto.name) {
        const existingDepartment = await this.departmentRepository.findByName(
          updateDepartmentDto.name
        );
        if (existingDepartment && existingDepartment.id !== id) {
          throw new ConflictException(
            `Department with name '${updateDepartmentDto.name}' already exists`
          );
        }
      }

      const updatedDepartment = await this.departmentRepository.update(
        id,
        updateDepartmentDto
      );
      if (!updatedDepartment) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      this.logger.log(`Department updated successfully with ID: ${id}`);
      return updatedDepartment;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Error updating department with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Soft deleting department with ID: ${id}`);

    try {
      await this.findById(id);

      const deleted = await this.departmentRepository.softDelete(id);
      if (!deleted) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      this.logger.log(`Department soft deleted successfully with ID: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error deleting department with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async restore(id: number): Promise<Department> {
    this.logger.log(`Restoring department with ID: ${id}`);

    try {
      const restored = await this.departmentRepository.restore(id);
      if (!restored) {
        throw new NotFoundException(
          `Department with ID ${id} not found or not deleted`
        );
      }

      const department = await this.departmentRepository.findById(id);
      if (!department) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      this.logger.log(`Department restored successfully with ID: ${id}`);
      return department;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error restoring department with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCount(): Promise<number> {
    try {
      return await this.departmentRepository.count();
    } catch (error) {
      this.logger.error(
        `Error getting departments count: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}
