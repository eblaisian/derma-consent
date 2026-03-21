import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';

// Mock the ResendTransport so we can capture what's sent
const mockSend = jest.fn().mockResolvedValue(undefined);
jest.mock('./transports', () => ({
  ResendTransport: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
}));

describe('EmailService', () => {
  let service: EmailService;
  let platformConfig: PlatformConfigService;

  const mockPlatformConfig = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'email.resendApiKey') return Promise.resolve('test-key');
      if (key === 'email.fromName') return Promise.resolve('DermaConsent');
      if (key === 'email.fromAddress') return Promise.resolve('noreply@test.com');
      return Promise.resolve(undefined);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPlatformConfig.get.mockImplementation((key: string) => {
      if (key === 'email.resendApiKey') return Promise.resolve('test-key');
      if (key === 'email.fromName') return Promise.resolve('DermaConsent');
      if (key === 'email.fromAddress') return Promise.resolve('noreply@test.com');
      return Promise.resolve(undefined);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: PlatformConfigService, useValue: mockPlatformConfig },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    platformConfig = module.get<PlatformConfigService>(PlatformConfigService);
  });

  describe('no-op when no API key', () => {
    it('logs but does not throw when resendApiKey is undefined', async () => {
      mockPlatformConfig.get.mockImplementation((key: string) => {
        if (key === 'email.resendApiKey') return Promise.resolve(undefined);
        return Promise.resolve(undefined);
      });

      await expect(service.sendWelcome('test@example.com', 'Max', 'en')).resolves.not.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('sendConsentLink', () => {
    it('sends email with correct subject and HTML content', async () => {
      await service.sendConsentLink('patient@example.com', 'Dr. Mueller', 'https://example.com/consent/abc', 7, 'en');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe('patient@example.com');
      expect(call.subject).toContain('Consent form');
      expect(call.html).toContain('Dr. Mueller');
      expect(call.html).toContain('https://example.com/consent/abc');
      expect(call.html).toContain('<!DOCTYPE html>');
      expect(call.text).toBeTruthy();
      expect(call.from).toContain('Dr. Mueller via DermaConsent');
    });
  });

  describe('sendWelcome', () => {
    it('sends email with dashboard CTA', async () => {
      await service.sendWelcome('user@example.com', 'Max', 'en');

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain('Welcome');
      expect(call.html).toContain('/dashboard');
      expect(call.text).toBeTruthy();
    });
  });

  describe('sendSubscriptionNotice', () => {
    it('sends trial_expiring with daysLeft', async () => {
      await service.sendSubscriptionNotice('admin@example.com', 'trial_expiring', 'Test Practice', 'en', 2);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('2');
      expect(call.html).toContain('/billing');
    });

    it('sends payment_failed with red color', async () => {
      await service.sendSubscriptionNotice('admin@example.com', 'payment_failed', 'Test Practice', 'en');

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('#b91c1c');
    });
  });

  describe('sendPasswordReset', () => {
    it('contains ignore notice', async () => {
      await service.sendPasswordReset('user@example.com', 'https://example.com/reset/abc', 'en');

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('ignore');
      expect(call.html).toContain('https://example.com/reset/abc');
    });
  });

  describe('sendEmailVerification', () => {
    it('contains verification link', async () => {
      await service.sendEmailVerification('user@example.com', 'https://example.com/verify/abc', 'en');

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('https://example.com/verify/abc');
    });
  });

  describe('sendConsentReminder', () => {
    it('sends with practice name in from header', async () => {
      await service.sendConsentReminder('patient@example.com', 'Dr. Mueller', 'https://example.com/consent/abc', 'en');

      const call = mockSend.mock.calls[0][0];
      expect(call.from).toContain('Dr. Mueller via DermaConsent');
      expect(call.html).toContain('https://example.com/consent/abc');
    });
  });

  describe('sendCustomMessage', () => {
    it('with isHtml: true — HTML tags survive (not escaped)', async () => {
      const htmlBody = '<h3>Aftercare</h3><ol><li>Step one</li><li>Step two</li></ol>';
      await service.sendCustomMessage('patient@example.com', 'Aftercare Instructions', htmlBody, {
        isHtml: true,
        locale: 'en',
        practiceName: 'Test Practice',
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('<h3>Aftercare</h3>');
      expect(call.html).toContain('<ol>');
      expect(call.html).toContain('<li>Step one</li>');
      expect(call.html).not.toContain('&lt;h3&gt;');
      expect(call.from).toContain('Test Practice via DermaConsent');
    });

    it('with isHtml: false — angle brackets are escaped and newlines become <br>', async () => {
      const body = 'Hello <script>alert("xss")</script>\nLine two';
      await service.sendCustomMessage('patient@example.com', 'Message', body, {
        isHtml: false,
        locale: 'en',
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('&lt;script&gt;');
      expect(call.html).not.toContain('<script>');
      expect(call.html).toContain('<br>');
    });

    it('without isHtml — defaults to escaped (safe)', async () => {
      await service.sendCustomMessage('patient@example.com', 'Subject', '<b>Bold</b>');

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('&lt;b&gt;');
    });

    it('locale controls footer language', async () => {
      await service.sendCustomMessage('patient@example.com', 'Subject', 'Hello', {
        locale: 'fr',
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('Envoyé via DermaConsent');
    });

    it('locale defaults to de', async () => {
      await service.sendCustomMessage('patient@example.com', 'Subject', 'Hello');

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('Gesendet über DermaConsent');
    });
  });

  describe('auto-generated plain text', () => {
    it('text field is always populated', async () => {
      await service.sendWelcome('user@example.com', 'Max', 'en');

      const call = mockSend.mock.calls[0][0];
      expect(call.text).toBeTruthy();
      expect(typeof call.text).toBe('string');
      expect(call.text.length).toBeGreaterThan(0);
      // Should not contain HTML tags
      expect(call.text).not.toMatch(/<[^>]+>/);
    });
  });

  describe('error propagation', () => {
    it('re-throws transport errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('Transport failure'));

      await expect(
        service.sendWelcome('user@example.com', 'Max', 'en'),
      ).rejects.toThrow('Transport failure');
    });
  });
});
