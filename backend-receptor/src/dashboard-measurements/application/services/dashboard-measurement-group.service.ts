import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DashboardMeasurementGroupRepository } from '../../domain/repositories/dashboard-measurement-group.repository';
import { DashboardMeasurementRepository } from '../../domain/repositories/dashboard-measurement.repository';
import { DashboardMeasurementGroup } from '../../domain/entities/dashboard-measurement-group.entity';
import {
  CreateDashboardMeasurementGroupDto,
  UpdateDashboardMeasurementGroupDto,
} from '../dtos/dashboard-measurement-group.dto';
import { MeasurementType } from '../../../measurements/domain/entities/measurement.entity';

@Injectable()
export class DashboardMeasurementGroupService {
  constructor(
    private readonly groupRepository: DashboardMeasurementGroupRepository,
    private readonly dashboardMeasurementRepository: DashboardMeasurementRepository
  ) {}

  async getAllGroups(): Promise<DashboardMeasurementGroup[]> {
    return this.groupRepository.findAllWithMeasurements();
  }

  async getGroupById(id: number): Promise<DashboardMeasurementGroup> {
    const group = await this.groupRepository.findByIdWithMeasurements(id);

    if (!group) {
      throw new NotFoundException(
        `Dashboard measurement group with ID ${id} not found`
      );
    }

    return group;
  }

