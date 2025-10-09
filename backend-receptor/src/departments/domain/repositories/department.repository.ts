import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Department } from '../entities/department.entity';

export interface CreateDepartmentDto {
  name: string;
}

export interface UpdateDepartmentDto {
  name?: string;
}

export interface DepartmentFilters {
  name?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

@Injectable()
export class DepartmentRepository {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const department = this.departmentRepository.create(createDepartmentDto);
    return await this.departmentRepository.save(department);
  }

  async findAll(filters: DepartmentFilters = {}): Promise<{
    data: Department[];
    total: number;
  }> {
    const queryBuilder =
      this.departmentRepository.createQueryBuilder('department');

    if (!filters.includeDeleted) {
      queryBuilder.andWhere('department.deletedAt IS NULL');
    }

    if (filters.name) {
      queryBuilder.andWhere('department.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    queryBuilder.orderBy('department.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  async findById(id: number): Promise<Department | null> {
    return await this.departmentRepository.findOne({
      where: { id },
      withDeleted: false,
    });
  }

  async findByName(name: string): Promise<Department | null> {
    return await this.departmentRepository.findOne({
      where: { name },
      withDeleted: false,
    });
  }

  async update(
    id: number,
    updateData: UpdateDepartmentDto
  ): Promise<Department | null> {
    await this.departmentRepository.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.departmentRepository.softDelete(id);
    return !!result.affected && result.affected > 0;
  }

  async restore(id: number): Promise<boolean> {
    const result = await this.departmentRepository.restore(id);
    return !!result.affected && result.affected > 0;
  }

  async count(): Promise<number> {
    return await this.departmentRepository.count({
      where: { deletedAt: IsNull() },
    });
  }
}
