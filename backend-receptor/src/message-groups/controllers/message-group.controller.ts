import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessageGroupService } from '../application/services/message-group.service';
import { MessageGroup } from '../domain/entities/message-group.entity';
import {
  CreateMessageGroupDto,
  UpdateMessageGroupDto,
} from '../application/dtos/message-group.dto';
import { SystemModuleTag } from 'src/common/decorators/system-module.decorator';
import { SystemModule } from 'src/common/enums/system-module.enum';

@SystemModuleTag(SystemModule.MEASUREMENTS)
@Controller('message-groups')
export class MessageGroupController {
  constructor(private readonly messageGroupService: MessageGroupService) {}

  @Get()
  async getAllMessageGroups(): Promise<{
    message: string;
    data: MessageGroup[];
  }> {
    const groups = await this.messageGroupService.getAllMessageGroups();

    return {
      message: 'Message groups retrieved successfully',
      data: groups,
    };
  }

  @Get(':id')
  async getMessageGroupById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: MessageGroup;
  }> {
    const group = await this.messageGroupService.getMessageGroupById(id);

    return {
      message: 'Message group found',
      data: group,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMessageGroup(@Body() createDto: CreateMessageGroupDto): Promise<{
    message: string;
    data: MessageGroup;
  }> {
    const group = await this.messageGroupService.createMessageGroup(createDto);

    return {
      message: 'Message group created successfully',
      data: group,
    };
  }

  @Put(':id')
  async updateMessageGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMessageGroupDto
  ): Promise<{
    message: string;
    data: MessageGroup;
  }> {
    const group = await this.messageGroupService.updateMessageGroup(
      id,
      updateDto
    );

    return {
      message: 'Message group updated successfully',
      data: group,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessageGroup(
    @Param('id', ParseIntPipe) id: number
  ): Promise<void> {
    await this.messageGroupService.deleteMessageGroup(id);
  }
}
