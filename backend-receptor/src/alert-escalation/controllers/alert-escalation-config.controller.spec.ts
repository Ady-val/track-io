import { Test, type TestingModule } from '@nestjs/testing';
import { AlertEscalationConfigController } from './alert-escalation-config.controller';
import { AlertEscalationConfigService } from '../application/services/alert-escalation-config.service';
import { createMockAlertEscalationConfig } from '../../test-helpers';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockPermissionGuard = {
  canActivate: jest.fn(() => true),
};

describe('AlertEscalationConfigController', () => {
  let controller: AlertEscalationConfigController;
  let service: jest.Mocked<AlertEscalationConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertEscalationConfigController],
      providers: [
        {
          provide: AlertEscalationConfigService,
          useValue: {
            create: jest.fn(),
            createWithMessages: jest.fn(),
            saveEscalationConfig: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByDeviceAndSignal: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(mockJwtAuthGuard.constructor as any)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(mockPermissionGuard.constructor as any)
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<AlertEscalationConfigController>(
      AlertEscalationConfigController
    );
    service = module.get(AlertEscalationConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create config successfully', async () => {
      const createDto = {
        deviceId: 1,
        deviceSignalId: 1,
        warningDelayMinutes: 20,
      };
      const mockConfig = createMockAlertEscalationConfig({
        id: 1,
        ...createDto,
      });

      service.create.mockResolvedValue(mockConfig);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockConfig);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('createWithMessages', () => {
    it('should create config with messages successfully', async () => {
      const createDto = {
        deviceId: 1,
        deviceSignalId: 1,
        messages: [],
      };
      const mockConfig = createMockAlertEscalationConfig({ id: 1 });

      service.createWithMessages.mockResolvedValue(mockConfig);

      const result = await controller.createWithMessages(createDto);

      expect(result).toEqual(mockConfig);
      expect(service.createWithMessages).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findByDeviceAndSignal', () => {
    it('should return config for device and signal', async () => {
      const deviceId = 1;
      const deviceSignalId = 1;
      const mockConfig = createMockAlertEscalationConfig({
        deviceId,
        deviceSignalId,
      });

      service.findByDeviceAndSignal.mockResolvedValue(mockConfig);

      const result = await controller.findByDeviceAndSignal(
        deviceId,
        deviceSignalId
      );

      expect(result).toEqual(mockConfig);
      expect(service.findByDeviceAndSignal).toHaveBeenCalledWith(
        deviceId,
        deviceSignalId
      );
    });
  });
});
