import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface CreateUserDto {
  name: string;
  username: string;
  password: string;
  createdBy?: string | null;
}

export interface UpdateUserDto {
  name?: string;
  username?: string;
  password?: string;
}

export interface UserFilters {
  name?: string;
  username?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(filters: UserFilters = {}): Promise<{
    data: User[];
    total: number;
  }> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (!filters.includeDeleted) {
      queryBuilder.andWhere('user.deletedAt IS NULL');
    }

    if (filters.name) {
      queryBuilder.andWhere('user.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters.username) {
      queryBuilder.andWhere('user.username ILIKE :username', {
        username: `%${filters.username}%`,
      });
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');

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

  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      withDeleted: false,
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username },
      withDeleted: false,
    });
  }

  async update(id: number, updateData: UpdateUserDto): Promise<User | null> {
    await this.userRepository.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.userRepository.softDelete(id);
    return !!result.affected && result.affected > 0;
  }

  async restore(id: number): Promise<boolean> {
    const result = await this.userRepository.restore(id);
    return !!result.affected && result.affected > 0;
  }

  async count(): Promise<number> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.deletedAt IS NULL')
      .getCount();
  }
}
