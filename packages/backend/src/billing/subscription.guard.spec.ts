import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { SubscriptionGuard } from './subscription.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;

  const mockPrisma = {
    practice: {
      findUnique: jest.fn().mockResolvedValue({ isSuspended: false }),
    },
    subscription: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  function createMockContext(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  const userCtx = { practiceId: 'practice-1', userId: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<SubscriptionGuard>(SubscriptionGuard);
    jest.clearAllMocks();
    mockPrisma.practice.findUnique.mockResolvedValue({ isSuspended: false });
  });

  it('should allow ACTIVE subscriptions', async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({ status: 'ACTIVE' });
    const result = await guard.canActivate(createMockContext(userCtx));
    expect(result).toBe(true);
  });

  it('should allow valid TRIALING subscriptions', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: 'TRIALING',
      trialEndsAt: futureDate,
    });
    const result = await guard.canActivate(createMockContext(userCtx));
    expect(result).toBe(true);
  });

  it('should block expired TRIALING subscriptions', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: 'TRIALING',
      trialEndsAt: pastDate,
    });
    await expect(guard.canActivate(createMockContext(userCtx))).rejects.toThrow(ForbiddenException);
  });

  it('should allow PAST_DUE subscriptions (Stripe retries payment)', async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({ status: 'PAST_DUE' });
    const result = await guard.canActivate(createMockContext(userCtx));
    expect(result).toBe(true);
  });

  it('should allow CANCELLED with grace period (currentPeriodEnd in future)', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: 'CANCELLED',
      currentPeriodEnd: futureDate,
    });
    const result = await guard.canActivate(createMockContext(userCtx));
    expect(result).toBe(true);
  });

  it('should block CANCELLED with expired grace period', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: 'CANCELLED',
      currentPeriodEnd: pastDate,
    });
    await expect(guard.canActivate(createMockContext(userCtx))).rejects.toThrow(ForbiddenException);
  });

  it('should block CANCELLED with no currentPeriodEnd', async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: 'CANCELLED',
      currentPeriodEnd: null,
    });
    await expect(guard.canActivate(createMockContext(userCtx))).rejects.toThrow(ForbiddenException);
  });

  it('should block EXPIRED subscriptions', async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({ status: 'EXPIRED' });
    await expect(guard.canActivate(createMockContext(userCtx))).rejects.toThrow(ForbiddenException);
  });

  it('should block when no subscription exists', async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(createMockContext(userCtx))).rejects.toThrow(ForbiddenException);
  });

  it('should block when user has no practiceId', async () => {
    const context = createMockContext({ userId: 'user-1', practiceId: null });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow PLATFORM_ADMIN regardless of subscription', async () => {
    const context = createMockContext({ role: 'PLATFORM_ADMIN', practiceId: null });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should block when practice is suspended', async () => {
    mockPrisma.practice.findUnique.mockResolvedValue({ isSuspended: true });
    await expect(guard.canActivate(createMockContext(userCtx))).rejects.toThrow(ForbiddenException);
  });
});
