import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AreaService } from './area.service';
import { AreaRepository } from '../../domain/repositories/area.repository';
import { createMockArea } from '../../../test-helpers';
import type {
  CreateAreaDto,
  UpdateAreaDto,
  AreaFilters,
} from '../../domain/repositories/area.repository';

describe('AreaService', () => {
  let service: AreaService;
  let repository: jest.Mocked<AreaRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreaService,
        {
          provide: AreaRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AreaService>(AreaService);
    repository = module.get(AreaRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create area successfully when valid data is provided', async () => {
      const createDto: CreateAreaDto = { name: 'New Area' };
      const mockArea = createMockArea({ name: 'New Area' });

      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockArea);

      const result = await service.create(createDto);

      expect(result).toEqual(mockArea);
      expect(repository.findByName).toHaveBeenCalledWith('New Area');
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when area name already exists', async () => {
      const createDto: CreateAreaDto = { name: 'Existing Area' };
      const existingArea = createMockArea({ name: 'Existing Area' });

      repository.findByName.mockResolvedValue(existingArea);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        "Area with name 'Existing Area' already exists"
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated areas when filters are provided', async () => {
      const filters: AreaFilters = { limit: 10, offset: 0 };
      const mockAreas = [
        createMockArea({ id: 1, name: 'Area 1' }),
        createMockArea({ id: 2, name: 'Area 2' }),
      ];

      repository.findAll.mockResolvedValue({
        data: mockAreas,
        total: 2,
      });

      const result = await service.findAll(filters);

      expect(result.data).toEqual(mockAreas);
      expect(result.total).toBe(2);
      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should return all areas when no filters are provided', async () => {
      const mockAreas = [createMockArea({ id: 1 })];
      repository.findAll.mockResolvedValue({ data: mockAreas, total: 1 });

      const result = await service.findAll();

      expect(result.data).toEqual(mockAreas);
      expect(result.total).toBe(1);
      expect(repository.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findById', () => {
    it('should return area when found', async () => {
      const id = 1;
      const mockArea = createMockArea({ id });

      repository.findById.mockResolvedValue(mockArea);

      const result = await service.findById(id);

      expect(result).toEqual(mockArea);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when area not found', async () => {
      const id = 999;

      repository.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
      await expect(service.findById(id)).rejects.toThrow(
        `Area with ID ${id} not found`
      );
    });
  });

  describe('update', () => {
    it('should update area successfully when valid data is provided', async () => {
      const id = 1;
      const updateDto: UpdateAreaDto = { name: 'Updated Area' };
      const existingArea = createMockArea({ id, name: 'Original Area' });
      const updatedArea = createMockArea({ id, name: 'Updated Area' });

      repository.findById.mockResolvedValueOnce(existingArea);
      repository.findByName.mockResolvedValue(null);
      repository.update.mockResolvedValue(updatedArea);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(updatedArea);
      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(repository.findByName).toHaveBeenCalledWith('Updated Area');
      expect(repository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw ConflictException when new name conflicts with existing area', async () => {
      const id = 1;
      const updateDto: UpdateAreaDto = { name: 'Existing Name' };
      const existingArea = createMockArea({ id, name: 'Original Area' });
      const conflictingArea = createMockArea({ id: 2, name: 'Existing Name' });

      repository.findById.mockResolvedValue(existingArea);
      repository.findByName.mockResolvedValue(conflictingArea);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.update(id, updateDto)).rejects.toThrow(
        "Area with name 'Existing Name' already exists"
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when area does not exist', async () => {
      const id = 999;
      const updateDto: UpdateAreaDto = { name: 'Updated Area' };

      repository.findById.mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.update(id, updateDto)).rejects.toThrow(
        `Area with ID ${id} not found`
      );
    });

    it('should allow update with same name for same area', async () => {
      const id = 1;
      const updateDto: UpdateAreaDto = { name: 'Same Name' };
      const existingArea = createMockArea({ id, name: 'Same Name' });

      repository.findById.mockResolvedValueOnce(existingArea);
      repository.findByName.mockResolvedValue(existingArea);
      repository.update.mockResolvedValue(existingArea);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(existingArea);
      expect(repository.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should soft delete area successfully when area exists', async () => {
      const id = 1;
      const existingArea = createMockArea({ id });

      repository.findById.mockResolvedValue(existingArea);
      repository.softDelete.mockResolvedValue(true);

      await service.remove(id);

      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(repository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when area does not exist', async () => {
      const id = 999;

      repository.findById.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      await expect(service.remove(id)).rejects.toThrow(
        `Area with ID ${id} not found`
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when soft delete returns false', async () => {
      const id = 1;
      const existingArea = createMockArea({ id });

      repository.findById.mockResolvedValue(existingArea);
      repository.softDelete.mockResolvedValue(false);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      await expect(service.remove(id)).rejects.toThrow(
        `Area with ID ${id} not found`
      );
    });
  });

  describe('restore', () => {
    it('should restore area successfully when area is deleted', async () => {
      const id = 1;
      const restoredArea = createMockArea({ id });

      repository.restore.mockResolvedValue(true);
      repository.findById.mockResolvedValue(restoredArea);

      const result = await service.restore(id);

      expect(result).toEqual(restoredArea);
      expect(repository.restore).toHaveBeenCalledWith(id);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when area does not exist', async () => {
      const id = 999;

      repository.restore.mockResolvedValue(false);

      await expect(service.restore(id)).rejects.toThrow(NotFoundException);
      await expect(service.restore(id)).rejects.toThrow(
        `Area with ID ${id} not found or not deleted`
      );
    });

    it('should throw NotFoundException when restored area cannot be found', async () => {
      const id = 1;

      repository.restore.mockResolvedValue(true);
      repository.findById.mockResolvedValue(null);

      await expect(service.restore(id)).rejects.toThrow(NotFoundException);
      await expect(service.restore(id)).rejects.toThrow(
        `Area with ID ${id} not found`
      );
    });
  });

  describe('getCount', () => {
    it('should return count of areas', async () => {
      const expectedCount = 5;

      repository.count.mockResolvedValue(expectedCount);

      const result = await service.getCount();

      expect(result).toBe(expectedCount);
      expect(repository.count).toHaveBeenCalled();
    });
  });
});
