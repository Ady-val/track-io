import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertMessage } from './domain/entities/alert-message.entity';
import { AlertMessageRepository } from './domain/repositories/alert-message.repository';
import { AlertMessageService } from './application/services/alert-message.service';
import { AlertMessageController } from './controllers/alert-message.controller';
import { AlertRulesModule } from '../alert-rules/alert-rules.module';
import { MessageGroupsModule } from '../message-groups/message-groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertMessage]),
    forwardRef(() => AlertRulesModule),
    MessageGroupsModule,
  ],
  controllers: [AlertMessageController],
  providers: [AlertMessageService, AlertMessageRepository],
  exports: [AlertMessageService, AlertMessageRepository],
})
export class AlertMessagesModule {}
