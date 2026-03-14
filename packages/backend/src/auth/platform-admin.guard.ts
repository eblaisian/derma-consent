import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  private readonly logger = new Logger(PlatformAdminGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();

    if (user?.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Platform admin access required');
    }

    // Warn if 2FA not enabled (will be enforced once 2FA onboarding flow is built)
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { twoFactorEnabled: true },
    });

    if (dbUser && !dbUser.twoFactorEnabled) {
      this.logger.warn(
        `Platform admin ${user.email} accessing admin endpoints without 2FA enabled`,
      );
    }

    return true;
  }
}
