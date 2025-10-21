import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AlertMessage } from '../entities/alert-message.entity';

@Injectable()
export class AlertMessageRepository extends Repository<AlertMessage> {
  constructor(dataSource: DataSource) {
    super(AlertMessage, dataSource.createEntityManager());
  }

  async findByAlertRuleId(alertRuleId: number): Promise<AlertMessage[]> {
    return this.find({
      where: { alertRuleId },
      relations: ['messageGroup', 'alertRule'],
      order: { createdAt: 'DESC' },
    });
  }

  async findWithRelations(id: number): Promise<AlertMessage | null> {
    return this.findOne({
      where: { id },
      relations: ['messageGroup', 'alertRule'],
    });
  }
}
