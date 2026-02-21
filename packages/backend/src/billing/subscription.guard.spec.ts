import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { SubscriptionGuard } from './subscription.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;

  const mockPrisma = {
    subscription: {
      findUnique: jest.fn(),
    },
  };

  function createMockContext(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<SubscriptionGuard>(SubscriptionGuard);
    jest.clearAllMocks();
  });

  it('should allow request when subscription status is ACTIVE', async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      practiceId: 'practice-1',
    });

    const context = createMockContext({
      practiceId: 'practice-1',
      userId: 'user-1',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow request when trial is still valid', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: 'TRIALING',
      practiceId: 'practice-1',
      trialEndsAt: futureDate,
    });

    const context = createMockContext({
      practiceId: 'practice-1',
      userId: 'user-1',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should block request when trial has expired', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: 'TRIALING',
      practiceId: 'practice-1',
      trialEndsAt: pastDate,
    });

    const context = createMockContext({
      practiceId: 'practice-1',
      userId: 'user-1',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should block request when subscription status is CANCELLED', async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: 'CANCELLED',
      practiceId: 'practice-1',
    });

    const context = createMockContext({
      practiceId: 'practice-1',
      userId: 'user-1',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should block request when no subscription exists', async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(null);

    const context = createMockContext({
      practiceId: 'practice-1',
      userId: 'user-1',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should block request when user has no practiceId', async () => {
    const context = createMockContext({
      userId: 'user-1',
      practiceId: null,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
