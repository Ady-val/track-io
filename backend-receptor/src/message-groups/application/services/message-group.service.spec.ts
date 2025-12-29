import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { MessageGroupService } from './message-group.service';
import { MessageGroupRepository } from '../../domain/repositories/message-group.repository';
import { createMockMessageGroup } from '../../../test-helpers';
import type {
  CreateMessageGroupDto,
  UpdateMessageGroupDto,
} from '../dtos/message-group.dto';

describe('MessageGroupService', () => {
  let service: MessageGroupService;
  let repository: jest.Mocked<MessageGroupRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageGroupService,
        {
          provide: MessageGroupRepository,
          useValue: {
            findAllOrderedByOrder: jest.fn(),
            findOne: jest.fn(),
            findByName: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MessageGroupService>(MessageGroupService);
    repository = module.get(MessageGroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllMessageGroups', () => {
    it('should return all groups ordered by order', async () => {
      const mockGroups = [
        createMockMessageGroup({ id: 1, order: 0 }),
        createMockMessageGroup({ id: 2, order: 1 }),
      ];

      repository.findAllOrderedByOrder.mockResolvedValue(mockGroups);

      const result = await service.getAllMessageGroups();

      expect(result).toEqual(mockGroups);
      expect(repository.findAllOrderedByOrder).toHaveBeenCalled();
    });
  });

  describe('getMessageGroupById', () => {
    it('should return group when exists', async () => {
      const id = 1;
      const mockGroup = createMockMessageGroup({ id });

      repository.findOne.mockResolvedValue(mockGroup as any);

      const result = await service.getMessageGroupById(id);

      expect(result).toEqual(mockGroup);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should throw NotFoundException when group does not exist', async () => {
      const id = 999;
      repository.findOne.mockResolvedValue(null);

      await expect(service.getMessageGroupById(id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getMessageGroupById(id)).rejects.toThrow(
        `Message group with ID ${id} not found`
      );
    });
  });

  describe('createMessageGroup', () => {
    it('should create group successfully', async () => {
      const createDto: CreateMessageGroupDto = {
        name: 'Test Group',
        color: '#FF0000',
        description: 'Test Description',
        order: 0,
      };
      const mockGroup = createMockMessageGroup({ id: 1, ...createDto });

      repository.findByName.mockResolvedValue(null);
      repository.create.mockReturnValue(mockGroup as any);
      repository.save.mockResolvedValue(mockGroup);

      const result = await service.createMessageGroup(createDto);

      expect(result).toEqual(mockGroup);
      expect(repository.findByName).toHaveBeenCalledWith(createDto.name);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockGroup);
    });

    it('should throw ConflictException when name already exists', async () => {
      const createDto: CreateMessageGroupDto = {
        name: 'Existing Group',
        color: '#FF0000',
        description: 'Test Description',
        order: 0,
      };
      const existingGroup = createMockMessageGroup({
        id: 1,
        name: 'Existing Group',
      });

      repository.findByName.mockResolvedValue(existingGroup);

      await expect(service.createMessageGroup(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.createMessageGroup(createDto)).rejects.toThrow(
        `Message group with name "${createDto.name}" already exists`
      );
    });
  });

  describe('updateMessageGroup', () => {
    it('should update group successfully', async () => {
      const id = 1;
      const updateDto: UpdateMessageGroupDto = { name: 'Updated Name' };
      const existingGroup = createMockMessageGroup({ id, name: 'Old Name' });
      const updatedGroup = createMockMessageGroup({
        id,
        name: 'Updated Name',
      });

      repository.findOne.mockResolvedValue(existingGroup as any);
      repository.findByName.mockResolvedValue(null);
      repository.save.mockResolvedValue(updatedGroup);

      const result = await service.updateMessageGroup(id, updateDto);

      expect(result).toEqual(updatedGroup);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when new name conflicts', async () => {
      const id = 1;
      const updateDto: UpdateMessageGroupDto = { name: 'Existing Name' };
      const existingGroup = createMockMessageGroup({ id, name: 'Old Name' });
      const conflictingGroup = createMockMessageGroup({
        id: 2,
        name: 'Existing Name',
      });

      repository.findOne.mockResolvedValue(existingGroup as any);
      repository.findByName.mockResolvedValue(conflictingGroup);

      await expect(service.updateMessageGroup(id, updateDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.updateMessageGroup(id, updateDto)).rejects.toThrow(
        `Message group with name "${updateDto.name}" already exists`
      );
    });

    it('should allow same name for same group', async () => {
      const id = 1;
      const updateDto: UpdateMessageGroupDto = { name: 'Same Name' };
      const existingGroup = createMockMessageGroup({ id, name: 'Same Name' });

      repository.findOne.mockResolvedValue(existingGroup as any);
      repository.findByName.mockResolvedValue(existingGroup);
      repository.save.mockResolvedValue(existingGroup);

      const result = await service.updateMessageGroup(id, updateDto);

      expect(result).toEqual(existingGroup);
    });
  });

  describe('deleteMessageGroup', () => {
    it('should delete group successfully', async () => {
      const id = 1;
      const mockGroup = createMockMessageGroup({ id });

      repository.findOne.mockResolvedValue(mockGroup as any);
      repository.remove.mockResolvedValue(mockGroup as any);

      await service.deleteMessageGroup(id);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(repository.remove).toHaveBeenCalledWith(mockGroup);
    });
  });
});
