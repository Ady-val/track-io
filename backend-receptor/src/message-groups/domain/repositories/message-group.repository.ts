import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { MessageGroup } from '../entities/message-group.entity';

@Injectable()
export class MessageGroupRepository extends Repository<MessageGroup> {
  constructor(dataSource: DataSource) {
    super(MessageGroup, dataSource.createEntityManager());
  }

  async findAllOrderedByOrder(): Promise<MessageGroup[]> {
    return this.find({
      order: {
        order: 'ASC',
        name: 'ASC',
      },
    });
  }

  async findByName(name: string): Promise<MessageGroup | null> {
    return this.findOne({ where: { name } });
  }
}
