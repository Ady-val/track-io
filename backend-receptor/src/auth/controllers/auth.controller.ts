import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from '../application/services/auth.service';
import { LoginDto, LoginResponseDto } from '../application/dtos/auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../decorators/current-user.decorator';

interface AuthenticatedRequest {
  headers: { authorization?: string; 'user-agent'?: string };
  ip?: string;
  connection?: { remoteAddress?: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private extractTokenFromRequest(req: AuthenticatedRequest): string {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header not found');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new BadRequestException('Token not found in authorization header');
    }

    return token;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: AuthenticatedRequest
  ): Promise<LoginResponseDto> {
    const ipAddress = req.ip ?? req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    const token = this.extractTokenFromRequest(req);
    await this.authService.logout(token);

    return {
      message: 'Logged out successfully',
    };
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: CurrentUserType
  ): Promise<{ message: string }> {
    await this.authService.logoutAll(user.id);

    return {
      message: 'All sessions closed successfully',
    };
  }

  @Delete('sessions/others')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAllExceptCurrent(
    @CurrentUser() user: CurrentUserType,
    @Request() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    const token = this.extractTokenFromRequest(req);
    await this.authService.logoutAllExceptCurrent(user.id, token);

    return {
      message: 'All other sessions closed successfully',
    };
  }
}
