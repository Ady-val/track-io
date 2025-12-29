import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TorretaColorService } from './torreta-color.service';
import { TorretaColorRepository } from '../../domain/repositories/torreta-color.repository';
import { createMockTorretaColor } from '../../../test-helpers';
import type {
  CreateTorretaColorDto,
  UpdateTorretaColorDto,
} from '../dtos/torreta-color.dto';

describe('TorretaColorService', () => {
  let service: TorretaColorService;
  let repository: jest.Mocked<TorretaColorRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TorretaColorService,
        {
          provide: TorretaColorRepository,
          useValue: {
            findAllOrderedByOrder: jest.fn(),
            findOne: jest.fn(),
            findByName: jest.fn(),
            findByHtmlColor: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TorretaColorService>(TorretaColorService);
    repository = module.get(TorretaColorRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTorretaColors', () => {
    it('should return all colors ordered by name', async () => {
      const mockColors = [
        createMockTorretaColor({ id: 1, name: 'Color 1' }),
        createMockTorretaColor({ id: 2, name: 'Color 2' }),
      ];

      repository.findAllOrderedByOrder.mockResolvedValue(mockColors);

      const result = await service.getAllTorretaColors();

      expect(result).toEqual(mockColors);
      expect(repository.findAllOrderedByOrder).toHaveBeenCalled();
    });
  });

  describe('getTorretaColorById', () => {
    it('should return color when found', async () => {
      const id = 1;
      const mockColor = createMockTorretaColor({ id });

      repository.findOne.mockResolvedValue(mockColor);

      const result = await service.getTorretaColorById(id);

      expect(result).toEqual(mockColor);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw NotFoundException when color not found', async () => {
      const id = 999;

      repository.findOne.mockResolvedValue(null);

      await expect(service.getTorretaColorById(id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getTorretaColorById(id)).rejects.toThrow(
        `Torreta color with ID ${id} not found`
      );
    });
  });

  describe('createTorretaColor', () => {
    it('should create color successfully when valid data is provided', async () => {
      const createDto: CreateTorretaColorDto = {
        name: 'New Color',
        htmlColor: '#FF0000',
        deviceColorId: 'RED',
      };
      const mockColor = createMockTorretaColor(createDto);

      repository.findByName.mockResolvedValue(null);
      repository.create.mockReturnValue(mockColor);
      repository.save.mockResolvedValue(mockColor);

      const result = await service.createTorretaColor(createDto);

      expect(result).toEqual(mockColor);
      expect(repository.findByName).toHaveBeenCalledWith('New Color');
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockColor);
    });

    it('should throw ConflictException when color name already exists', async () => {
      const createDto: CreateTorretaColorDto = {
        name: 'Existing Color',
        htmlColor: '#FF0000',
        deviceColorId: 'RED',
      };
      const existingColor = createMockTorretaColor({ name: 'Existing Color' });

      repository.findByName.mockResolvedValue(existingColor);

      await expect(service.createTorretaColor(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.createTorretaColor(createDto)).rejects.toThrow(
        'Torreta color with name "Existing Color" already exists'
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateTorretaColor', () => {
    it('should update color successfully when valid data is provided', async () => {
      const id = 1;
      const updateDto: UpdateTorretaColorDto = { name: 'Updated Color' };
      const existingColor = createMockTorretaColor({
        id,
        name: 'Original Color',
      });
      const updatedColor = createMockTorretaColor({
        id,
        name: 'Updated Color',
      });

      repository.findOne.mockResolvedValueOnce(existingColor);
      repository.findByName.mockResolvedValue(null);
      repository.save.mockResolvedValue(updatedColor);

      const result = await service.updateTorretaColor(id, updateDto);

      expect(result).toEqual(updatedColor);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw ConflictException when new name conflicts', async () => {
      const id = 1;
      const updateDto: UpdateTorretaColorDto = { name: 'Existing Name' };
      const existingColor = createMockTorretaColor({
        id,
        name: 'Original Color',
      });
      const conflictingColor = createMockTorretaColor({
        id: 2,
        name: 'Existing Name',
      });

      repository.findOne.mockResolvedValue(existingColor);
      repository.findByName.mockResolvedValue(conflictingColor);

      await expect(service.updateTorretaColor(id, updateDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.updateTorretaColor(id, updateDto)).rejects.toThrow(
        'Torreta color with name "Existing Name" already exists'
      );
    });

    it('should allow update with same name for same color', async () => {
      const id = 1;
      const updateDto: UpdateTorretaColorDto = { htmlColor: '#00FF00' };
      const existingColor = createMockTorretaColor({ id, name: 'Same Name' });

      repository.findOne.mockResolvedValueOnce(existingColor);
      repository.save.mockResolvedValue({
        ...existingColor,
        htmlColor: '#00FF00',
      });

      const result = await service.updateTorretaColor(id, updateDto);

      expect(result.htmlColor).toBe('#00FF00');
    });
  });

  describe('deleteTorretaColor', () => {
    it('should delete color successfully when color exists', async () => {
      const id = 1;
      const mockColor = createMockTorretaColor({ id });

      repository.findOne.mockResolvedValue(mockColor);
      repository.remove.mockResolvedValue(mockColor);

      await service.deleteTorretaColor(id);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(repository.remove).toHaveBeenCalledWith(mockColor);
    });

    it('should throw NotFoundException when color does not exist', async () => {
      const id = 999;

      repository.findOne.mockResolvedValue(null);

      await expect(service.deleteTorretaColor(id)).rejects.toThrow(
        NotFoundException
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('getTorretaColorByHtmlColor', () => {
    it('should return color when found by html color', async () => {
      const htmlColor = '#FF0000';
      const mockColor = createMockTorretaColor({ htmlColor });

      repository.findByHtmlColor.mockResolvedValue(mockColor);

      const result = await service.getTorretaColorByHtmlColor(htmlColor);

      expect(result).toEqual(mockColor);
      expect(repository.findByHtmlColor).toHaveBeenCalledWith(htmlColor);
    });

    it('should return null when color not found', async () => {
      const htmlColor = '#000000';

      repository.findByHtmlColor.mockResolvedValue(null);

      const result = await service.getTorretaColorByHtmlColor(htmlColor);

      expect(result).toBeNull();
    });
  });
});
