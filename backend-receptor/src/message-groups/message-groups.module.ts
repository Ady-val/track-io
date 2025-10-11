import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageGroup } from './domain/entities/message-group.entity';
import { MessageGroupRepository } from './domain/repositories/message-group.repository';
import { MessageGroupService } from './application/services/message-group.service';
import { MessageGroupController } from './controllers/message-group.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MessageGroup])],
  controllers: [MessageGroupController],
  providers: [MessageGroupService, MessageGroupRepository],
  exports: [MessageGroupService, MessageGroupRepository],
})
export class MessageGroupsModule {}

