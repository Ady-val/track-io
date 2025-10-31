import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Torreta } from '../entities/torreta.entity';

@Injectable()
export class TorretaRepository extends Repository<Torreta> {
  constructor(dataSource: DataSource) {
    super(Torreta, dataSource.createEntityManager());
  }

  async findAllActive(): Promise<Torreta[]> {
    return this.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findByName(name: string): Promise<Torreta | null> {
    return this.findOne({ where: { name } });
  }

  async findAllBannerTorretas(): Promise<Torreta[]> {
    return this.find({ where: { type: 'BANNER' as any, isActive: true } });
  }
}
