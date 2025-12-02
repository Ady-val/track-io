import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DashboardMeasurementGroup } from '../entities/dashboard-measurement-group.entity';

@Injectable()
export class DashboardMeasurementGroupRepository extends Repository<DashboardMeasurementGroup> {
  constructor(dataSource: DataSource) {
    super(DashboardMeasurementGroup, dataSource.createEntityManager());
  }

  async findAllWithMeasurements(): Promise<DashboardMeasurementGroup[]> {
    return this.find({
      relations: ['dashboardMeasurements', 'dashboardMeasurements.measurement'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdWithMeasurements(
    id: number
  ): Promise<DashboardMeasurementGroup | null> {
    return this.findOne({
      where: { id },
      relations: ['dashboardMeasurements', 'dashboardMeasurements.measurement'],
    });
  }
}