  async createGroup(
    createDto: CreateDashboardMeasurementGroupDto
  ): Promise<DashboardMeasurementGroup> {
    if (createDto.dashboardMeasurements.length === 0) {
      throw new BadRequestException(
        'At least one dashboard measurement is required'
      );
    }

    const dashboardMeasurementIds = createDto.dashboardMeasurements.map(
      dm => dm.dashboardMeasurementId
    );

    const dashboardMeasurements = await Promise.all(
      dashboardMeasurementIds.map(id =>
        this.dashboardMeasurementRepository.findOne({
          where: { id },
          relations: ['measurement'],
        })
      )
    );

    const notFoundIds = dashboardMeasurements
      .map((dm, index) => (!dm ? dashboardMeasurementIds[index] : null))
      .filter((id): id is number => id !== null);

    if (notFoundIds.length > 0) {
      throw new BadRequestException(
        `Dashboard measurements not found: ${notFoundIds.join(', ')}`
      );
    }

    const validMeasurements = dashboardMeasurements.filter(
      (dm): dm is NonNullable<typeof dm> => dm !== null
    );

    const hasChart1Config =
      createDto.chartTimeRange ||
      createDto.chartMinValue !== undefined ||
      createDto.chartMaxValue !== undefined ||
      createDto.chartMeasurementIds;
    const hasChart2Config =
      createDto.chart2TimeRange ||
      createDto.chart2MinValue !== undefined ||
      createDto.chart2MaxValue !== undefined ||
      createDto.chart2MeasurementIds;

    if (hasChart1Config || hasChart2Config) {
      const validTimeRanges = [1, 10, 30, 60, 120, 240, 480];
      const groupMeasurementIds = validMeasurements.map(
        dm => dm.measurementId
      );
      const statusMeasurementIds = validMeasurements
        .filter(
          dm => dm.measurement && dm.measurement.type === MeasurementType.STATUS
        )
        .map(dm => dm.measurementId);

      if (
        createDto.chartTimeRange &&
        !validTimeRanges.includes(createDto.chartTimeRange)
      ) {
        throw new BadRequestException(
          `chartTimeRange must be one of: ${validTimeRanges.join(', ')}`
        );
      }

      if (
        createDto.chart2TimeRange &&
        !validTimeRanges.includes(createDto.chart2TimeRange)
      ) {
        throw new BadRequestException(
          `chart2TimeRange must be one of: ${validTimeRanges.join(', ')}`
        );
      }

      if (
        createDto.chartMinValue !== undefined &&
        createDto.chartMaxValue !== undefined
      ) {
        if (createDto.chartMinValue >= createDto.chartMaxValue) {
          throw new BadRequestException(
            'chartMinValue must be less than chartMaxValue'
          );
        }
      }

      if (
        createDto.chart2MinValue !== undefined &&
        createDto.chart2MaxValue !== undefined
      ) {
        if (createDto.chart2MinValue >= createDto.chart2MaxValue) {
          throw new BadRequestException(
            'chart2MinValue must be less than chart2MaxValue'
          );
        }
      }

      if (createDto.chartMeasurementIds) {
        const invalidIds = createDto.chartMeasurementIds.filter(
          id => !groupMeasurementIds.includes(id)
        );
        if (invalidIds.length > 0) {
          throw new BadRequestException(
            `chartMeasurementIds contains invalid measurement IDs: ${invalidIds.join(', ')}`
          );
        }

        const statusIdsInChart = createDto.chartMeasurementIds.filter(id =>
          statusMeasurementIds.includes(id)
        );
        if (statusIdsInChart.length > 0) {
          throw new BadRequestException(
            `chartMeasurementIds cannot include status type measurements. Invalid IDs: ${statusIdsInChart.join(', ')}`
          );
        }
      }

      if (createDto.chart2MeasurementIds) {
        const invalidIds = createDto.chart2MeasurementIds.filter(
          id => !groupMeasurementIds.includes(id)
        );
        if (invalidIds.length > 0) {
          throw new BadRequestException(
            `chart2MeasurementIds contains invalid measurement IDs: ${invalidIds.join(', ')}`
          );
        }

        const statusIdsInChart = createDto.chart2MeasurementIds.filter(id =>
          statusMeasurementIds.includes(id)
        );
        if (statusIdsInChart.length > 0) {
          throw new BadRequestException(
            `chart2MeasurementIds cannot include status type measurements. Invalid IDs: ${statusIdsInChart.join(', ')}`
          );
        }
      }
    }

    const groupData: Partial<DashboardMeasurementGroup> = {
      name: createDto.name,
      dashboardMeasurements: validMeasurements,
    };

    groupData.dashboardMeasurementOrder = dashboardMeasurementIds;

    if (createDto.chartTimeRange !== undefined) {
      groupData.chartTimeRange = createDto.chartTimeRange;
    }
    if (createDto.chartMinValue !== undefined) {
      groupData.chartMinValue = createDto.chartMinValue;
    }
    if (createDto.chartMaxValue !== undefined) {
      groupData.chartMaxValue = createDto.chartMaxValue;
    }
    if (createDto.chartMeasurementIds !== undefined) {
      groupData.chartMeasurementIds = createDto.chartMeasurementIds;
    }
    if (createDto.chart2TimeRange !== undefined) {
      groupData.chart2TimeRange = createDto.chart2TimeRange;
    }
    if (createDto.chart2MinValue !== undefined) {
      groupData.chart2MinValue = createDto.chart2MinValue;
    }
    if (createDto.chart2MaxValue !== undefined) {
      groupData.chart2MaxValue = createDto.chart2MaxValue;
    }
    if (createDto.chart2MeasurementIds !== undefined) {
      groupData.chart2MeasurementIds = createDto.chart2MeasurementIds;
    }

    const group = this.groupRepository.create(groupData);
    const savedGroup = await this.groupRepository.save(group);

    // Actualizar el groupId de los measurements después de guardar el grupo
    for (const measurement of validMeasurements) {
      measurement.groupId = savedGroup.id;
      await this.dashboardMeasurementRepository.save(measurement);
    }

    return this.getGroupById(savedGroup.id);
  }

