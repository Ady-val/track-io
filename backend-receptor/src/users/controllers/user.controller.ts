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
import { plainToInstance } from 'class-transformer';
import { UserService } from '../application/services/user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '../application/dtos/user.dto';
import { UserFilters } from '../domain/repositories/user.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async create(@Body() createUserDto: CreateUserDto): Promise<{
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.userService.create(createUserDto);
    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'User created successfully',
      data: userResponse,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('name') name?: string,
    @Query('username') username?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('includeDeleted', new DefaultValuePipe(false))
    includeDeleted?: boolean
  ): Promise<{
    message: string;
    data: UserResponseDto[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: UserFilters = {};
    if (name) filters.name = name;
    if (username) filters.username = username;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (includeDeleted) filters.includeDeleted = includeDeleted;

    const { data, total } = await this.userService.findAll(filters);
    const userResponses = plainToInstance(UserResponseDto, data, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Users retrieved successfully',
      data: userResponses,
      total,
      pagination: {
        limit: limit ?? 10,
        offset: offset ?? 0,
        total,
      },
    };
  }

  @Get('count')
  @UseGuards(JwtAuthGuard)
  async getCount(): Promise<{
    message: string;
    count: number;
  }> {
    const count = await this.userService.getCount();

    return {
      message: 'Users count retrieved successfully',
      count,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.userService.findById(id);
    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'User retrieved successfully',
      data: userResponse,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<{
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.userService.update(id, updateUserDto);
    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'User updated successfully',
      data: userResponse,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.userService.remove(id);

    return {
      message: 'User deleted successfully',
    };
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard)
  async restore(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.userService.restore(id);
    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'User restored successfully',
      data: userResponse,
    };
  }
}
