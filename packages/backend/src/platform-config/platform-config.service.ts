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
  source: 'database' | 'environment' | 'default';
}

// Maps config keys to environment variable names
const ENV_VAR_MAP: Record<string, string> = {
  'stripe.secretKey': 'STRIPE_SECRET_KEY',
  'stripe.webhookSecret': 'STRIPE_WEBHOOK_SECRET',
  'stripe.connectWebhookSecret': 'STRIPE_CONNECT_WEBHOOK_SECRET',
  'stripe.starterMonthlyPriceId': 'STRIPE_STARTER_MONTHLY_PRICE_ID',
  'stripe.starterYearlyPriceId': 'STRIPE_STARTER_YEARLY_PRICE_ID',
  'stripe.professionalMonthlyPriceId': 'STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID',
  'stripe.professionalYearlyPriceId': 'STRIPE_PROFESSIONAL_YEARLY_PRICE_ID',
  'stripe.enterpriseMonthlyPriceId': 'STRIPE_ENTERPRISE_MONTHLY_PRICE_ID',
  'stripe.enterpriseYearlyPriceId': 'STRIPE_ENTERPRISE_YEARLY_PRICE_ID',
  'stripe.platformFeePercent': 'STRIPE_PLATFORM_FEE_PERCENT',
  'stripe.subscriptionWebhookSecret': 'STRIPE_SUBSCRIPTION_WEBHOOK_SECRET',
  'email.smtpHost': 'SMTP_HOST',
  'email.smtpPort': 'SMTP_PORT',
  'email.smtpUser': 'SMTP_USER',
  'email.smtpPass': 'SMTP_PASSWORD',
  'email.fromAddress': 'SMTP_FROM_EMAIL',
  'email.fromName': 'EMAIL_FROM_NAME',
  'sms.twilioAccountSid': 'TWILIO_ACCOUNT_SID',
  'sms.twilioAuthToken': 'TWILIO_AUTH_TOKEN',
  'sms.twilioPhoneNumber': 'TWILIO_PHONE_NUMBER',
  'storage.supabaseUrl': 'SUPABASE_URL',
  'storage.supabaseServiceKey': 'SUPABASE_SERVICE_KEY',
  'storage.supabaseBucket': 'SUPABASE_BUCKET',
  'openai.apiKey': 'OPENAI_API_KEY',
  'openai.baseUrl': 'OPENAI_BASE_URL',
  'openai.model': 'OPENAI_MODEL',
  'openai.explainerEnabled': 'OPENAI_EXPLAINER_ENABLED',
};

// Default values for config keys
const DEFAULTS: Record<string, string> = {
  'stripe.platformFeePercent': '5',
  'email.smtpHost': 'smtp.gmail.com',
  'email.smtpPort': '465',
  'email.fromAddress': 'noreply@eblaisian.com',
  'email.fromName': 'DermaConsent',
  'storage.supabaseBucket': 'consent-pdfs',
  'plans.freeTrialLimit': '25',
  'plans.starterLimit': '100',
  'plans.professionalLimit': '-1',
  'plans.enterpriseLimit': '-1',
  'openai.baseUrl': 'https://api.openai.com/v1',
  'openai.model': 'gpt-4o-mini',
  'openai.explainerEnabled': 'true',
  'notifications.consentLinkEnabled': 'true',
  'notifications.consentReminderEnabled': 'true',
  'notifications.inviteEnabled': 'true',
  'notifications.welcomeEnabled': 'true',
  'notifications.subscriptionAlertsEnabled': 'true',
};

