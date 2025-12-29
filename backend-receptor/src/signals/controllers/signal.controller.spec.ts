import { Test, type TestingModule } from '@nestjs/testing';
import { SignalController } from './signal.controller';
import { SignalService } from '../application/services/signal.service';
import { createMockRawSignal } from '../../test-helpers';

describe('SignalController', () => {
  let controller: SignalController;
  let service: jest.Mocked<SignalService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignalController],
      providers: [
        {
          provide: SignalService,
          useValue: {
            processSignal: jest.fn(),
            processVirtualDeviceSignal: jest.fn(),
            getAllSignals: jest.fn(),
            getSignalById: jest.fn(),
            getSignalsByExternalId: jest.fn(),
            getSignalsCount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SignalController>(SignalController);
    service = module.get(SignalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSignal', () => {
    it('should return 201 when signal is processed successfully', async () => {
      // Arrange
      const signalDto = { id: 'DEV001', value: 'VAL001' };
      const mockRawSignal = createMockRawSignal({
        externalId: signalDto.id,
        value: signalDto.value,
      });
      service.processSignal.mockResolvedValue(mockRawSignal);

      // Act
      const result = await controller.createSignal(signalDto);

      // Assert
      expect(result.message).toBe('Signal processed successfully');
      expect(result.data).toEqual(mockRawSignal);
      expect(service.processSignal).toHaveBeenCalledWith(
        signalDto.id,
        signalDto.value
      );
    });

    it('should call service with correct parameters', async () => {
      // Arrange
      const signalDto = { id: 'DEV001', value: 'VAL001' };
      const mockRawSignal = createMockRawSignal();
      service.processSignal.mockResolvedValue(mockRawSignal);

      // Act
      await controller.createSignal(signalDto);

      // Assert
      expect(service.processSignal).toHaveBeenCalledWith(
        signalDto.id,
        signalDto.value
      );
    });
  });

  describe('createVirtualDeviceSignal', () => {
    it('should return 201 when virtual device signal is processed successfully', async () => {
      // Arrange
      const signalDto = {
        id: 'DEV001',
        value: 'VAL001',
        reason: 'Test reason',
        comment: 'Test comment',
      };
      const mockRawSignal = createMockRawSignal({
        externalId: signalDto.id,
        value: signalDto.value,
      });
      service.processVirtualDeviceSignal.mockResolvedValue(mockRawSignal);

      // Act
      const result = await controller.createVirtualDeviceSignal(signalDto);

      // Assert
      expect(result.message).toBe(
        'Virtual device signal processed successfully'
      );
      expect(result.data).toEqual(mockRawSignal);
      expect(service.processVirtualDeviceSignal).toHaveBeenCalledWith(
        signalDto.id,
        signalDto.value,
        signalDto.reason,
        signalDto.comment
      );
    });

    it('should include reason when provided', async () => {
      // Arrange
      const signalDto = {
        id: 'DEV001',
        value: 'VAL001',
        reason: 'Test reason',
      };
      const mockRawSignal = createMockRawSignal();
      service.processVirtualDeviceSignal.mockResolvedValue(mockRawSignal);

      // Act
      await controller.createVirtualDeviceSignal(signalDto);

      // Assert
      expect(service.processVirtualDeviceSignal).toHaveBeenCalledWith(
        signalDto.id,
        signalDto.value,
        signalDto.reason,
        undefined
      );
    });

    it('should include comment when provided', async () => {
      // Arrange
      const signalDto = {
        id: 'DEV001',
        value: 'VAL001',
        comment: 'Test comment',
      };
      const mockRawSignal = createMockRawSignal();
      service.processVirtualDeviceSignal.mockResolvedValue(mockRawSignal);

      // Act
      await controller.createVirtualDeviceSignal(signalDto);

      // Assert
      expect(service.processVirtualDeviceSignal).toHaveBeenCalledWith(
        signalDto.id,
        signalDto.value,
        undefined,
        signalDto.comment
      );
    });

    it('should work without reason and comment', async () => {
      // Arrange
      const signalDto = { id: 'DEV001', value: 'VAL001' };
      const mockRawSignal = createMockRawSignal();
      service.processVirtualDeviceSignal.mockResolvedValue(mockRawSignal);

      // Act
      await controller.createVirtualDeviceSignal(signalDto);

      // Assert
      expect(service.processVirtualDeviceSignal).toHaveBeenCalledWith(
        signalDto.id,
        signalDto.value,
        undefined,
        undefined
      );
    });
  });

  describe('getAllSignals', () => {
    it('should return paginated list of signals', async () => {
      // Arrange
      const mockSignals = [
        createMockRawSignal({ id: 1 }),
        createMockRawSignal({ id: 2 }),
      ];
      service.getAllSignals.mockResolvedValue({
        data: mockSignals,
        total: 2,
      });

      // Act
      const result = await controller.getAllSignals();

      // Assert
      expect(result.message).toBe('Signals retrieved successfully');
      expect(result.data).toEqual(mockSignals);
      expect(result.total).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.total).toBe(2);
    });

    it('should apply externalId filter when provided', async () => {
      // Arrange
      const externalId = 'DEV001';
      const mockSignals = [createMockRawSignal({ externalId })];
      service.getAllSignals.mockResolvedValue({
        data: mockSignals,
        total: 1,
      });

      // Act
      const result = await controller.getAllSignals(externalId);

      // Assert
      expect(service.getAllSignals).toHaveBeenCalledWith({
        externalId,
      });
      expect(result.data).toEqual(mockSignals);
    });

    it('should apply startDate filter when provided', async () => {
      // Arrange
      const startDate = '2024-01-01';
      const mockSignals = [createMockRawSignal()];
      service.getAllSignals.mockResolvedValue({
        data: mockSignals,
        total: 1,
      });

      // Act
      await controller.getAllSignals(
        undefined,
        undefined,
        undefined,
        startDate
      );

      // Assert
      expect(service.getAllSignals).toHaveBeenCalledWith({
        startDate: new Date(startDate),
      });
    });

    it('should apply endDate filter when provided', async () => {
      // Arrange
      const endDate = '2024-12-31';
      const mockSignals = [createMockRawSignal()];
      service.getAllSignals.mockResolvedValue({
        data: mockSignals,
        total: 1,
      });

      // Act
      await controller.getAllSignals(
        undefined,
        undefined,
        undefined,
        undefined,
        endDate
      );

      // Assert
      expect(service.getAllSignals).toHaveBeenCalledWith({
        endDate: new Date(endDate),
      });
    });

    it('should use default limit of 10', async () => {
      // Arrange
      const mockSignals = [createMockRawSignal()];
      service.getAllSignals.mockResolvedValue({
        data: mockSignals,
        total: 1,
      });

      // Act
      const result = await controller.getAllSignals();

      // Assert
      expect(result.pagination.limit).toBe(10);
    });

    it('should use default offset of 0', async () => {
      // Arrange
      const mockSignals = [createMockRawSignal()];
      service.getAllSignals.mockResolvedValue({
        data: mockSignals,
        total: 1,
      });

      // Act
      const result = await controller.getAllSignals();

      // Assert
      expect(result.pagination.offset).toBe(0);
    });

    it('should apply custom limit and offset', async () => {
      // Arrange
      const limit = 20;
      const offset = 10;
      const mockSignals = [createMockRawSignal()];
      service.getAllSignals.mockResolvedValue({
        data: mockSignals,
        total: 1,
      });

      // Act
      await controller.getAllSignals(undefined, limit, offset);

      // Assert
      expect(service.getAllSignals).toHaveBeenCalledWith({
        limit,
        offset,
      });
    });

    it('should apply all filters together', async () => {
      // Arrange
      const externalId = 'DEV001';
      const limit = 20;
      const offset = 10;
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const mockSignals = [createMockRawSignal()];
      service.getAllSignals.mockResolvedValue({
        data: mockSignals,
        total: 1,
      });

      // Act
      await controller.getAllSignals(
        externalId,
        limit,
        offset,
        startDate,
        endDate
      );

      // Assert
      expect(service.getAllSignals).toHaveBeenCalledWith({
        externalId,
        limit,
        offset,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    });
  });

  describe('getSignalsCount', () => {
    it('should return count of signals', async () => {
      // Arrange
      const count = 100;
      service.getSignalsCount.mockResolvedValue(count);

      // Act
      const result = await controller.getSignalsCount();

      // Assert
      expect(result.message).toBe('Signals count retrieved successfully');
      expect(result.count).toBe(count);
      expect(service.getSignalsCount).toHaveBeenCalled();
    });
  });

  describe('getSignalById', () => {
    it('should return signal when found', async () => {
      // Arrange
      const id = 1;
      const mockSignal = createMockRawSignal({ id });
      service.getSignalById.mockResolvedValue(mockSignal);

      // Act
      const result = await controller.getSignalById(id);

      // Assert
      expect(result.message).toBe('Signal found');
      expect(result.data).toEqual(mockSignal);
      expect(service.getSignalById).toHaveBeenCalledWith(id);
    });

    it('should return null when signal not found', async () => {
      // Arrange
      const id = 999;
      service.getSignalById.mockResolvedValue(null);

      // Act
      const result = await controller.getSignalById(id);

      // Assert
      expect(result.message).toBe('Signal not found');
      expect(result.data).toBeNull();
      expect(service.getSignalById).toHaveBeenCalledWith(id);
    });
  });

  describe('getSignalsByExternalId', () => {
    it('should return array of signals for externalId', async () => {
      // Arrange
      const externalId = 'DEV001';
      const mockSignals = [
        createMockRawSignal({ externalId }),
        createMockRawSignal({ externalId }),
      ];
      service.getSignalsByExternalId.mockResolvedValue(mockSignals);

      // Act
      const result = await controller.getSignalsByExternalId(externalId);

      // Assert
      expect(result.message).toBe('Signals retrieved successfully');
      expect(result.data).toEqual(mockSignals);
      expect(service.getSignalsByExternalId).toHaveBeenCalledWith(externalId);
    });

    it('should return empty array when no signals found', async () => {
      // Arrange
      const externalId = 'NONEXISTENT';
      service.getSignalsByExternalId.mockResolvedValue([]);

      // Act
      const result = await controller.getSignalsByExternalId(externalId);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.message).toBe('Signals retrieved successfully');
    });
  });
});
