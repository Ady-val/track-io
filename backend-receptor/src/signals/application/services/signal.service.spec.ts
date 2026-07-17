import { Test, type TestingModule } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { getDataSourceToken } from '@nestjs/typeorm';
import { SignalService } from './signal.service';
import { RawSignalRepository } from '../../domain/repositories/raw-signal.repository';
import { ProcessedSignalRepository } from '../../domain/repositories/processed-signal.repository';
import { DeviceRepository } from '../../../devices/domain/repositories/device.repository';
import { DeviceSignalRepository } from '../../../device-signals/domain/repositories/device-signal.repository';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import { WebSocketEmitterService } from '../../../websocket/services/websocket-emitter.service';
import { AreaDowntimeService } from '../../../area-downtime/application/services/area-downtime.service';
import { AlertCronService } from '../../../alert-escalation/application/services/alert-cron.service';
import { ScheduledDowntimeCalculatorService } from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';
import { EventScheduledDowntimeSliceRepository } from '../../../events/domain/repositories/event-scheduled-downtime-slice.repository';
import type { AreaTorretaSignalService } from '../../../area-torreta-config/application/services/area-torreta-signal.service';
import {
  createMockRawSignal,
  createMockProcessedSignal,
  createMockDevice,
  createMockDeviceSignal,
  createMockEvent,
} from '../../../test-helpers';
import { Event, EventStatus } from '../../../events/domain/entities/event.entity';

