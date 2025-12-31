import { Test, type TestingModule } from '@nestjs/testing';
import { AlertEscalationMessageController } from './alert-escalation-message.controller';
import { AlertEscalationMessageService } from '../application/services/alert-escalation-message.service';
import { createMockAlertEscalationMessage } from '../../test-helpers';
import {
  AlertLevel,
  MessageType,
} from '../domain/entities/alert-escalation-message.entity';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockPermissionGuard = {
  canActivate: jest.fn(() => true),
};

describe('AlertEscalationMessageController', () => {
  let controller: AlertEscalationMessageController;
  let service: jest.Mocked<AlertEscalationMessageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertEscalationMessageController],
      providers: [
        {
          provide: AlertEscalationMessageService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByConfig: jest.fn(),
            findByConfigAndLevel: jest.fn(),
            findByDeviceAndSignal: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            deleteByConfig: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(
        mockJwtAuthGuard.constructor as unknown as new () => unknown
      )
      .useValue(mockJwtAuthGuard)
      .overrideGuard(
        mockPermissionGuard.constructor as unknown as new () => unknown
      )
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<AlertEscalationMessageController>(
      AlertEscalationMessageController
    );
    service = module.get(AlertEscalationMessageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create message successfully', async () => {
      const createDto = {
        escalationConfigId: 1,
        level: AlertLevel.WARNING,
        messageType: MessageType.EMAIL,
        targetId: 'test@example.com',
        message: 'Test message',
      };
      const mockMessage = createMockAlertEscalationMessage({
        id: 1,
        ...createDto,
      });

      service.create.mockResolvedValue(mockMessage);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockMessage);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findByConfigAndLevel', () => {
    it('should return messages for config and level', async () => {
      const configId = 1;
      const level = AlertLevel.WARNING;
      const mockMessages = [
        createMockAlertEscalationMessage({
          id: 1,
          escalationConfigId: configId,
          level,
        }),
      ];

      service.findByConfigAndLevel.mockResolvedValue(mockMessages);

      const result = await controller.findByConfigAndLevel(configId, level);

      expect(result).toEqual(mockMessages);
      expect(service.findByConfigAndLevel).toHaveBeenCalledWith(
        configId,
        level
      );
    });
  });
});
