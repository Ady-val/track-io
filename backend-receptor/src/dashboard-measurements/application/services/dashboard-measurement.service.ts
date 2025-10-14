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

@Injectable()
export class DashboardMeasurementService {
  constructor(
    private readonly dashboardMeasurementRepository: DashboardMeasurementRepository,
    private readonly measurementService: MeasurementService
  ) {}

  async getAllDashboardMeasurements(): Promise<DashboardMeasurement[]> {
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
    // Verificar que el measurement existe
    await this.measurementService.getMeasurementById(createDto.measurementId);

    // Verificar que no exista ya una configuración para este measurement
    const existing =
      await this.dashboardMeasurementRepository.findByMeasurementId(
        createDto.measurementId
      );

    if (existing) {
      throw new BadRequestException(
        `Dashboard configuration already exists for measurement ID ${createDto.measurementId}`
      );
    }

    // Validar que minValue < maxValue
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

    // Si se está actualizando el measurementId, verificar que existe
    if (updateDto.measurementId) {
      await this.measurementService.getMeasurementById(updateDto.measurementId);
    }

    // Validar que minValue < maxValue si se están actualizando
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


