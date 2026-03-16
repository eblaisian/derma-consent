import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Headers,
  HttpCode,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { SyncUserDto } from './auth.dto';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto, UpdateProfileDto, ChangePasswordDto } from './credentials.dto';
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
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginWithCredentials(dto);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('verify-email')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async resendVerification(@Body() dto: ForgotPasswordDto) {
    return this.authService.resendVerification(dto.email);
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
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verify2FA(@Body() dto: TwoFactorVerifyLoginDto) {
    return this.authService.verifyTwoFactorLogin(dto.tempToken, dto.token);
  }

  @Post('refresh-token')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.refreshToken(user.userId);
  }

  @Get('account/profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.userId);
  }

  @Patch('account/profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }

  @Post('account/change-password')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto.currentPassword, dto.newPassword);
  }

  /** GDPR Art. 15 — Data Subject Access Request (DSAR) */
  @Get('account/export')
  @UseGuards(JwtAuthGuard)
  async exportAccountData(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.exportAccountData(user.userId, user.practiceId);
  }
}
