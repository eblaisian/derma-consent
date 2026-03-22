import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

interface CacheEntry {
  value: string;
  timestamp: number;
}

export interface ConfigEntry {
  key: string;
  value: string;
  isSecret: boolean;
  description: string | null;
  category: string;
  source: 'database' | 'default';
}

export interface ConfigRequirement {
  key: string;
  label: string;
  required: boolean;
  configured: boolean;
  instruction: string;
}

export interface ServiceValidation {
  category: string;
  status: 'healthy' | 'degraded' | 'error' | 'unconfigured';
  message: string;
  success: boolean;
  setupComplete: boolean;
  setupProgress: { configured: number; required: number };
  requirements: ConfigRequirement[];
  checks: { name: string; passed: boolean; detail: string }[];
  durationMs: number;
}

export interface SystemHealthReport {
  overall: 'healthy' | 'degraded' | 'error';
  timestamp: string;
  services: ServiceValidation[];
}

// Default values for config keys
const DEFAULTS: Record<string, string> = {
  'stripe.platformFeePercent': '5',
  'email.fromAddress': 'noreply@derma-consent.de',
  'email.fromName': 'DermaConsent',
  'storage.endpoint': 'https://fra1.digitaloceanspaces.com',
  'storage.region': 'fra1',
  'storage.bucket': 'derma-consent-bucket',
  'plans.freeTrialLimit': '25',
  'plans.starterLimit': '100',
  'plans.professionalLimit': '-1',
  'plans.enterpriseLimit': '-1',
  'ai.baseUrl': 'https://api.cerebras.ai/v1',
  'ai.model': 'llama3.1-8b',
  'ai.explainerEnabled': 'true',
  'sms.senderName': 'DermaConsent',
  'sms.whatsappEnabled': 'false',
  'notifications.consentLinkEnabled': 'true',
  'notifications.consentReminderEnabled': 'true',
  'notifications.inviteEnabled': 'true',
  'notifications.welcomeEnabled': 'true',
  'notifications.subscriptionAlertsEnabled': 'true',
  // Usage quotas per plan (-1 = unlimited)
  'usage.sms.freeTrialLimit': '20',
  'usage.sms.starterLimit': '100',
  'usage.sms.professionalLimit': '300',
  'usage.sms.enterpriseLimit': '2000',
  'usage.email.freeTrialLimit': '200',
  'usage.email.starterLimit': '1000',
  'usage.email.professionalLimit': '5000',
  'usage.email.enterpriseLimit': '-1',
  'usage.aiExplainer.freeTrialLimit': '50',
  'usage.aiExplainer.starterLimit': '200',
  'usage.aiExplainer.professionalLimit': '500',
  'usage.aiExplainer.enterpriseLimit': '-1',
  'usage.storageBytes.freeTrialLimit': '1073741824',      // 1 GB
  'usage.storageBytes.starterLimit': '5368709120',         // 5 GB
  'usage.storageBytes.professionalLimit': '21474836480',   // 20 GB
  'usage.storageBytes.enterpriseLimit': '107374182400',    // 100 GB
  'usage.alertThresholdPercent': '80',
};

// Which keys are secrets
const SECRET_KEYS = new Set([
  'stripe.secretKey',
  'stripe.webhookSecret',
  'stripe.connectWebhookSecret',
  'stripe.subscriptionWebhookSecret',
  'email.resendApiKey',
  'sms.sevenApiKey',
  'storage.accessKey',
  'storage.secretKey',
  'ai.apiKey',
]);

