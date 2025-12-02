import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Module, Action } from '../../constants/permissions.constants';

export interface CreatePermissionDto {
  module: string;
  action: string;
  description?: string;
}

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const permission = this.permissionRepository.create(createPermissionDto);
    return await this.permissionRepository.save(permission);
  }

  async findAll(): Promise<Permission[]> {
    return await this.permissionRepository.find({
      order: { module: 'ASC', action: 'ASC' },
    });
  }

  async findById(id: number): Promise<Permission | null> {
    return await this.permissionRepository.findOne({
      where: { id },
    });
  }

  async findByModule(module: Module | string): Promise<Permission[]> {
    return await this.permissionRepository.find({
      where: { module },
      order: { action: 'ASC' },
    });
  }

  async findByModuleAndAction(
    module: Module | string,
    action: Action | string
  ): Promise<Permission | null> {
    return await this.permissionRepository.findOne({
      where: { module, action },
    });
  }

  async findByIds(ids: number[]): Promise<Permission[]> {
    if (ids.length === 0) {
      return [];
    }
    return await this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.id IN (:...ids)', { ids })
      .getMany();
  }

  async findByMultipleModulesAndActions(
    permissions: Array<{ module: Module | string; action: Action | string }>
  ): Promise<Permission[]> {
    const queryBuilder =
      this.permissionRepository.createQueryBuilder('permission');

    permissions.forEach((perm, index) => {
      queryBuilder.orWhere(
        '(permission.module = :module' +
          index +
          ' AND permission.action = :action' +
          index +
          ')',
        {
          [`module${index}`]: perm.module,
          [`action${index}`]: perm.action,
        }
      );
    });

    return await queryBuilder.getMany();
  }
}
