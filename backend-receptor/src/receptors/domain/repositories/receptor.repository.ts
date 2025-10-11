import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Receptor } from '../entities/receptor.entity';

@Injectable()
export class ReceptorRepository extends Repository<Receptor> {
  constructor(dataSource: DataSource) {
    super(Receptor, dataSource.createEntityManager());
  }

  async findAllActive(): Promise<Receptor[]> {
    return this.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findByExternalId(externalId: string): Promise<Receptor | null> {
    return this.findOne({ where: { externalId } });
  }
}
