import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsNull } from 'typeorm';
import { DashboardMeasurementRepository } from '../../domain/repositories/dashboard-measurement.repository';
import { DashboardMeasurement } from '../../domain/entities/dashboard-measurement.entity';
import {
  CreateDashboardMeasurementDto,
  UpdateDashboardMeasurementDto,
} from '../dtos/dashboard-measurement.dto';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';
import { DashboardMeasurementGroupRepository } from '../../domain/repositories/dashboard-measurement-group.repository';
import { MeasurementValueRepository } from '../../../measurements/domain/repositories/measurement-value.repository';
import { MeasurementType } from '../../../measurements/domain/entities/measurement.entity';
import {
  CreateMeasurementWithDashboardDto,
  UpdateMeasurementWithDashboardDto,
} from '../dtos/dashboard-measurement.dto';
import {
  CreateMeasurementDto,
  UpdateMeasurementDto,
} from '../../../measurements/application/dtos/measurement.dto';

@Injectable()
export class DashboardMeasurementService {
  constructor(
    private readonly dashboardMeasurementRepository: DashboardMeasurementRepository,
    private readonly measurementService: MeasurementService,
    private readonly groupRepository: DashboardMeasurementGroupRepository,
    private readonly measurementValueRepository: MeasurementValueRepository
  ) {}

  async getAllDashboardMeasurements(groupId?: number): Promise<
    Array<
      DashboardMeasurement & {
        onStartTime?: string;
        latestValue?: { value: string; createdAt: string };
      }
    >
  > {
    let dashboards: DashboardMeasurement[];
    if (groupId) {
      dashboards =
        await this.dashboardMeasurementRepository.findByGroupId(groupId);
    } else {
      dashboards =
        await this.dashboardMeasurementRepository.findAllWithMeasurements();
    }

    const latestValuePromises = dashboards.map(async dm => {
      try {
        const latestValue =
          await this.measurementValueRepository.findLatestValueByMeasurementId(
            dm.measurementId
          );
        return {
          dashboard: dm,
          latestValue: latestValue
            ? {
                value: latestValue.value,
                createdAt: latestValue.createdAt,
              }
            : undefined,
        };
      } catch (_error) {
        return {
          dashboard: dm,
          latestValue: undefined,
        };
      }
    });

    const latestValueResults = await Promise.all(latestValuePromises);
    const latestValueMap = new Map(
      latestValueResults.map(result => [
        result.dashboard.id,
        result.latestValue,
      ])
    );

    const statusMeasurements = dashboards.filter(
      dm => dm.measurement && dm.measurement.type === MeasurementType.STATUS
    );

    if (statusMeasurements.length > 0) {
      const onStartTimePromises = statusMeasurements.map(async dm => {
        try {
          const onStartTime =
            await this.measurementValueRepository.findStatusOnStartTime(
              dm.measurementId
            );
          return {
            dashboard: dm,
            onStartTime: onStartTime ? onStartTime.toISOString() : undefined,
          };
        } catch (_error) {
          return {
            dashboard: dm,
            onStartTime: undefined,
          };
        }
      });

      const onStartTimeResults = await Promise.all(onStartTimePromises);
      const onStartTimeMap = new Map(
        onStartTimeResults.map(result => [
          result.dashboard.id,
          result.onStartTime,
        ])
      );

      return dashboards.map(dm => {
        const latestValue = latestValueMap.get(dm.id);
        const onStartTime = onStartTimeMap.get(dm.id);

        const result: DashboardMeasurement & {
          onStartTime?: string;
          latestValue?: { value: string; createdAt: string };
        } = {
          ...dm,
        };

        if (onStartTime !== undefined) {
          result.onStartTime = onStartTime;
        }

        if (latestValue) {
          result.latestValue = {
            value: latestValue.value,
            createdAt: latestValue.createdAt.toISOString(),
          };
        }

        return result;
      });
    }

    return dashboards.map(dm => {
      const latestValue = latestValueMap.get(dm.id);

      const result: DashboardMeasurement & {
        latestValue?: { value: string; createdAt: string };
      } = {
        ...dm,
      };

      if (latestValue) {
        result.latestValue = {
          value: latestValue.value,
          createdAt: latestValue.createdAt.toISOString(),
        };
      }

      return result;
    });
  }

  async getDashboardMeasurementById(id: number): Promise<DashboardMeasurement> {
    const dashboard = await this.dashboardMeasurementRepository.findOne({
      where: { id },
      relations: ['measurement'],
    });

    if (!dashboard) {
      throw new NotFoundException(
        `Dashboard measurement with ID ${id} not found`
      );
    }

    return dashboard;
  }

  async getDashboardMeasurementByMeasurementId(
    measurementId: number
  ): Promise<DashboardMeasurement | null> {
    return this.dashboardMeasurementRepository.findByMeasurementId(
      measurementId
    );
  }

