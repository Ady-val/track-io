import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailRepository } from '../../domain/repositories/email.repository';
import { createMockEmail } from '../../../test-helpers';
import type {
  CreateEmailDto,
  UpdateEmailDto,
  EmailFilters,
} from '../../domain/repositories/email.repository';

describe('EmailService', () => {
  let service: EmailService;
  let repository: jest.Mocked<EmailRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: EmailRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    repository = module.get(EmailRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create email successfully', async () => {
      const createDto: CreateEmailDto = {
        name: 'Test Email',
        email: 'test@example.com',
      };
      const mockEmail = createMockEmail({ id: 1, ...createDto });

      repository.create.mockResolvedValue(mockEmail);

      const result = await service.create(createDto);

      expect(result).toEqual(mockEmail);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });

    it('should handle errors when creating email', async () => {
      const createDto: CreateEmailDto = {
        name: 'Test Email',
        email: 'test@example.com',
      };
      const error = new Error('Database error');
      repository.create.mockRejectedValue(error);

      await expect(service.create(createDto)).rejects.toThrow(error);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of emails', async () => {
      const filters: EmailFilters = { limit: 10, offset: 0 };
      const mockEmails = [
        createMockEmail({ id: 1 }),
        createMockEmail({ id: 2 }),
      ];
      const mockResult = { data: mockEmails, total: 2 };

      repository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll(filters);

      expect(result).toEqual(mockResult);
      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should apply filters correctly', async () => {
      const filters: EmailFilters = {
        name: 'Test',
        email: 'example.com',
        includeDeleted: true,
      };
      const mockResult = { data: [], total: 0 };

      repository.findAll.mockResolvedValue(mockResult);

      await service.findAll(filters);

      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should handle errors when retrieving emails', async () => {
      const filters: EmailFilters = {};
      const error = new Error('Database error');
      repository.findAll.mockRejectedValue(error);

      await expect(service.findAll(filters)).rejects.toThrow(error);
    });
  });

  describe('findById', () => {
    it('should return email when exists', async () => {
      const id = 1;
      const mockEmail = createMockEmail({ id });

      repository.findById.mockResolvedValue(mockEmail);

      const result = await service.findById(id);

      expect(result).toEqual(mockEmail);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when email does not exist', async () => {
      const id = 999;
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
      await expect(service.findById(id)).rejects.toThrow(
        `Email with ID ${id} not found`
      );
    });

    it('should handle errors when retrieving email', async () => {
      const id = 1;
      const error = new Error('Database error');
      repository.findById.mockRejectedValue(error);

      await expect(service.findById(id)).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    it('should update email successfully', async () => {
      const id = 1;
      const updateDto: UpdateEmailDto = { name: 'Updated Name' };
      const existingEmail = createMockEmail({ id });
      const updatedEmail = createMockEmail({ id, name: 'Updated Name' });

      repository.findById.mockResolvedValue(existingEmail);
      repository.update.mockResolvedValue(updatedEmail);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(updatedEmail);
      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(repository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw NotFoundException when email does not exist', async () => {
      const id = 999;
      const updateDto: UpdateEmailDto = { name: 'Updated Name' };

      repository.findById.mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle errors when updating email', async () => {
      const id = 1;
      const updateDto: UpdateEmailDto = { name: 'Updated Name' };
      const existingEmail = createMockEmail({ id });
      const error = new Error('Database error');

      repository.findById.mockResolvedValue(existingEmail);
      repository.update.mockRejectedValue(error);

      await expect(service.update(id, updateDto)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    it('should soft delete email successfully', async () => {
      const id = 1;
      const existingEmail = createMockEmail({ id });

      repository.findById.mockResolvedValue(existingEmail);
      repository.softDelete.mockResolvedValue(true);

      await service.remove(id);

      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(repository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when email does not exist', async () => {
      const id = 999;
      repository.findById.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when soft delete fails', async () => {
      const id = 1;
      const existingEmail = createMockEmail({ id });

      repository.findById.mockResolvedValue(existingEmail);
      repository.softDelete.mockResolvedValue(false);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });

    it('should handle errors when deleting email', async () => {
      const id = 1;
      const existingEmail = createMockEmail({ id });
      const error = new Error('Database error');

      repository.findById.mockResolvedValue(existingEmail);
      repository.softDelete.mockRejectedValue(error);

      await expect(service.remove(id)).rejects.toThrow(error);
    });
  });

  describe('restore', () => {
    it('should restore email successfully', async () => {
      const id = 1;
      const restoredEmail = createMockEmail({ id });

      repository.restore.mockResolvedValue(true);
      repository.findById.mockResolvedValue(restoredEmail);

      const result = await service.restore(id);

      expect(result).toEqual(restoredEmail);
      expect(repository.restore).toHaveBeenCalledWith(id);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when email cannot be restored', async () => {
      const id = 999;
      repository.restore.mockResolvedValue(false);

      await expect(service.restore(id)).rejects.toThrow(NotFoundException);
      await expect(service.restore(id)).rejects.toThrow(
        `Email with ID ${id} not found or not deleted`
      );
    });

    it('should throw NotFoundException when email not found after restore', async () => {
      const id = 1;
      repository.restore.mockResolvedValue(true);
      repository.findById.mockResolvedValue(null);

      await expect(service.restore(id)).rejects.toThrow(NotFoundException);
    });

    it('should handle errors when restoring email', async () => {
      const id = 1;
      const error = new Error('Database error');
      repository.restore.mockRejectedValue(error);

      await expect(service.restore(id)).rejects.toThrow(error);
    });
  });

  describe('getCount', () => {
    it('should return count of emails', async () => {
      const count = 10;
      repository.count.mockResolvedValue(count);

      const result = await service.getCount();

      expect(result).toBe(count);
      expect(repository.count).toHaveBeenCalled();
    });

    it('should handle errors when getting count', async () => {
      const error = new Error('Database error');
      repository.count.mockRejectedValue(error);

      await expect(service.getCount()).rejects.toThrow(error);
    });
  });
});
