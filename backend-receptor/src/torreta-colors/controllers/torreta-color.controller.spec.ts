import { Test, type TestingModule } from '@nestjs/testing';
import { TorretaColorController } from './torreta-color.controller';
import { TorretaColorService } from '../application/services/torreta-color.service';
import { createMockTorretaColor } from '../../test-helpers';
import type {
  CreateTorretaColorDto,
  UpdateTorretaColorDto,
} from '../application/dtos/torreta-color.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('TorretaColorController', () => {
  let controller: TorretaColorController;
  let service: jest.Mocked<TorretaColorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TorretaColorController],
      providers: [
        {
          provide: TorretaColorService,
          useValue: {
            getAllTorretaColors: jest.fn(),
            getTorretaColorById: jest.fn(),
            createTorretaColor: jest.fn(),
            updateTorretaColor: jest.fn(),
            deleteTorretaColor: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TorretaColorController>(TorretaColorController);
    service = module.get(TorretaColorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTorretaColors', () => {
    it('should return all colors', async () => {
      const mockColors = [
        createMockTorretaColor({ id: 1, name: 'Color 1' }),
        createMockTorretaColor({ id: 2, name: 'Color 2' }),
      ];

      service.getAllTorretaColors.mockResolvedValue(mockColors);

      const result = await controller.getAllTorretaColors();

      expect(result.message).toBe('Torreta colors retrieved successfully');
      expect(result.data).toEqual(mockColors);
      expect(service.getAllTorretaColors).toHaveBeenCalled();
    });
  });

  describe('getTorretaColorById', () => {
    it('should return color by id', async () => {
      const id = 1;
      const mockColor = createMockTorretaColor({ id, name: 'Test Color' });

      service.getTorretaColorById.mockResolvedValue(mockColor);

      const result = await controller.getTorretaColorById(id);

      expect(result.message).toBe('Torreta color found');
      expect(result.data).toEqual(mockColor);
      expect(service.getTorretaColorById).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when color not found', async () => {
      const id = 999;

      service.getTorretaColorById.mockRejectedValue(
        new NotFoundException(`Torreta color with ID ${id} not found`)
      );

      await expect(controller.getTorretaColorById(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('createTorretaColor', () => {
    it('should create color and return success response', async () => {
      const createDto: CreateTorretaColorDto = {
        name: 'New Color',
        htmlColor: '#FF0000',
        deviceColorId: 'RED',
      };
      const mockColor = createMockTorretaColor(createDto);

      service.createTorretaColor.mockResolvedValue(mockColor);

      const result = await controller.createTorretaColor(createDto);

      expect(result.message).toBe('Torreta color created successfully');
      expect(result.data.name).toBe('New Color');
      expect(service.createTorretaColor).toHaveBeenCalledWith(createDto);
    });

    it('should propagate ConflictException when color name exists', async () => {
      const createDto: CreateTorretaColorDto = {
        name: 'Existing Color',
        htmlColor: '#FF0000',
        deviceColorId: 'RED',
      };

      service.createTorretaColor.mockRejectedValue(
        new ConflictException(
          'Torreta color with name "Existing Color" already exists'
        )
      );

      await expect(controller.createTorretaColor(createDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('updateTorretaColor', () => {
    it('should update color and return success response', async () => {
      const id = 1;
      const updateDto: UpdateTorretaColorDto = { name: 'Updated Color' };
      const updatedColor = createMockTorretaColor({
        id,
        name: 'Updated Color',
      });

      service.updateTorretaColor.mockResolvedValue(updatedColor);

      const result = await controller.updateTorretaColor(id, updateDto);

      expect(result.message).toBe('Torreta color updated successfully');
      expect(result.data.name).toBe('Updated Color');
      expect(service.updateTorretaColor).toHaveBeenCalledWith(id, updateDto);
    });

    it('should propagate NotFoundException when color not found', async () => {
      const id = 999;
      const updateDto: UpdateTorretaColorDto = { name: 'Updated Color' };

      service.updateTorretaColor.mockRejectedValue(
        new NotFoundException(`Torreta color with ID ${id} not found`)
      );

      await expect(
        controller.updateTorretaColor(id, updateDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTorretaColor', () => {
    it('should delete color successfully', async () => {
      const id = 1;

      service.deleteTorretaColor.mockResolvedValue(undefined);

      await controller.deleteTorretaColor(id);

      expect(service.deleteTorretaColor).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when color not found', async () => {
      const id = 999;

      service.deleteTorretaColor.mockRejectedValue(
        new NotFoundException(`Torreta color with ID ${id} not found`)
      );

      await expect(controller.deleteTorretaColor(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
