import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from '../application/services/email.service';
import { createMockEmail } from '../../test-helpers';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockPermissionGuard = {
  canActivate: jest.fn(() => true),
};

describe('EmailController', () => {
  let controller: EmailController;
  let service: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        {
          provide: EmailService,
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
    })
      .overrideGuard(mockJwtAuthGuard.constructor as any)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(mockPermissionGuard.constructor as any)
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<EmailController>(EmailController);
    service = module.get(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create email successfully', async () => {
      const createDto = {
        name: 'Test Email',
        email: 'test@example.com',
      };
      const mockEmail = createMockEmail({ id: 1, ...createDto });

      service.create.mockResolvedValue(mockEmail);

      const result = await controller.create(createDto);

      expect(result).toEqual({
        message: 'Email created successfully',
        data: mockEmail,
      });
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of emails', async () => {
      const mockEmails = [
        createMockEmail({ id: 1 }),
        createMockEmail({ id: 2 }),
      ];
      const mockResult = { data: mockEmails, total: 2 };

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll();

      expect(result).toEqual({
        message: 'Emails retrieved successfully',
        data: mockEmails,
        total: 2,
        pagination: {
          limit: 10,
          offset: 0,
          total: 2,
        },
      });
      expect(service.findAll).toHaveBeenCalledWith({});
    });

    it('should apply filters when provided', async () => {
      const name = 'Test';
      const email = 'example.com';
      const limit = 20;
      const offset = 10;
      const includeDeleted = true;
      const mockResult = { data: [], total: 0 };

      service.findAll.mockResolvedValue(mockResult);

      await controller.findAll(name, email, limit, offset, includeDeleted);

      expect(service.findAll).toHaveBeenCalledWith({
        name,
        email,
        limit,
        offset,
        includeDeleted,
      });
    });
  });

  describe('getCount', () => {
    it('should return count of emails', async () => {
      const count = 10;
      service.getCount.mockResolvedValue(count);

      const result = await controller.getCount();

      expect(result).toEqual({
        message: 'Emails count retrieved successfully',
        count,
      });
      expect(service.getCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return email when exists', async () => {
      const id = 1;
      const mockEmail = createMockEmail({ id });

      service.findById.mockResolvedValue(mockEmail);

      const result = await controller.findOne(id);

      expect(result).toEqual({
        message: 'Email retrieved successfully',
        data: mockEmail,
      });
      expect(service.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when email does not exist', async () => {
      const id = 999;
      service.findById.mockRejectedValue(
        new NotFoundException(`Email with ID ${id} not found`)
      );

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update email successfully', async () => {
      const id = 1;
      const updateDto = { name: 'Updated Name' };
      const updatedEmail = createMockEmail({ id, name: 'Updated Name' });

      service.update.mockResolvedValue(updatedEmail);

      const result = await controller.update(id, updateDto);

      expect(result).toEqual({
        message: 'Email updated successfully',
        data: updatedEmail,
      });
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete email successfully', async () => {
      const id = 1;
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(result).toEqual({
        message: 'Email deleted successfully',
      });
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('restore', () => {
    it('should restore email successfully', async () => {
      const id = 1;
      const restoredEmail = createMockEmail({ id });

      service.restore.mockResolvedValue(restoredEmail);

      const result = await controller.restore(id);

      expect(result).toEqual({
        message: 'Email restored successfully',
        data: restoredEmail,
      });
      expect(service.restore).toHaveBeenCalledWith(id);
    });
  });
});
