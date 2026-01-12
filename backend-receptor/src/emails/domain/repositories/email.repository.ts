import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Email } from '../entities/email.entity';

export interface CreateEmailDto {
  name: string;
  email: string;
}

export interface UpdateEmailDto {
  name?: string;
  email?: string;
}

export interface EmailFilters {
  name?: string;
  email?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

@Injectable()
export class EmailRepository {
  constructor(
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>
  ) {}

  async create(createEmailDto: CreateEmailDto): Promise<Email> {
    const email = this.emailRepository.create(createEmailDto);
    return await this.emailRepository.save(email);
  }

  async findAll(filters: EmailFilters = {}): Promise<{
    data: Email[];
    total: number;
  }> {
    const queryBuilder = this.emailRepository.createQueryBuilder('email');

    if (!filters.includeDeleted) {
      queryBuilder.andWhere('email.deletedAt IS NULL');
    }

    if (filters.name) {
      queryBuilder.andWhere('LOWER(email.name) LIKE LOWER(:name)', {
        name: `%${filters.name}%`,
      });
    }

    if (filters.email) {
      queryBuilder.andWhere('LOWER(email.email) LIKE LOWER(:email)', {
        email: `%${filters.email}%`,
      });
    }

    queryBuilder.orderBy('email.createdAt', 'DESC');

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

  async findById(id: number): Promise<Email | null> {
    return await this.emailRepository.findOne({
      where: { id },
      withDeleted: false,
    });
  }

  async findByEmail(email: string): Promise<Email | null> {
    return await this.emailRepository.findOne({
      where: { email },
      withDeleted: false,
    });
  }

  async findByName(name: string): Promise<Email | null> {
    return await this.emailRepository.findOne({
      where: { name },
      withDeleted: false,
    });
  }

  async update(id: number, updateData: UpdateEmailDto): Promise<Email | null> {
    await this.emailRepository.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.emailRepository.softDelete(id);
    return !!result.affected && result.affected > 0;
  }

  async restore(id: number): Promise<boolean> {
    const result = await this.emailRepository.restore(id);
    return !!result.affected && result.affected > 0;
  }

  async count(): Promise<number> {
    return await this.emailRepository.count({
      where: { deletedAt: IsNull() },
    });
  }
}
