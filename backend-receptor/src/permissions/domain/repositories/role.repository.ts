import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';

export interface CreateRoleDto {
  name: string;
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export interface RoleFilters {
  name?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create(createRoleDto);
    return await this.roleRepository.save(role);
  }

  async findAll(filters: RoleFilters = {}): Promise<{
    data: Role[];
    total: number;
  }> {
    const queryBuilder = this.roleRepository.createQueryBuilder('role');

    if (!filters.includeDeleted) {
      queryBuilder.andWhere('role.deletedAt IS NULL');
    }

    if (filters.name) {
      queryBuilder.andWhere('role.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    queryBuilder.orderBy('role.createdAt', 'DESC');

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

  async findById(id: number, includeRelations = false): Promise<Role | null> {
    const options: any = {
      where: { id },
      withDeleted: false,
    };

    if (includeRelations) {
      options.relations = ['permissions'];
    }

    return await this.roleRepository.findOne(options);
  }

  async findByName(name: string): Promise<Role | null> {
    return await this.roleRepository.findOne({
      where: { name },
      withDeleted: false,
    });
  }

  async update(id: number, updateData: UpdateRoleDto): Promise<Role | null> {
    await this.roleRepository.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.roleRepository.softDelete(id);
    return !!result.affected && result.affected > 0;
  }

  async restore(id: number): Promise<boolean> {
    const result = await this.roleRepository.restore(id);
    return !!result.affected && result.affected > 0;
  }

  async assignPermissions(
    roleId: number,
    permissionIds: number[]
  ): Promise<Role | null> {
    const role = await this.findById(roleId, true);
    if (!role) {
      return null;
    }

    const permissions = await this.roleRepository.manager.find<Permission>(
      Permission,
      {
        where: permissionIds.map((id) => ({ id })),
      }
    );

    role.permissions = permissions;
    return await this.roleRepository.save(role);
  }

  async removePermissions(
    roleId: number,
    permissionIds: number[]
  ): Promise<Role | null> {
    const role = await this.findById(roleId, true);
    if (!role || !role.permissions) {
      return null;
    }

    role.permissions = role.permissions.filter(
      (permission) => !permissionIds.includes(permission.id)
    );
    return await this.roleRepository.save(role);
  }

  async getPermissionsByRoleId(roleId: number): Promise<any[]> {
    const role = await this.findById(roleId, true);
    return role?.permissions || [];
  }
}

