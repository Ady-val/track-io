import { Test, type TestingModule } from '@nestjs/testing';
import { AreaController } from './area.controller';
import { AreaService } from '../application/services/area.service';
import { createMockArea } from '../../test-helpers';
import type {
  CreateAreaDto,
  UpdateAreaDto,
} from '../application/dtos/area.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('AreaController', () => {
  let controller: AreaController;
  let service: jest.Mocked<AreaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreaController],
      providers: [
        {
          provide: AreaService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            restore: jest.fn(),
            getCount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AreaController>(AreaController);
    service = module.get(AreaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create area and return success response', async () => {
      const createDto: CreateAreaDto = { name: 'New Area' };
      const mockArea = createMockArea({ name: 'New Area' });

      service.create.mockResolvedValue(mockArea);

      const result = await controller.create(createDto);

      expect(result.message).toBe('Area created successfully');
      expect(result.data.name).toBe('New Area');
      expect(result.data.id).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should propagate ConflictException when area name exists', async () => {
      const createDto: CreateAreaDto = { name: 'Existing Area' };

      service.create.mockRejectedValue(
        new ConflictException("Area with name 'Existing Area' already exists")
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException
      );
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated areas with default pagination', async () => {
      const mockAreas = [
        createMockArea({ id: 1, name: 'Area 1' }),
        createMockArea({ id: 2, name: 'Area 2' }),
      ];

      service.findAll.mockResolvedValue({
        data: mockAreas,
        total: 2,
      });

      const result = await controller.findAll(undefined, 10, 0, false);

      expect(result.message).toBe('Areas retrieved successfully');
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.total).toBe(2);
      expect(service.findAll).toHaveBeenCalledWith({
        limit: 10,
      });
    });

    it('should apply name filter when provided', async () => {
      const mockAreas = [createMockArea({ id: 1, name: 'Filtered Area' })];

      service.findAll.mockResolvedValue({
        data: mockAreas,
        total: 1,
      });

      const result = await controller.findAll('Filtered', 10, 0, false);

      expect(result.data).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith({
        name: 'Filtered',
        limit: 10,
      });
    });

    it('should include deleted areas when includeDeleted is true', async () => {
      const mockAreas = [createMockArea({ id: 1 })];

      service.findAll.mockResolvedValue({
        data: mockAreas,
        total: 1,
      });

      await controller.findAll(undefined, 10, 0, true);

      expect(service.findAll).toHaveBeenCalledWith({
        limit: 10,
        includeDeleted: true,
      });
    });
  });

  describe('getCount', () => {
    it('should return count of areas', async () => {
      const expectedCount = 5;

      service.getCount.mockResolvedValue(expectedCount);

      const result = await controller.getCount();

      expect(result.message).toBe('Areas count retrieved successfully');
      expect(result.count).toBe(expectedCount);
      expect(service.getCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return area by id', async () => {
      const id = 1;
      const mockArea = createMockArea({ id, name: 'Test Area' });

      service.findById.mockResolvedValue(mockArea);

      const result = await controller.findOne(id);

      expect(result.message).toBe('Area retrieved successfully');
      expect(result.data.id).toBe(id);
      expect(result.data.name).toBe('Test Area');
      expect(service.findById).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when area not found', async () => {
      const id = 999;

      service.findById.mockRejectedValue(
        new NotFoundException(`Area with ID ${id} not found`)
      );

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
      expect(service.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update area and return success response', async () => {
      const id = 1;
      const updateDto: UpdateAreaDto = { name: 'Updated Area' };
      const updatedArea = createMockArea({ id, name: 'Updated Area' });

      service.update.mockResolvedValue(updatedArea);

      const result = await controller.update(id, updateDto);

      expect(result.message).toBe('Area updated successfully');
      expect(result.data.name).toBe('Updated Area');
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should propagate NotFoundException when area not found', async () => {
      const id = 999;
      const updateDto: UpdateAreaDto = { name: 'Updated Area' };

      service.update.mockRejectedValue(
        new NotFoundException(`Area with ID ${id} not found`)
      );

      await expect(controller.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should propagate ConflictException when name conflicts', async () => {
      const id = 1;
      const updateDto: UpdateAreaDto = { name: 'Existing Name' };

      service.update.mockRejectedValue(
        new ConflictException("Area with name 'Existing Name' already exists")
      );

      await expect(controller.update(id, updateDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('remove', () => {
    it('should delete area and return success message', async () => {
      const id = 1;

      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(result.message).toBe('Area deleted successfully');
      expect(service.remove).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when area not found', async () => {
      const id = 999;

      service.remove.mockRejectedValue(
        new NotFoundException(`Area with ID ${id} not found`)
      );

      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore area and return success response', async () => {
      const id = 1;
      const restoredArea = createMockArea({ id, name: 'Restored Area' });

      service.restore.mockResolvedValue(restoredArea);

      const result = await controller.restore(id);

      expect(result.message).toBe('Area restored successfully');
      expect(result.data.id).toBe(id);
      expect(service.restore).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when area not found', async () => {
      const id = 999;

      service.restore.mockRejectedValue(
        new NotFoundException(`Area with ID ${id} not found or not deleted`)
      );

      await expect(controller.restore(id)).rejects.toThrow(NotFoundException);
    });
  });
});
