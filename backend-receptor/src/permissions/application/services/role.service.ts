import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Role } from '../../domain/entities/role.entity';
import {
  RoleRepository,
  CreateRoleDto,
  UpdateRoleDto,
  RoleFilters,
} from '../../domain/repositories/role.repository';
import { PermissionRepository } from '../../domain/repositories/permission.repository';
import { Permission } from '../../domain/entities/permission.entity';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    this.logger.log(`Creating role with name: ${createRoleDto.name}`);

    const existingRole = await this.roleRepository.findByName(
      createRoleDto.name
    );
    if (existingRole) {
      throw new ConflictException(
        `Role with name '${createRoleDto.name}' already exists`
      );
    }

    try {
      const role = await this.roleRepository.create(createRoleDto);
      this.logger.log(`Role created successfully with ID: ${role.id}`);
      return role;
    } catch (error) {
      this.logger.error(
        `Error creating role: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findAll(
    filters?: RoleFilters
  ): Promise<{ data: Role[]; total: number }> {
    return await this.roleRepository.findAll(filters);
  }

  async findById(id: number): Promise<Role> {
    try {
      const role = await this.roleRepository.findById(id, true);
      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
      return role;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving role by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    this.logger.log(`Updating role with ID: ${id}`);

    try {
      await this.findById(id);

      if (updateRoleDto.name) {
        const existingRole = await this.roleRepository.findByName(
          updateRoleDto.name
        );
        if (existingRole && existingRole.id !== id) {
          throw new ConflictException(
            `Role with name '${updateRoleDto.name}' already exists`
          );
        }
      }

      const updatedRole = await this.roleRepository.update(id, updateRoleDto);
      if (!updatedRole) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      this.logger.log(`Role updated successfully with ID: ${id}`);
      return updatedRole;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Error updating role with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Soft deleting role with ID: ${id}`);

    try {
      await this.findById(id);

      const deleted = await this.roleRepository.softDelete(id);
      if (!deleted) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      this.logger.log(`Role soft deleted successfully with ID: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error deleting role with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async restore(id: number): Promise<Role> {
    this.logger.log(`Restoring role with ID: ${id}`);

    try {
      const restored = await this.roleRepository.restore(id);
      if (!restored) {
        throw new NotFoundException(
          `Role with ID ${id} not found or not deleted`
        );
      }

      const role = await this.roleRepository.findById(id);
      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      this.logger.log(`Role restored successfully with ID: ${id}`);
      return role;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error restoring role with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async assignPermissions(
    roleId: number,
    permissionIds: number[]
  ): Promise<Role> {
    this.logger.log(
      `Assigning ${permissionIds.length} permissions to role ${roleId}`
    );

    try {
      await this.findById(roleId);

      const permissions =
        await this.permissionRepository.findByIds(permissionIds);
      if (permissions.length !== permissionIds.length) {
        throw new NotFoundException('One or more permissions not found');
      }

      const role = await this.roleRepository.assignPermissions(
        roleId,
        permissionIds
      );
      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      this.logger.log(`Permissions assigned successfully to role ${roleId}`);
      return role;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error assigning permissions to role ${roleId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async removePermissions(
    roleId: number,
    permissionIds: number[]
  ): Promise<Role> {
    this.logger.log(
      `Removing ${permissionIds.length} permissions from role ${roleId}`
    );

    try {
      await this.findById(roleId);

      const role = await this.roleRepository.removePermissions(
        roleId,
        permissionIds
      );
      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      this.logger.log(`Permissions removed successfully from role ${roleId}`);
      return role;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error removing permissions from role ${roleId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getPermissionsByRoleId(roleId: number): Promise<Permission[]> {
    try {
      await this.findById(roleId);
      return await this.roleRepository.getPermissionsByRoleId(roleId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving permissions for role ${roleId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}
