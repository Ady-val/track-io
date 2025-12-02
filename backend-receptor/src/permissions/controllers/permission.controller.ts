import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PermissionService } from '../application/services/permission.service';
import { PermissionResponseDto } from '../application/dtos/permission.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { Module, Action } from '../constants/permissions.constants';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequirePermission(Module.ROLES_AND_PERMISSIONS, Action.READ)
  async findAll(): Promise<{
    message: string;
    data: PermissionResponseDto[];
  }> {
    const permissions = await this.permissionService.findAll();
    const permissionResponses = plainToInstance(
      PermissionResponseDto,
      permissions,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Permissions retrieved successfully',
      data: permissionResponses,
    };
  }

  @Get('modules')
  @RequirePermission(Module.ROLES_AND_PERMISSIONS, Action.READ)
  getModules(): {
    message: string;
    data: string[];
  } {
    const modules = this.permissionService.getAllModules();

    return {
      message: 'Modules retrieved successfully',
      data: modules,
    };
  }

  @Get('module/:module')
  @RequirePermission(Module.ROLES_AND_PERMISSIONS, Action.READ)
  async findByModule(@Param('module') module: string): Promise<{
    message: string;
    data: PermissionResponseDto[];
  }> {
    const permissions = await this.permissionService.findByModule(module);
    const permissionResponses = plainToInstance(
      PermissionResponseDto,
      permissions,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: `Permissions for module '${module}' retrieved successfully`,
      data: permissionResponses,
    };
  }

  @Post('initialize')
  async initialize(): Promise<{
    message: string;
  }> {
    await this.permissionService.initializeDefaultPermissions();
    return {
      message: 'Default permissions initialized successfully',
    };
  }
}
