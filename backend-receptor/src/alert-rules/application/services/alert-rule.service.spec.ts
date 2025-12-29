import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AlertRuleService } from './alert-rule.service';
import { AlertRuleRepository } from '../../domain/repositories/alert-rule.repository';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';
import {
  createMockAlertRule,
  createMockMeasurement,
} from '../../../test-helpers';
import { AlertRuleMode } from '../../domain/entities/alert-rule.entity';

describe('AlertRuleService', () => {
  let service: AlertRuleService;
  let alertRuleRepository: jest.Mocked<AlertRuleRepository>;
  let measurementService: jest.Mocked<MeasurementService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertRuleService,
        {
          provide: AlertRuleRepository,
          useValue: {
            findAllWithFilters: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            findByMeasurementId: jest.fn(),
            findEnabledRules: jest.fn(),
          },
        },
        {
          provide: MeasurementService,
          useValue: {
            getMeasurementById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertRuleService>(AlertRuleService);
    alertRuleRepository = module.get(AlertRuleRepository);
    measurementService = module.get(MeasurementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAlertRules', () => {
    it('should return list of AlertRules when no filters', async () => {
      // Arrange
      const mockRules = [
        createMockAlertRule({ id: 1 }),
        createMockAlertRule({ id: 2 }),
      ];
      alertRuleRepository.findAllWithFilters.mockResolvedValue(mockRules);

      // Act
      const result = await service.getAllAlertRules();

      // Assert
      expect(result).toEqual(mockRules);
      expect(alertRuleRepository.findAllWithFilters).toHaveBeenCalledWith(
        undefined
      );
    });

    it('should apply measurementId filter when provided', async () => {
      // Arrange
      const filters = { measurementId: 1 };
      const mockRules = [createMockAlertRule({ measurementId: 1 })];
      alertRuleRepository.findAllWithFilters.mockResolvedValue(mockRules);

      // Act
      const result = await service.getAllAlertRules(filters);

      // Assert
      expect(result).toEqual(mockRules);
      expect(alertRuleRepository.findAllWithFilters).toHaveBeenCalledWith(
        filters
      );
    });

    it('should apply isEnabled filter when provided', async () => {
      // Arrange
      const filters = { isEnabled: true };
      const mockRules = [createMockAlertRule({ isEnabled: true })];
      alertRuleRepository.findAllWithFilters.mockResolvedValue(mockRules);

      // Act
      const result = await service.getAllAlertRules(filters);

      // Assert
      expect(result).toEqual(mockRules);
      expect(alertRuleRepository.findAllWithFilters).toHaveBeenCalledWith(
        filters
      );
    });

    it('should apply mode filter when provided', async () => {
      // Arrange
      const filters = { mode: AlertRuleMode.SETPOINT };
      const mockRules = [createMockAlertRule({ mode: AlertRuleMode.SETPOINT })];
      alertRuleRepository.findAllWithFilters.mockResolvedValue(mockRules);

      // Act
      const result = await service.getAllAlertRules(filters);

      // Assert
      expect(result).toEqual(mockRules);
      expect(alertRuleRepository.findAllWithFilters).toHaveBeenCalledWith(
        filters
      );
    });

    it('should apply multiple filters simultaneously', async () => {
      // Arrange
      const filters = {
        measurementId: 1,
        isEnabled: true,
        mode: AlertRuleMode.SETPOINT,
      };
      const mockRules = [createMockAlertRule()];
      alertRuleRepository.findAllWithFilters.mockResolvedValue(mockRules);

      // Act
      const result = await service.getAllAlertRules(filters);

      // Assert
      expect(result).toEqual(mockRules);
      expect(alertRuleRepository.findAllWithFilters).toHaveBeenCalledWith(
        filters
      );
    });
  });

  describe('getAlertRuleById', () => {
    it('should return AlertRule when found', async () => {
      // Arrange
      const id = 1;
      const mockRule = createMockAlertRule({ id });
      alertRuleRepository.findOne.mockResolvedValue(mockRule);

      // Act
      const result = await service.getAlertRuleById(id);

      // Assert
      expect(result).toEqual(mockRule);
      expect(alertRuleRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['measurement'],
      });
    });

    it('should throw NotFoundException when AlertRule not found', async () => {
      // Arrange
      const id = 999;
      alertRuleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getAlertRuleById(id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getAlertRuleById(id)).rejects.toThrow(
        `Alert rule with ID ${id} not found`
      );
    });
  });

  describe('createAlertRule', () => {
    it('should create AlertRule in SETPOINT mode when valid data', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });
      const mockRule = createMockAlertRule({
        ...createDto,
        isEnabled: true,
      });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);
      alertRuleRepository.create.mockReturnValue(mockRule);
      alertRuleRepository.save.mockResolvedValue(mockRule);

      // Act
      const result = await service.createAlertRule(createDto);

      // Assert
      expect(result).toEqual(mockRule);
      expect(measurementService.getMeasurementById).toHaveBeenCalledWith(1);
      expect(alertRuleRepository.create).toHaveBeenCalledWith(createDto);
      expect(alertRuleRepository.save).toHaveBeenCalledWith(mockRule);
    });

    it('should create AlertRule in WINDOW mode when valid data', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.WINDOW,
        minValue: 20,
        maxValue: 30,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });
      const mockRule = createMockAlertRule({
        ...createDto,
        isEnabled: true,
      });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);
      alertRuleRepository.create.mockReturnValue(mockRule);
      alertRuleRepository.save.mockResolvedValue(mockRule);

      // Act
      const result = await service.createAlertRule(createDto);

      // Assert
      expect(result).toEqual(mockRule);
      expect(alertRuleRepository.create).toHaveBeenCalledWith(createDto);
      expect(alertRuleRepository.save).toHaveBeenCalledWith(mockRule);
    });

    it('should create AlertRule with isEnabled default true', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });
      const mockRule = createMockAlertRule({
        ...createDto,
        isEnabled: true,
      });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);
      alertRuleRepository.create.mockReturnValue(mockRule);
      alertRuleRepository.save.mockResolvedValue(mockRule);

      // Act
      await service.createAlertRule(createDto);

      // Assert
      expect(alertRuleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isEnabled: true,
        })
      );
    });

    it('should create AlertRule with isEnabled false when specified', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
        isEnabled: false,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });
      const mockRule = createMockAlertRule({
        ...createDto,
        isEnabled: false,
      });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);
      alertRuleRepository.create.mockReturnValue(mockRule);
      alertRuleRepository.save.mockResolvedValue(mockRule);

      // Act
      await service.createAlertRule(createDto);

      // Assert
      expect(alertRuleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isEnabled: false,
        })
      );
    });

    it('should throw BadRequestException when SETPOINT mode missing operator', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        setpoint: 25,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);

      // Act & Assert
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        'Setpoint mode requires operator and setpoint value'
      );
    });

    it('should throw BadRequestException when SETPOINT mode missing setpoint', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);

      // Act & Assert
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        'Setpoint mode requires operator and setpoint value'
      );
    });

    it('should throw BadRequestException when operator is invalid', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: 'invalid',
        setpoint: 25,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);

      // Act & Assert
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        'Invalid operator'
      );
    });

    it('should accept valid operators', async () => {
      // Arrange
      const validOperators = ['>', '>=', '<', '<=', '==', '!='];
      const mockMeasurement = createMockMeasurement({ id: 1 });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);

      for (const operator of validOperators) {
        const createDto = {
          name: 'Test Rule',
          measurementId: 1,
          mode: AlertRuleMode.SETPOINT,
          operator,
          setpoint: 25,
        };
        const mockRule = createMockAlertRule({
          ...createDto,
          isEnabled: true,
        });

        alertRuleRepository.create.mockReturnValue(mockRule);
        alertRuleRepository.save.mockResolvedValue(mockRule);

        // Act
        await service.createAlertRule(createDto);

        // Assert
        expect(alertRuleRepository.save).toHaveBeenCalled();
      }
    });

    it('should throw BadRequestException when WINDOW mode missing minValue', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.WINDOW,
        maxValue: 30,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);

      // Act & Assert
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        'Window mode requires minValue and maxValue'
      );
    });

    it('should throw BadRequestException when WINDOW mode missing maxValue', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.WINDOW,
        minValue: 20,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);

      // Act & Assert
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        'Window mode requires minValue and maxValue'
      );
    });

    it('should throw BadRequestException when minValue >= maxValue', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.WINDOW,
        minValue: 30,
        maxValue: 20,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);

      // Act & Assert
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        'minValue must be less than maxValue'
      );
    });

    it('should throw BadRequestException when minValue equals maxValue', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.WINDOW,
        minValue: 25,
        maxValue: 25,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);

      // Act & Assert
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createAlertRule(createDto as any)).rejects.toThrow(
        'minValue must be less than maxValue'
      );
    });

    it('should throw NotFoundException when Measurement does not exist', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 999,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      };

      measurementService.getMeasurementById.mockRejectedValue(
        new NotFoundException('Measurement not found')
      );

      // Act & Assert
      await expect(service.createAlertRule(createDto)).rejects.toThrow(
        NotFoundException
      );
      expect(alertRuleRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateAlertRule', () => {
    it('should update name correctly', async () => {
      // Arrange
      const id = 1;
      const updateDto = { name: 'Updated Name' };
      const existingRule = createMockAlertRule({ id });
      const updatedRule = createMockAlertRule({
        ...existingRule,
        ...updateDto,
      });

      alertRuleRepository.findOne.mockResolvedValue(existingRule);
      alertRuleRepository.save.mockResolvedValue(updatedRule);

      // Act
      const result = await service.updateAlertRule(id, updateDto);

      // Assert
      expect(result.name).toBe('Updated Name');
      expect(alertRuleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto)
      );
    });

    it('should update measurementId correctly', async () => {
      // Arrange
      const id = 1;
      const updateDto = { measurementId: 2 };
      const existingRule = createMockAlertRule({ id });
      const updatedRule = createMockAlertRule({
        ...existingRule,
        ...updateDto,
      });
      const mockMeasurement = createMockMeasurement({ id: 2 });

      alertRuleRepository.findOne.mockResolvedValue(existingRule);
      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);
      alertRuleRepository.save.mockResolvedValue(updatedRule);

      // Act
      const result = await service.updateAlertRule(id, updateDto);

      // Assert
      expect(result.measurementId).toBe(2);
      expect(measurementService.getMeasurementById).toHaveBeenCalledWith(2);
    });

    it('should validate configuration when changing mode to SETPOINT', async () => {
      // Arrange
      const id = 1;
      const updateDto = {
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      };
      const existingRule = createMockAlertRule({
        id,
        mode: AlertRuleMode.WINDOW,
      });
      const updatedRule = createMockAlertRule({
        ...existingRule,
        ...updateDto,
      });

      alertRuleRepository.findOne.mockResolvedValue(existingRule);
      alertRuleRepository.save.mockResolvedValue(updatedRule);

      // Act
      await service.updateAlertRule(id, updateDto);

      // Assert
      expect(alertRuleRepository.save).toHaveBeenCalled();
    });

    it('should validate configuration when changing mode to WINDOW', async () => {
      // Arrange
      const id = 1;
      const updateDto = {
        mode: AlertRuleMode.WINDOW,
        minValue: 20,
        maxValue: 30,
      };
      const existingRule = createMockAlertRule({
        id,
        mode: AlertRuleMode.SETPOINT,
      });
      const updatedRule = createMockAlertRule({
        ...existingRule,
        ...updateDto,
      });

      alertRuleRepository.findOne.mockResolvedValue(existingRule);
      alertRuleRepository.save.mockResolvedValue(updatedRule);

      // Act
      await service.updateAlertRule(id, updateDto);

      // Assert
      expect(alertRuleRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when updating to SETPOINT without operator', async () => {
      // Arrange
      const id = 1;
      const updateDto = {
        mode: AlertRuleMode.SETPOINT,
        setpoint: 25,
      };
      const existingRule = createMockAlertRule({
        id,
        mode: AlertRuleMode.WINDOW,
      });

      alertRuleRepository.findOne.mockResolvedValue(existingRule);

      // Act & Assert
      await expect(
        service.updateAlertRule(id, updateDto as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when AlertRule does not exist', async () => {
      // Arrange
      const id = 999;
      const updateDto = { name: 'Updated Name' };

      alertRuleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateAlertRule(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when new Measurement does not exist', async () => {
      // Arrange
      const id = 1;
      const updateDto = { measurementId: 999 };
      const existingRule = createMockAlertRule({ id });

      alertRuleRepository.findOne.mockResolvedValue(existingRule);
      measurementService.getMeasurementById.mockRejectedValue(
        new NotFoundException('Measurement not found')
      );

      // Act & Assert
      await expect(service.updateAlertRule(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteAlertRule', () => {
    it('should delete AlertRule correctly (soft delete)', async () => {
      // Arrange
      const id = 1;
      const existingRule = createMockAlertRule({ id });

      alertRuleRepository.findOne.mockResolvedValue(existingRule);
      alertRuleRepository.softDelete.mockResolvedValue(undefined as any);

      // Act
      await service.deleteAlertRule(id);

      // Assert
      expect(alertRuleRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['measurement'],
      });
      expect(alertRuleRepository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when AlertRule does not exist', async () => {
      // Arrange
      const id = 999;

      alertRuleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteAlertRule(id)).rejects.toThrow(
        NotFoundException
      );
      expect(alertRuleRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('toggleAlertRule', () => {
    it('should change isEnabled from true to false', async () => {
      // Arrange
      const id = 1;
      const existingRule = createMockAlertRule({ id, isEnabled: true });
      const updatedRule = createMockAlertRule({ id, isEnabled: false });

      alertRuleRepository.findOne.mockResolvedValue(existingRule);
      alertRuleRepository.save.mockResolvedValue(updatedRule);

      // Act
      const result = await service.toggleAlertRule(id);

      // Assert
      expect(result.isEnabled).toBe(false);
      expect(alertRuleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isEnabled: false,
        })
      );
    });

    it('should change isEnabled from false to true', async () => {
      // Arrange
      const id = 1;
      const existingRule = createMockAlertRule({ id, isEnabled: false });
      const updatedRule = createMockAlertRule({ id, isEnabled: true });

      alertRuleRepository.findOne.mockResolvedValue(existingRule);
      alertRuleRepository.save.mockResolvedValue(updatedRule);

      // Act
      const result = await service.toggleAlertRule(id);

      // Assert
      expect(result.isEnabled).toBe(true);
      expect(alertRuleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isEnabled: true,
        })
      );
    });

    it('should throw NotFoundException when AlertRule does not exist', async () => {
      // Arrange
      const id = 999;

      alertRuleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.toggleAlertRule(id)).rejects.toThrow(
        NotFoundException
      );
      expect(alertRuleRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getAlertRulesByMeasurementId', () => {
    it('should return array of AlertRules for measurementId', async () => {
      // Arrange
      const measurementId = 1;
      const mockRules = [
        createMockAlertRule({ measurementId }),
        createMockAlertRule({ measurementId }),
      ];

      alertRuleRepository.findByMeasurementId.mockResolvedValue(mockRules);

      // Act
      const result = await service.getAlertRulesByMeasurementId(measurementId);

      // Assert
      expect(result).toEqual(mockRules);
      expect(alertRuleRepository.findByMeasurementId).toHaveBeenCalledWith(
        measurementId
      );
    });

    it('should return empty array when no rules found', async () => {
      // Arrange
      const measurementId = 999;

      alertRuleRepository.findByMeasurementId.mockResolvedValue([]);

      // Act
      const result = await service.getAlertRulesByMeasurementId(measurementId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getEnabledAlertRules', () => {
    it('should return only AlertRules with isEnabled = true', async () => {
      // Arrange
      const mockRules = [
        createMockAlertRule({ id: 1, isEnabled: true }),
        createMockAlertRule({ id: 2, isEnabled: true }),
      ];

      alertRuleRepository.findEnabledRules.mockResolvedValue(mockRules);

      // Act
      const result = await service.getEnabledAlertRules();

      // Assert
      expect(result).toEqual(mockRules);
      expect(result.every(rule => rule.isEnabled === true)).toBe(true);
      expect(alertRuleRepository.findEnabledRules).toHaveBeenCalled();
    });

    it('should return empty array when no enabled rules found', async () => {
      // Arrange
      alertRuleRepository.findEnabledRules.mockResolvedValue([]);

      // Act
      const result = await service.getEnabledAlertRules();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
