import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Email } from '../../domain/entities/email.entity';
import {
  EmailRepository,
  CreateEmailDto,
  UpdateEmailDto,
  EmailFilters,
} from '../../domain/repositories/email.repository';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly emailRepository: EmailRepository) {}

  async create(createEmailDto: CreateEmailDto): Promise<Email> {
    this.logger.log(`Creating email with address: ${createEmailDto.email}`);

    try {
      const email = await this.emailRepository.create(createEmailDto);
      this.logger.log(`Email created successfully with ID: ${email.id}`);
      return email;
    } catch (error) {
      this.logger.error(
        `Error creating email: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findAll(
    filters?: EmailFilters
  ): Promise<{ data: Email[]; total: number }> {
    try {
      return await this.emailRepository.findAll(filters);
    } catch (error) {
      this.logger.error(
        `Error retrieving emails: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findById(id: number): Promise<Email> {
    try {
      const email = await this.emailRepository.findById(id);
      if (!email) {
        throw new NotFoundException(`Email with ID ${id} not found`);
      }
      return email;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving email by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async update(id: number, updateEmailDto: UpdateEmailDto): Promise<Email> {
    this.logger.log(`Updating email with ID: ${id}`);

    try {
      await this.findById(id);

      const updatedEmail = await this.emailRepository.update(id, updateEmailDto);
      if (!updatedEmail) {
        throw new NotFoundException(`Email with ID ${id} not found`);
      }

      this.logger.log(`Email updated successfully with ID: ${id}`);
      return updatedEmail;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error updating email with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Soft deleting email with ID: ${id}`);

    try {
      await this.findById(id);

      const deleted = await this.emailRepository.softDelete(id);
      if (!deleted) {
        throw new NotFoundException(`Email with ID ${id} not found`);
      }

      this.logger.log(`Email soft deleted successfully with ID: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error deleting email with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async restore(id: number): Promise<Email> {
    this.logger.log(`Restoring email with ID: ${id}`);

    try {
      const restored = await this.emailRepository.restore(id);
      if (!restored) {
        throw new NotFoundException(
          `Email with ID ${id} not found or not deleted`
        );
      }

      const email = await this.emailRepository.findById(id);
      if (!email) {
        throw new NotFoundException(`Email with ID ${id} not found`);
      }

      this.logger.log(`Email restored successfully with ID: ${id}`);
      return email;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error restoring email with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCount(): Promise<number> {
    try {
      return await this.emailRepository.count();
    } catch (error) {
      this.logger.error(
        `Error getting emails count: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}