  async updateGroup(
    id: number,
    updateDto: UpdateDashboardMeasurementGroupDto
  ): Promise<DashboardMeasurementGroup> {
    const group = await this.getGroupById(id);

    if (updateDto.name) {
      group.name = updateDto.name;
    }

    if (
      updateDto.chartTimeRange !== undefined ||
      updateDto.chartMinValue !== undefined ||
      updateDto.chartMaxValue !== undefined ||
      updateDto.chartMeasurementIds !== undefined ||
      updateDto.chart2TimeRange !== undefined ||
      updateDto.chart2MinValue !== undefined ||
      updateDto.chart2MaxValue !== undefined ||
      updateDto.chart2MeasurementIds !== undefined
    ) {
      const validTimeRanges = [1, 10, 30, 60, 120, 240, 480];
      if (
        updateDto.chartTimeRange !== undefined &&
        updateDto.chartTimeRange !== null &&
        !validTimeRanges.includes(updateDto.chartTimeRange)
      ) {
        throw new BadRequestException(
          `chartTimeRange must be one of: ${validTimeRanges.join(', ')}`
        );
      }

      if (
        updateDto.chart2TimeRange !== undefined &&
        updateDto.chart2TimeRange !== null &&
        !validTimeRanges.includes(updateDto.chart2TimeRange)
      ) {
        throw new BadRequestException(
          `chart2TimeRange must be one of: ${validTimeRanges.join(', ')}`
        );
      }

      const chartMinValue =
        updateDto.chartMinValue !== undefined
          ? updateDto.chartMinValue
          : group.chartMinValue;
      const chartMaxValue =
        updateDto.chartMaxValue !== undefined
          ? updateDto.chartMaxValue
          : group.chartMaxValue;

      if (
        chartMinValue !== undefined &&
        chartMinValue !== null &&
        chartMaxValue !== undefined &&
        chartMaxValue !== null &&
        chartMinValue >= chartMaxValue
      ) {
        throw new BadRequestException(
          'chartMinValue must be less than chartMaxValue'
        );
      }

      const chart2MinValue =
        updateDto.chart2MinValue !== undefined
          ? updateDto.chart2MinValue
          : group.chart2MinValue;
      const chart2MaxValue =
        updateDto.chart2MaxValue !== undefined
          ? updateDto.chart2MaxValue
          : group.chart2MaxValue;

      if (
        chart2MinValue !== undefined &&
        chart2MinValue !== null &&
        chart2MaxValue !== undefined &&
        chart2MaxValue !== null &&
        chart2MinValue >= chart2MaxValue
      ) {
        throw new BadRequestException(
          'chart2MinValue must be less than chart2MaxValue'
        );
      }

      if (
        updateDto.chartMeasurementIds !== undefined ||
        updateDto.chart2MeasurementIds !== undefined
      ) {
        const targetDashboardMeasurementIds = updateDto.dashboardMeasurements
          ? updateDto.dashboardMeasurements.map(dm => dm.dashboardMeasurementId)
          : group.dashboardMeasurements.map(dm => dm.id);

        const targetDashboardMeasurements = updateDto.dashboardMeasurements
          ? await Promise.all(
              targetDashboardMeasurementIds.map(dashboardMeasurementId =>
                this.dashboardMeasurementRepository.findOne({
                  where: { id: dashboardMeasurementId },
                  relations: ['measurement'],
                })
              )
            )
          : group.dashboardMeasurements;

        const missingTargetIds = targetDashboardMeasurements
          .map((dm, index) =>
            !dm ? targetDashboardMeasurementIds[index] : null
          )
          .filter((id): id is number => id !== null);

        if (missingTargetIds.length > 0) {
          throw new BadRequestException(
            `Dashboard measurements not found: ${missingTargetIds.join(', ')}`
          );
        }

        const validTargets = targetDashboardMeasurements.filter(
          (dm): dm is NonNullable<typeof dm> => dm !== null
        );

        const allowedMeasurementIds = validTargets.map(dm => dm.measurementId);
        const statusMeasurementIds = validTargets
          .filter(
            dm =>
              dm.measurement && dm.measurement.type === MeasurementType.STATUS
          )
          .map(dm => dm.measurementId);

        if (updateDto.chartMeasurementIds !== undefined) {
          const invalidIds = updateDto.chartMeasurementIds.filter(
            measurementId => !allowedMeasurementIds.includes(measurementId)
          );
          if (invalidIds.length > 0) {
            throw new BadRequestException(
              `chartMeasurementIds contains invalid measurement IDs: ${invalidIds.join(', ')}`
            );
          }

          const statusIdsInChart = updateDto.chartMeasurementIds.filter(id =>
            statusMeasurementIds.includes(id)
          );
          if (statusIdsInChart.length > 0) {
            throw new BadRequestException(
              `chartMeasurementIds cannot include status type measurements. Invalid IDs: ${statusIdsInChart.join(', ')}`
            );
          }
        }

        if (updateDto.chart2MeasurementIds !== undefined) {
          const invalidIds = updateDto.chart2MeasurementIds.filter(
            measurementId => !allowedMeasurementIds.includes(measurementId)
          );
          if (invalidIds.length > 0) {
            throw new BadRequestException(
              `chart2MeasurementIds contains invalid measurement IDs: ${invalidIds.join(', ')}`
            );
          }

          const statusIdsInChart = updateDto.chart2MeasurementIds.filter(id =>
            statusMeasurementIds.includes(id)
          );
          if (statusIdsInChart.length > 0) {
            throw new BadRequestException(
              `chart2MeasurementIds cannot include status type measurements. Invalid IDs: ${statusIdsInChart.join(', ')}`
            );
          }
        }
      }

      if (updateDto.chartTimeRange !== undefined) {
        group.chartTimeRange = updateDto.chartTimeRange;
      }
      if (updateDto.chartMinValue !== undefined) {
        group.chartMinValue = updateDto.chartMinValue;
      }
      if (updateDto.chartMaxValue !== undefined) {
        group.chartMaxValue = updateDto.chartMaxValue;
      }
      if (updateDto.chartMeasurementIds !== undefined) {
        group.chartMeasurementIds = updateDto.chartMeasurementIds;
      }
      if (updateDto.chart2TimeRange !== undefined) {
        group.chart2TimeRange = updateDto.chart2TimeRange;
      }
      if (updateDto.chart2MinValue !== undefined) {
        group.chart2MinValue = updateDto.chart2MinValue;
      }
      if (updateDto.chart2MaxValue !== undefined) {
        group.chart2MaxValue = updateDto.chart2MaxValue;
      }
      if (updateDto.chart2MeasurementIds !== undefined) {
        group.chart2MeasurementIds = updateDto.chart2MeasurementIds;
      }
    }

    if (updateDto.dashboardMeasurements) {
      if (updateDto.dashboardMeasurements.length === 0) {
        throw new BadRequestException(
          'At least one dashboard measurement is required'
        );
      }

      const dashboardMeasurementIds = updateDto.dashboardMeasurements.map(
        dm => dm.dashboardMeasurementId
      );

      const dashboardMeasurements = await Promise.all(
        dashboardMeasurementIds.map(dashboardMeasurementId =>
          this.dashboardMeasurementRepository.findOne({
            where: { id: dashboardMeasurementId },
            relations: ['measurement'],
          })
        )
      );

      const notFoundIds = dashboardMeasurements
        .map((dm, index) => (!dm ? dashboardMeasurementIds[index] : null))
        .filter((id): id is number => id !== null);

      if (notFoundIds.length > 0) {
        throw new BadRequestException(
          `Dashboard measurements not found: ${notFoundIds.join(', ')}`
        );
      }

      const validMeasurements = dashboardMeasurements.filter(
        (dm): dm is NonNullable<typeof dm> => dm !== null
      );

      group.dashboardMeasurementOrder = dashboardMeasurementIds;

      // Desasignar measurements actuales del grupo usando query builder
      await this.dashboardMeasurementRepository
        .createQueryBuilder()
        .update()
        .set({ groupId: () => 'NULL' })
        .where('group_id = :groupId', { groupId: id })
        .execute();

      // Asignar nuevos measurements al grupo
      for (const measurement of validMeasurements) {
        measurement.groupId = id;
        await this.dashboardMeasurementRepository.save(measurement);
      }

      group.dashboardMeasurements = validMeasurements;
    }

    await this.groupRepository.save(group);

    const refreshedGroup = await this.groupRepository.findByIdWithMeasurements(
      id
    );
    if (!refreshedGroup) {
      throw new NotFoundException(
        `Dashboard measurement group with ID ${id} not found`
      );
    }

    return refreshedGroup;
  }

  async deleteGroup(id: number): Promise<void> {
    await this.getGroupById(id);
    await this.groupRepository.softDelete(id);
  }
}