// Which keys are secrets
const SECRET_KEYS = new Set([
  'stripe.secretKey',
  'stripe.webhookSecret',
  'stripe.connectWebhookSecret',
  'stripe.subscriptionWebhookSecret',
  'email.smtpPass',
  'sms.twilioAccountSid',
  'sms.twilioAuthToken',
  'storage.supabaseServiceKey',
  'openai.apiKey',
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
  'email.smtpHost': { category: 'email', description: 'SMTP Host (e.g. smtp.gmail.com)', isSecret: false },
  'email.smtpPort': { category: 'email', description: 'SMTP Port (e.g. 465 for TLS)', isSecret: false },
  'email.smtpUser': { category: 'email', description: 'SMTP Username (Gmail address)', isSecret: false },
  'email.smtpPass': { category: 'email', description: 'SMTP Password (App Password)', isSecret: true },
  'email.fromAddress': { category: 'email', description: 'Sender Email Address', isSecret: false },
  'email.fromName': { category: 'email', description: 'Sender Name', isSecret: false },
  'sms.twilioAccountSid': { category: 'sms', description: 'Twilio Account SID', isSecret: true },
  'sms.twilioAuthToken': { category: 'sms', description: 'Twilio Auth Token', isSecret: true },
  'sms.twilioPhoneNumber': { category: 'sms', description: 'Twilio Phone Number', isSecret: false },
  'storage.supabaseUrl': { category: 'storage', description: 'Supabase Project URL', isSecret: false },
  'storage.supabaseServiceKey': { category: 'storage', description: 'Supabase Service Role Key', isSecret: true },
  'storage.supabaseBucket': { category: 'storage', description: 'Supabase Storage Bucket', isSecret: false },
  'plans.freeTrialLimit': { category: 'plans', description: 'Free Trial Monthly Consent Limit', isSecret: false },
  'plans.starterLimit': { category: 'plans', description: 'Starter Plan Monthly Consent Limit', isSecret: false },
  'plans.professionalLimit': { category: 'plans', description: 'Professional Plan Monthly Consent Limit (-1 = unlimited)', isSecret: false },
  'plans.enterpriseLimit': { category: 'plans', description: 'Enterprise Plan Monthly Consent Limit (-1 = unlimited)', isSecret: false },
  'openai.apiKey': { category: 'ai', description: 'OpenAI API Key (sk-...) — not needed for Ollama', isSecret: true },
  'openai.baseUrl': { category: 'ai', description: 'API Base URL (default: OpenAI, set to http://localhost:11434/v1 for Ollama)', isSecret: false },
  'openai.model': { category: 'ai', description: 'Model (e.g. gpt-4o-mini, llama3.2, mistral)', isSecret: false },
  'openai.explainerEnabled': { category: 'ai', description: 'Enable AI Consent Explainer on patient forms (true/false)', isSecret: false },
  'notifications.consentLinkEnabled': { category: 'notifications', description: 'Send consent link emails to patients', isSecret: false },
  'notifications.consentReminderEnabled': { category: 'notifications', description: 'Send consent reminder emails to admins', isSecret: false },
  'notifications.inviteEnabled': { category: 'notifications', description: 'Send team invite emails', isSecret: false },
  'notifications.welcomeEnabled': { category: 'notifications', description: 'Send welcome emails on registration', isSecret: false },
  'notifications.subscriptionAlertsEnabled': { category: 'notifications', description: 'Send trial expiry and payment failure alerts', isSecret: false },
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
   * Get a config value. Fallback chain: DB → env var → hardcoded default.
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

    // Check env var
    const envVar = ENV_VAR_MAP[key];
    if (envVar) {
      const envValue = this.configService.get<string>(envVar);
      if (envValue) {
        this.cache.set(key, { value: envValue, timestamp: Date.now() });
        return envValue;
      }
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
      let source: 'database' | 'environment' | 'default';

      const dbEntry = dbMap.get(key);

      if (dbEntry) {
        value = dbEntry.isSecret ? this.decrypt(dbEntry.value) : dbEntry.value;
        source = 'database';
      } else {
        const envVar = ENV_VAR_MAP[key];
        const envValue = envVar ? this.configService.get<string>(envVar) : undefined;
        if (envValue) {
          value = envValue;
          source = 'environment';
        } else {
          value = DEFAULTS[key] ?? '';
          source = 'default';
        }
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
   * Delete a config override (reverts to env var / default).
   */
  async delete(key: string): Promise<void> {
    await this.prisma.platformConfig.deleteMany({ where: { key } });
    this.cache.delete(key);
  }

  /**
   * Test connection for a category.
   */
  async testConnection(category: string): Promise<{ success: boolean; message: string }> {
    switch (category) {
      case 'stripe':
        return this.testStripe();
      case 'email':
        return this.testEmail();
      case 'sms':
        return this.testSms();
      case 'storage':
        return this.testStorage();
      case 'plans':
        return { success: true, message: 'Plan limits are configuration values — no connection test needed.' };
      case 'notifications':
        return { success: true, message: 'Notification toggles are configuration values — no connection test needed.' };
      case 'ai':
        return this.testOpenAI();
      default:
        return { success: false, message: `Unknown category: ${category}` };
    }
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
    // Format: iv:tag:ciphertext (all base64)
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  private decrypt(stored: string): string {
    if (!this.encryptionKey) {
      return Buffer.from(stored, 'base64').toString('utf8');
    }
    const parts = stored.split(':');
    if (parts.length !== 3) {
      // Fallback: try base64 decode (for non-encrypted values)
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

  private async testStripe(): Promise<{ success: boolean; message: string }> {
    try {
      const key = await this.get('stripe.secretKey');
      if (!key) return { success: false, message: 'Stripe secret key not configured' };
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(key);
      await stripe.balance.retrieve();
      return { success: true, message: 'Stripe connection successful' };
    } catch (error) {
      return { success: false, message: `Stripe connection failed: ${(error as Error).message}` };
    }
  }

  private async testEmail(): Promise<{ success: boolean; message: string }> {
    try {
      const smtpUser = await this.get('email.smtpUser');
      const smtpPass = await this.get('email.smtpPass');
      if (!smtpUser || !smtpPass) return { success: false, message: 'SMTP credentials not configured' };
      const { createTransport } = await import('nodemailer');
      const transporter = createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.verify();
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      return { success: false, message: `SMTP connection failed: ${(error as Error).message}` };
    }
  }

  private async testSms(): Promise<{ success: boolean; message: string }> {
    try {
      const sid = await this.get('sms.twilioAccountSid');
      const token = await this.get('sms.twilioAuthToken');
      if (!sid || !token) return { success: false, message: 'Twilio credentials not configured' };
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio') as (sid: string, token: string) => { api: { accounts: { list: () => Promise<unknown[]> } } };
      const client = twilio(sid, token);
      await client.api.accounts.list();
      return { success: true, message: 'Twilio connection successful' };
    } catch (error) {
      return { success: false, message: `Twilio connection failed: ${(error as Error).message}` };
    }
  }

  private async testOpenAI(): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = (await this.get('openai.baseUrl')) || 'https://api.openai.com/v1';
      const apiKey = await this.get('openai.apiKey');
      const isOllama = baseUrl !== 'https://api.openai.com/v1';

      if (!isOllama && !apiKey) {
        return { success: false, message: 'OpenAI API key not configured' };
      }

      const res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey || 'ollama'}` },
      });
      if (!res.ok) {
        const body = await res.text();
        return { success: false, message: `AI API error: ${res.status} ${body.substring(0, 100)}` };
      }

      const provider = isOllama ? 'Ollama' : 'OpenAI';
      return { success: true, message: `${provider} connection successful` };
    } catch (error) {
      return { success: false, message: `AI connection failed: ${(error as Error).message}` };
    }
  }

  private async testStorage(): Promise<{ success: boolean; message: string }> {
    try {
      const url = await this.get('storage.supabaseUrl');
      const key = await this.get('storage.supabaseServiceKey');
      if (!url || !key) return { success: false, message: 'Supabase credentials not configured' };
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(url, key);
      const { error } = await supabase.storage.listBuckets();
      if (error) throw error;
      return { success: true, message: 'Supabase Storage connection successful' };
    } catch (error) {
      return { success: false, message: `Supabase connection failed: ${(error as Error).message}` };
    }
  }
}
