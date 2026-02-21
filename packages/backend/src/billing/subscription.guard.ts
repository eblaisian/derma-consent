import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.practiceId) {
      throw new ForbiddenException('Keine Praxis zugeordnet');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId: user.practiceId },
    });

    if (!subscription) {
      throw new ForbiddenException('Kein Abonnement gefunden');
    }

    // Allow trialing within trial period
    if (subscription.status === 'TRIALING') {
      if (subscription.trialEndsAt && subscription.trialEndsAt > new Date()) {
        return true;
      }
      throw new ForbiddenException('Testphase abgelaufen');
    }

    // Allow active subscriptions
    if (subscription.status === 'ACTIVE') {
      return true;
    }

    throw new ForbiddenException('Aktives Abonnement erforderlich');
  }
}
