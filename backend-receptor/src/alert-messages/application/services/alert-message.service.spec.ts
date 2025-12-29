import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AlertMessageService } from './alert-message.service';
import { AlertMessageRepository } from '../../domain/repositories/alert-message.repository';
import { AlertRuleService } from '../../../alert-rules/application/services/alert-rule.service';
import { MessageGroupService } from '../../../message-groups/application/services/message-group.service';
import {
  createMockAlertMessage,
  createMockAlertRule,
  createMockMessageGroup,
} from '../../../test-helpers';

describe('AlertMessageService', () => {
  let service: AlertMessageService;
  let repository: jest.Mocked<AlertMessageRepository>;
  let alertRuleService: jest.Mocked<AlertRuleService>;
  let messageGroupService: jest.Mocked<MessageGroupService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertMessageService,
        {
          provide: AlertMessageRepository,
          useValue: {
            find: jest.fn(),
            findWithRelations: jest.fn(),
            findByAlertRuleId: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: AlertRuleService,
          useValue: {
            getAlertRuleById: jest.fn(),
          },
        },
        {
          provide: MessageGroupService,
          useValue: {
            getMessageGroupById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertMessageService>(AlertMessageService);
    repository = module.get(AlertMessageRepository);
    alertRuleService = module.get(AlertRuleService);
    messageGroupService = module.get(MessageGroupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAlertMessages', () => {
    it('should return all messages ordered by createdAt DESC', async () => {
      const mockMessages = [
        createMockAlertMessage({ id: 1 }),
        createMockAlertMessage({ id: 2 }),
      ];

      repository.find.mockResolvedValue(mockMessages);

      const result = await service.getAllAlertMessages();

      expect(result).toEqual(mockMessages);
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['messageGroup', 'alertRule'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getAlertMessageById', () => {
    it('should return message when exists', async () => {
      const id = 1;
      const mockMessage = createMockAlertMessage({ id });

      repository.findWithRelations.mockResolvedValue(mockMessage);

      const result = await service.getAlertMessageById(id);

      expect(result).toEqual(mockMessage);
      expect(repository.findWithRelations).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when message does not exist', async () => {
      const id = 999;
      repository.findWithRelations.mockResolvedValue(null);

      await expect(service.getAlertMessageById(id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getAlertMessageById(id)).rejects.toThrow(
        `Alert message with ID ${id} not found`
      );
    });
  });

  describe('createAlertMessage', () => {
    it('should create message successfully', async () => {
      const alertRuleId = 1;
      const createDto = {
        receptorType: 'correo',
        messageData: {
          correo: {
            emails: ['test@example.com'],
            subject: 'Test',
            message: 'Test message',
          },
        },
        messageGroupId: 1,
      };
      const mockAlertRule = createMockAlertRule({ id: alertRuleId });
      const mockMessageGroup = createMockMessageGroup({ id: 1 });
      const mockMessage = createMockAlertMessage({
        id: 1,
        alertRuleId,
        ...createDto,
      });

      alertRuleService.getAlertRuleById.mockResolvedValue(mockAlertRule);
      messageGroupService.getMessageGroupById.mockResolvedValue(
        mockMessageGroup
      );
      repository.findByAlertRuleId.mockResolvedValue([]);
      repository.save.mockResolvedValue(mockMessage);

      const result = await service.createAlertMessage(alertRuleId, createDto);

      expect(result).toEqual(mockMessage);
      expect(alertRuleService.getAlertRuleById).toHaveBeenCalledWith(
        alertRuleId
      );
      expect(messageGroupService.getMessageGroupById).toHaveBeenCalledWith(1);
      expect(repository.findByAlertRuleId).toHaveBeenCalledWith(alertRuleId);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when alertRule does not exist', async () => {
      const alertRuleId = 999;
      const createDto = {
        receptorType: 'correo',
        messageData: {},
        messageGroupId: 1,
      };

      alertRuleService.getAlertRuleById.mockRejectedValue(
        new NotFoundException(`Alert rule with ID ${alertRuleId} not found`)
      );

      await expect(
        service.createAlertMessage(alertRuleId, createDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when messageGroup does not exist', async () => {
      const alertRuleId = 1;
      const createDto = {
        receptorType: 'correo',
        messageData: {},
        messageGroupId: 999,
      };
      const mockAlertRule = createMockAlertRule({ id: alertRuleId });

      alertRuleService.getAlertRuleById.mockResolvedValue(mockAlertRule);
      messageGroupService.getMessageGroupById.mockRejectedValue(
        new NotFoundException('Message group with ID 999 not found')
      );

      await expect(
        service.createAlertMessage(alertRuleId, createDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when maximum 5 messages exceeded', async () => {
      const alertRuleId = 1;
      const createDto = {
        receptorType: 'correo',
        messageData: {},
        messageGroupId: 1,
      };
      const mockAlertRule = createMockAlertRule({ id: alertRuleId });
      const mockMessageGroup = createMockMessageGroup({ id: 1 });
      const existingMessages = Array.from({ length: 5 }, (_, i) =>
        createMockAlertMessage({ id: i + 1, alertRuleId })
      );

      alertRuleService.getAlertRuleById.mockResolvedValue(mockAlertRule);
      messageGroupService.getMessageGroupById.mockResolvedValue(
        mockMessageGroup
      );
      repository.findByAlertRuleId.mockResolvedValue(existingMessages);

      await expect(
        service.createAlertMessage(alertRuleId, createDto)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createAlertMessage(alertRuleId, createDto)
      ).rejects.toThrow('Maximum 5 messages per alert rule exceeded');
    });
  });

  describe('updateAlertMessage', () => {
    it('should update message successfully', async () => {
      const id = 1;
      const updateDto = { status: 'sent' };
      const existingMessage = createMockAlertMessage({ id });
      const updatedMessage = createMockAlertMessage({ id, status: 'sent' });

      repository.findWithRelations.mockResolvedValue(existingMessage);
      repository.save.mockResolvedValue(updatedMessage);

      const result = await service.updateAlertMessage(id, updateDto);

      expect(result).toEqual(updatedMessage);
      expect(repository.findWithRelations).toHaveBeenCalledWith(id);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should validate messageGroup when updating', async () => {
      const id = 1;
      const updateDto = { messageGroupId: 2 };
      const existingMessage = createMockAlertMessage({ id });
      const mockMessageGroup = createMockMessageGroup({ id: 2 });

      repository.findWithRelations.mockResolvedValue(existingMessage);
      messageGroupService.getMessageGroupById.mockResolvedValue(
        mockMessageGroup
      );
      repository.save.mockResolvedValue(existingMessage);

      await service.updateAlertMessage(id, updateDto);

      expect(messageGroupService.getMessageGroupById).toHaveBeenCalledWith(2);
    });
  });

  describe('deleteAlertMessage', () => {
    it('should delete message successfully', async () => {
      const id = 1;
      const mockMessage = createMockAlertMessage({ id });

      repository.findWithRelations.mockResolvedValue(mockMessage);
      repository.remove.mockResolvedValue(mockMessage as any);

      await service.deleteAlertMessage(id);

      expect(repository.findWithRelations).toHaveBeenCalledWith(id);
      expect(repository.remove).toHaveBeenCalledWith(mockMessage);
    });
  });

  describe('duplicateAlertMessage', () => {
    it('should duplicate message successfully', async () => {
      const id = 1;
      const originalMessage = createMockAlertMessage({ id, alertRuleId: 1 });
      const duplicatedMessage = createMockAlertMessage({
        id: 2,
        alertRuleId: 1,
      });

      repository.findWithRelations.mockResolvedValue(originalMessage);
      repository.findByAlertRuleId.mockResolvedValue([originalMessage]);
      repository.save.mockResolvedValue(duplicatedMessage);

      const result = await service.duplicateAlertMessage(id);

      expect(result).toEqual(duplicatedMessage);
      expect(repository.findWithRelations).toHaveBeenCalledWith(id);
      expect(repository.findByAlertRuleId).toHaveBeenCalledWith(1);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when maximum exceeded on duplicate', async () => {
      const id = 1;
      const originalMessage = createMockAlertMessage({ id, alertRuleId: 1 });
      const existingMessages = Array.from({ length: 5 }, (_, i) =>
        createMockAlertMessage({ id: i + 1, alertRuleId: 1 })
      );

      repository.findWithRelations.mockResolvedValue(originalMessage);
      repository.findByAlertRuleId.mockResolvedValue(existingMessages);

      await expect(service.duplicateAlertMessage(id)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.duplicateAlertMessage(id)).rejects.toThrow(
        'Maximum 5 messages per alert rule exceeded. Cannot duplicate.'
      );
    });
  });

  describe('getMessagesByAlertRuleId', () => {
    it('should return messages for alert rule', async () => {
      const alertRuleId = 1;
      const mockMessages = [
        createMockAlertMessage({ id: 1, alertRuleId }),
        createMockAlertMessage({ id: 2, alertRuleId }),
      ];
      const mockAlertRule = createMockAlertRule({ id: alertRuleId });

      alertRuleService.getAlertRuleById.mockResolvedValue(mockAlertRule);
      repository.findByAlertRuleId.mockResolvedValue(mockMessages);

      const result = await service.getMessagesByAlertRuleId(alertRuleId);

      expect(result).toEqual(mockMessages);
      expect(alertRuleService.getAlertRuleById).toHaveBeenCalledWith(
        alertRuleId
      );
      expect(repository.findByAlertRuleId).toHaveBeenCalledWith(alertRuleId);
    });
  });
});
