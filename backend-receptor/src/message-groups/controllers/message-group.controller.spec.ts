import { Test, type TestingModule } from '@nestjs/testing';
import { MessageGroupController } from './message-group.controller';
import { MessageGroupService } from '../application/services/message-group.service';
import { createMockMessageGroup } from '../../test-helpers';

describe('MessageGroupController', () => {
  let controller: MessageGroupController;
  let service: jest.Mocked<MessageGroupService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageGroupController],
      providers: [
        {
          provide: MessageGroupService,
          useValue: {
            getAllMessageGroups: jest.fn(),
            getMessageGroupById: jest.fn(),
            createMessageGroup: jest.fn(),
            updateMessageGroup: jest.fn(),
            deleteMessageGroup: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MessageGroupController>(MessageGroupController);
    service = module.get(MessageGroupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllMessageGroups', () => {
    it('should return all groups', async () => {
      const mockGroups = [
        createMockMessageGroup({ id: 1 }),
        createMockMessageGroup({ id: 2 }),
      ];

      service.getAllMessageGroups.mockResolvedValue(mockGroups);

      const result = await controller.getAllMessageGroups();

      expect(result).toEqual({
        message: 'Message groups retrieved successfully',
        data: mockGroups,
      });
      expect(service.getAllMessageGroups).toHaveBeenCalled();
    });
  });

  describe('getMessageGroupById', () => {
    it('should return group by ID', async () => {
      const id = 1;
      const mockGroup = createMockMessageGroup({ id });

      service.getMessageGroupById.mockResolvedValue(mockGroup);

      const result = await controller.getMessageGroupById(id);

      expect(result).toEqual({
        message: 'Message group found',
        data: mockGroup,
      });
      expect(service.getMessageGroupById).toHaveBeenCalledWith(id);
    });
  });

  describe('createMessageGroup', () => {
    it('should create group successfully', async () => {
      const createDto = {
        name: 'Test Group',
        color: '#FF0000',
        description: 'Test Description',
        order: 0,
      };
      const mockGroup = createMockMessageGroup({ id: 1, ...createDto });

      service.createMessageGroup.mockResolvedValue(mockGroup);

      const result = await controller.createMessageGroup(createDto);

      expect(result).toEqual({
        message: 'Message group created successfully',
        data: mockGroup,
      });
      expect(service.createMessageGroup).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateMessageGroup', () => {
    it('should update group successfully', async () => {
      const id = 1;
      const updateDto = { name: 'Updated Name' };
      const updatedGroup = createMockMessageGroup({ id, name: 'Updated Name' });

      service.updateMessageGroup.mockResolvedValue(updatedGroup);

      const result = await controller.updateMessageGroup(id, updateDto);

      expect(result).toEqual({
        message: 'Message group updated successfully',
        data: updatedGroup,
      });
      expect(service.updateMessageGroup).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('deleteMessageGroup', () => {
    it('should delete group successfully', async () => {
      const id = 1;
      service.deleteMessageGroup.mockResolvedValue(undefined);

      await controller.deleteMessageGroup(id);

      expect(service.deleteMessageGroup).toHaveBeenCalledWith(id);
    });
  });
});
