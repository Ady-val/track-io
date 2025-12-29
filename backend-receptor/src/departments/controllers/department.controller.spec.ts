import { Test, type TestingModule } from '@nestjs/testing';
import { DepartmentController } from './department.controller';
import { DepartmentService } from '../application/services/department.service';
import { createMockDepartment } from '../../test-helpers';
import type {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '../application/dtos/department.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('DepartmentController', () => {
  let controller: DepartmentController;
  let service: jest.Mocked<DepartmentService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentController],
      providers: [
        {
          provide: DepartmentService,
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

    controller = module.get<DepartmentController>(DepartmentController);
    service = module.get(DepartmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create department and return success response', async () => {
      const createDto: CreateDepartmentDto = { name: 'New Department' };
      const mockDepartment = createMockDepartment({ name: 'New Department' });

      service.create.mockResolvedValue(mockDepartment);

      const result = await controller.create(createDto);

      expect(result.message).toBe('Department created successfully');
      expect(result.data.name).toBe('New Department');
      expect(result.data.id).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should create department with htmlColor when provided', async () => {
      const createDto: CreateDepartmentDto = {
        name: 'New Department',
        htmlColor: '#FF0000',
      };
      const mockDepartment = createMockDepartment({
        name: 'New Department',
        htmlColor: '#FF0000',
      });

      service.create.mockResolvedValue(mockDepartment);

      const result = await controller.create(createDto);

      expect(result.data.htmlColor).toBe('#FF0000');
    });

    it('should propagate ConflictException when department name exists', async () => {
      const createDto: CreateDepartmentDto = { name: 'Existing Department' };

      service.create.mockRejectedValue(
        new ConflictException(
          "Department with name 'Existing Department' already exists"
        )
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException
      );
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated departments with default pagination', async () => {
      const mockDepartments = [
        createMockDepartment({ id: 1, name: 'Department 1' }),
        createMockDepartment({ id: 2, name: 'Department 2' }),
      ];

      service.findAll.mockResolvedValue({
        data: mockDepartments,
        total: 2,
      });

      const result = await controller.findAll(undefined, 10, 0, false);

      expect(result.message).toBe('Departments retrieved successfully');
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
      const mockDepartments = [
        createMockDepartment({ id: 1, name: 'Filtered Department' }),
      ];

      service.findAll.mockResolvedValue({
        data: mockDepartments,
        total: 1,
      });

      const result = await controller.findAll('Filtered', 10, 0, false);

      expect(result.data).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith({
        name: 'Filtered',
        limit: 10,
      });
    });

    it('should include deleted departments when includeDeleted is true', async () => {
      const mockDepartments = [createMockDepartment({ id: 1 })];

      service.findAll.mockResolvedValue({
        data: mockDepartments,
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
    it('should return count of departments', async () => {
      const expectedCount = 5;

      service.getCount.mockResolvedValue(expectedCount);

      const result = await controller.getCount();

      expect(result.message).toBe('Departments count retrieved successfully');
      expect(result.count).toBe(expectedCount);
      expect(service.getCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return department by id', async () => {
      const id = 1;
      const mockDepartment = createMockDepartment({
        id,
        name: 'Test Department',
      });

      service.findById.mockResolvedValue(mockDepartment);

      const result = await controller.findOne(id);

      expect(result.message).toBe('Department retrieved successfully');
      expect(result.data.id).toBe(id);
      expect(result.data.name).toBe('Test Department');
      expect(service.findById).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when department not found', async () => {
      const id = 999;

      service.findById.mockRejectedValue(
        new NotFoundException(`Department with ID ${id} not found`)
      );

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
      expect(service.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update department and return success response', async () => {
      const id = 1;
      const updateDto: UpdateDepartmentDto = { name: 'Updated Department' };
      const updatedDepartment = createMockDepartment({
        id,
        name: 'Updated Department',
      });

      service.update.mockResolvedValue(updatedDepartment);

      const result = await controller.update(id, updateDto);

      expect(result.message).toBe('Department updated successfully');
      expect(result.data.name).toBe('Updated Department');
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should update htmlColor when provided', async () => {
      const id = 1;
      const updateDto: UpdateDepartmentDto = { htmlColor: '#00FF00' };
      const updatedDepartment = createMockDepartment({
        id,
        htmlColor: '#00FF00',
      });

      service.update.mockResolvedValue(updatedDepartment);

      const result = await controller.update(id, updateDto);

      expect(result.data.htmlColor).toBe('#00FF00');
    });

    it('should propagate NotFoundException when department not found', async () => {
      const id = 999;
      const updateDto: UpdateDepartmentDto = { name: 'Updated Department' };

      service.update.mockRejectedValue(
        new NotFoundException(`Department with ID ${id} not found`)
      );

      await expect(controller.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should propagate ConflictException when name conflicts', async () => {
      const id = 1;
      const updateDto: UpdateDepartmentDto = { name: 'Existing Name' };

      service.update.mockRejectedValue(
        new ConflictException(
          "Department with name 'Existing Name' already exists"
        )
      );

      await expect(controller.update(id, updateDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('remove', () => {
    it('should delete department and return success message', async () => {
      const id = 1;

      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(result.message).toBe('Department deleted successfully');
      expect(service.remove).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when department not found', async () => {
      const id = 999;

      service.remove.mockRejectedValue(
        new NotFoundException(`Department with ID ${id} not found`)
      );

      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore department and return success response', async () => {
      const id = 1;
      const restoredDepartment = createMockDepartment({
        id,
        name: 'Restored Department',
      });

      service.restore.mockResolvedValue(restoredDepartment);

      const result = await controller.restore(id);

      expect(result.message).toBe('Department restored successfully');
      expect(result.data.id).toBe(id);
      expect(service.restore).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when department not found', async () => {
      const id = 999;

      service.restore.mockRejectedValue(
        new NotFoundException(
          `Department with ID ${id} not found or not deleted`
        )
      );

      await expect(controller.restore(id)).rejects.toThrow(NotFoundException);
    });
  });
});
