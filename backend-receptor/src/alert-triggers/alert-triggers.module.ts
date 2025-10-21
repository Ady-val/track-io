import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertTrigger } from './domain/entities/alert-trigger.entity';
import { AlertTriggerRepository } from './domain/repositories/alert-trigger.repository';
import { AlertTriggerService } from './application/services/alert-trigger.service';
import { AlertTriggerController } from './controllers/alert-trigger.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AlertTrigger])],
  controllers: [AlertTriggerController],
  providers: [AlertTriggerService, AlertTriggerRepository],
  exports: [AlertTriggerService, AlertTriggerRepository],
})
export class AlertTriggersModule {}
