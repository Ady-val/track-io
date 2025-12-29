import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TorretaService } from './torreta.service';
import { TorretaRepository } from '../../domain/repositories/torreta.repository';
import { createMockTorreta } from '../../../test-helpers';
import type { CreateTorretaDto, UpdateTorretaDto } from '../dtos/torreta.dto';

describe('TorretaService', () => {
  let service: TorretaService;
  let repository: jest.Mocked<TorretaRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TorretaService,
        {
          provide: TorretaRepository,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAllActive: jest.fn(),
            findByName: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TorretaService>(TorretaService);
    repository = module.get(TorretaRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTorretas', () => {
    it('should return all torretas ordered by name', async () => {
      const mockTorretas = [
        createMockTorreta({ id: 1, name: 'Torreta A' }),
        createMockTorreta({ id: 2, name: 'Torreta B' }),
      ];

      repository.find.mockResolvedValue(mockTorretas);

      const result = await service.getAllTorretas();

      expect(result).toEqual(mockTorretas);
      expect(repository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });

  describe('getActiveTorretas', () => {
    it('should return only active torretas', async () => {
      const mockTorretas = [createMockTorreta({ id: 1, isActive: true })];

      repository.findAllActive.mockResolvedValue(mockTorretas);

      const result = await service.getActiveTorretas();

      expect(result).toEqual(mockTorretas);
      expect(repository.findAllActive).toHaveBeenCalled();
    });
  });

  describe('getTorretaById', () => {
    it('should return torreta when found', async () => {
      const id = 1;
      const mockTorreta = createMockTorreta({ id });

      repository.findOne.mockResolvedValue(mockTorreta);

      const result = await service.getTorretaById(id);

      expect(result).toEqual(mockTorreta);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw NotFoundException when torreta not found', async () => {
      const id = 999;

      repository.findOne.mockResolvedValue(null);

      await expect(service.getTorretaById(id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getTorretaById(id)).rejects.toThrow(
        `Torreta with ID ${id} not found`
      );
    });
  });

  describe('createTorreta', () => {
    it('should create torreta successfully when valid data is provided', async () => {
      const createDto: CreateTorretaDto = {
        name: 'New Torreta',
        description: 'Test Description',
      };
      const mockTorreta = createMockTorreta(createDto);

      repository.findByName.mockResolvedValue(null);
      repository.create.mockReturnValue(mockTorreta);
      repository.save.mockResolvedValue(mockTorreta);

      const result = await service.createTorreta(createDto);

      expect(result).toEqual(mockTorreta);
      expect(repository.findByName).toHaveBeenCalledWith('New Torreta');
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockTorreta);
    });

    it('should throw ConflictException when name already exists', async () => {
      const createDto: CreateTorretaDto = {
        name: 'EXISTING',
        description: 'Test Description',
      };
      const existingTorreta = createMockTorreta({ name: 'EXISTING' });

      repository.findByName.mockResolvedValue(existingTorreta);

      await expect(service.createTorreta(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.createTorreta(createDto)).rejects.toThrow(
        'Torreta with name "EXISTING" already exists'
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateTorreta', () => {
    it('should update torreta successfully when valid data is provided', async () => {
      const id = 1;
      const updateDto: UpdateTorretaDto = { name: 'Updated Torreta' };
      const existingTorreta = createMockTorreta({
        id,
        name: 'Original Torreta',
      });
      const updatedTorreta = createMockTorreta({
        id,
        name: 'Updated Torreta',
      });

      repository.findOne.mockResolvedValue(existingTorreta);
      repository.findByName.mockResolvedValue(null);
      repository.save.mockResolvedValue(updatedTorreta);

      const result = await service.updateTorreta(id, updateDto);

      expect(result).toEqual(updatedTorreta);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw ConflictException when new name conflicts', async () => {
      const id = 1;
      const updateDto: UpdateTorretaDto = { name: 'EXISTING' };
      const existingTorreta = createMockTorreta({
        id,
        name: 'Original Torreta',
      });
      const conflictingTorreta = createMockTorreta({
        id: 2,
        name: 'EXISTING',
      });

      repository.findOne.mockResolvedValue(existingTorreta);
      repository.findByName.mockResolvedValue(conflictingTorreta);

      await expect(service.updateTorreta(id, updateDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.updateTorreta(id, updateDto)).rejects.toThrow(
        'Torreta with name "EXISTING" already exists'
      );
    });

    it('should allow update with same name for same torreta', async () => {
      const id = 1;
      const updateDto: UpdateTorretaDto = { description: 'Updated Desc' };
      const existingTorreta = createMockTorreta({ id, name: 'Same Name' });

      repository.findOne.mockResolvedValue(existingTorreta);
      repository.save.mockResolvedValue({
        ...existingTorreta,
        description: 'Updated Desc',
      });

      const result = await service.updateTorreta(id, updateDto);

      expect(result.description).toBe('Updated Desc');
    });
  });

  describe('toggleTorreta', () => {
    it('should toggle torreta from active to inactive', async () => {
      const id = 1;
      const activeTorreta = createMockTorreta({ id, isActive: true });
      const inactiveTorreta = createMockTorreta({ id, isActive: false });

      repository.findOne.mockResolvedValue(activeTorreta);
      repository.save.mockResolvedValue(inactiveTorreta);

      const result = await service.toggleTorreta(id);

      expect(result.isActive).toBe(false);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('deleteTorreta', () => {
    it('should soft delete torreta successfully when torreta exists', async () => {
      const id = 1;
      const mockTorreta = createMockTorreta({ id });

      repository.findOne.mockResolvedValue(mockTorreta);
      repository.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.deleteTorreta(id);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(repository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when torreta does not exist', async () => {
      const id = 999;

      repository.findOne.mockResolvedValue(null);

      await expect(service.deleteTorreta(id)).rejects.toThrow(
        NotFoundException
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });
});
