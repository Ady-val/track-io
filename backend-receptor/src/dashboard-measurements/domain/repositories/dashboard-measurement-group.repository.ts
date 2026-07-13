import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DashboardMeasurementGroup } from '../entities/dashboard-measurement-group.entity';

@Injectable()
export class DashboardMeasurementGroupRepository extends Repository<DashboardMeasurementGroup> {
  constructor(dataSource: DataSource) {
    super(DashboardMeasurementGroup, dataSource.createEntityManager());
  }

  private sortDashboardMeasurements(
    group: DashboardMeasurementGroup | null
  ): void {
    if (
      !group?.dashboardMeasurementOrder ||
      group.dashboardMeasurementOrder.length === 0 ||
      !group.dashboardMeasurements?.length
    ) {
      return;
    }

    const orderMap = new Map(
      group.dashboardMeasurementOrder.map((measurementId, index) => [
        measurementId,
        index,
      ])
    );

    group.dashboardMeasurements.sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? Number.POSITIVE_INFINITY;
      const orderB = orderMap.get(b.id) ?? Number.POSITIVE_INFINITY;
      return orderA - orderB;
    });
  }

  async findAllWithMeasurements(): Promise<DashboardMeasurementGroup[]> {
    const groups = await this.find({
      relations: ['dashboardMeasurements', 'dashboardMeasurements.measurement'],
      order: { createdAt: 'DESC' },
    });

    groups.forEach((group) => this.sortDashboardMeasurements(group));

    return groups;
  }

  async findByIdWithMeasurements(
    id: number
  ): Promise<DashboardMeasurementGroup | null> {
    const group = await this.findOne({
      where: { id },
      relations: ['dashboardMeasurements', 'dashboardMeasurements.measurement'],
    });

    this.sortDashboardMeasurements(group);

    return group;
  }
}
