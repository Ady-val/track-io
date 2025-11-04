import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailController } from './controllers/email.controller';
import { EmailService } from './application/services/email.service';
import { Email } from './domain/entities/email.entity';
import { EmailRepository } from './domain/repositories/email.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Email])],
  controllers: [EmailController],
  providers: [EmailService, EmailRepository],
  exports: [EmailService, EmailRepository],
})
export class EmailsModule {}

