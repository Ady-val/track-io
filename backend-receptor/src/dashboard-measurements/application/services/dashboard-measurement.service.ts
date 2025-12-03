import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DashboardMeasurementRepository } from '../../domain/repositories/dashboard-measurement.repository';
import { DashboardMeasurement } from '../../domain/entities/dashboard-measurement.entity';
import {
  CreateDashboardMeasurementDto,
  UpdateDashboardMeasurementDto,
} from '../dtos/dashboard-measurement.dto';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';
import { DashboardMeasurementGroupRepository } from '../../domain/repositories/dashboard-measurement-group.repository';

@Injectable()
export class DashboardMeasurementService {
  constructor(
    private readonly dashboardMeasurementRepository: DashboardMeasurementRepository,
    private readonly measurementService: MeasurementService,
    private readonly groupRepository: DashboardMeasurementGroupRepository
  ) {}

  async getAllDashboardMeasurements(
    groupId?: number
  ): Promise<DashboardMeasurement[]> {
    if (groupId) {
      return this.dashboardMeasurementRepository.findByGroupId(groupId);
    }
    return this.dashboardMeasurementRepository.findAllWithMeasurements();
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

  async updateDashboardMeasurement(
    id: number,
    updateDto: UpdateDashboardMeasurementDto
  ): Promise<DashboardMeasurement> {
    const dashboard = await this.getDashboardMeasurementById(id);

    if (updateDto.measurementId) {
      await this.measurementService.getMeasurementById(updateDto.measurementId);
    }

    if (updateDto.groupId !== undefined && updateDto.groupId !== null) {
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

  async deleteDashboardMeasurement(id: number): Promise<void> {
    await this.getDashboardMeasurementById(id);
    await this.dashboardMeasurementRepository.softDelete(id);
  }
}
