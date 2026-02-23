import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { PracticesQueryDto, OverrideSubscriptionDto } from './dto/admin.dto';

@Controller('api/admin/practices')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminPracticesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async list(@Query() query: PracticesQueryDto) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.practice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          isSuspended: true,
          createdAt: true,
          _count: { select: { users: true, consentForms: true } },
          subscription: { select: { plan: true, status: true } },
          users: {
            where: { role: 'ADMIN' },
            take: 1,
            select: { email: true },
          },
        },
      }),
      this.prisma.practice.count({ where }),
    ]);

    const practices = items.map((p) => ({
      id: p.id,
      name: p.name,
      isSuspended: p.isSuspended,
      createdAt: p.createdAt,
      usersCount: p._count.users,
      consentsCount: p._count.consentForms,
      plan: p.subscription?.plan ?? null,
      subscriptionStatus: p.subscription?.status ?? null,
      ownerEmail: p.users[0]?.email ?? null,
    }));

    return {
      items: practices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const practice = await this.prisma.practice.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        dsgvoContact: true,
        stripeConnectId: true,
        isSuspended: true,
        suspendedAt: true,
        createdAt: true,
        _count: { select: { users: true, consentForms: true, patients: true } },
        subscription: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const consentsByStatus = await this.prisma.consentForm.groupBy({
      by: ['status'],
      where: { practiceId: id },
      _count: { status: true },
    });

    const statusBreakdown: Record<string, number> = {};
    for (const item of consentsByStatus) {
      statusBreakdown[item.status] = item._count.status;
    }

    return {
      ...practice,
      consentStatusBreakdown: statusBreakdown,
    };
  }

  @Post(':id/suspend')
  async suspend(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    const practice = await this.prisma.practice.update({
      where: { id },
      data: { isSuspended: true, suspendedAt: new Date() },
      select: { id: true, name: true, isSuspended: true, suspendedAt: true },
    });

    await this.auditService.log({
      practiceId: id,
      userId: user.userId,
      action: 'PRACTICE_SUSPENDED',
      entityType: 'Practice',
      entityId: id,
    });

    return practice;
  }

  @Post(':id/activate')
  async activate(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    const practice = await this.prisma.practice.update({
      where: { id },
      data: { isSuspended: false, suspendedAt: null },
      select: { id: true, name: true, isSuspended: true },
    });

    await this.auditService.log({
      practiceId: id,
      userId: user.userId,
      action: 'PRACTICE_ACTIVATED',
      entityType: 'Practice',
      entityId: id,
    });

    return practice;
  }

  @Patch(':id/subscription')
  async overrideSubscription(
    @Param('id') id: string,
    @Body() body: OverrideSubscriptionDto,
    @CurrentUser() user: { userId: string },
  ) {
    const subscription = await this.prisma.subscription.update({
      where: { practiceId: id },
      data: { plan: body.plan },
    });

    await this.auditService.log({
      practiceId: id,
      userId: user.userId,
      action: 'PRACTICE_SUBSCRIPTION_OVERRIDDEN',
      entityType: 'Subscription',
      entityId: subscription.id,
      metadata: { newPlan: body.plan },
    });

    return subscription;
  }
}
