import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { SyncUserDto } from './auth.dto';
import { RegisterDto, LoginDto } from './credentials.dto';
import { TwoFactorTokenDto, TwoFactorVerifyLoginDto } from './two-factor.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from './current-user.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
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

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  async get2FAStatus(@CurrentUser() user: CurrentUserPayload) {
    return this.twoFactorService.getStatus(user.userId);
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  async setup2FA(@CurrentUser() user: CurrentUserPayload) {
    return this.twoFactorService.generateSetupSecret(user.userId);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  async enable2FA(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: TwoFactorTokenDto,
  ) {
    return this.twoFactorService.enableTwoFactor(user.userId, dto.token);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  async disable2FA(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: TwoFactorTokenDto,
  ) {
    return this.twoFactorService.disableTwoFactor(user.userId, dto.token);
  }

  @Post('2fa/verify')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verify2FA(@Body() dto: TwoFactorVerifyLoginDto) {
    return this.authService.verifyTwoFactorLogin(dto.tempToken, dto.token);
  }
}
