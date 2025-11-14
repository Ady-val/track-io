import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardMeasurementGroupRepository } from '../../domain/repositories/dashboard-measurement-group.repository';
import { DashboardMeasurementRepository } from '../../domain/repositories/dashboard-measurement.repository';
import { DashboardMeasurementGroup } from '../../domain/entities/dashboard-measurement-group.entity';
import {
  CreateDashboardMeasurementGroupDto,
  UpdateDashboardMeasurementGroupDto,
} from '../dtos/dashboard-measurement-group.dto';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';

@Injectable()
export class DashboardMeasurementGroupService {
  constructor(
    private readonly groupRepository: DashboardMeasurementGroupRepository,
    private readonly dashboardMeasurementRepository: DashboardMeasurementRepository,
    private readonly measurementService: MeasurementService,
    private readonly dataSource: DataSource
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
    if (
      !createDto.dashboardMeasurements ||
      createDto.dashboardMeasurements.length === 0
    ) {
      throw new BadRequestException(
        'At least one dashboard measurement is required'
      );
    }

    for (const dm of createDto.dashboardMeasurements) {
      await this.measurementService.getMeasurementById(dm.measurementId);

      if (dm.minValue >= dm.maxValue) {
        throw new BadRequestException(
          `minValue must be less than maxValue for measurement ${dm.measurementId}`
        );
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const group = this.groupRepository.create({
        name: createDto.name,
      });
      const savedGroup = await queryRunner.manager.save(group);

      const dashboardMeasurements = createDto.dashboardMeasurements.map((dm) =>
        this.dashboardMeasurementRepository.create({
          measurementId: dm.measurementId,
          minValue: dm.minValue,
          maxValue: dm.maxValue,
          groupId: savedGroup.id,
        })
      );

      await queryRunner.manager.save(dashboardMeasurements);

      await queryRunner.commitTransaction();

      return this.getGroupById(savedGroup.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateGroup(
    id: number,
    updateDto: UpdateDashboardMeasurementGroupDto
  ): Promise<DashboardMeasurementGroup> {
    const group = await this.getGroupById(id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (updateDto.name) {
        group.name = updateDto.name;
        await queryRunner.manager.save(group);
      }

      if (updateDto.dashboardMeasurements) {
        if (updateDto.dashboardMeasurements.length === 0) {
          throw new BadRequestException(
            'At least one dashboard measurement is required'
          );
        }

        for (const dm of updateDto.dashboardMeasurements) {
          await this.measurementService.getMeasurementById(dm.measurementId);

          if (dm.minValue >= dm.maxValue) {
            throw new BadRequestException(
              `minValue must be less than maxValue for measurement ${dm.measurementId}`
            );
          }
        }

        const existingMeasurements =
          await this.dashboardMeasurementRepository.find({
            where: { groupId: id },
          });
        if (existingMeasurements.length > 0) {
          await queryRunner.manager.remove(existingMeasurements);
        }

        const newDashboardMeasurements = updateDto.dashboardMeasurements.map(
          (dm) =>
            this.dashboardMeasurementRepository.create({
              measurementId: dm.measurementId,
              minValue: dm.minValue,
              maxValue: dm.maxValue,
              groupId: id,
            })
        );

        await queryRunner.manager.save(newDashboardMeasurements);
      }

      await queryRunner.commitTransaction();

      return this.getGroupById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteGroup(id: number): Promise<void> {
    await this.getGroupById(id);
    await this.groupRepository.softDelete(id);
  }
}