describe('SignalService', () => {
  let service: SignalService;
  let mockManager: { update: jest.Mock };
  let eventSliceRepository: { createMany: jest.Mock };
  let rawSignalRepository: jest.Mocked<RawSignalRepository>;
  let processedSignalRepository: jest.Mocked<ProcessedSignalRepository>;
  let deviceRepository: jest.Mocked<DeviceRepository>;
  let deviceSignalRepository: jest.Mocked<DeviceSignalRepository>;
  let eventRepository: jest.Mocked<TypeOrmEventRepository>;
  let webSocketEmitterService: jest.Mocked<WebSocketEmitterService>;
  let areaDowntimeService: jest.Mocked<AreaDowntimeService>;
  let alertCronService: jest.Mocked<AlertCronService>;
  let areaTorretaSignalService: jest.Mocked<AreaTorretaSignalService>;

  beforeEach(async () => {
    mockManager = { update: jest.fn().mockResolvedValue({ affected: 1 }) };

    const mockAreaTorretaSignalService = {
      processEventForAreaTorretas: jest.fn(),
    };

    const mockModuleRef = {
      get: jest.fn().mockReturnValue(mockAreaTorretaSignalService),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          // Por defecto sin descuento: aísla estos tests de la lógica de paros
          // programados (cubierta en su propio spec).
          provide: ScheduledDowntimeCalculatorService,
          useValue: {
            getDiscount: jest.fn().mockResolvedValue({
              timezone: 'America/Chihuahua',
              totalDiscountedSeconds: 0,
              slices: [],
            }),
          },
        },
        SignalService,
        {
          provide: RawSignalRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByExternalId: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: ProcessedSignalRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByDeviceId: jest.fn(),
            findByDeviceSignalId: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: DeviceRepository,
          useValue: {
            findByExternalId: jest.fn(),
          },
        },
        {
          provide: DeviceSignalRepository,
          useValue: {
            findByExternalValueIdAndDeviceId: jest.fn(),
            findByExternalValueId: jest.fn(),
          },
        },
        {
          provide: TypeOrmEventRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findOpenByDeviceAndSignal: jest.fn(),
            findInProgressByDeviceAndSignal: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
        {
          provide: EventScheduledDowntimeSliceRepository,
          useValue: {
            createMany: jest.fn().mockResolvedValue(undefined),
            deleteByEventIds: jest.fn(),
            findByEventIds: jest.fn(),
          },
        },
        {
          // DataSource.transaction ejecuta el callback con un EntityManager de
          // prueba cuyo update() se puede inspeccionar (cierre transaccional).
          provide: getDataSourceToken(),
          useValue: {
            transaction: jest.fn(
              async (cb: (m: unknown) => Promise<unknown>) => cb(mockManager)
            ),
          },
        },
        {
          provide: WebSocketEmitterService,
          useValue: {
            emitNewRawSignal: jest.fn(),
            emitToAll: jest.fn(),
          },
        },
        {
          provide: AreaDowntimeService,
          useValue: {
            handleEventForAreaDowntime: jest.fn(),
          },
        },
        {
          provide: AlertCronService,
          useValue: {
            processClosedEvent: jest.fn(),
          },
        },
        {
          provide: ModuleRef,
          useValue: mockModuleRef,
        },
      ],
    }).compile();

    service = module.get<SignalService>(SignalService);
    rawSignalRepository = module.get(RawSignalRepository);
    processedSignalRepository = module.get(ProcessedSignalRepository);
    deviceRepository = module.get(DeviceRepository);
    deviceSignalRepository = module.get(DeviceSignalRepository);
    eventRepository = module.get(TypeOrmEventRepository);
    eventSliceRepository = module.get(EventScheduledDowntimeSliceRepository);
    webSocketEmitterService = module.get(WebSocketEmitterService);
    areaDowntimeService = module.get(AreaDowntimeService);
    alertCronService = module.get(AlertCronService);
    areaTorretaSignalService =
      mockAreaTorretaSignalService as jest.Mocked<AreaTorretaSignalService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processSignal', () => {
    const externalId = 'DEV001';
    const value = 'VAL001';

    it('should create RawSignal when valid data is provided', async () => {
      // Arrange
      const mockRawSignal = createMockRawSignal({ externalId, value });
      rawSignalRepository.create.mockResolvedValue(mockRawSignal);
      deviceRepository.findByExternalId.mockResolvedValue(null);
      deviceSignalRepository.findByExternalValueId.mockResolvedValue(null);
      processedSignalRepository.create.mockResolvedValue(
        createMockProcessedSignal()
      );
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);

      // Act
      const result = await service.processSignal(externalId, value);

      // Assert
      expect(result).toEqual(mockRawSignal);
      expect(rawSignalRepository.create).toHaveBeenCalledWith({
        externalId,
        value,
      });
    });

    it('should process device relation when device exists', async () => {
      // Arrange
      const mockDevice = createMockDevice({ externalId });
      const mockRawSignal = createMockRawSignal({ externalId, value });
      const mockDeviceSignal = createMockDeviceSignal({
        externalValueId: value,
        deviceId: mockDevice.id,
      });
      const mockProcessedSignal = createMockProcessedSignal({
        deviceId: mockDevice.id,
        deviceName: mockDevice.name,
        deviceSignalId: mockDeviceSignal.id,
        deviceSignalName: mockDeviceSignal.name,
      });

      rawSignalRepository.create.mockResolvedValue(mockRawSignal);
      deviceRepository.findByExternalId.mockResolvedValue(mockDevice);
      deviceSignalRepository.findByExternalValueIdAndDeviceId.mockResolvedValue(
        mockDeviceSignal
      );
      processedSignalRepository.create.mockResolvedValue(mockProcessedSignal);
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);

      // Act
      await service.processSignal(externalId, value);

      // Assert
      expect(deviceRepository.findByExternalId).toHaveBeenCalledWith(
        externalId
      );
      expect(
        deviceSignalRepository.findByExternalValueIdAndDeviceId
      ).toHaveBeenCalledWith(value, mockDevice.id);
      expect(processedSignalRepository.create).toHaveBeenCalledWith({
        deviceId: mockDevice.id,
        deviceName: mockDevice.name,
        deviceSignalId: mockDeviceSignal.id,
        deviceSignalName: mockDeviceSignal.name,
      });
    });

    it('should process device relation when device does not exist', async () => {
      // Arrange
      const mockRawSignal = createMockRawSignal({ externalId, value });
      const mockDeviceSignal = createMockDeviceSignal({
        externalValueId: value,
      });
      const mockProcessedSignal = createMockProcessedSignal({
        deviceSignalId: mockDeviceSignal.id,
        deviceSignalName: mockDeviceSignal.name,
      });

      rawSignalRepository.create.mockResolvedValue(mockRawSignal);
      deviceRepository.findByExternalId.mockResolvedValue(null);
      deviceSignalRepository.findByExternalValueId.mockResolvedValue(
        mockDeviceSignal
      );
      processedSignalRepository.create.mockResolvedValue(mockProcessedSignal);
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);

      // Act
      await service.processSignal(externalId, value);

      // Assert
      expect(deviceSignalRepository.findByExternalValueId).toHaveBeenCalledWith(
        value
      );
      expect(processedSignalRepository.create).toHaveBeenCalledWith({
        deviceSignalId: mockDeviceSignal.id,
        deviceSignalName: mockDeviceSignal.name,
      });
    });

    it('should emit WebSocket event after saving', async () => {
      // Arrange
      const mockRawSignal = createMockRawSignal({ externalId, value });
      rawSignalRepository.create.mockResolvedValue(mockRawSignal);
      deviceRepository.findByExternalId.mockResolvedValue(null);
      deviceSignalRepository.findByExternalValueId.mockResolvedValue(null);
      processedSignalRepository.create.mockResolvedValue(
        createMockProcessedSignal()
      );
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);

      // Act
      await service.processSignal(externalId, value);

      // Assert
      expect(webSocketEmitterService.emitNewRawSignal).toHaveBeenCalledWith({
        id: mockRawSignal.id,
        externalId: mockRawSignal.externalId,
        value: mockRawSignal.value,
        createdAt: mockRawSignal.createdAt,
      });
    });

    it('should handle event logic after processing signal', async () => {
      // Arrange
      const mockDevice = createMockDevice({ externalId });
      const mockDeviceSignal = createMockDeviceSignal({
        externalValueId: value,
        deviceId: mockDevice.id,
      });
      const mockRawSignal = createMockRawSignal({ externalId, value });
      const mockEvent = createMockEvent({
        id: 1,
        deviceId: mockDevice.id,
        deviceSignalId: mockDeviceSignal.id,
      });

      rawSignalRepository.create.mockResolvedValue(mockRawSignal);
      deviceRepository.findByExternalId.mockResolvedValue(mockDevice);
      deviceSignalRepository.findByExternalValueIdAndDeviceId.mockResolvedValue(
        mockDeviceSignal
      );
      processedSignalRepository.create.mockResolvedValue(
        createMockProcessedSignal()
      );
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service.processSignal(externalId, value);

      // Assert
      expect(eventRepository.findOpenByDeviceAndSignal).toHaveBeenCalledWith(
        mockDevice.id,
        mockDeviceSignal.id
      );
      expect(
        eventRepository.findInProgressByDeviceAndSignal
      ).toHaveBeenCalledWith(mockDevice.id, mockDeviceSignal.id);
    });

    it('should continue processing when WebSocket emission fails', async () => {
      // Arrange
      const mockRawSignal = createMockRawSignal({ externalId, value });
      rawSignalRepository.create.mockResolvedValue(mockRawSignal);
      deviceRepository.findByExternalId.mockResolvedValue(null);
      deviceSignalRepository.findByExternalValueId.mockResolvedValue(null);
      processedSignalRepository.create.mockResolvedValue(
        createMockProcessedSignal()
      );
      webSocketEmitterService.emitNewRawSignal.mockImplementation(() => {
        throw new Error('WebSocket error');
      });
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);

      // Act
      const result = await service.processSignal(externalId, value);

      // Assert
      expect(result).toEqual(mockRawSignal);
      expect(webSocketEmitterService.emitNewRawSignal).toHaveBeenCalled();
    });

    it('should throw error when RawSignal creation fails', async () => {
      // Arrange
      const error = new Error('Database error');
      rawSignalRepository.create.mockRejectedValue(error);

      // Act & Assert
      await expect(service.processSignal(externalId, value)).rejects.toThrow(
        error
      );
    });

    it('should continue processing when processSignalWithDeviceRelation fails', async () => {
      // Arrange
      const mockRawSignal = createMockRawSignal({ externalId, value });
      rawSignalRepository.create.mockResolvedValue(mockRawSignal);
      deviceRepository.findByExternalId.mockRejectedValue(
        new Error('Device error')
      );
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);

      // Act
      const result = await service.processSignal(externalId, value);

      // Assert
      expect(result).toEqual(mockRawSignal);
    });
  });

  describe('processVirtualDeviceSignal', () => {
    const externalId = 'DEV001';
    const value = 'VAL001';
    const reason = 'Test reason';
    const comment = 'Test comment';

    it('should create RawSignal with virtualDevice flag', async () => {
      // Arrange
      const mockRawSignal = createMockRawSignal({ externalId, value });
      rawSignalRepository.create.mockResolvedValue(mockRawSignal);
      deviceRepository.findByExternalId.mockResolvedValue(null);
      deviceSignalRepository.findByExternalValueId.mockResolvedValue(null);
      processedSignalRepository.create.mockResolvedValue(
        createMockProcessedSignal()
      );
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);

      // Act
      const result = await service.processVirtualDeviceSignal(
        externalId,
        value,
        reason,
        comment
      );

      // Assert
      expect(result).toEqual(mockRawSignal);
      expect(rawSignalRepository.create).toHaveBeenCalledWith({
        externalId,
        value,
        virtualDevice: true,
        reason,
        comment,
      });
    });

    it('should include reason when provided', async () => {
      // Arrange
      const mockRawSignal = createMockRawSignal({ externalId, value });
      rawSignalRepository.create.mockResolvedValue(mockRawSignal);
      deviceRepository.findByExternalId.mockResolvedValue(null);
      deviceSignalRepository.findByExternalValueId.mockResolvedValue(null);
      processedSignalRepository.create.mockResolvedValue(
        createMockProcessedSignal()
      );
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);

      // Act
      await service.processVirtualDeviceSignal(externalId, value, reason);

      // Assert
      expect(rawSignalRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reason,
        })
      );
    });

    it('should include comment when provided', async () => {
      // Arrange
      const mockRawSignal = createMockRawSignal({ externalId, value });
      rawSignalRepository.create.mockResolvedValue(mockRawSignal);
      deviceRepository.findByExternalId.mockResolvedValue(null);
      deviceSignalRepository.findByExternalValueId.mockResolvedValue(null);
      processedSignalRepository.create.mockResolvedValue(
        createMockProcessedSignal()
      );
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);

      // Act
      await service.processVirtualDeviceSignal(
        externalId,
        value,
        undefined,
        comment
      );

      // Assert
      expect(rawSignalRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          comment,
        })
      );
    });

    it('should handle event logic for virtual device', async () => {
      // Arrange
      const mockDevice = createMockDevice({ externalId });
      const mockDeviceSignal = createMockDeviceSignal({
        externalValueId: value,
        deviceId: mockDevice.id,
      });
      const mockRawSignal = createMockRawSignal({ externalId, value });
      const mockEvent = createMockEvent({
        deviceId: mockDevice.id,
        deviceSignalId: mockDeviceSignal.id,
        virtualDevice: true,
        reason,
        comment,
      });

      rawSignalRepository.create.mockResolvedValue(mockRawSignal);
      deviceRepository.findByExternalId.mockResolvedValue(mockDevice);
      deviceSignalRepository.findByExternalValueIdAndDeviceId.mockResolvedValue(
        mockDeviceSignal
      );
      processedSignalRepository.create.mockResolvedValue(
        createMockProcessedSignal()
      );
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service.processVirtualDeviceSignal(
        externalId,
        value,
        reason,
        comment
      );

      // Assert
      expect(eventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          virtualDevice: true,
          reason,
          comment,
        })
      );
    });
  });

  describe('getAllSignals', () => {
    it('should return paginated list of RawSignals', async () => {
      // Arrange
      const mockSignals = [
        createMockRawSignal({ id: 1 }),
        createMockRawSignal({ id: 2 }),
      ];
      rawSignalRepository.findAll.mockResolvedValue({
        data: mockSignals,
        total: 2,
      });

      // Act
      const result = await service.getAllSignals();

      // Assert
      expect(result.data).toEqual(mockSignals);
      expect(result.total).toBe(2);
      expect(rawSignalRepository.findAll).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const filters = {
        externalId: 'DEV001',
        limit: 20,
        offset: 10,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };
      const mockSignals = [createMockRawSignal()];
      rawSignalRepository.findAll.mockResolvedValue({
        data: mockSignals,
        total: 1,
      });

      // Act
      await service.getAllSignals(filters);

      // Assert
      expect(rawSignalRepository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const error = new Error('Repository error');
      rawSignalRepository.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getAllSignals()).rejects.toThrow(error);
    });
  });

  describe('getSignalById', () => {
    it('should return RawSignal when found', async () => {
      // Arrange
      const id = 1;
      const mockSignal = createMockRawSignal({ id });
      rawSignalRepository.findById.mockResolvedValue(mockSignal);

      // Act
      const result = await service.getSignalById(id);

      // Assert
      expect(result).toEqual(mockSignal);
      expect(rawSignalRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should return null when not found', async () => {
      // Arrange
      const id = 999;
      rawSignalRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.getSignalById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const id = 1;
      const error = new Error('Repository error');
      rawSignalRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getSignalById(id)).rejects.toThrow(error);
    });
  });

  describe('getSignalsByExternalId', () => {
    it('should return array of RawSignals for externalId', async () => {
      // Arrange
      const externalId = 'DEV001';
      const mockSignals = [
        createMockRawSignal({ externalId }),
        createMockRawSignal({ externalId }),
      ];
      rawSignalRepository.findByExternalId.mockResolvedValue(mockSignals);

      // Act
      const result = await service.getSignalsByExternalId(externalId);

      // Assert
      expect(result).toEqual(mockSignals);
      expect(rawSignalRepository.findByExternalId).toHaveBeenCalledWith(
        externalId
      );
    });

    it('should return empty array when no signals found', async () => {
      // Arrange
      const externalId = 'NONEXISTENT';
      rawSignalRepository.findByExternalId.mockResolvedValue([]);

      // Act
      const result = await service.getSignalsByExternalId(externalId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const externalId = 'DEV001';
      const error = new Error('Repository error');
      rawSignalRepository.findByExternalId.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getSignalsByExternalId(externalId)).rejects.toThrow(
        error
      );
    });
  });

  describe('getSignalsCount', () => {
    it('should return total count of RawSignals', async () => {
      // Arrange
      const count = 100;
      rawSignalRepository.count.mockResolvedValue(count);

      // Act
      const result = await service.getSignalsCount();

      // Assert
      expect(result).toBe(count);
      expect(rawSignalRepository.count).toHaveBeenCalled();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const error = new Error('Repository error');
      rawSignalRepository.count.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getSignalsCount()).rejects.toThrow(error);
    });
  });

  describe('getAllProcessedSignals', () => {
    it('should return paginated list of ProcessedSignals', async () => {
      // Arrange
      const mockSignals = [
        createMockProcessedSignal({ id: 1 }),
        createMockProcessedSignal({ id: 2 }),
      ];
      processedSignalRepository.findAll.mockResolvedValue({
        data: mockSignals,
        total: 2,
      });

      // Act
      const result = await service.getAllProcessedSignals();

      // Assert
      expect(result.data).toEqual(mockSignals);
      expect(result.total).toBe(2);
      expect(processedSignalRepository.findAll).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const filters = {
        deviceId: 1,
        deviceSignalId: 2,
        limit: 20,
        offset: 10,
      };
      const mockSignals = [createMockProcessedSignal()];
      processedSignalRepository.findAll.mockResolvedValue({
        data: mockSignals,
        total: 1,
      });

      // Act
      await service.getAllProcessedSignals(filters);

      // Assert
      expect(processedSignalRepository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const error = new Error('Repository error');
      processedSignalRepository.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getAllProcessedSignals()).rejects.toThrow(error);
    });
  });

  describe('getProcessedSignalsByDeviceId', () => {
    it('should return array of ProcessedSignals for deviceId', async () => {
      // Arrange
      const deviceId = 1;
      const mockSignals = [
        createMockProcessedSignal({ deviceId }),
        createMockProcessedSignal({ deviceId }),
      ];
      processedSignalRepository.findByDeviceId.mockResolvedValue(mockSignals);

      // Act
      const result = await service.getProcessedSignalsByDeviceId(deviceId);

      // Assert
      expect(result).toEqual(mockSignals);
      expect(processedSignalRepository.findByDeviceId).toHaveBeenCalledWith(
        deviceId
      );
    });

    it('should return empty array when no signals found', async () => {
      // Arrange
      const deviceId = 999;
      processedSignalRepository.findByDeviceId.mockResolvedValue([]);

      // Act
      const result = await service.getProcessedSignalsByDeviceId(deviceId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const deviceId = 1;
      const error = new Error('Repository error');
      processedSignalRepository.findByDeviceId.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.getProcessedSignalsByDeviceId(deviceId)
      ).rejects.toThrow(error);
    });
  });

  describe('getProcessedSignalsByDeviceSignalId', () => {
    it('should return array of ProcessedSignals for deviceSignalId', async () => {
      // Arrange
      const deviceSignalId = 1;
      const mockSignals = [
        createMockProcessedSignal({ deviceSignalId }),
        createMockProcessedSignal({ deviceSignalId }),
      ];
      processedSignalRepository.findByDeviceSignalId.mockResolvedValue(
        mockSignals
      );

      // Act
      const result =
        await service.getProcessedSignalsByDeviceSignalId(deviceSignalId);

      // Assert
      expect(result).toEqual(mockSignals);
      expect(
        processedSignalRepository.findByDeviceSignalId
      ).toHaveBeenCalledWith(deviceSignalId);
    });

    it('should return empty array when no signals found', async () => {
      // Arrange
      const deviceSignalId = 999;
      processedSignalRepository.findByDeviceSignalId.mockResolvedValue([]);

      // Act
      const result =
        await service.getProcessedSignalsByDeviceSignalId(deviceSignalId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const deviceSignalId = 1;
      const error = new Error('Repository error');
      processedSignalRepository.findByDeviceSignalId.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.getProcessedSignalsByDeviceSignalId(deviceSignalId)
      ).rejects.toThrow(error);
    });
  });

  describe('getProcessedSignalsCount', () => {
    it('should return total count of ProcessedSignals', async () => {
      // Arrange
      const count = 50;
      processedSignalRepository.count.mockResolvedValue(count);

      // Act
      const result = await service.getProcessedSignalsCount();

      // Assert
      expect(result).toBe(count);
      expect(processedSignalRepository.count).toHaveBeenCalled();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const error = new Error('Repository error');
      processedSignalRepository.count.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getProcessedSignalsCount()).rejects.toThrow(error);
    });
  });

  describe('handleEventLogic', () => {
    const externalId = 'DEV001';
    const value = 'VAL001';

    it('should return early when device not found', async () => {
      // Arrange
      deviceRepository.findByExternalId.mockResolvedValue(null);

      // Act
      await service['handleEventLogic'](externalId, value);

      // Assert
      expect(eventRepository.findOpenByDeviceAndSignal).not.toHaveBeenCalled();
    });

    it('should return early when deviceSignal not found', async () => {
      // Arrange
      const mockDevice = createMockDevice({ externalId });
      deviceRepository.findByExternalId.mockResolvedValue(mockDevice);
      deviceSignalRepository.findByExternalValueIdAndDeviceId.mockResolvedValue(
        null
      );

      // Act
      await service['handleEventLogic'](externalId, value);

      // Assert
      expect(eventRepository.findOpenByDeviceAndSignal).not.toHaveBeenCalled();
    });

    it('should close existing IN_PROGRESS event when exists', async () => {
      // Arrange
      const mockDevice = createMockDevice({ externalId });
      const mockDeviceSignal = createMockDeviceSignal({
        externalValueId: value,
        deviceId: mockDevice.id,
      });
      const mockInProgressEvent = createMockEvent({
        deviceId: mockDevice.id,
        deviceSignalId: mockDeviceSignal.id,
        status: EventStatus.IN_PROGRESS,
      });
      const mockClosedEvent = createMockEvent({
        ...mockInProgressEvent,
        status: EventStatus.CLOSED,
        durationSeconds: 100,
      });

      deviceRepository.findByExternalId.mockResolvedValue(mockDevice);
      deviceSignalRepository.findByExternalValueIdAndDeviceId.mockResolvedValue(
        mockDeviceSignal
      );
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(
        mockInProgressEvent
      );
      eventRepository.findById.mockResolvedValue(mockClosedEvent);

      // Act
      await service['handleEventLogic'](externalId, value);

      // Assert
      expect(
        eventRepository.findInProgressByDeviceAndSignal
      ).toHaveBeenCalledWith(mockDevice.id, mockDeviceSignal.id);
      // El cierre ahora es transaccional: evento + rebanadas en la misma tx.
      expect(mockManager.update).toHaveBeenCalledWith(
        Event,
        mockInProgressEvent.id,
        expect.objectContaining({
          status: EventStatus.CLOSED,
          durationSeconds: expect.any(Number) as unknown as number,
        })
      );
    });

    it('should set OPEN event to IN_PROGRESS when exists', async () => {
      // Arrange
      const mockDevice = createMockDevice({ externalId });
      const mockDeviceSignal = createMockDeviceSignal({
        externalValueId: value,
        deviceId: mockDevice.id,
      });
      const mockOpenEvent = createMockEvent({
        deviceId: mockDevice.id,
        deviceSignalId: mockDeviceSignal.id,
        status: EventStatus.OPEN,
      });
      const mockInProgressEvent = createMockEvent({
        ...mockOpenEvent,
        status: EventStatus.IN_PROGRESS,
      });

      deviceRepository.findByExternalId.mockResolvedValue(mockDevice);
      deviceSignalRepository.findByExternalValueIdAndDeviceId.mockResolvedValue(
        mockDeviceSignal
      );
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(
        mockOpenEvent
      );
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.updateStatus.mockResolvedValue(mockInProgressEvent);

      // Act
      await service['handleEventLogic'](externalId, value);

      // Assert
      expect(eventRepository.updateStatus).toHaveBeenCalledWith(
        mockOpenEvent.id,
        EventStatus.IN_PROGRESS
      );
    });

    it('should create new event when none exists', async () => {
      // Arrange
      const mockDevice = createMockDevice({ externalId });
      const mockDeviceSignal = createMockDeviceSignal({
        externalValueId: value,
        deviceId: mockDevice.id,
      });
      const mockEvent = createMockEvent({
        id: 1,
        deviceId: mockDevice.id,
        deviceSignalId: mockDeviceSignal.id,
      });

      deviceRepository.findByExternalId.mockResolvedValue(mockDevice);
      deviceSignalRepository.findByExternalValueIdAndDeviceId.mockResolvedValue(
        mockDeviceSignal
      );
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service['handleEventLogic'](externalId, value);

      // Assert
      expect(eventRepository.create).toHaveBeenCalledWith({
        areaId: mockDevice.areaId,
        areaName: mockDevice.area?.name ?? 'Unknown Area',
        departmentId: mockDeviceSignal.departmentId || 1,
        departmentName:
          mockDeviceSignal.department?.name ?? 'Unknown Department',
        deviceId: mockDevice.id,
        deviceName: mockDevice.name,
        deviceSignalId: mockDeviceSignal.id,
        deviceSignalName: mockDeviceSignal.name,
      });
    });
  });

  describe('createNewEvent', () => {
    it('should create event with correct data', async () => {
      // Arrange
      const mockDevice = createMockDevice();
      const mockDeviceSignal = createMockDeviceSignal();
      const mockEvent = createMockEvent({
        id: 1,
        deviceId: mockDevice.id,
        deviceSignalId: mockDeviceSignal.id,
      });

      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service['createNewEvent'](mockDevice, mockDeviceSignal);

      // Assert
      expect(eventRepository.create).toHaveBeenCalledWith({
        areaId: mockDevice.areaId,
        areaName: mockDevice.area?.name ?? 'Unknown Area',
        departmentId: mockDeviceSignal.departmentId || 1,
        departmentName:
          mockDeviceSignal.department?.name ?? 'Unknown Department',
        deviceId: mockDevice.id,
        deviceName: mockDevice.name,
        deviceSignalId: mockDeviceSignal.id,
        deviceSignalName: mockDeviceSignal.name,
      });
    });

    it('should use Unknown Area when device.area is null', async () => {
      // Arrange
      const mockDevice = createMockDevice({ area: undefined });
      const mockDeviceSignal = createMockDeviceSignal();
      const mockEvent = createMockEvent({ id: 1 });

      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service['createNewEvent'](mockDevice, mockDeviceSignal);

      // Assert
      expect(eventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          areaName: 'Unknown Area',
        })
      );
    });

    it('should use Unknown Department when deviceSignal.department is null', async () => {
      // Arrange
      const mockDevice = createMockDevice();
      const mockDeviceSignal = createMockDeviceSignal({
        department: undefined,
      });
      const mockEvent = createMockEvent({ id: 1 });

      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service['createNewEvent'](mockDevice, mockDeviceSignal);

      // Assert
      expect(eventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          departmentName: 'Unknown Department',
        })
      );
    });

    it('should call areaDowntimeService.handleEventForAreaDowntime', async () => {
      // Arrange
      const mockDevice = createMockDevice();
      const mockDeviceSignal = createMockDeviceSignal();
      const mockEvent = createMockEvent({ id: 1 });

      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service['createNewEvent'](mockDevice, mockDeviceSignal);

      // Assert
      expect(
        areaDowntimeService.handleEventForAreaDowntime
      ).toHaveBeenCalledWith(mockEvent);
    });

    it('should emit WebSocket new-event', async () => {
      // Arrange
      const mockDevice = createMockDevice();
      const mockDeviceSignal = createMockDeviceSignal();
      const mockEvent = createMockEvent();

      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service['createNewEvent'](mockDevice, mockDeviceSignal);

      // Assert
      expect(webSocketEmitterService.emitToAll).toHaveBeenCalledWith(
        'new-event',
        {
          area: mockEvent.areaName,
          department: mockEvent.departmentName,
          status: mockEvent.status,
          device: mockEvent.deviceName,
          signal: mockEvent.deviceSignalName,
        }
      );
    });

    it('should call areaTorretaSignalService.processEventForAreaTorretas', async () => {
      // Arrange
      const mockDevice = createMockDevice();
      const mockDeviceSignal = createMockDeviceSignal();
      const mockEvent = createMockEvent({ id: 1 });

      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service['createNewEvent'](mockDevice, mockDeviceSignal);

      // Assert
      expect(
        areaTorretaSignalService.processEventForAreaTorretas
      ).toHaveBeenCalledWith(mockEvent);
    });

    it('should continue when areaDowntimeService fails', async () => {
      // Arrange
      const mockDevice = createMockDevice();
      const mockDeviceSignal = createMockDeviceSignal();
      const mockEvent = createMockEvent({ id: 1 });

      eventRepository.create.mockResolvedValue(mockEvent);
      areaDowntimeService.handleEventForAreaDowntime.mockRejectedValue(
        new Error('Downtime error')
      );

      // Act
      await service['createNewEvent'](mockDevice, mockDeviceSignal);

      // Assert
      expect(webSocketEmitterService.emitToAll).toHaveBeenCalled();
    });

    it('should continue when areaTorretaSignalService fails', async () => {
      // Arrange
      const mockDevice = createMockDevice();
      const mockDeviceSignal = createMockDeviceSignal();
      const mockEvent = createMockEvent();

      eventRepository.create.mockResolvedValue(mockEvent);
      areaTorretaSignalService.processEventForAreaTorretas.mockRejectedValue(
        new Error('Torreta error')
      );

      // Act
      await service['createNewEvent'](mockDevice, mockDeviceSignal);

      // Assert
      expect(webSocketEmitterService.emitToAll).toHaveBeenCalled();
    });
  });

  describe('setEventInProgress', () => {
    it('should update event status to IN_PROGRESS', async () => {
      // Arrange
      const mockEvent = createMockEvent({ status: EventStatus.OPEN });
      const mockUpdatedEvent = createMockEvent({
        ...mockEvent,
        status: EventStatus.IN_PROGRESS,
      });

      eventRepository.updateStatus.mockResolvedValue(mockUpdatedEvent);

      // Act
      await service['setEventInProgress'](mockEvent);

      // Assert
      expect(eventRepository.updateStatus).toHaveBeenCalledWith(
        mockEvent.id,
        EventStatus.IN_PROGRESS
      );
    });

    it('should call areaDowntimeService.handleEventForAreaDowntime', async () => {
      // Arrange
      const mockEvent = createMockEvent();
      const mockUpdatedEvent = createMockEvent({
        ...mockEvent,
        status: EventStatus.IN_PROGRESS,
      });

      eventRepository.updateStatus.mockResolvedValue(mockUpdatedEvent);

      // Act
      await service['setEventInProgress'](mockEvent);

      // Assert
      expect(
        areaDowntimeService.handleEventForAreaDowntime
      ).toHaveBeenCalledWith(mockUpdatedEvent);
    });

    it('should emit WebSocket event-updated', async () => {
      // Arrange
      const mockEvent = createMockEvent();
      const mockUpdatedEvent = createMockEvent({
        ...mockEvent,
        status: EventStatus.IN_PROGRESS,
      });

      eventRepository.updateStatus.mockResolvedValue(mockUpdatedEvent);

      // Act
      await service['setEventInProgress'](mockEvent);

      // Assert
      expect(webSocketEmitterService.emitToAll).toHaveBeenCalledWith(
        'event-updated',
        {
          eventId: mockUpdatedEvent.id,
          status: mockUpdatedEvent.status,
          area: mockUpdatedEvent.areaName,
          department: mockUpdatedEvent.departmentName,
        }
      );
    });

    it('should call areaTorretaSignalService.processEventForAreaTorretas', async () => {
      // Arrange
      const mockEvent = createMockEvent();
      const mockUpdatedEvent = createMockEvent({
        ...mockEvent,
        status: EventStatus.IN_PROGRESS,
      });

      eventRepository.updateStatus.mockResolvedValue(mockUpdatedEvent);

      // Act
      await service['setEventInProgress'](mockEvent);

      // Assert
      expect(
        areaTorretaSignalService.processEventForAreaTorretas
      ).toHaveBeenCalledWith(mockUpdatedEvent);
    });
  });

  describe('closeEvent', () => {
    it('should calculate durationSeconds correctly', async () => {
      // Arrange
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const mockEvent = createMockEvent({ createdAt });
      const mockClosedEvent = createMockEvent({
        ...mockEvent,
        status: EventStatus.CLOSED,
        durationSeconds: 100,
      });

      eventRepository.findById.mockResolvedValue(mockClosedEvent);

      // Act
      await service['closeEvent'](mockEvent);

      // Assert
      expect(mockManager.update).toHaveBeenCalledWith(
        Event,
        mockEvent.id,
        expect.objectContaining({
          status: EventStatus.CLOSED,
          durationSeconds: expect.any(Number) as unknown as number,
        })
      );
      // Verify durationSeconds is a non-negative number
      const callArgs = mockManager.update.mock.calls[0] as [
        unknown,
        number,
        Partial<Event>,
      ];
      expect(callArgs[2].durationSeconds).toBeGreaterThanOrEqual(0);
      // Evento y rebanadas se escriben juntos.
      expect(eventSliceRepository.createMany).toHaveBeenCalled();
    });

    it('should update event status to CLOSED with durationSeconds', async () => {
      // Arrange
      const mockEvent = createMockEvent({ status: EventStatus.IN_PROGRESS });
      const mockClosedEvent = createMockEvent({
        ...mockEvent,
        status: EventStatus.CLOSED,
        durationSeconds: 100,
      });

      eventRepository.findById.mockResolvedValue(mockClosedEvent);

      // Act
      await service['closeEvent'](mockEvent);

      // Assert
      expect(mockManager.update).toHaveBeenCalledWith(
        Event,
        mockEvent.id,
        expect.objectContaining({
          status: EventStatus.CLOSED,
          durationSeconds: expect.any(Number) as unknown as number,
        })
      );
    });

    it('should call areaDowntimeService.handleEventForAreaDowntime', async () => {
      // Arrange
      const mockEvent = createMockEvent();
      const mockClosedEvent = createMockEvent({
        ...mockEvent,
        status: EventStatus.CLOSED,
      });

      eventRepository.findById.mockResolvedValue(mockClosedEvent);

      // Act
      await service['closeEvent'](mockEvent);

      // Assert
      expect(
        areaDowntimeService.handleEventForAreaDowntime
      ).toHaveBeenCalledWith(mockClosedEvent);
    });

    it('should emit WebSocket closed-event with duration', async () => {
      // Arrange
      const mockEvent = createMockEvent();
      const mockClosedEvent = createMockEvent({
        ...mockEvent,
        status: EventStatus.CLOSED,
        durationSeconds: 100,
      });

      eventRepository.findById.mockResolvedValue(mockClosedEvent);

      // Act
      await service['closeEvent'](mockEvent);

      // Assert
      expect(webSocketEmitterService.emitToAll).toHaveBeenCalledWith(
        'closed-event',
        expect.objectContaining({
          eventId: mockClosedEvent.id,
          area: mockClosedEvent.areaName,
          department: mockClosedEvent.departmentName,
          status: mockClosedEvent.status,
          duration: expect.any(Number) as unknown as number,
        } as Partial<Event>)
      );
    });

    it('should call alertCronService.processClosedEvent', async () => {
      // Arrange
      const mockEvent = createMockEvent();
      const mockClosedEvent = createMockEvent({
        ...mockEvent,
        status: EventStatus.CLOSED,
      });

      eventRepository.findById.mockResolvedValue(mockClosedEvent);

      // Act
      await service['closeEvent'](mockEvent);

      // Assert
      expect(alertCronService.processClosedEvent).toHaveBeenCalledWith(
        mockClosedEvent
      );
    });

    it('should call areaTorretaSignalService.processEventForAreaTorretas', async () => {
      // Arrange
      const mockEvent = createMockEvent();
      const mockClosedEvent = createMockEvent({
        ...mockEvent,
        status: EventStatus.CLOSED,
      });

      eventRepository.findById.mockResolvedValue(mockClosedEvent);

      // Act
      await service['closeEvent'](mockEvent);

      // Assert
      expect(
        areaTorretaSignalService.processEventForAreaTorretas
      ).toHaveBeenCalledWith(mockClosedEvent);
    });
  });

  describe('handleEventLogic (virtual device context)', () => {
    const externalId = 'DEV001';
    const value = 'VAL001';
    const reason = 'Test reason';
    const comment = 'Test comment';

    it('should return early when device not found', async () => {
      // Arrange
      deviceRepository.findByExternalId.mockResolvedValue(null);

      // Act
      await service['handleEventLogic'](externalId, value, {
        virtualDevice: true,
        reason,
        comment,
      });

      // Assert
      expect(eventRepository.findOpenByDeviceAndSignal).not.toHaveBeenCalled();
    });

    it('should create new virtual device event when none exists', async () => {
      // Arrange
      const mockDevice = createMockDevice({ externalId });
      const mockDeviceSignal = createMockDeviceSignal({
        externalValueId: value,
        deviceId: mockDevice.id,
      });
      const mockEvent = createMockEvent({
        id: 1,
        deviceId: mockDevice.id,
        deviceSignalId: mockDeviceSignal.id,
        virtualDevice: true,
        reason,
        comment,
      });

      deviceRepository.findByExternalId.mockResolvedValue(mockDevice);
      deviceSignalRepository.findByExternalValueIdAndDeviceId.mockResolvedValue(
        mockDeviceSignal
      );
      eventRepository.findOpenByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.findInProgressByDeviceAndSignal.mockResolvedValue(null);
      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service['handleEventLogic'](externalId, value, {
        virtualDevice: true,
        reason,
        comment,
      });

      // Assert
      expect(eventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          virtualDevice: true,
          reason,
          comment,
        })
      );
    });
  });

  describe('createNewEvent (virtual device context)', () => {
    it('should create event with virtualDevice flag', async () => {
      // Arrange
      const mockDevice = createMockDevice();
      const mockDeviceSignal = createMockDeviceSignal();
      const reason = 'Test reason';
      const comment = 'Test comment';
      const mockEvent = createMockEvent({
        id: 1,
        virtualDevice: true,
        reason,
        comment,
      });

      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service['createNewEvent'](mockDevice, mockDeviceSignal, {
        virtualDevice: true,
        reason,
        comment,
      });

      // Assert
      expect(eventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          virtualDevice: true,
          reason,
          comment,
        })
      );
    });

    it('should call areaDowntimeService.handleEventForAreaDowntime', async () => {
      // Arrange
      const mockDevice = createMockDevice();
      const mockDeviceSignal = createMockDeviceSignal();
      const mockEvent = createMockEvent({ id: 1, virtualDevice: true });

      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service['createNewEvent'](mockDevice, mockDeviceSignal, {
        virtualDevice: true,
      });

      // Assert
      expect(
        areaDowntimeService.handleEventForAreaDowntime
      ).toHaveBeenCalledWith(mockEvent);
    });

    it('should emit WebSocket new-event', async () => {
      // Arrange
      const mockDevice = createMockDevice();
      const mockDeviceSignal = createMockDeviceSignal();
      const mockEvent = createMockEvent({ id: 1, virtualDevice: true });

      eventRepository.create.mockResolvedValue(mockEvent);

      // Act
      await service['createNewEvent'](mockDevice, mockDeviceSignal, {
        virtualDevice: true,
      });

      // Assert
      expect(webSocketEmitterService.emitToAll).toHaveBeenCalledWith(
        'new-event',
        {
          area: mockEvent.areaName,
          department: mockEvent.departmentName,
          status: mockEvent.status,
          device: mockEvent.deviceName,
          signal: mockEvent.deviceSignalName,
        }
      );
    });
  });
});
