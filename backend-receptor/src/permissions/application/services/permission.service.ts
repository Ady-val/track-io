import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Permission } from '../../domain/entities/permission.entity';
import { PermissionRepository } from '../../domain/repositories/permission.repository';
import { CreatePermissionDto } from '../dtos/permission.dto';
import { Module, Action } from '../../constants/permissions.constants';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    private readonly permissionRepository: PermissionRepository
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    this.logger.log(
      `Creating permission: ${createPermissionDto.module}:${createPermissionDto.action}`
    );

    const existingPermission =
      await this.permissionRepository.findByModuleAndAction(
        createPermissionDto.module,
        createPermissionDto.action
      );
    if (existingPermission) {
      throw new NotFoundException(
        `Permission ${createPermissionDto.module}:${createPermissionDto.action} already exists`
      );
    }

    try {
      const permission = await this.permissionRepository.create(
        createPermissionDto
      );
      this.logger.log(`Permission created successfully with ID: ${permission.id}`);
      return permission;
    } catch (error) {
      this.logger.error(
        `Error creating permission: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findAll(): Promise<Permission[]> {
    return await this.permissionRepository.findAll();
  }

  async findById(id: number): Promise<Permission> {
    try {
      const permission = await this.permissionRepository.findById(id);
      if (!permission) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }
      return permission;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving permission by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findByModule(module: Module | string): Promise<Permission[]> {
    return await this.permissionRepository.findByModule(module);
  }

  async findByModuleAndAction(
    module: Module | string,
    action: Action | string
  ): Promise<Permission> {
    const permission = await this.permissionRepository.findByModuleAndAction(
      module,
      action
    );
    if (!permission) {
      throw new NotFoundException(
        `Permission ${module}:${action} not found`
      );
    }
    return permission;
  }

  getAllModules(): string[] {
    return Object.values(Module);
  }

  async initializeDefaultPermissions(): Promise<void> {
    this.logger.log('Initializing default permissions');

    const modules = Object.values(Module);
    const actions = Object.values(Action);

    for (const module of modules) {
      for (const action of actions) {
        try {
          const existingPermission =
            await this.permissionRepository.findByModuleAndAction(
              module,
              action
            );
          if (!existingPermission) {
            await this.permissionRepository.create({
              module,
              action,
              description: `Permission to ${action} ${module}`,
            });
          }
        } catch (error) {
          this.logger.warn(
            `Error creating permission ${module}:${action}: ${(error as Error).message}`
          );
        }
      }
    }

    this.logger.log('Default permissions initialized');
  }
}

