import { Test, type TestingModule } from '@nestjs/testing';
import { AlertEscalationMessageService } from './alert-escalation-message.service';
import { AlertEscalationMessageRepository } from '../../domain/repositories/alert-escalation-message.repository';
import { createMockAlertEscalationMessage } from '../../../test-helpers';
import {
  AlertLevel,
  MessageType,
} from '../../domain/entities/alert-escalation-message.entity';
import type { CreateAlertEscalationMessageDto } from '../dtos/create-alert-escalation-message.dto';

describe('AlertEscalationMessageService', () => {
  let service: AlertEscalationMessageService;
  let messageRepository: jest.Mocked<AlertEscalationMessageRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertEscalationMessageService,
        {
          provide: AlertEscalationMessageRepository,
          useValue: {
            create: jest.fn(),
            findByConfig: jest.fn(),
            findById: jest.fn(),
            findByConfigAndLevel: jest.fn(),
            findByDeviceAndSignal: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            deleteByConfig: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertEscalationMessageService>(
      AlertEscalationMessageService
    );
    messageRepository = module.get(AlertEscalationMessageRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create message successfully', async () => {
      const createDto: CreateAlertEscalationMessageDto = {
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

      messageRepository.create.mockResolvedValue(mockMessage);

      const result = await service.create(createDto);

      expect(result).toEqual(mockMessage);
      expect(messageRepository.create).toHaveBeenCalled();
    });

    it('should include color for TORRETA messages', async () => {
      const createDto: CreateAlertEscalationMessageDto = {
        escalationConfigId: 1,
        level: AlertLevel.WARNING,
        messageType: MessageType.TORRETA,
        targetId: 'TORRETA001',
        message: 'Test message',
        deviceColorId: 'RED',
      };
      const mockMessage = createMockAlertEscalationMessage({
        id: 1,
        ...createDto,
        color: 'RED',
      });

      messageRepository.create.mockResolvedValue(mockMessage);

      await service.create(createDto);

      expect(messageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'RED',
        })
      );
    });
  });

  describe('findByConfig', () => {
    it('should return messages for config', async () => {
      const configId = 1;
      const mockMessages = [
        createMockAlertEscalationMessage({
          id: 1,
          escalationConfigId: configId,
        }),
      ];

      messageRepository.findByConfig.mockResolvedValue(mockMessages);

      const result = await service.findByConfig(configId);

      expect(result).toEqual(mockMessages);
      expect(messageRepository.findByConfig).toHaveBeenCalledWith(configId);
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

      messageRepository.findByConfigAndLevel.mockResolvedValue(mockMessages);

      const result = await service.findByConfigAndLevel(configId, level);

      expect(result).toEqual(mockMessages);
      expect(messageRepository.findByConfigAndLevel).toHaveBeenCalledWith(
        configId,
        level
      );
    });
  });

  describe('update', () => {
    it('should update message successfully', async () => {
      const id = 1;
      const updateDto = {
        message: 'Updated message',
      };
      const updatedMessage = createMockAlertEscalationMessage({
        id,
        ...updateDto,
      });

      messageRepository.update.mockResolvedValue(updatedMessage);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(updatedMessage);
      expect(messageRepository.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('delete', () => {
    it('should delete message successfully', async () => {
      const id = 1;

      messageRepository.delete.mockResolvedValue(undefined);

      await service.delete(id);

      expect(messageRepository.delete).toHaveBeenCalledWith(id);
    });
  });

  describe('deleteByConfig', () => {
    it('should delete all messages for config', async () => {
      const configId = 1;

      messageRepository.deleteByConfig.mockResolvedValue(undefined);

      await service.deleteByConfig(configId);

      expect(messageRepository.deleteByConfig).toHaveBeenCalledWith(configId);
    });
  });

  describe('count', () => {
    it('should return message count', async () => {
      const count = 10;

      messageRepository.count.mockResolvedValue(count);

      const result = await service.count();

      expect(result).toBe(count);
      expect(messageRepository.count).toHaveBeenCalled();
    });
  });
});