// Config key metadata
const CONFIG_METADATA: Record<string, { category: string; description: string; isSecret: boolean }> = {
  'stripe.secretKey': { category: 'stripe', description: 'Stripe Secret API Key', isSecret: true },
  'stripe.webhookSecret': { category: 'stripe', description: 'Stripe Webhook Signing Secret', isSecret: true },
  'stripe.connectWebhookSecret': { category: 'stripe', description: 'Stripe Connect Webhook Secret', isSecret: true },
  'stripe.subscriptionWebhookSecret': { category: 'stripe', description: 'Stripe Subscription Webhook Secret', isSecret: true },
  'stripe.starterMonthlyPriceId': { category: 'stripe', description: 'Starter Plan Monthly Price ID', isSecret: false },
  'stripe.starterYearlyPriceId': { category: 'stripe', description: 'Starter Plan Yearly Price ID', isSecret: false },
  'stripe.professionalMonthlyPriceId': { category: 'stripe', description: 'Professional Plan Monthly Price ID', isSecret: false },
  'stripe.professionalYearlyPriceId': { category: 'stripe', description: 'Professional Plan Yearly Price ID', isSecret: false },
  'stripe.enterpriseMonthlyPriceId': { category: 'stripe', description: 'Enterprise Plan Monthly Price ID', isSecret: false },
  'stripe.enterpriseYearlyPriceId': { category: 'stripe', description: 'Enterprise Plan Yearly Price ID', isSecret: false },
  'stripe.platformFeePercent': { category: 'stripe', description: 'Platform Fee Percentage', isSecret: false },
  'email.resendApiKey': { category: 'email', description: 'Resend API Key (re_...)', isSecret: true },
  'email.fromAddress': { category: 'email', description: 'Sender Email Address (must be verified in Resend)', isSecret: false },
  'email.fromName': { category: 'email', description: 'Sender Display Name', isSecret: false },
  'sms.sevenApiKey': { category: 'sms', description: 'seven.io API Key (from Developer > API Keys)', isSecret: true },
  'sms.senderName': { category: 'sms', description: 'SMS sender name (max 11 alphanumeric chars, e.g. DermaConsent)', isSecret: false },
  'sms.whatsappEnabled': { category: 'sms', description: 'Enable WhatsApp messaging (coming soon)', isSecret: false },
  'storage.endpoint': { category: 'storage', description: 'S3-compatible endpoint URL (e.g. https://fra1.digitaloceanspaces.com)', isSecret: false },
  'storage.region': { category: 'storage', description: 'Storage region (e.g. fra1)', isSecret: false },
  'storage.bucket': { category: 'storage', description: 'Bucket name', isSecret: false },
  'storage.cdnEndpoint': { category: 'storage', description: 'CDN endpoint URL (optional, e.g. https://bucket.fra1.cdn.digitaloceanspaces.com)', isSecret: false },
  'storage.accessKey': { category: 'storage', description: 'Access Key ID', isSecret: true },
  'storage.secretKey': { category: 'storage', description: 'Secret Access Key', isSecret: true },
  'plans.freeTrialLimit': { category: 'plans', description: 'Free Trial Monthly Consent Limit', isSecret: false },
  'plans.starterLimit': { category: 'plans', description: 'Starter Plan Monthly Consent Limit', isSecret: false },
  'plans.professionalLimit': { category: 'plans', description: 'Professional Plan Monthly Consent Limit (-1 = unlimited)', isSecret: false },
  'plans.enterpriseLimit': { category: 'plans', description: 'Enterprise Plan Monthly Consent Limit (-1 = unlimited)', isSecret: false },
  'ai.apiKey': { category: 'ai', description: 'AI API Key (Cerebras, OpenAI, or other provider) — not needed for Ollama', isSecret: true },
  'ai.baseUrl': { category: 'ai', description: 'API Base URL (default: Cerebras, or http://localhost:11434/v1 for Ollama)', isSecret: false },
  'ai.model': { category: 'ai', description: 'Model (e.g. llama3.1-8b, gpt-4o-mini, gemini-2.0-flash)', isSecret: false },
  'ai.explainerEnabled': { category: 'ai', description: 'Enable AI Consent Explainer on patient forms (true/false)', isSecret: false },
  'notifications.consentLinkEnabled': { category: 'notifications', description: 'Send consent link emails to patients', isSecret: false },
  'notifications.consentReminderEnabled': { category: 'notifications', description: 'Send consent reminder emails to admins', isSecret: false },
  'notifications.inviteEnabled': { category: 'notifications', description: 'Send team invite emails', isSecret: false },
  'notifications.welcomeEnabled': { category: 'notifications', description: 'Send welcome emails on registration', isSecret: false },
  'notifications.subscriptionAlertsEnabled': { category: 'notifications', description: 'Send trial expiry and payment failure alerts', isSecret: false },
  // Usage quotas
  'usage.sms.freeTrialLimit': { category: 'usage', description: 'Free Trial monthly SMS limit', isSecret: false },
  'usage.sms.starterLimit': { category: 'usage', description: 'Starter monthly SMS limit', isSecret: false },
  'usage.sms.professionalLimit': { category: 'usage', description: 'Professional monthly SMS limit', isSecret: false },
  'usage.sms.enterpriseLimit': { category: 'usage', description: 'Enterprise monthly SMS limit (safety cap)', isSecret: false },
  'usage.email.freeTrialLimit': { category: 'usage', description: 'Free Trial monthly email limit', isSecret: false },
  'usage.email.starterLimit': { category: 'usage', description: 'Starter monthly email limit', isSecret: false },
  'usage.email.professionalLimit': { category: 'usage', description: 'Professional monthly email limit', isSecret: false },
  'usage.email.enterpriseLimit': { category: 'usage', description: 'Enterprise monthly email limit (-1 = unlimited)', isSecret: false },
  'usage.aiExplainer.freeTrialLimit': { category: 'usage', description: 'Free Trial monthly AI explainer call limit', isSecret: false },
  'usage.aiExplainer.starterLimit': { category: 'usage', description: 'Starter monthly AI explainer call limit', isSecret: false },
  'usage.aiExplainer.professionalLimit': { category: 'usage', description: 'Professional monthly AI explainer call limit', isSecret: false },
  'usage.aiExplainer.enterpriseLimit': { category: 'usage', description: 'Enterprise monthly AI explainer call limit (-1 = unlimited)', isSecret: false },
  'usage.storageBytes.freeTrialLimit': { category: 'usage', description: 'Free Trial storage limit in bytes (1 GB)', isSecret: false },
  'usage.storageBytes.starterLimit': { category: 'usage', description: 'Starter storage limit in bytes (5 GB)', isSecret: false },
  'usage.storageBytes.professionalLimit': { category: 'usage', description: 'Professional storage limit in bytes (20 GB)', isSecret: false },
  'usage.storageBytes.enterpriseLimit': { category: 'usage', description: 'Enterprise storage limit in bytes (100 GB)', isSecret: false },
  'usage.alertThresholdPercent': { category: 'usage', description: 'Usage alert threshold percentage (default 80)', isSecret: false },
};

