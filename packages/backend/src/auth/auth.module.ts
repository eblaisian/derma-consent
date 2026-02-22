import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { TwoFactorService } from './two-factor.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('AUTH_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [AuthService, TwoFactorService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, TwoFactorService, JwtModule],
})
export class AuthModule {}
