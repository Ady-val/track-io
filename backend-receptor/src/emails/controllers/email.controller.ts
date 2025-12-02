import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { EmailService } from '../application/services/email.service';
import { CreateEmailDto, UpdateEmailDto } from '../application/dtos/email.dto';
import { Email } from '../domain/entities/email.entity';
import { EmailFilters } from '../domain/repositories/email.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';

@Controller('emails')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.CATALOGS, Action.CREATE)
  async create(@Body() createEmailDto: CreateEmailDto): Promise<{
    message: string;
    data: Email;
  }> {
    const email = await this.emailService.create(createEmailDto);

    return {
      message: 'Email created successfully',
      data: email,
    };
  }

  @Get()
  async findAll(
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('includeDeleted', new DefaultValuePipe(false))
    includeDeleted?: boolean
  ): Promise<{
    message: string;
    data: Email[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: EmailFilters = {};
    if (name) filters.name = name;
    if (email) filters.email = email;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (includeDeleted) filters.includeDeleted = includeDeleted;

    const { data, total } = await this.emailService.findAll(filters);

    return {
      message: 'Emails retrieved successfully',
      data,
      total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total,
      },
    };
  }

  @Get('count')
  async getCount(): Promise<{
    message: string;
    count: number;
  }> {
    const count = await this.emailService.getCount();

    return {
      message: 'Emails count retrieved successfully',
      count,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: Email;
  }> {
    const email = await this.emailService.findById(id);

    return {
      message: 'Email retrieved successfully',
      data: email,
    };
  }

  @Patch(':id')
  @RequirePermission(Module.CATALOGS, Action.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmailDto: UpdateEmailDto
  ): Promise<{
    message: string;
    data: Email;
  }> {
    const email = await this.emailService.update(id, updateEmailDto);

    return {
      message: 'Email updated successfully',
      data: email,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.CATALOGS, Action.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.emailService.remove(id);

    return {
      message: 'Email deleted successfully',
    };
  }

  @Patch(':id/restore')
  @RequirePermission(Module.CATALOGS, Action.UPDATE)
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: Email;
  }> {
    const email = await this.emailService.restore(id);

    return {
      message: 'Email restored successfully',
      data: email,
    };
  }
}
