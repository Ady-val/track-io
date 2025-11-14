import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import {
  UserRepository,
  CreateUserDto,
  UpdateUserDto,
  UserFilters,
} from '../../domain/repositories/user.repository';
import { ADMIN_USERNAME } from '../../../permissions/constants/permissions.constants';
import { Role } from '../../../permissions/domain/entities/role.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    @InjectRepository(User)
    private readonly userTypeOrmRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user with username: ${createUserDto.username}`);

    const existingUser = await this.userRepository.findByUsername(
      createUserDto.username
    );
    if (existingUser) {
      throw new ConflictException(
        `User with username '${createUserDto.username}' already exists`
      );
    }

    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const userData = {
        ...createUserDto,
        password: hashedPassword,
      };

      const user = await this.userRepository.create(userData);
      this.logger.log(`User created successfully with ID: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Error creating user: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findAll(
    filters?: UserFilters
  ): Promise<{ data: User[]; total: number }> {
    return await this.userRepository.findAll(filters);
  }

  async findById(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving user by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findByUsername(username: string): Promise<User> {
    try {
      const user = await this.userRepository.findByUsername(username);
      if (!user) {
        throw new NotFoundException(
          `User with username '${username}' not found`
        );
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving user by username ${username}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);

    try {
      const user = await this.findById(id);

      if (
        user.username === ADMIN_USERNAME &&
        updateUserDto.username &&
        updateUserDto.username !== ADMIN_USERNAME
      ) {
        throw new ForbiddenException('Cannot change username of ADMIN user');
      }

      if (updateUserDto.username) {
        const existingUser = await this.userRepository.findByUsername(
          updateUserDto.username
        );
        if (existingUser && existingUser.id !== id) {
          throw new ConflictException(
            `User with username '${updateUserDto.username}' already exists`
          );
        }
      }

      const updateData = { ...updateUserDto };
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const updatedUser = await this.userRepository.update(id, updateData);
      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(`User updated successfully with ID: ${id}`);
      return updatedUser;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `Error updating user with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Soft deleting user with ID: ${id}`);

    try {
      const user = await this.findById(id);

      if (user.username === ADMIN_USERNAME) {
        throw new ForbiddenException('Cannot delete ADMIN user');
      }

      const deleted = await this.userRepository.softDelete(id);
      if (!deleted) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(`User soft deleted successfully with ID: ${id}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `Error deleting user with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async restore(id: number): Promise<User> {
    this.logger.log(`Restoring user with ID: ${id}`);

    try {
      const restored = await this.userRepository.restore(id);
      if (!restored) {
        throw new NotFoundException(
          `User with ID ${id} not found or not deleted`
        );
      }

      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(`User restored successfully with ID: ${id}`);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error restoring user with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCount(): Promise<number> {
    return await this.userRepository.count();
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async assignRole(userId: number, roleId: number): Promise<User> {
    this.logger.log(`Assigning role ${roleId} to user ${userId}`);

    try {
      const user = await this.userRepository.findByIdWithRoles(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const role = await this.roleRepository.findOne({
        where: { id: roleId },
        withDeleted: false,
      });
      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      user.roles ??= [];

      if (user.roles.some(r => r.id === roleId)) {
        throw new ConflictException(
          `Role ${roleId} is already assigned to user ${userId}`
        );
      }

      user.roles.push(role);
      await this.userTypeOrmRepository.save(user);

      this.logger.log(`Role ${roleId} assigned to user ${userId} successfully`);
      const updatedUser = await this.userRepository.findByIdWithRoles(userId);
      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      return updatedUser;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Error assigning role ${roleId} to user ${userId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async removeRole(userId: number, roleId: number): Promise<User> {
    this.logger.log(`Removing role ${roleId} from user ${userId}`);

    try {
      const user = await this.userRepository.findByIdWithRoles(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (!user.roles || user.roles.length === 0) {
        throw new NotFoundException(`User ${userId} has no roles`);
      }

      const initialLength = user.roles.length;
      user.roles = user.roles.filter(r => r.id !== roleId);

      if (user.roles.length === initialLength) {
        throw new NotFoundException(
          `Role ${roleId} is not assigned to user ${userId}`
        );
      }

      await this.userTypeOrmRepository.save(user);

      this.logger.log(
        `Role ${roleId} removed from user ${userId} successfully`
      );
      const updatedUser = await this.userRepository.findByIdWithRoles(userId);
      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error removing role ${roleId} from user ${userId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getUserRoles(userId: number): Promise<Role[]> {
    try {
      const user = await this.userRepository.findByIdWithRoles(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      return user.roles ?? [];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving roles for user ${userId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getUserPermissions(
    userId: number
  ): Promise<
    Array<{ id: number; module: string; action: string; description?: string }>
  > {
    try {
      const user = await this.userRepository.findByIdWithRoles(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (!user.roles || user.roles.length === 0) {
        return [];
      }

      const permissionsMap = new Map<
        number,
        { id: number; module: string; action: string; description?: string }
      >();
      for (const role of user.roles) {
        if (role.permissions) {
          for (const permission of role.permissions) {
            const permData: {
              id: number;
              module: string;
              action: string;
              description?: string;
            } = {
              id: permission.id,
              module: permission.module,
              action: permission.action,
            };
            if (permission.description !== undefined) {
              permData.description = permission.description;
            }
            permissionsMap.set(permission.id, permData);
          }
        }
      }

      return Array.from(permissionsMap.values());
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving permissions for user ${userId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  isAdmin(username: string): boolean {
    return username === ADMIN_USERNAME;
  }
}
