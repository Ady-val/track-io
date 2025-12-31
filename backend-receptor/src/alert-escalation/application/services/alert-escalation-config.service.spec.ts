import { Test, type TestingModule } from '@nestjs/testing';
import { AlertEscalationConfigService } from './alert-escalation-config.service';
import { AlertEscalationConfigRepository } from '../../domain/repositories/alert-escalation-config.repository';
import { AlertEscalationMessageRepository } from '../../domain/repositories/alert-escalation-message.repository';
import { TorretaColorService } from '../../../torreta-colors/application/services/torreta-color.service';
import {
  createMockAlertEscalationConfig,
  createMockTorretaColor,
} from '../../../test-helpers';
import type { CreateAlertEscalationConfigDto } from '../dtos/create-alert-escalation-config.dto';
import { MessageType } from '../../domain/entities/alert-escalation-message.entity';
import type { CreateEscalationConfigWithMessagesDto } from '../dtos/create-escalation-config-with-messages.dto';
import type { AlertEscalationMessage } from '../../domain/entities/alert-escalation-message.entity';

describe('AlertEscalationConfigService', () => {
  let service: AlertEscalationConfigService;
  let configRepository: jest.Mocked<AlertEscalationConfigRepository>;
  let messageRepository: jest.Mocked<AlertEscalationMessageRepository>;
  let torretaColorService: jest.Mocked<TorretaColorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertEscalationConfigService,
        {
          provide: AlertEscalationConfigRepository,
          useValue: {
            create: jest.fn(),
            findByDeviceAndSignal: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: AlertEscalationMessageRepository,
          useValue: {
            create: jest.fn(),
            deleteByConfig: jest.fn(),
          },
        },
        {
          provide: TorretaColorService,
          useValue: {
            getTorretaColorByHtmlColor: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertEscalationConfigService>(
      AlertEscalationConfigService
    );
    configRepository = module.get(AlertEscalationConfigRepository);
    messageRepository = module.get(AlertEscalationMessageRepository);
    torretaColorService = module.get(TorretaColorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create config successfully', async () => {
      const createDto: CreateAlertEscalationConfigDto = {
        deviceId: 1,
        deviceSignalId: 1,
        warningDelayMinutes: 20,
      };
      const mockConfig = createMockAlertEscalationConfig({
        id: 1,
        ...createDto,
      });

      configRepository.create.mockResolvedValue(mockConfig);

      const result = await service.create(createDto);

      expect(result).toEqual(mockConfig);
      expect(configRepository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('createWithMessages', () => {
    it('should create config with messages successfully', async () => {
      const createDto = {
        deviceId: 1,
        deviceSignalId: 1,
        warningDelayMinutes: 20,
        messages: [
          {
            level: 'warning' as const,
            messageType: MessageType.EMAIL,
            targetId: 'test@example.com',
            message: 'Test message',
          },
        ],
      };
      const mockConfig = createMockAlertEscalationConfig({
        id: 1,
        deviceId: createDto.deviceId,
        deviceSignalId: createDto.deviceSignalId,
      });

      configRepository.create.mockResolvedValue(mockConfig);
      messageRepository.create.mockResolvedValue({
        id: 1,
        escalationConfigId: mockConfig.id,
        ...createDto.messages[0],
      } as AlertEscalationMessage);

      const result = await service.createWithMessages(
        createDto as CreateEscalationConfigWithMessagesDto
      );

      expect(result).toEqual(mockConfig);
      expect(configRepository.create).toHaveBeenCalled();
      expect(messageRepository.create).toHaveBeenCalled();
    });

    it('should convert hex color to deviceColorId for TORRETA messages', async () => {
      const createDto = {
        deviceId: 1,
        deviceSignalId: 1,
        messages: [
          {
            level: 'warning' as const,
            messageType: MessageType.TORRETA,
            targetId: 'TORRETA001',
            message: 'Test message',
            color: '#FF0000',
          },
        ],
      };
      const mockConfig = createMockAlertEscalationConfig({ id: 1 });
      const mockTorretaColor = createMockTorretaColor({
        htmlColor: '#FF0000',
        deviceColorId: 'RED',
      });

      configRepository.create.mockResolvedValue(mockConfig);
      torretaColorService.getTorretaColorByHtmlColor.mockResolvedValue(
        mockTorretaColor
      );
      messageRepository.create.mockResolvedValue({
        id: 1,
        escalationConfigId: mockConfig.id,
        color: 'RED',
      } as AlertEscalationMessage);

      await service.createWithMessages(
        createDto as CreateEscalationConfigWithMessagesDto
      );

      expect(
        torretaColorService.getTorretaColorByHtmlColor
      ).toHaveBeenCalledWith('#FF0000');
      expect(messageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'RED',
        })
      );
    });
  });
});
