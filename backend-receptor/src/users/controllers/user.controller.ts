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
import { UserService } from '../application/services/user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '../application/dtos/user.dto';
import { UserFilters } from '../domain/repositories/user.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';
import { RoleResponseDto } from '../../permissions/application/dtos/role.dto';
import { PermissionResponseDto } from '../../permissions/application/dtos/permission.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.USERS, Action.CREATE)
  async create(@Body() createUserDto: CreateUserDto): Promise<{
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.userService.create(createUserDto);
    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'User created successfully',
      data: userResponse,
    };
  }

  @Get()
  @RequirePermission(Module.USERS, Action.READ)
  async findAll(
    @Query('name') name?: string,
    @Query('username') username?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('includeDeleted', new DefaultValuePipe(false))
    includeDeleted?: boolean
  ): Promise<{
    message: string;
    data: UserResponseDto[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: UserFilters = {};
    if (name) filters.name = name;
    if (username) filters.username = username;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (includeDeleted) filters.includeDeleted = includeDeleted;

    const { data, total } = await this.userService.findAll(filters);
    const userResponses = plainToInstance(UserResponseDto, data, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Users retrieved successfully',
      data: userResponses,
      total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total,
      },
    };
  }

  @Get('count')
  @RequirePermission(Module.USERS, Action.READ)
  async getCount(): Promise<{
    message: string;
    count: number;
  }> {
    const count = await this.userService.getCount();

    return {
      message: 'Users count retrieved successfully',
      count,
    };
  }

  @Get(':id')
  @RequirePermission(Module.USERS, Action.READ)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.userService.findById(id);
    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'User retrieved successfully',
      data: userResponse,
    };
  }

  @Patch(':id')
  @RequirePermission(Module.USERS, Action.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<{
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.userService.update(id, updateUserDto);
    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'User updated successfully',
      data: userResponse,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.USERS, Action.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.userService.remove(id);

    return {
      message: 'User deleted successfully',
    };
  }

  @Post(':id/roles')
  @RequirePermission(Module.USERS, Action.UPDATE)
  async assignRole(
    @Param('id', ParseIntPipe) userId: number,
    @Body() body: { roleId: number }
  ): Promise<{
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.userService.assignRole(userId, body.roleId);
    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Role assigned to user successfully',
      data: userResponse,
    };
  }

  @Delete(':id/roles/:roleId')
  @RequirePermission(Module.USERS, Action.UPDATE)
  async removeRole(
    @Param('id', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number
  ): Promise<{
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.userService.removeRole(userId, roleId);
    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Role removed from user successfully',
      data: userResponse,
    };
  }

  @Get(':id/roles')
  @RequirePermission(Module.USERS, Action.READ)
  async getUserRoles(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: RoleResponseDto[];
  }> {
    const roles = await this.userService.getUserRoles(id);
    const roleResponses = plainToInstance(RoleResponseDto, roles, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'User roles retrieved successfully',
      data: roleResponses,
    };
  }

  @Get(':id/permissions')
  @RequirePermission(Module.USERS, Action.READ)
  async getUserPermissions(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: PermissionResponseDto[];
  }> {
    const permissions = await this.userService.getUserPermissions(id);
    const permissionResponses = plainToInstance(
      PermissionResponseDto,
      permissions,
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );

    return {
      message: 'User permissions retrieved successfully',
      data: permissionResponses,
    };
  }

  @Patch(':id/restore')
  @RequirePermission(Module.USERS, Action.UPDATE)
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.userService.restore(id);
    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'User restored successfully',
      data: userResponse,
    };
  }
}
