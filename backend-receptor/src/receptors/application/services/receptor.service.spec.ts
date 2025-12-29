import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ReceptorService } from './receptor.service';
import { ReceptorRepository } from '../../domain/repositories/receptor.repository';
import { createMockReceptor } from '../../../test-helpers';
import type {
  CreateReceptorDto,
  UpdateReceptorDto,
} from '../dtos/receptor.dto';

describe('ReceptorService', () => {
  let service: ReceptorService;
  let repository: jest.Mocked<ReceptorRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceptorService,
        {
          provide: ReceptorRepository,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAllActive: jest.fn(),
            findByExternalId: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReceptorService>(ReceptorService);
    repository = module.get(ReceptorRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllReceptors', () => {
    it('should return all receptors ordered by name', async () => {
      const mockReceptors = [
        createMockReceptor({ id: 1, name: 'Receptor A' }),
        createMockReceptor({ id: 2, name: 'Receptor B' }),
      ];

      repository.find.mockResolvedValue(mockReceptors);

      const result = await service.getAllReceptors();

      expect(result).toEqual(mockReceptors);
      expect(repository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });

  describe('getActiveReceptors', () => {
    it('should return only active receptors', async () => {
      const mockReceptors = [createMockReceptor({ id: 1, isActive: true })];

      repository.findAllActive.mockResolvedValue(mockReceptors);

      const result = await service.getActiveReceptors();

      expect(result).toEqual(mockReceptors);
      expect(repository.findAllActive).toHaveBeenCalled();
    });
  });

  describe('getReceptorById', () => {
    it('should return receptor when found', async () => {
      const id = 1;
      const mockReceptor = createMockReceptor({ id });

      repository.findOne.mockResolvedValue(mockReceptor);

      const result = await service.getReceptorById(id);

      expect(result).toEqual(mockReceptor);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw NotFoundException when receptor not found', async () => {
      const id = 999;

      repository.findOne.mockResolvedValue(null);

      await expect(service.getReceptorById(id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getReceptorById(id)).rejects.toThrow(
        `Receptor with ID ${id} not found`
      );
    });
  });

  describe('getReceptorByExternalId', () => {
    it('should return receptor when found', async () => {
      const externalId = 'EXT001';
      const mockReceptor = createMockReceptor({ externalId });

      repository.findByExternalId.mockResolvedValue(mockReceptor);

      const result = await service.getReceptorByExternalId(externalId);

      expect(result).toEqual(mockReceptor);
      expect(repository.findByExternalId).toHaveBeenCalledWith(externalId);
    });

    it('should throw NotFoundException when receptor not found', async () => {
      const externalId = 'NONEXISTENT';

      repository.findByExternalId.mockResolvedValue(null);

      await expect(service.getReceptorByExternalId(externalId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getReceptorByExternalId(externalId)).rejects.toThrow(
        `Receptor with external ID ${externalId} not found`
      );
    });
  });

  describe('createReceptor', () => {
    it('should create receptor successfully when valid data is provided', async () => {
      const createDto: CreateReceptorDto = {
        externalId: 'EXT001',
        name: 'New Receptor',
      };
      const mockReceptor = createMockReceptor(createDto);

      repository.findByExternalId.mockResolvedValue(null);
      repository.create.mockReturnValue(mockReceptor);
      repository.save.mockResolvedValue(mockReceptor);

      const result = await service.createReceptor(createDto);

      expect(result).toEqual(mockReceptor);
      expect(repository.findByExternalId).toHaveBeenCalledWith('EXT001');
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockReceptor);
    });

    it('should throw ConflictException when externalId already exists', async () => {
      const createDto: CreateReceptorDto = {
        externalId: 'EXISTING',
        name: 'New Receptor',
      };
      const existingReceptor = createMockReceptor({
        externalId: 'EXISTING',
      });

      repository.findByExternalId.mockResolvedValue(existingReceptor);

      await expect(service.createReceptor(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.createReceptor(createDto)).rejects.toThrow(
        'Receptor with external ID "EXISTING" already exists'
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateReceptor', () => {
    it('should update receptor successfully when valid data is provided', async () => {
      const id = 1;
      const updateDto: UpdateReceptorDto = { name: 'Updated Receptor' };
      const existingReceptor = createMockReceptor({
        id,
        name: 'Original Receptor',
      });
      const updatedReceptor = createMockReceptor({
        id,
        name: 'Updated Receptor',
      });

      repository.findOne.mockResolvedValue(existingReceptor);
      repository.save.mockResolvedValue(updatedReceptor);

      const result = await service.updateReceptor(id, updateDto);

      expect(result).toEqual(updatedReceptor);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw ConflictException when new externalId conflicts', async () => {
      const id = 1;
      const updateDto: UpdateReceptorDto = { externalId: 'EXISTING' };
      const existingReceptor = createMockReceptor({
        id,
        externalId: 'ORIGINAL',
      });
      const conflictingReceptor = createMockReceptor({
        id: 2,
        externalId: 'EXISTING',
      });

      repository.findOne.mockResolvedValue(existingReceptor);
      repository.findByExternalId.mockResolvedValue(conflictingReceptor);

      await expect(service.updateReceptor(id, updateDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.updateReceptor(id, updateDto)).rejects.toThrow(
        'Receptor with external ID "EXISTING" already exists'
      );
    });

    it('should allow update with same externalId for same receptor', async () => {
      const id = 1;
      const updateDto: UpdateReceptorDto = { name: 'Updated Name' };
      const existingReceptor = createMockReceptor({
        id,
        externalId: 'SAME',
      });

      repository.findOne.mockResolvedValue(existingReceptor);
      repository.save.mockResolvedValue({
        ...existingReceptor,
        name: 'Updated Name',
      });

      const result = await service.updateReceptor(id, updateDto);

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('toggleReceptor', () => {
    it('should toggle receptor from active to inactive', async () => {
      const id = 1;
      const activeReceptor = createMockReceptor({ id, isActive: true });
      const inactiveReceptor = createMockReceptor({ id, isActive: false });

      repository.findOne.mockResolvedValue(activeReceptor);
      repository.save.mockResolvedValue(inactiveReceptor);

      const result = await service.toggleReceptor(id);

      expect(result.isActive).toBe(false);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should toggle receptor from inactive to active', async () => {
      const id = 1;
      const inactiveReceptor = createMockReceptor({ id, isActive: false });
      const activeReceptor = createMockReceptor({ id, isActive: true });

      repository.findOne.mockResolvedValue(inactiveReceptor);
      repository.save.mockResolvedValue(activeReceptor);

      const result = await service.toggleReceptor(id);

      expect(result.isActive).toBe(true);
    });
  });

  describe('deleteReceptor', () => {
    it('should soft delete receptor successfully when receptor exists', async () => {
      const id = 1;
      const mockReceptor = createMockReceptor({ id });

      repository.findOne.mockResolvedValue(mockReceptor);
      repository.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.deleteReceptor(id);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(repository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when receptor does not exist', async () => {
      const id = 999;

      repository.findOne.mockResolvedValue(null);

      await expect(service.deleteReceptor(id)).rejects.toThrow(
        NotFoundException
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });
});
