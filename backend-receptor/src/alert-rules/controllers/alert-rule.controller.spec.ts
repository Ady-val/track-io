import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AlertRuleController } from './alert-rule.controller';
import { AlertRuleService } from '../application/services/alert-rule.service';
import { createMockAlertRule } from '../../test-helpers';
import { AlertRuleMode } from '../domain/entities/alert-rule.entity';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockPermissionGuard = {
  canActivate: jest.fn(() => true),
};

describe('AlertRuleController', () => {
  let controller: AlertRuleController;
  let service: jest.Mocked<AlertRuleService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertRuleController],
      providers: [
        {
          provide: AlertRuleService,
          useValue: {
            getAllAlertRules: jest.fn(),
            getAlertRuleById: jest.fn(),
            createAlertRule: jest.fn(),
            updateAlertRule: jest.fn(),
            toggleAlertRule: jest.fn(),
            deleteAlertRule: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(mockJwtAuthGuard.constructor as any)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(mockPermissionGuard.constructor as any)
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<AlertRuleController>(AlertRuleController);
    service = module.get(AlertRuleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAlertRules', () => {
    it('should return list of AlertRules', async () => {
      // Arrange
      const mockRules = [
        createMockAlertRule({ id: 1 }),
        createMockAlertRule({ id: 2 }),
      ];
      service.getAllAlertRules.mockResolvedValue(mockRules);

      // Act
      const result = await controller.getAllAlertRules();

      // Assert
      expect(result.message).toBe('Alert rules retrieved successfully');
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(service.getAllAlertRules).toHaveBeenCalled();
    });

    it('should apply measurementId filter when provided', async () => {
      // Arrange
      const measurementId = '1';
      const mockRules = [createMockAlertRule({ measurementId: 1 })];
      service.getAllAlertRules.mockResolvedValue(mockRules);

      // Act
      await controller.getAllAlertRules(measurementId);

      // Assert
      expect(service.getAllAlertRules).toHaveBeenCalledWith({
        measurementId: 1,
      });
    });

    it('should apply isEnabled filter when provided', async () => {
      // Arrange
      const isEnabled = 'true';
      const mockRules = [createMockAlertRule({ isEnabled: true })];
      service.getAllAlertRules.mockResolvedValue(mockRules);

      // Act
      await controller.getAllAlertRules(undefined, isEnabled);

      // Assert
      expect(service.getAllAlertRules).toHaveBeenCalledWith({
        isEnabled: true,
      });
    });

    it('should apply mode filter when provided', async () => {
      // Arrange
      const mode = AlertRuleMode.SETPOINT;
      const mockRules = [createMockAlertRule({ mode: AlertRuleMode.SETPOINT })];
      service.getAllAlertRules.mockResolvedValue(mockRules);

      // Act
      await controller.getAllAlertRules(undefined, undefined, mode);

      // Assert
      expect(service.getAllAlertRules).toHaveBeenCalledWith({
        mode,
      });
    });

    it('should apply multiple filters simultaneously', async () => {
      // Arrange
      const measurementId = '1';
      const isEnabled = 'true';
      const mode = AlertRuleMode.SETPOINT;
      const mockRules = [createMockAlertRule()];
      service.getAllAlertRules.mockResolvedValue(mockRules);

      // Act
      await controller.getAllAlertRules(measurementId, isEnabled, mode);

      // Assert
      expect(service.getAllAlertRules).toHaveBeenCalledWith({
        measurementId: 1,
        isEnabled: true,
        mode,
      });
    });
  });

  describe('getAlertRuleById', () => {
    it('should return AlertRule when found', async () => {
      // Arrange
      const id = 1;
      const mockRule = createMockAlertRule({ id });
      service.getAlertRuleById.mockResolvedValue(mockRule);

      // Act
      const result = await controller.getAlertRuleById(id);

      // Assert
      expect(result.message).toBe('Alert rule found');
      expect(result.data.id).toBe(id);
      expect(service.getAlertRuleById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when AlertRule not found', async () => {
      // Arrange
      const id = 999;
      service.getAlertRuleById.mockRejectedValue(
        new NotFoundException(`Alert rule with ID ${id} not found`)
      );

      // Act & Assert
      await expect(controller.getAlertRuleById(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('createAlertRule', () => {
    it('should create AlertRule in SETPOINT mode successfully', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      };
      const mockRule = createMockAlertRule({
        ...createDto,
        isEnabled: true,
      });
      service.createAlertRule.mockResolvedValue(mockRule);

      // Act
      const result = await controller.createAlertRule(createDto);

      // Assert
      expect(result.message).toBe('Alert rule created successfully');
      expect(result.data.name).toBe('Test Rule');
      expect(service.createAlertRule).toHaveBeenCalledWith(createDto);
    });

    it('should create AlertRule in WINDOW mode successfully', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.WINDOW,
        minValue: 20,
        maxValue: 30,
      };
      const mockRule = createMockAlertRule({
        ...createDto,
        isEnabled: true,
      });
      service.createAlertRule.mockResolvedValue(mockRule);

      // Act
      const result = await controller.createAlertRule(createDto);

      // Assert
      expect(result.message).toBe('Alert rule created successfully');
      expect(result.data.mode).toBe(AlertRuleMode.WINDOW);
      expect(service.createAlertRule).toHaveBeenCalledWith(createDto);
    });

    it('should throw BadRequestException when data is invalid', async () => {
      // Arrange
      const createDto = {
        name: 'Test Rule',
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        // Missing operator and setpoint
      };
      service.createAlertRule.mockRejectedValue(
        new BadRequestException(
          'Setpoint mode requires operator and setpoint value'
        )
      );

      // Act & Assert
      await expect(
        controller.createAlertRule(createDto as any)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAlertRule', () => {
    it('should update AlertRule successfully', async () => {
      // Arrange
      const id = 1;
      const updateDto = { name: 'Updated Name' };
      const mockRule = createMockAlertRule({ id, name: 'Updated Name' });
      service.updateAlertRule.mockResolvedValue(mockRule);

      // Act
      const result = await controller.updateAlertRule(id, updateDto);

      // Assert
      expect(result.message).toBe('Alert rule updated successfully');
      expect(result.data.name).toBe('Updated Name');
      expect(service.updateAlertRule).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw NotFoundException when AlertRule not found', async () => {
      // Arrange
      const id = 999;
      const updateDto = { name: 'Updated Name' };
      service.updateAlertRule.mockRejectedValue(
        new NotFoundException(`Alert rule with ID ${id} not found`)
      );

      // Act & Assert
      await expect(controller.updateAlertRule(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when data is invalid', async () => {
      // Arrange
      const id = 1;
      const updateDto = {
        mode: AlertRuleMode.SETPOINT,
        // Missing operator
      };
      service.updateAlertRule.mockRejectedValue(
        new BadRequestException(
          'Setpoint mode requires operator and setpoint value'
        )
      );

      // Act & Assert
      await expect(
        controller.updateAlertRule(id, updateDto as any)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('toggleAlertRule', () => {
    it('should change isEnabled from true to false', async () => {
      // Arrange
      const id = 1;
      const mockRule = createMockAlertRule({ id, isEnabled: false });
      service.toggleAlertRule.mockResolvedValue(mockRule);

      // Act
      const result = await controller.toggleAlertRule(id);

      // Assert
      expect(result.message).toBe('Alert rule disabled successfully');
      expect(result.data.isEnabled).toBe(false);
      expect(service.toggleAlertRule).toHaveBeenCalledWith(id);
    });

    it('should change isEnabled from false to true', async () => {
      // Arrange
      const id = 1;
      const mockRule = createMockAlertRule({ id, isEnabled: true });
      service.toggleAlertRule.mockResolvedValue(mockRule);

      // Act
      const result = await controller.toggleAlertRule(id);

      // Assert
      expect(result.message).toBe('Alert rule enabled successfully');
      expect(result.data.isEnabled).toBe(true);
      expect(service.toggleAlertRule).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when AlertRule not found', async () => {
      // Arrange
      const id = 999;
      service.toggleAlertRule.mockRejectedValue(
        new NotFoundException(`Alert rule with ID ${id} not found`)
      );

      // Act & Assert
      await expect(controller.toggleAlertRule(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteAlertRule', () => {
    it('should delete AlertRule successfully (soft delete)', async () => {
      // Arrange
      const id = 1;
      service.deleteAlertRule.mockResolvedValue(undefined);

      // Act
      await controller.deleteAlertRule(id);

      // Assert
      expect(service.deleteAlertRule).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when AlertRule not found', async () => {
      // Arrange
      const id = 999;
      service.deleteAlertRule.mockRejectedValue(
        new NotFoundException(`Alert rule with ID ${id} not found`)
      );

      // Act & Assert
      await expect(controller.deleteAlertRule(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
