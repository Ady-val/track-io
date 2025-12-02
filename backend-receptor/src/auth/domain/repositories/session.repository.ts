import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';

export interface CreateSessionDto {
  userId: number;
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class SessionRepository {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>
  ) {}

  async create(createSessionDto: CreateSessionDto): Promise<Session> {
    const session = this.sessionRepository.create(createSessionDto);
    return await this.sessionRepository.save(session);
  }

  async findByToken(token: string): Promise<Session | null> {
    return await this.sessionRepository.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  async findByUserId(userId: number): Promise<Session[]> {
    return await this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteByToken(token: string): Promise<boolean> {
    const result = await this.sessionRepository.delete({ token });
    return !!result.affected && result.affected > 0;
  }

  async deleteByUserId(userId: number): Promise<boolean> {
    const result = await this.sessionRepository.delete({ userId });
    return !!result.affected && result.affected > 0;
  }

  async deleteAllExceptToken(userId: number, token: string): Promise<boolean> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId })
      .andWhere('token != :token', { token })
      .execute();
    return !!result.affected && result.affected > 0;
  }
}
