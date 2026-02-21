import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

describe('BillingService', () => {
  let service: BillingService;

  const mockPrisma = {
    subscription: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_dummy',
        STRIPE_STARTER_MONTHLY_PRICE_ID: 'price_starter_monthly',
        STRIPE_STARTER_YEARLY_PRICE_ID: 'price_starter_yearly',
        STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID: 'price_pro_monthly',
        STRIPE_PROFESSIONAL_YEARLY_PRICE_ID: 'price_pro_yearly',
      };
      return map[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    jest.clearAllMocks();
  });

  describe('handleWebhookEvent()', () => {
    it('should update subscription on customer.subscription.created', async () => {
      mockPrisma.subscription.update.mockResolvedValue({});

      const event = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            metadata: { practiceId: 'practice-1' },
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 86400,
            items: { data: [{ price: { id: 'price_starter_monthly' } }] },
          },
        },
      } as unknown as Stripe.Event;

      await service.handleWebhookEvent(event);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { practiceId: 'practice-1' },
        data: expect.objectContaining({
          stripeSubscriptionId: 'sub_123',
          status: 'ACTIVE',
          plan: 'STARTER',
        }),
      });
    });

    it('should update status to PAST_DUE on subscription.updated with past_due', async () => {
      mockPrisma.subscription.update.mockResolvedValue({});

      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            metadata: { practiceId: 'practice-1' },
            status: 'past_due',
            current_period_end: Math.floor(Date.now() / 1000) + 86400,
            items: { data: [{ price: { id: 'price_pro_monthly' } }] },
          },
        },
      } as unknown as Stripe.Event;

      await service.handleWebhookEvent(event);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { practiceId: 'practice-1' },
        data: expect.objectContaining({
          status: 'PAST_DUE',
          plan: 'PROFESSIONAL',
        }),
      });
    });

    it('should set status to CANCELLED on subscription.deleted', async () => {
      mockPrisma.subscription.update.mockResolvedValue({});

      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            metadata: { practiceId: 'practice-1' },
            status: 'canceled',
          },
        },
      } as unknown as Stripe.Event;

      await service.handleWebhookEvent(event);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { practiceId: 'practice-1' },
        data: {
          status: 'CANCELLED',
          stripeSubscriptionId: null,
        },
      });
    });

    it('should update status to PAST_DUE on invoice.payment_failed', async () => {
      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });

      const event = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer: 'cus_123',
          },
        },
      } as unknown as Stripe.Event;

      await service.handleWebhookEvent(event);

      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_123' },
        data: { status: 'PAST_DUE' },
      });
    });

    it('should skip events without practiceId in metadata', async () => {
      const event = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            metadata: {},
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000),
            items: { data: [{ price: { id: 'price_starter_monthly' } }] },
          },
        },
      } as unknown as Stripe.Event;

      await service.handleWebhookEvent(event);

      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    });
  });
});
