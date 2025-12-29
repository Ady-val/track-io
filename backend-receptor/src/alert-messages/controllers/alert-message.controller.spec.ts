import { Test, type TestingModule } from '@nestjs/testing';
import { AlertMessageController } from './alert-message.controller';
import { AlertMessageService } from '../application/services/alert-message.service';
import { createMockAlertMessage } from '../../test-helpers';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockPermissionGuard = {
  canActivate: jest.fn(() => true),
};

describe('AlertMessageController', () => {
  let controller: AlertMessageController;
  let service: jest.Mocked<AlertMessageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertMessageController],
      providers: [
        {
          provide: AlertMessageService,
          useValue: {
            getAllAlertMessages: jest.fn(),
            getAlertMessageById: jest.fn(),
            createAlertMessage: jest.fn(),
            updateAlertMessage: jest.fn(),
            deleteAlertMessage: jest.fn(),
            duplicateAlertMessage: jest.fn(),
            getMessagesByAlertRuleId: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(mockJwtAuthGuard.constructor as any)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(mockPermissionGuard.constructor as any)
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<AlertMessageController>(AlertMessageController);
    service = module.get(AlertMessageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAlertMessages', () => {
    it('should return all messages', async () => {
      const mockMessages = [
        createMockAlertMessage({ id: 1 }),
        createMockAlertMessage({ id: 2 }),
      ];

      service.getAllAlertMessages.mockResolvedValue(mockMessages);

      const result = await controller.getAllAlertMessages();

      expect(result).toEqual({
        message: 'Alert messages retrieved successfully',
        data: mockMessages,
      });
      expect(service.getAllAlertMessages).toHaveBeenCalled();
    });
  });

  describe('getAlertMessageById', () => {
    it('should return message by ID', async () => {
      const id = 1;
      const mockMessage = createMockAlertMessage({ id });

      service.getAlertMessageById.mockResolvedValue(mockMessage);

      const result = await controller.getAlertMessageById(id);

      expect(result).toEqual({
        message: 'Alert message found',
        data: mockMessage,
      });
      expect(service.getAlertMessageById).toHaveBeenCalledWith(id);
    });
  });

  describe('getMessagesByAlertRuleId', () => {
    it('should return messages for alert rule', async () => {
      const ruleId = 1;
      const mockMessages = [
        createMockAlertMessage({ id: 1, alertRuleId: ruleId }),
      ];

      service.getMessagesByAlertRuleId.mockResolvedValue(mockMessages);

      const result = await controller.getMessagesByAlertRuleId(ruleId);

      expect(result).toEqual({
        message: 'Alert rule messages retrieved successfully',
        data: mockMessages,
      });
      expect(service.getMessagesByAlertRuleId).toHaveBeenCalledWith(ruleId);
    });
  });

  describe('createAlertMessage', () => {
    it('should create message successfully', async () => {
      const ruleId = 1;
      const createDto = {
        receptorType: 'correo',
        messageData: {},
        messageGroupId: 1,
      };
      const mockMessage = createMockAlertMessage({
        id: 1,
        alertRuleId: ruleId,
      });

      service.createAlertMessage.mockResolvedValue(mockMessage);

      const result = await controller.createAlertMessage(ruleId, createDto);

      expect(result).toEqual({
        message: 'Alert message created successfully',
        data: mockMessage,
      });
      expect(service.createAlertMessage).toHaveBeenCalledWith(
        ruleId,
        createDto
      );
    });
  });

  describe('updateAlertMessage', () => {
    it('should update message successfully', async () => {
      const id = 1;
      const updateDto = { status: 'sent' };
      const updatedMessage = createMockAlertMessage({ id, status: 'sent' });

      service.updateAlertMessage.mockResolvedValue(updatedMessage);

      const result = await controller.updateAlertMessage(id, updateDto);

      expect(result).toEqual({
        message: 'Alert message updated successfully',
        data: updatedMessage,
      });
      expect(service.updateAlertMessage).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('duplicateAlertMessage', () => {
    it('should duplicate message successfully', async () => {
      const id = 1;
      const duplicatedMessage = createMockAlertMessage({ id: 2 });

      service.duplicateAlertMessage.mockResolvedValue(duplicatedMessage);

      const result = await controller.duplicateAlertMessage(id);

      expect(result).toEqual({
        message: 'Alert message duplicated successfully',
        data: duplicatedMessage,
      });
      expect(service.duplicateAlertMessage).toHaveBeenCalledWith(id);
    });
  });

  describe('deleteAlertMessage', () => {
    it('should delete message successfully', async () => {
      const id = 1;
      service.deleteAlertMessage.mockResolvedValue(undefined);

      await controller.deleteAlertMessage(id);

      expect(service.deleteAlertMessage).toHaveBeenCalledWith(id);
    });
  });
});