  async createDashboardMeasurement(
    createDto: CreateDashboardMeasurementDto
  ): Promise<DashboardMeasurement> {
    await this.measurementService.getMeasurementById(createDto.measurementId);

    if (createDto.groupId) {
      await this.groupRepository.findOneOrFail({
        where: { id: createDto.groupId },
      });
    }

    if (createDto.minValue >= createDto.maxValue) {
      throw new BadRequestException('minValue must be less than maxValue');
    }

    const dashboard = this.dashboardMeasurementRepository.create(createDto);
    return this.dashboardMeasurementRepository.save(dashboard);
  }

  /**
   * Create a Measurement and its DashboardMeasurement configuration
   * in a single operation.
   */
  async createMeasurementWithDashboard(
    dto: CreateMeasurementWithDashboardDto
  ): Promise<DashboardMeasurement> {
    if (dto.minValue >= dto.maxValue) {
      throw new BadRequestException('minValue must be less than maxValue');
    }

    // Validate group if provided BEFORE creating measurement
    // This ensures no orphaned measurements are created if group validation fails
    if (dto.groupId !== undefined && dto.groupId !== null) {
      await this.groupRepository.findOneOrFail({
        where: { id: dto.groupId },
      });
    }

    // Create Measurement after all validations pass
    const measurementPayload: CreateMeasurementDto = {
      externalId: dto.externalId,
      name: dto.name,
      type: dto.type,
    };
    const measurement =
      await this.measurementService.createMeasurement(measurementPayload);

    // Create Dashboard Measurement
    const dashboardData: {
      measurementId: number;
      groupId?: number;
      minValue: number;
      maxValue: number;
    } = {
      measurementId: measurement.id,
      minValue: dto.minValue,
      maxValue: dto.maxValue,
    };

    if (dto.groupId !== undefined && dto.groupId !== null) {
      dashboardData.groupId = dto.groupId;
    }

    const dashboard = this.dashboardMeasurementRepository.create(dashboardData);

    return this.dashboardMeasurementRepository.save(dashboard);
  }

  async updateDashboardMeasurement(
    id: number,
    updateDto: UpdateDashboardMeasurementDto
  ): Promise<DashboardMeasurement> {
    const dashboard = await this.getDashboardMeasurementById(id);

    if (updateDto.measurementId) {
      await this.measurementService.getMeasurementById(updateDto.measurementId);
    }

    if (updateDto.groupId !== undefined) {
      await this.groupRepository.findOneOrFail({
        where: { id: updateDto.groupId },
      });
    }

    const newMinValue = updateDto.minValue ?? dashboard.minValue;
    const newMaxValue = updateDto.maxValue ?? dashboard.maxValue;

    if (newMinValue >= newMaxValue) {
      throw new BadRequestException('minValue must be less than maxValue');
    }

    Object.assign(dashboard, updateDto);
    return this.dashboardMeasurementRepository.save(dashboard);
  }

  /**
   * Update both Measurement and DashboardMeasurement in one operation.
   */
  async updateMeasurementWithDashboard(
    id: number,
    dto: UpdateMeasurementWithDashboardDto
  ): Promise<DashboardMeasurement> {
    const dashboard = await this.getDashboardMeasurementById(id);

    // Update Measurement if any field provided
    const hasMeasurementUpdates =
      dto.externalId !== undefined ||
      dto.name !== undefined ||
      dto.type !== undefined;
    if (hasMeasurementUpdates) {
      const measurementPayload: UpdateMeasurementDto = {};
      if (dto.externalId !== undefined)
        measurementPayload.externalId = dto.externalId;
      if (dto.name !== undefined) measurementPayload.name = dto.name;
      if (dto.type !== undefined) measurementPayload.type = dto.type;
      await this.measurementService.updateMeasurement(
        dashboard.measurementId,
        measurementPayload
      );
    }

    // Validate and update DashboardMeasurement fields
    if (dto.groupId !== undefined) {
      if (dto.groupId === null) {
        // Remove group assignment - set to null in database
        // TypeORM requires explicit null for nullable columns
        Object.assign(dashboard, { groupId: null as any });
      } else {
        await this.groupRepository.findOneOrFail({
          where: { id: dto.groupId },
        });
        dashboard.groupId = dto.groupId;
      }
    }

    const newMin = dto.minValue ?? dashboard.minValue;
    const newMax = dto.maxValue ?? dashboard.maxValue;
    if (newMin >= newMax) {
      throw new BadRequestException('minValue must be less than maxValue');
    }
    if (dto.minValue !== undefined) dashboard.minValue = dto.minValue;
    if (dto.maxValue !== undefined) dashboard.maxValue = dto.maxValue;

    return this.dashboardMeasurementRepository.save(dashboard);
  }

  async deleteDashboardMeasurement(id: number): Promise<void> {
    const dashboard = await this.getDashboardMeasurementById(id);
    // Soft delete dashboard-measurement
    await this.dashboardMeasurementRepository.softDelete(id);
    // Soft delete the underlying measurement as requested
    await this.measurementService.deleteMeasurement(dashboard.measurementId);
  }

  async getAvailableDashboardMeasurements(): Promise<DashboardMeasurement[]> {
    // Retornar todos los dashboard measurements no eliminados
    // Ya que ahora se pueden reasignar entre grupos
    return this.dashboardMeasurementRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['measurement'],
      order: { createdAt: 'DESC' },
    });
  }
}
