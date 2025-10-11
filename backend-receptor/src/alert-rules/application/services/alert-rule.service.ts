import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  AlertRuleRepository,
  AlertRuleFilters,
} from '../../domain/repositories/alert-rule.repository';
import {
  AlertRule,
  AlertRuleMode,
} from '../../domain/entities/alert-rule.entity';
import { CreateAlertRuleDto, UpdateAlertRuleDto } from '../dtos/alert-rule.dto';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';

@Injectable()
export class AlertRuleService {
  constructor(
    private readonly alertRuleRepository: AlertRuleRepository,
    private readonly measurementService: MeasurementService
  ) {}

  async getAllAlertRules(filters?: AlertRuleFilters): Promise<AlertRule[]> {
    return this.alertRuleRepository.findAllWithFilters(filters);
  }

  async getAlertRuleById(id: number): Promise<AlertRule> {
    const alertRule = await this.alertRuleRepository.findOne({
      where: { id },
      relations: ['measurement'],
    });

    if (!alertRule) {
      throw new NotFoundException(`Alert rule with ID ${id} not found`);
    }

    return alertRule;
  }

  async createAlertRule(createDto: CreateAlertRuleDto): Promise<AlertRule> {
    // Verify measurement exists
    await this.measurementService.getMeasurementById(createDto.measurementId);

    // Validate rule configuration
    this.validateRuleConfiguration(createDto);

    const alertRule = this.alertRuleRepository.create(createDto);
    return this.alertRuleRepository.save(alertRule);
  }

  async updateAlertRule(
    id: number,
    updateDto: UpdateAlertRuleDto
  ): Promise<AlertRule> {
    const alertRule = await this.getAlertRuleById(id);

    // Verify measurement exists if changing
    if (updateDto.measurementId) {
      await this.measurementService.getMeasurementById(updateDto.measurementId);
    }

    // Validate rule configuration if mode is changing
    if (
      updateDto.mode ||
      updateDto.operator ||
      updateDto.setpoint ||
      updateDto.minValue ||
      updateDto.maxValue
    ) {
      const mergedRule = { ...alertRule, ...updateDto };
      this.validateRuleConfiguration(mergedRule as UpdateAlertRuleDto);
    }

    Object.assign(alertRule, updateDto);
    return this.alertRuleRepository.save(alertRule);
  }

  async deleteAlertRule(id: number): Promise<void> {
    await this.getAlertRuleById(id);
    await this.alertRuleRepository.softDelete(id);
  }

  async toggleAlertRule(id: number): Promise<AlertRule> {
    const alertRule = await this.getAlertRuleById(id);
    alertRule.isEnabled = !alertRule.isEnabled;
    return this.alertRuleRepository.save(alertRule);
  }

  async getAlertRulesByMeasurementId(
    measurementId: number
  ): Promise<AlertRule[]> {
    return this.alertRuleRepository.findByMeasurementId(measurementId);
  }

  async getEnabledAlertRules(): Promise<AlertRule[]> {
    return this.alertRuleRepository.findEnabledRules();
  }

  private validateRuleConfiguration(
    rule: CreateAlertRuleDto | UpdateAlertRuleDto
  ): void {
    if (rule.mode === AlertRuleMode.SETPOINT) {
      if (!rule.operator || rule.setpoint === undefined) {
        throw new BadRequestException(
          'Setpoint mode requires operator and setpoint value'
        );
      }

      const validOperators = ['>', '>=', '<', '<=', '==', '!='];
      if (!validOperators.includes(rule.operator)) {
        throw new BadRequestException(
          `Invalid operator. Must be one of: ${validOperators.join(', ')}`
        );
      }
    }

    if (rule.mode === AlertRuleMode.WINDOW) {
      if (rule.minValue === undefined || rule.maxValue === undefined) {
        throw new BadRequestException(
          'Window mode requires minValue and maxValue'
        );
      }

      if (rule.minValue >= rule.maxValue) {
        throw new BadRequestException('minValue must be less than maxValue');
      }
    }
  }
}
