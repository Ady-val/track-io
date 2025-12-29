import { Test, type TestingModule } from '@nestjs/testing';
import { ReceptorController } from './receptor.controller';
import { ReceptorService } from '../application/services/receptor.service';
import { createMockReceptor } from '../../test-helpers';
import type {
  CreateReceptorDto,
  UpdateReceptorDto,
} from '../application/dtos/receptor.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ReceptorController', () => {
  let controller: ReceptorController;
  let service: jest.Mocked<ReceptorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReceptorController],
      providers: [
        {
          provide: ReceptorService,
          useValue: {
            getAllReceptors: jest.fn(),
            getActiveReceptors: jest.fn(),
            getReceptorById: jest.fn(),
            getReceptorByExternalId: jest.fn(),
            createReceptor: jest.fn(),
            updateReceptor: jest.fn(),
            toggleReceptor: jest.fn(),
            deleteReceptor: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReceptorController>(ReceptorController);
    service = module.get(ReceptorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllReceptors', () => {
    it('should return all receptors when active query is not provided', async () => {
      const mockReceptors = [
        createMockReceptor({ id: 1, name: 'Receptor 1' }),
        createMockReceptor({ id: 2, name: 'Receptor 2' }),
      ];

      service.getAllReceptors.mockResolvedValue(mockReceptors);

      const result = await controller.getAllReceptors();

      expect(result.message).toBe('Receptors retrieved successfully');
      expect(result.data).toEqual(mockReceptors);
      expect(service.getAllReceptors).toHaveBeenCalled();
    });

    it('should return active receptors when active query is true', async () => {
      const mockReceptors = [createMockReceptor({ id: 1, isActive: true })];

      service.getActiveReceptors.mockResolvedValue(mockReceptors);

      const result = await controller.getAllReceptors('true');

      expect(result.data).toEqual(mockReceptors);
      expect(service.getActiveReceptors).toHaveBeenCalled();
    });
  });

  describe('getReceptorById', () => {
    it('should return receptor by id', async () => {
      const id = 1;
      const mockReceptor = createMockReceptor({ id, name: 'Test Receptor' });

      service.getReceptorById.mockResolvedValue(mockReceptor);

      const result = await controller.getReceptorById(id);

      expect(result.message).toBe('Receptor found');
      expect(result.data).toEqual(mockReceptor);
      expect(service.getReceptorById).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when receptor not found', async () => {
      const id = 999;

      service.getReceptorById.mockRejectedValue(
        new NotFoundException(`Receptor with ID ${id} not found`)
      );

      await expect(controller.getReceptorById(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getReceptorByExternalId', () => {
    it('should return receptor by external id', async () => {
      const externalId = 'EXT001';
      const mockReceptor = createMockReceptor({ externalId });

      service.getReceptorByExternalId.mockResolvedValue(mockReceptor);

      const result = await controller.getReceptorByExternalId(externalId);

      expect(result.message).toBe('Receptor found');
      expect(result.data).toEqual(mockReceptor);
      expect(service.getReceptorByExternalId).toHaveBeenCalledWith(externalId);
    });
  });

  describe('createReceptor', () => {
    it('should create receptor and return success response', async () => {
      const createDto: CreateReceptorDto = {
        externalId: 'EXT001',
        name: 'New Receptor',
      };
      const mockReceptor = createMockReceptor(createDto);

      service.createReceptor.mockResolvedValue(mockReceptor);

      const result = await controller.createReceptor(createDto);

      expect(result.message).toBe('Receptor created successfully');
      expect(result.data.name).toBe('New Receptor');
      expect(service.createReceptor).toHaveBeenCalledWith(createDto);
    });

    it('should propagate ConflictException when externalId exists', async () => {
      const createDto: CreateReceptorDto = {
        externalId: 'EXISTING',
        name: 'New Receptor',
      };

      service.createReceptor.mockRejectedValue(
        new ConflictException(
          'Receptor with external ID "EXISTING" already exists'
        )
      );

      await expect(controller.createReceptor(createDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('updateReceptor', () => {
    it('should update receptor and return success response', async () => {
      const id = 1;
      const updateDto: UpdateReceptorDto = { name: 'Updated Receptor' };
      const updatedReceptor = createMockReceptor({
        id,
        name: 'Updated Receptor',
      });

      service.updateReceptor.mockResolvedValue(updatedReceptor);

      const result = await controller.updateReceptor(id, updateDto);

      expect(result.message).toBe('Receptor updated successfully');
      expect(result.data.name).toBe('Updated Receptor');
      expect(service.updateReceptor).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('toggleReceptor', () => {
    it('should toggle receptor and return success response', async () => {
      const id = 1;
      const toggledReceptor = createMockReceptor({ id, isActive: false });

      service.toggleReceptor.mockResolvedValue(toggledReceptor);

      const result = await controller.toggleReceptor(id);

      expect(result.message).toBe('Receptor deactivated successfully');
      expect(result.data.isActive).toBe(false);
      expect(service.toggleReceptor).toHaveBeenCalledWith(id);
    });

    it('should return activated message when receptor becomes active', async () => {
      const id = 1;
      const toggledReceptor = createMockReceptor({ id, isActive: true });

      service.toggleReceptor.mockResolvedValue(toggledReceptor);

      const result = await controller.toggleReceptor(id);

      expect(result.message).toBe('Receptor activated successfully');
      expect(result.data.isActive).toBe(true);
    });
  });

  describe('deleteReceptor', () => {
    it('should delete receptor successfully', async () => {
      const id = 1;

      service.deleteReceptor.mockResolvedValue(undefined);

      await controller.deleteReceptor(id);

      expect(service.deleteReceptor).toHaveBeenCalledWith(id);
    });
  });
});
