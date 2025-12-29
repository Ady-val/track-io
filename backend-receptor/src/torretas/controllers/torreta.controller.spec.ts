import { Test, type TestingModule } from '@nestjs/testing';
import { TorretaController } from './torreta.controller';
import { TorretaService } from '../application/services/torreta.service';
import { createMockTorreta } from '../../test-helpers';
import type {
  CreateTorretaDto,
  UpdateTorretaDto,
} from '../application/dtos/torreta.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('TorretaController', () => {
  let controller: TorretaController;
  let service: jest.Mocked<TorretaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TorretaController],
      providers: [
        {
          provide: TorretaService,
          useValue: {
            getAllTorretas: jest.fn(),
            getActiveTorretas: jest.fn(),
            getTorretaById: jest.fn(),
            createTorreta: jest.fn(),
            updateTorreta: jest.fn(),
            toggleTorreta: jest.fn(),
            deleteTorreta: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TorretaController>(TorretaController);
    service = module.get(TorretaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTorretas', () => {
    it('should return all torretas when active query is not provided', async () => {
      const mockTorretas = [
        createMockTorreta({ id: 1, name: 'Torreta 1' }),
        createMockTorreta({ id: 2, name: 'Torreta 2' }),
      ];

      service.getAllTorretas.mockResolvedValue(mockTorretas);

      const result = await controller.getAllTorretas();

      expect(result.message).toBe('Torretas retrieved successfully');
      expect(result.data).toHaveLength(2);
      expect(service.getAllTorretas).toHaveBeenCalled();
    });

    it('should return active torretas when active query is true', async () => {
      const mockTorretas = [createMockTorreta({ id: 1, isActive: true })];

      service.getActiveTorretas.mockResolvedValue(mockTorretas);

      const result = await controller.getAllTorretas('true');

      expect(result.data).toHaveLength(1);
      expect(service.getActiveTorretas).toHaveBeenCalled();
    });
  });

  describe('getTorretaById', () => {
    it('should return torreta by id', async () => {
      const id = 1;
      const mockTorreta = createMockTorreta({ id, name: 'Test Torreta' });

      service.getTorretaById.mockResolvedValue(mockTorreta);

      const result = await controller.getTorretaById(id);

      expect(result.message).toBe('Torreta found');
      expect(result.data.name).toBe('Test Torreta');
      expect(service.getTorretaById).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when torreta not found', async () => {
      const id = 999;

      service.getTorretaById.mockRejectedValue(
        new NotFoundException(`Torreta with ID ${id} not found`)
      );

      await expect(controller.getTorretaById(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('createTorreta', () => {
    it('should create torreta and return success response', async () => {
      const createDto: CreateTorretaDto = {
        name: 'New Torreta',
        description: 'Test Description',
      };
      const mockTorreta = createMockTorreta(createDto);

      service.createTorreta.mockResolvedValue(mockTorreta);

      const result = await controller.createTorreta(createDto);

      expect(result.message).toBe('Torreta created successfully');
      expect(result.data.name).toBe('New Torreta');
      expect(service.createTorreta).toHaveBeenCalledWith(createDto);
    });

    it('should propagate ConflictException when name exists', async () => {
      const createDto: CreateTorretaDto = {
        name: 'EXISTING',
        description: 'Test Description',
      };

      service.createTorreta.mockRejectedValue(
        new ConflictException('Torreta with name "EXISTING" already exists')
      );

      await expect(controller.createTorreta(createDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('updateTorreta', () => {
    it('should update torreta and return success response', async () => {
      const id = 1;
      const updateDto: UpdateTorretaDto = { name: 'Updated Torreta' };
      const updatedTorreta = createMockTorreta({
        id,
        name: 'Updated Torreta',
      });

      service.updateTorreta.mockResolvedValue(updatedTorreta);

      const result = await controller.updateTorreta(id, updateDto);

      expect(result.message).toBe('Torreta updated successfully');
      expect(result.data.name).toBe('Updated Torreta');
      expect(service.updateTorreta).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('toggleTorreta', () => {
    it('should toggle torreta and return success response', async () => {
      const id = 1;
      const toggledTorreta = createMockTorreta({ id, isActive: false });

      service.toggleTorreta.mockResolvedValue(toggledTorreta);

      const result = await controller.toggleTorreta(id);

      expect(result.message).toBe('Torreta deactivated successfully');
      expect(result.data.isActive).toBe(false);
      expect(service.toggleTorreta).toHaveBeenCalledWith(id);
    });
  });

  describe('deleteTorreta', () => {
    it('should delete torreta successfully', async () => {
      const id = 1;

      service.deleteTorreta.mockResolvedValue(undefined);

      await controller.deleteTorreta(id);

      expect(service.deleteTorreta).toHaveBeenCalledWith(id);
    });
  });
});
