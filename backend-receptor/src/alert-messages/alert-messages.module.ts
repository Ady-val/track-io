import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AlertMessage } from './domain/entities/alert-message.entity';
import { AlertMessageRepository } from './domain/repositories/alert-message.repository';
import { AlertMessageService } from './application/services/alert-message.service';
import { AlertMessageSenderService } from './application/services/alert-message-sender.service';
import { AlertMessageController } from './controllers/alert-message.controller';
import { AlertRulesModule } from '../alert-rules/alert-rules.module';
import { MessageGroupsModule } from '../message-groups/message-groups.module';
import { TorretaColorsModule } from '../torreta-colors/torreta-colors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertMessage]),
    HttpModule,
    forwardRef(() => AlertRulesModule),
    MessageGroupsModule,
    TorretaColorsModule,
  ],
  controllers: [AlertMessageController],
  providers: [
    AlertMessageService,
    AlertMessageSenderService,
    AlertMessageRepository,
  ],
  exports: [
    AlertMessageService,
    AlertMessageSenderService,
    AlertMessageRepository,
  ],
})
export class AlertMessagesModule {}
