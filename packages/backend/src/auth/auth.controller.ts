import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SyncUserDto } from './auth.dto';
import { RegisterDto, LoginDto } from './credentials.dto';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('sync')
  async syncUser(
    @Body() dto: SyncUserDto,
    @Headers('x-auth-secret') authSecret: string,
  ) {
    const expectedSecret = this.configService.get<string>('AUTH_SECRET');
    if (!authSecret || authSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid auth secret');
    }

    return this.authService.syncUser(dto);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginWithCredentials(dto);
  }
}
