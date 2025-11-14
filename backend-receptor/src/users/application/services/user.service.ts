import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../../domain/entities/user.entity';
import {
  UserRepository,
  CreateUserDto,
  UpdateUserDto,
  UserFilters,
} from '../../domain/repositories/user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user with username: ${createUserDto.username}`);

    // Check if user with same username already exists
    const existingUser = await this.userRepository.findByUsername(
      createUserDto.username
    );
    if (existingUser) {
      throw new ConflictException(
        `User with username '${createUserDto.username}' already exists`
      );
    }

    try {
      // Hash password before saving
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
        throw new NotFoundException(`User with username '${username}' not found`);
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
      // Check if user exists
      await this.findById(id);

      // Check if new username conflicts with existing user
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

      // Hash password if provided
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
        error instanceof ConflictException
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
      // Check if user exists
      await this.findById(id);

      const deleted = await this.userRepository.softDelete(id);
      if (!deleted) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(`User soft deleted successfully with ID: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
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
}

