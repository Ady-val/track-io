import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { RoleService } from '../application/services/role.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  AssignPermissionsDto,
  PermissionResponseDto,
} from '../application/dtos/role.dto';
import { RoleFilters } from '../domain/repositories/role.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { Module, Action } from '../constants/permissions.constants';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.ROLES, Action.CREATE)
  async create(@Body() createRoleDto: CreateRoleDto): Promise<{
    message: string;
    data: RoleResponseDto;
  }> {
    const role = await this.roleService.create(createRoleDto);
    const roleResponse = plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Role created successfully',
      data: roleResponse,
    };
  }

  @Get()
  @RequirePermission(Module.ROLES, Action.READ)
  async findAll(
    @Query('name') name?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('includeDeleted', new DefaultValuePipe(false))
    includeDeleted?: boolean
  ): Promise<{
    message: string;
    data: RoleResponseDto[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: RoleFilters = {};
    if (name) filters.name = name;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (includeDeleted) filters.includeDeleted = includeDeleted;

    const { data, total } = await this.roleService.findAll(filters);
    const roleResponses = plainToInstance(RoleResponseDto, data, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Roles retrieved successfully',
      data: roleResponses,
      total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total,
      },
    };
  }

  @Get(':id')
  @RequirePermission(Module.ROLES, Action.READ)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: RoleResponseDto;
  }> {
    const role = await this.roleService.findById(id);
    const roleResponse = plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Role retrieved successfully',
      data: roleResponse,
    };
  }

  @Patch(':id')
  @RequirePermission(Module.ROLES, Action.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto
  ): Promise<{
    message: string;
    data: RoleResponseDto;
  }> {
    const role = await this.roleService.update(id, updateRoleDto);
    const roleResponse = plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Role updated successfully',
      data: roleResponse,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.ROLES, Action.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.roleService.remove(id);

    return {
      message: 'Role deleted successfully',
    };
  }

  @Patch(':id/restore')
  @RequirePermission(Module.ROLES, Action.UPDATE)
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: RoleResponseDto;
  }> {
    const role = await this.roleService.restore(id);
    const roleResponse = plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Role restored successfully',
      data: roleResponse,
    };
  }

  @Post(':id/permissions')
  @RequirePermission(Module.ROLES, Action.UPDATE)
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto
  ): Promise<{
    message: string;
    data: RoleResponseDto;
  }> {
    const role = await this.roleService.assignPermissions(
      id,
      assignPermissionsDto.permissionIds
    );
    const roleResponse = plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Permissions assigned to role successfully',
      data: roleResponse,
    };
  }

  @Delete(':id/permissions')
  @RequirePermission(Module.ROLES, Action.UPDATE)
  async removePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto
  ): Promise<{
    message: string;
    data: RoleResponseDto;
  }> {
    const role = await this.roleService.removePermissions(
      id,
      assignPermissionsDto.permissionIds
    );
    const roleResponse = plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Permissions removed from role successfully',
      data: roleResponse,
    };
  }

  @Get(':id/permissions')
  @RequirePermission(Module.ROLES, Action.READ)
  async getPermissions(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: PermissionResponseDto[];
  }> {
    const permissions = await this.roleService.getPermissionsByRoleId(id);
    const permissionResponses = plainToInstance(
      PermissionResponseDto,
      permissions,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'Role permissions retrieved successfully',
      data: permissionResponses,
    };
  }
}

