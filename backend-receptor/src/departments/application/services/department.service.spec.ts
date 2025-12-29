import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentRepository } from '../../domain/repositories/department.repository';
import { createMockDepartment } from '../../../test-helpers';
import type {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentFilters,
} from '../../domain/repositories/department.repository';

describe('DepartmentService', () => {
  let service: DepartmentService;
  let repository: jest.Mocked<DepartmentRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentService,
        {
          provide: DepartmentRepository,
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

    service = module.get<DepartmentService>(DepartmentService);
    repository = module.get(DepartmentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create department successfully when valid data is provided', async () => {
      const createDto: CreateDepartmentDto = { name: 'New Department' };
      const mockDepartment = createMockDepartment({ name: 'New Department' });

      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockDepartment);

      const result = await service.create(createDto);

      expect(result).toEqual(mockDepartment);
      expect(repository.findByName).toHaveBeenCalledWith('New Department');
      expect(repository.create).toHaveBeenCalledWith(createDto);
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

      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockDepartment);

      const result = await service.create(createDto);

      expect(result).toEqual(mockDepartment);
      expect(result.htmlColor).toBe('#FF0000');
    });

    it('should throw ConflictException when department name already exists', async () => {
      const createDto: CreateDepartmentDto = { name: 'Existing Department' };
      const existingDepartment = createMockDepartment({
        name: 'Existing Department',
      });

      repository.findByName.mockResolvedValue(existingDepartment);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        "Department with name 'Existing Department' already exists"
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated departments when filters are provided', async () => {
      const filters: DepartmentFilters = { limit: 10, offset: 0 };
      const mockDepartments = [
        createMockDepartment({ id: 1, name: 'Department 1' }),
        createMockDepartment({ id: 2, name: 'Department 2' }),
      ];

      repository.findAll.mockResolvedValue({
        data: mockDepartments,
        total: 2,
      });

      const result = await service.findAll(filters);

      expect(result.data).toEqual(mockDepartments);
      expect(result.total).toBe(2);
      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should return all departments when no filters are provided', async () => {
      const mockDepartments = [createMockDepartment({ id: 1 })];
      repository.findAll.mockResolvedValue({
        data: mockDepartments,
        total: 1,
      });

      const result = await service.findAll();

      expect(result.data).toEqual(mockDepartments);
      expect(result.total).toBe(1);
      expect(repository.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findById', () => {
    it('should return department when found', async () => {
      const id = 1;
      const mockDepartment = createMockDepartment({ id });

      repository.findById.mockResolvedValue(mockDepartment);

      const result = await service.findById(id);

      expect(result).toEqual(mockDepartment);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when department not found', async () => {
      const id = 999;

      repository.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
      await expect(service.findById(id)).rejects.toThrow(
        `Department with ID ${id} not found`
      );
    });
  });

  describe('update', () => {
    it('should update department successfully when valid data is provided', async () => {
      const id = 1;
      const updateDto: UpdateDepartmentDto = { name: 'Updated Department' };
      const existingDepartment = createMockDepartment({
        id,
        name: 'Original Department',
      });
      const updatedDepartment = createMockDepartment({
        id,
        name: 'Updated Department',
      });

      repository.findById.mockResolvedValueOnce(existingDepartment);
      repository.findByName.mockResolvedValue(null);
      repository.update.mockResolvedValue(updatedDepartment);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(updatedDepartment);
      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(repository.findByName).toHaveBeenCalledWith('Updated Department');
      expect(repository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should update htmlColor when provided', async () => {
      const id = 1;
      const updateDto: UpdateDepartmentDto = { htmlColor: '#00FF00' };
      const existingDepartment = createMockDepartment({ id });
      const updatedDepartment = createMockDepartment({
        id,
        htmlColor: '#00FF00',
      });

      repository.findById.mockResolvedValueOnce(existingDepartment);
      repository.update.mockResolvedValue(updatedDepartment);

      const result = await service.update(id, updateDto);

      expect(result.htmlColor).toBe('#00FF00');
    });

    it('should throw ConflictException when new name conflicts with existing department', async () => {
      const id = 1;
      const updateDto: UpdateDepartmentDto = { name: 'Existing Name' };
      const existingDepartment = createMockDepartment({
        id,
        name: 'Original Department',
      });
      const conflictingDepartment = createMockDepartment({
        id: 2,
        name: 'Existing Name',
      });

      repository.findById.mockResolvedValue(existingDepartment);
      repository.findByName.mockResolvedValue(conflictingDepartment);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.update(id, updateDto)).rejects.toThrow(
        "Department with name 'Existing Name' already exists"
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when department does not exist', async () => {
      const id = 999;
      const updateDto: UpdateDepartmentDto = { name: 'Updated Department' };

      repository.findById.mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.update(id, updateDto)).rejects.toThrow(
        `Department with ID ${id} not found`
      );
    });

    it('should allow update with same name for same department', async () => {
      const id = 1;
      const updateDto: UpdateDepartmentDto = { name: 'Same Name' };
      const existingDepartment = createMockDepartment({
        id,
        name: 'Same Name',
      });

      repository.findById.mockResolvedValueOnce(existingDepartment);
      repository.findByName.mockResolvedValue(existingDepartment);
      repository.update.mockResolvedValue(existingDepartment);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(existingDepartment);
      expect(repository.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should soft delete department successfully when department exists', async () => {
      const id = 1;
      const existingDepartment = createMockDepartment({ id });

      repository.findById.mockResolvedValue(existingDepartment);
      repository.softDelete.mockResolvedValue(true);

      await service.remove(id);

      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(repository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when department does not exist', async () => {
      const id = 999;

      repository.findById.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      await expect(service.remove(id)).rejects.toThrow(
        `Department with ID ${id} not found`
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when soft delete returns false', async () => {
      const id = 1;
      const existingDepartment = createMockDepartment({ id });

      repository.findById.mockResolvedValue(existingDepartment);
      repository.softDelete.mockResolvedValue(false);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      await expect(service.remove(id)).rejects.toThrow(
        `Department with ID ${id} not found`
      );
    });
  });

  describe('restore', () => {
    it('should restore department successfully when department is deleted', async () => {
      const id = 1;
      const restoredDepartment = createMockDepartment({ id });

      repository.restore.mockResolvedValue(true);
      repository.findById.mockResolvedValue(restoredDepartment);

      const result = await service.restore(id);

      expect(result).toEqual(restoredDepartment);
      expect(repository.restore).toHaveBeenCalledWith(id);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when department does not exist', async () => {
      const id = 999;

      repository.restore.mockResolvedValue(false);

      await expect(service.restore(id)).rejects.toThrow(NotFoundException);
      await expect(service.restore(id)).rejects.toThrow(
        `Department with ID ${id} not found or not deleted`
      );
    });

    it('should throw NotFoundException when restored department cannot be found', async () => {
      const id = 1;

      repository.restore.mockResolvedValue(true);
      repository.findById.mockResolvedValue(null);

      await expect(service.restore(id)).rejects.toThrow(NotFoundException);
      await expect(service.restore(id)).rejects.toThrow(
        `Department with ID ${id} not found`
      );
    });
  });

  describe('getCount', () => {
    it('should return count of departments', async () => {
      const expectedCount = 5;

      repository.count.mockResolvedValue(expectedCount);

      const result = await service.getCount();

      expect(result).toBe(expectedCount);
      expect(repository.count).toHaveBeenCalled();
    });
  });
});