const CACHE_TTL_MS = 60_000; // 60 seconds

@Injectable()
export class PlatformConfigService {
  private readonly logger = new Logger(PlatformConfigService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly encryptionKey: Buffer | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const key = this.configService.get<string>('PLATFORM_ENCRYPTION_KEY');
    if (key) {
      // Derive a 32-byte key from the provided key using SHA-256
      this.encryptionKey = crypto.createHash('sha256').update(key).digest();
    } else {
      this.encryptionKey = null;
      this.logger.warn(
        'PLATFORM_ENCRYPTION_KEY not set — secrets will be stored as base64 (not encrypted)',
      );
    }
  }

  /**
   * Get a config value. Fallback chain: DB → hardcoded default.
   */
  async get(key: string): Promise<string | undefined> {
    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.value;
    }

    // Check DB
    const dbEntry = await this.prisma.platformConfig.findUnique({
      where: { key },
    });

    if (dbEntry) {
      const value = dbEntry.isSecret ? this.decrypt(dbEntry.value) : dbEntry.value;
      this.cache.set(key, { value, timestamp: Date.now() });
      return value;
    }

    // Check defaults
    const defaultValue = DEFAULTS[key];
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    return undefined;
  }

  /**
   * Set a config value. Encrypts secrets before storage.
   */
  async set(
    key: string,
    value: string,
    opts?: { isSecret?: boolean; description?: string; category?: string },
  ): Promise<void> {
    const meta = CONFIG_METADATA[key];
    const isSecret = opts?.isSecret ?? meta?.isSecret ?? SECRET_KEYS.has(key);
    const category = opts?.category ?? meta?.category ?? 'general';
    const description = opts?.description ?? meta?.description ?? null;

    const storedValue = isSecret ? this.encrypt(value) : value;

    await this.prisma.platformConfig.upsert({
      where: { key },
      update: {
        value: storedValue,
        isSecret,
        description,
        category,
      },
      create: {
        key,
        value: storedValue,
        isSecret,
        description,
        category,
      },
    });

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  /**
   * Get all config entries, optionally filtered by category. Secrets are masked.
   */
  async getAll(category?: string): Promise<ConfigEntry[]> {
    // Filter metadata keys by category up front
    const relevantKeys = Object.entries(CONFIG_METADATA).filter(
      ([, meta]) => !category || meta.category === category,
    );

    // Single query: fetch all matching DB rows at once instead of N individual queries
    const dbRows = await this.prisma.platformConfig.findMany({
      where: {
        key: { in: relevantKeys.map(([key]) => key) },
      },
    });

    // Build a lookup map for O(1) access per key
    const dbMap = new Map(dbRows.map((row) => [row.key, row]));

    const entries: ConfigEntry[] = [];

    for (const [key, meta] of relevantKeys) {
      let value: string;
      let source: 'database' | 'default';

      const dbEntry = dbMap.get(key);

      if (dbEntry) {
        value = dbEntry.isSecret ? this.decrypt(dbEntry.value) : dbEntry.value;
        source = 'database';
      } else {
        value = DEFAULTS[key] ?? '';
        source = 'default';
      }

      entries.push({
        key,
        value: meta.isSecret ? '••••••••' : value,
        isSecret: meta.isSecret,
        description: meta.description,
        category: meta.category,
        source,
      });
    }

    return entries;
  }

  /**
   * Delete a config override (reverts to default).
   */
  async delete(key: string): Promise<void> {
    await this.prisma.platformConfig.deleteMany({ where: { key } });
    this.cache.delete(key);
  }

  /**
   * Deep validation for a service category. Returns setup completeness + connectivity checks.
   */
  async testConnection(category: string): Promise<ServiceValidation> {
    const start = Date.now();
    let result: ServiceValidation;

    switch (category) {
      case 'stripe':
        result = await this.validateStripe();
        break;
      case 'email':
        result = await this.validateEmail();
        break;
      case 'sms':
        result = await this.validateSms();
        break;
      case 'storage':
        result = await this.validateStorage();
        break;
      case 'ai':
        result = await this.validateAI();
        break;
      case 'plans':
        result = {
          category: 'plans',
          status: 'healthy',
          message: 'Plan limits are configuration values — no connection test needed.',
          success: true,
          setupComplete: true,
          setupProgress: { configured: 0, required: 0 },
          requirements: [],
          checks: [{ name: 'Configuration', passed: true, detail: 'Plan limits configured' }],
          durationMs: 0,
        };
        break;
      case 'notifications':
        result = {
          category: 'notifications',
          status: 'healthy',
          message: 'Notification toggles are configuration values — no connection test needed.',
          success: true,
          setupComplete: true,
          setupProgress: { configured: 0, required: 0 },
          requirements: [],
          checks: [{ name: 'Configuration', passed: true, detail: 'Notification toggles configured' }],
          durationMs: 0,
        };
        break;
      default:
        result = {
          category,
          status: 'error',
          message: `Unknown category: ${category}`,
          success: false,
          setupComplete: false,
          setupProgress: { configured: 0, required: 0 },
          requirements: [],
          checks: [],
          durationMs: 0,
        };
    }

    result.durationMs = Date.now() - start;
    return result;
  }

  /**
   * Validate ALL services in parallel — returns a full system health report.
   */
  async validateAllServices(): Promise<SystemHealthReport> {
    const categories = ['stripe', 'email', 'ai', 'storage', 'sms'];
    const services = await Promise.all(
      categories.map((cat) => this.testConnection(cat)),
    );

    const statuses = services.map((s) => s.status);
    let overall: 'healthy' | 'degraded' | 'error' = 'healthy';
    if (statuses.some((s) => s === 'error')) overall = 'error';
    else if (statuses.some((s) => s === 'degraded' || s === 'unconfigured')) overall = 'degraded';

    return {
      overall,
      timestamp: new Date().toISOString(),
      services,
    };
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  // ── Private helpers ──

  private encrypt(plaintext: string): string {
    if (!this.encryptionKey) {
      return Buffer.from(plaintext).toString('base64');
    }
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  private decrypt(stored: string): string {
    if (!this.encryptionKey) {
      return Buffer.from(stored, 'base64').toString('utf8');
    }
    const parts = stored.split(':');
    if (parts.length !== 3) {
      return Buffer.from(stored, 'base64').toString('utf8');
    }
    const [ivB64, tagB64, ciphertextB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }

  private async checkRequirement(key: string, label: string, required: boolean, instruction: string): Promise<ConfigRequirement> {
    const value = await this.get(key);
    return {
      key,
      label,
      required,
      configured: !!value && value.trim().length > 0,
      instruction,
    };
  }

  private buildValidationResult(
    category: string,
    requirements: ConfigRequirement[],
    checks: { name: string; passed: boolean; detail: string }[],
  ): ServiceValidation {
    const requiredReqs = requirements.filter((r) => r.required);
    const configured = requiredReqs.filter((r) => r.configured).length;
    const total = requiredReqs.length;
    const setupComplete = configured === total;
    const allChecksPassed = checks.every((c) => c.passed);

    let status: ServiceValidation['status'] = 'unconfigured';
    if (setupComplete && allChecksPassed) status = 'healthy';
    else if (setupComplete && !allChecksPassed) status = 'error';
    else if (configured > 0) status = 'degraded';

    const failedChecks = checks.filter((c) => !c.passed);
    let message: string;
    if (status === 'healthy') {
      message = `All ${total} required settings configured, all checks passed`;
    } else if (status === 'unconfigured') {
      message = `${configured}/${total} required settings configured`;
    } else if (failedChecks.length > 0) {
      message = failedChecks.map((c) => c.detail).join('; ');
    } else {
      message = `${configured}/${total} required settings configured`;
    }

    return {
      category,
      status,
      message,
      success: status === 'healthy',
      setupComplete,
      setupProgress: { configured, required: total },
      requirements,
      checks,
      durationMs: 0,
    };
  }

  private async validateStripe(): Promise<ServiceValidation> {
    const requirements = await Promise.all([
      this.checkRequirement('stripe.secretKey', 'Secret Key', true, 'Get your secret key from https://dashboard.stripe.com/apikeys'),
      this.checkRequirement('stripe.subscriptionWebhookSecret', 'Webhook Secret', true, 'Run: stripe listen --forward-to localhost:3001/api/billing/webhook, then copy the whsec_ value'),
      this.checkRequirement('stripe.starterMonthlyPriceId', 'Starter Monthly Price', true, 'Run ./scripts/setup-stripe.sh to create Stripe products and prices'),
      this.checkRequirement('stripe.starterYearlyPriceId', 'Starter Yearly Price', true, 'Run ./scripts/setup-stripe.sh to create Stripe products and prices'),
      this.checkRequirement('stripe.professionalMonthlyPriceId', 'Professional Monthly Price', true, 'Run ./scripts/setup-stripe.sh to create Stripe products and prices'),
      this.checkRequirement('stripe.professionalYearlyPriceId', 'Professional Yearly Price', true, 'Run ./scripts/setup-stripe.sh to create Stripe products and prices'),
      this.checkRequirement('stripe.enterpriseMonthlyPriceId', 'Enterprise Monthly Price', true, 'Run ./scripts/setup-stripe.sh to create Stripe products and prices'),
      this.checkRequirement('stripe.enterpriseYearlyPriceId', 'Enterprise Yearly Price', true, 'Run ./scripts/setup-stripe.sh to create Stripe products and prices'),
    ]);

    const checks: { name: string; passed: boolean; detail: string }[] = [];

    const secretKey = await this.get('stripe.secretKey');
    if (!secretKey) {
      return this.buildValidationResult('stripe', requirements, [
        { name: 'API Connection', passed: false, detail: 'Secret key not configured' },
      ]);
    }

    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(secretKey);
      await stripe.balance.retrieve();
      checks.push({ name: 'API Connection', passed: true, detail: 'Stripe API key valid' });

      // Amounts in cents — must match PRICING in packages/frontend/src/lib/pricing.ts
      const expectedPrices: { key: string; label: string; expectedAmount: number }[] = [
        { key: 'stripe.starterMonthlyPriceId', label: 'Starter Monthly', expectedAmount: 4900 },
        { key: 'stripe.starterYearlyPriceId', label: 'Starter Yearly', expectedAmount: 47000 },
        { key: 'stripe.professionalMonthlyPriceId', label: 'Professional Monthly', expectedAmount: 9900 },
        { key: 'stripe.professionalYearlyPriceId', label: 'Professional Yearly', expectedAmount: 95000 },
        { key: 'stripe.enterpriseMonthlyPriceId', label: 'Enterprise Monthly', expectedAmount: 19900 },
        { key: 'stripe.enterpriseYearlyPriceId', label: 'Enterprise Yearly', expectedAmount: 199000 },
      ];

      let validPrices = 0;
      let totalPrices = 0;

      for (const { key, label, expectedAmount } of expectedPrices) {
        const priceId = await this.get(key);
        totalPrices++;
        if (!priceId) {
          checks.push({ name: `Price: ${label}`, passed: false, detail: `${label} price ID not configured` });
          continue;
        }
        try {
          const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
          if (!price.active) {
            checks.push({ name: `Price: ${label}`, passed: false, detail: `${label} price is inactive in Stripe` });
          } else if (price.currency !== 'eur') {
            checks.push({ name: `Price: ${label}`, passed: false, detail: `${label} currency is ${price.currency}, expected eur` });
          } else if (price.unit_amount !== expectedAmount) {
            checks.push({ name: `Price: ${label}`, passed: false, detail: `${label} amount is ${price.unit_amount}, expected ${expectedAmount}` });
          } else {
            checks.push({ name: `Price: ${label}`, passed: true, detail: `${label} OK (${price.unit_amount / 100} EUR)` });
            validPrices++;
          }
        } catch {
          checks.push({ name: `Price: ${label}`, passed: false, detail: `${label} price ID invalid or not found in Stripe` });
        }
      }

      checks.push({
        name: 'Price Summary',
        passed: validPrices === totalPrices,
        detail: `${validPrices}/${totalPrices} prices valid`,
      });

      const webhookSecret = await this.get('stripe.subscriptionWebhookSecret');
      checks.push({
        name: 'Webhook Secret',
        passed: !!webhookSecret,
        detail: webhookSecret ? 'Webhook secret configured' : 'Webhook secret not set — webhooks will fail',
      });
    } catch (error) {
      checks.push({ name: 'API Connection', passed: false, detail: `Stripe connection failed: ${(error as Error).message}` });
    }

    return this.buildValidationResult('stripe', requirements, checks);
  }

  private async validateEmail(): Promise<ServiceValidation> {
    const requirements = await Promise.all([
      this.checkRequirement('email.resendApiKey', 'Resend API Key', true, 'Get your API key from https://resend.com/api-keys'),
      this.checkRequirement('email.fromAddress', 'From Address', true, 'Set a verified sender email (must be verified in Resend)'),
      this.checkRequirement('email.fromName', 'From Name', false, 'Display name for outgoing emails (defaults to DermaConsent)'),
    ]);

    const checks: { name: string; passed: boolean; detail: string }[] = [];

    const apiKey = await this.get('email.resendApiKey');
    if (!apiKey) {
      return this.buildValidationResult('email', requirements, [
        { name: 'API Connection', passed: false, detail: 'Resend API key not configured' },
      ]);
    }

    try {
      const { ResendTransport } = await import('../email/transports');
      const transport = new ResendTransport(this);
      const result = await transport.test();
      checks.push({
        name: 'Send Test Email',
        passed: result.success,
        detail: result.message,
      });
    } catch (error) {
      checks.push({ name: 'Send Test Email', passed: false, detail: `Email test failed: ${(error as Error).message}` });
    }

    return this.buildValidationResult('email', requirements, checks);
  }

  private async validateSms(): Promise<ServiceValidation> {
    const requirements = await Promise.all([
      this.checkRequirement('sms.sevenApiKey', 'seven.io API Key', true, 'Sign up at https://www.seven.io and create an API key under Developer > API Keys'),
      this.checkRequirement('sms.senderName', 'Sender Name', false, 'Alphanumeric sender ID shown to recipients (max 11 chars, defaults to DermaConsent)'),
    ]);

    const checks: { name: string; passed: boolean; detail: string }[] = [];

    const apiKey = await this.get('sms.sevenApiKey');
    if (!apiKey) {
      return this.buildValidationResult('sms', requirements, [
        { name: 'API Connection', passed: false, detail: 'seven.io API key not configured' },
      ]);
    }

    try {
      // Validate by checking account balance
      const res = await fetch('https://gateway.seven.io/api/balance', {
        headers: { 'X-Api-Key': apiKey },
      });
      if (!res.ok) {
        checks.push({ name: 'API Connection', passed: false, detail: `seven.io API returned ${res.status}` });
      } else {
        const balance = await res.text();
        checks.push({ name: 'API Connection', passed: true, detail: `seven.io connected — balance: €${parseFloat(balance).toFixed(2)}` });
      }
    } catch (error) {
      checks.push({ name: 'API Connection', passed: false, detail: `seven.io connection failed: ${(error as Error).message}` });
    }

    return this.buildValidationResult('sms', requirements, checks);
  }

  private async validateAI(): Promise<ServiceValidation> {
    const requirements = await Promise.all([
      this.checkRequirement('ai.baseUrl', 'API Base URL', true, 'Default: Cerebras — or http://localhost:11434/v1 for Ollama'),
      this.checkRequirement('ai.model', 'Model', true, 'e.g. llama3.1-8b, gpt-4o-mini, gemini-2.0-flash'),
      this.checkRequirement('ai.apiKey', 'API Key', false, 'Required for cloud providers (Cerebras, OpenAI), not needed for Ollama'),
    ]);

    const checks: { name: string; passed: boolean; detail: string }[] = [];

    const defaultUrl = 'https://api.cerebras.ai/v1';
    const baseUrl = (await this.get('ai.baseUrl')) || defaultUrl;
    const apiKey = await this.get('ai.apiKey');
    const model = (await this.get('ai.model')) || 'llama3.1-8b';
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    const provider = isLocal ? 'Ollama' : baseUrl.includes('cerebras') ? 'Cerebras' : 'AI Provider';

    if (!isLocal && !apiKey) {
      return this.buildValidationResult('ai', requirements, [
        { name: 'API Connection', passed: false, detail: 'AI API key not configured' },
      ]);
    }

    try {
      const modelsRes = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey || 'local'}` },
      });
      if (!modelsRes.ok) {
        const body = await modelsRes.text();
        checks.push({ name: 'API Connection', passed: false, detail: `${provider} API error: ${modelsRes.status} ${body.substring(0, 100)}` });
        return this.buildValidationResult('ai', requirements, checks);
      }
      checks.push({ name: 'API Connection', passed: true, detail: `${provider} API reachable at ${baseUrl}` });

      const modelsData = (await modelsRes.json()) as { data?: { id: string }[] };
      const modelIds = modelsData.data?.map((m) => m.id) || [];
      const modelExists = modelIds.some((id) => id.includes(model));
      checks.push({
        name: 'Model Available',
        passed: modelExists,
        detail: modelExists
          ? `Model "${model}" found (${modelIds.length} models available)`
          : `Model "${model}" not found — available: ${modelIds.slice(0, 5).join(', ')}${modelIds.length > 5 ? '...' : ''}`,
      });

      // Test chat completion
      const chatStart = Date.now();
      const chatRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey || 'local'}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
          max_tokens: 10,
        }),
      });
      const chatLatency = Date.now() - chatStart;

      if (chatRes.ok) {
        checks.push({
          name: 'Chat Completion',
          passed: true,
          detail: `${provider} (${model}) responded in ${chatLatency}ms`,
        });
      } else {
        const chatBody = await chatRes.text();
        checks.push({
          name: 'Chat Completion',
          passed: false,
          detail: `Chat completion failed: ${chatRes.status} ${chatBody.substring(0, 100)}`,
        });
      }
    } catch (error) {
      checks.push({ name: 'API Connection', passed: false, detail: `${provider} connection failed: ${(error as Error).message}` });
    }

    return this.buildValidationResult('ai', requirements, checks);
  }

  private async validateStorage(): Promise<ServiceValidation> {
    const requirements = await Promise.all([
      this.checkRequirement('storage.endpoint', 'Endpoint URL', false, 'S3-compatible endpoint (e.g. https://fra1.digitaloceanspaces.com). Not needed for local storage.'),
      this.checkRequirement('storage.accessKey', 'Access Key', false, 'Get Spaces access keys from https://cloud.digitalocean.com/account/api/spaces'),
      this.checkRequirement('storage.secretKey', 'Secret Key', false, 'Get Spaces secret key from https://cloud.digitalocean.com/account/api/spaces'),
      this.checkRequirement('storage.bucket', 'Bucket Name', false, 'Create a Space at https://cloud.digitalocean.com/spaces'),
      this.checkRequirement('storage.region', 'Region', false, 'e.g. fra1, nyc3'),
      this.checkRequirement('storage.cdnEndpoint', 'CDN Endpoint', false, 'Optional: enable CDN on your Space for faster delivery'),
    ]);

    const checks: { name: string; passed: boolean; detail: string }[] = [];

    const endpoint = await this.get('storage.endpoint');
    const accessKey = await this.get('storage.accessKey');
    const secretKey = await this.get('storage.secretKey');
    const isS3 = !!(endpoint && accessKey && secretKey);
    const providerType = isS3 ? 'S3-compatible (DO Spaces)' : 'Local filesystem';

    checks.push({
      name: 'Provider',
      passed: true,
      detail: `Using ${providerType}`,
    });

    try {
      const { StorageService } = await import('../storage/storage.service');
      const storageService = new StorageService(this);
      const result = await storageService.test();
      checks.push({
        name: 'Roundtrip Test',
        passed: result.success,
        detail: result.message,
      });
    } catch (error) {
      checks.push({ name: 'Roundtrip Test', passed: false, detail: `Storage test failed: ${(error as Error).message}` });
    }

    // For storage, the required count depends on whether S3 is being used
    // Override to make all checks pass if local FS is working
    const requiredReqs = isS3
      ? requirements.filter((r) => ['storage.endpoint', 'storage.accessKey', 'storage.secretKey', 'storage.bucket'].includes(r.key))
      : [];
    const configured = requiredReqs.filter((r) => r.configured).length;
    const total = requiredReqs.length;

    const allChecksPassed = checks.every((c) => c.passed);
    let status: ServiceValidation['status'] = 'unconfigured';
    if (allChecksPassed) status = 'healthy';
    else if (checks.some((c) => c.passed)) status = 'degraded';
    else status = 'error';

    return {
      category: 'storage',
      status,
      message: allChecksPassed ? `${providerType} — roundtrip test passed` : checks.filter((c) => !c.passed).map((c) => c.detail).join('; '),
      success: allChecksPassed,
      setupComplete: isS3 ? configured === total : true,
      setupProgress: { configured, required: total },
      requirements,
      checks,
      durationMs: 0,
    };
  }
}
