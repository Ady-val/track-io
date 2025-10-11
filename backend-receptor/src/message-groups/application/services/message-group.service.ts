import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { MessageGroupRepository } from '../../domain/repositories/message-group.repository';
import { MessageGroup } from '../../domain/entities/message-group.entity';
import {
  CreateMessageGroupDto,
  UpdateMessageGroupDto,
} from '../dtos/message-group.dto';

@Injectable()
export class MessageGroupService {
  constructor(
    private readonly messageGroupRepository: MessageGroupRepository
  ) {}

  async getAllMessageGroups(): Promise<MessageGroup[]> {
    return this.messageGroupRepository.findAllOrderedByOrder();
  }

  async getMessageGroupById(id: number): Promise<MessageGroup> {
    const messageGroup = await this.messageGroupRepository.findOne({
      where: { id },
    });

    if (!messageGroup) {
      throw new NotFoundException(`Message group with ID ${id} not found`);
    }

    return messageGroup;
  }

  async createMessageGroup(
    createDto: CreateMessageGroupDto
  ): Promise<MessageGroup> {
    // Check if name already exists
    const existing = await this.messageGroupRepository.findByName(
      createDto.name
    );

    if (existing) {
      throw new ConflictException(
        `Message group with name "${createDto.name}" already exists`
      );
    }

    const messageGroup = this.messageGroupRepository.create(createDto);
    return this.messageGroupRepository.save(messageGroup);
  }

  async updateMessageGroup(
    id: number,
    updateDto: UpdateMessageGroupDto
  ): Promise<MessageGroup> {
    const messageGroup = await this.getMessageGroupById(id);

    // Check if new name conflicts with existing
    if (updateDto.name && updateDto.name !== messageGroup.name) {
      const existing = await this.messageGroupRepository.findByName(
        updateDto.name
      );
      if (existing) {
        throw new ConflictException(
          `Message group with name "${updateDto.name}" already exists`
        );
      }
    }

    Object.assign(messageGroup, updateDto);
    return this.messageGroupRepository.save(messageGroup);
  }

  async deleteMessageGroup(id: number): Promise<void> {
    const messageGroup = await this.getMessageGroupById(id);
    await this.messageGroupRepository.remove(messageGroup);
  }
}

