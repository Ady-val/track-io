import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TorretaColor } from '../entities/torreta-color.entity';

@Injectable()
export class TorretaColorRepository extends Repository<TorretaColor> {
  constructor(dataSource: DataSource) {
    super(TorretaColor, dataSource.createEntityManager());
  }

  async findAllOrderedByOrder(): Promise<TorretaColor[]> {
    return this.find({
      order: {
        order: 'ASC',
        name: 'ASC',
      },
    });
  }

  async findByName(name: string): Promise<TorretaColor | null> {
    return this.findOne({ where: { name } });
  }
}
