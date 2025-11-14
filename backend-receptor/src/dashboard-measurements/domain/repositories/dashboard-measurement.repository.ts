import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DashboardMeasurement } from '../entities/dashboard-measurement.entity';

@Injectable()
export class DashboardMeasurementRepository extends Repository<DashboardMeasurement> {
  constructor(dataSource: DataSource) {
    super(DashboardMeasurement, dataSource.createEntityManager());
  }

  async findByMeasurementId(
    measurementId: number
  ): Promise<DashboardMeasurement | null> {
    return this.findOne({
      where: { measurementId },
      relations: ['measurement'],
    });
  }

  async findAllWithMeasurements(): Promise<DashboardMeasurement[]> {
    return this.find({
      relations: ['measurement', 'group'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByGroupId(groupId: number): Promise<DashboardMeasurement[]> {
    return this.find({
      where: { groupId },
      relations: ['measurement', 'group'],
      order: { createdAt: 'DESC' },
    });
  }
}
