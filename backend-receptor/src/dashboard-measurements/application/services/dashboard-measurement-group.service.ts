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

    if (
      createDto.chartTimeRange ||
      createDto.chartMinValue !== undefined ||
      createDto.chartMaxValue !== undefined ||
      createDto.chartMeasurementIds
    ) {
      const validTimeRanges = [1, 10, 30, 60, 120, 240, 480];
      if (
        createDto.chartTimeRange &&
        !validTimeRanges.includes(createDto.chartTimeRange)
      ) {
        throw new BadRequestException(
          `chartTimeRange must be one of: ${validTimeRanges.join(', ')}`
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

      if (createDto.chartMeasurementIds) {
        const groupMeasurementIds = validMeasurements.map(
          dm => dm.measurementId
        );
        const invalidIds = createDto.chartMeasurementIds.filter(
          id => !groupMeasurementIds.includes(id)
        );
        if (invalidIds.length > 0) {
          throw new BadRequestException(
            `chartMeasurementIds contains invalid measurement IDs: ${invalidIds.join(', ')}`
          );
        }

        const statusMeasurementIds = validMeasurements
          .filter(
            dm =>
              dm.measurement && dm.measurement.type === MeasurementType.STATUS
          )
          .map(dm => dm.measurementId);
        const statusIdsInChart = createDto.chartMeasurementIds.filter(id =>
          statusMeasurementIds.includes(id)
        );
        if (statusIdsInChart.length > 0) {
          throw new BadRequestException(
            `chartMeasurementIds cannot include status type measurements. Invalid IDs: ${statusIdsInChart.join(', ')}`
          );
        }
      }
    }

    const groupData: Partial<DashboardMeasurementGroup> = {
      name: createDto.name,
      dashboardMeasurements: validMeasurements,
    };

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
      updateDto.chartMeasurementIds !== undefined
    ) {
      const validTimeRanges = [1, 10, 30, 60, 120, 240, 480];
      if (
        updateDto.chartTimeRange !== undefined &&
        !validTimeRanges.includes(updateDto.chartTimeRange)
      ) {
        throw new BadRequestException(
          `chartTimeRange must be one of: ${validTimeRanges.join(', ')}`
        );
      }

      const chartMinValue = updateDto.chartMinValue ?? group.chartMinValue;
      const chartMaxValue = updateDto.chartMaxValue ?? group.chartMaxValue;

      if (
        chartMinValue !== undefined &&
        chartMaxValue !== undefined &&
        chartMinValue >= chartMaxValue
      ) {
        throw new BadRequestException(
          'chartMinValue must be less than chartMaxValue'
        );
      }

      if (updateDto.chartMeasurementIds) {
        const currentMeasurementIds = group.dashboardMeasurements.map(
          dm => dm.measurementId
        );
        const invalidIds = updateDto.chartMeasurementIds.filter(
          measurementId => !currentMeasurementIds.includes(measurementId)
        );
        if (invalidIds.length > 0) {
          throw new BadRequestException(
            `chartMeasurementIds contains invalid measurement IDs: ${invalidIds.join(', ')}`
          );
        }

        const statusMeasurementIds = group.dashboardMeasurements
          .filter(
            dm =>
              dm.measurement && dm.measurement.type === MeasurementType.STATUS
          )
          .map(dm => dm.measurementId);
        const statusIdsInChart = updateDto.chartMeasurementIds.filter(id =>
          statusMeasurementIds.includes(id)
        );
        if (statusIdsInChart.length > 0) {
          throw new BadRequestException(
            `chartMeasurementIds cannot include status type measurements. Invalid IDs: ${statusIdsInChart.join(', ')}`
          );
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

    return this.getGroupById(id);
  }

  async deleteGroup(id: number): Promise<void> {
    await this.getGroupById(id);
    await this.groupRepository.softDelete(id);
  }
}
