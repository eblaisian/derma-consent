import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  Optional,
} from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import { ConsentService } from './consent.service';

const SUPPORTED_LOCALES = ['de', 'en', 'es', 'fr', 'ar', 'tr', 'pl', 'ru'];

const LOCALE_NAMES: Record<string, string> = {
  de: 'German', en: 'English', es: 'Spanish', fr: 'French',
  ar: 'Arabic', tr: 'Turkish', pl: 'Polish', ru: 'Russian',
};

const PROCEDURE_INFO: Record<string, { name: string; description: string }> = {
  BOTOX: {
    name: 'Botulinum Toxin (Botox) Injection',
    description: 'A cosmetic injection that temporarily relaxes facial muscles to smooth wrinkles. Commonly used on forehead lines, frown lines, and crow\'s feet.',
  },
  FILLER: {
    name: 'Dermal Filler Injection',
    description: 'An injectable treatment using hyaluronic acid or similar substances to restore volume, smooth lines, and enhance facial contours (lips, cheeks, jawline).',
  },
  LASER: {
    name: 'Laser Skin Treatment',
    description: 'A dermatological procedure using focused light energy for skin resurfacing, scar reduction, pigmentation correction, or hair removal.',
  },
  CHEMICAL_PEEL: {
    name: 'Chemical Peel',
    description: 'A skin treatment where a chemical solution is applied to remove damaged outer layers, improving texture, tone, and reducing fine lines or acne scars.',
  },
  MICRONEEDLING: {
    name: 'Microneedling',
    description: 'A collagen-stimulating treatment using fine needles to create micro-injuries in the skin, promoting natural healing and skin rejuvenation.',
  },
  PRP: {
    name: 'Platelet-Rich Plasma (PRP) Therapy',
    description: 'A regenerative treatment using the patient\'s own concentrated blood platelets to promote skin healing, hair growth, or enhance other treatments.',
  },
};

interface CacheEntry {
  text: string;
  cachedAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class ConsentExplainerService {
  private readonly logger = new Logger(ConsentExplainerService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly ai: AiService,
    private readonly consentService: ConsentService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async explain(
    token: string,
    locale: string,
    mode: 'full' | 'summary' = 'full',
  ): Promise<{ explanation: string; cached: boolean }> {
    const safeLocale = SUPPORTED_LOCALES.includes(locale) ? locale : 'de';

    const consent = await this.consentService.findByToken(token);
    const consentType = consent.type;

    // Check cache (keyed by type + locale + mode)
    const cacheKey = `${consentType}:${safeLocale}:${mode}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      await this.logExplainerEvent(consent.practiceId, consentType, safeLocale, true);
      return { explanation: cached.text, cached: true };
    }

    const procedure = PROCEDURE_INFO[consentType];
    if (!procedure) {
      throw new ServiceUnavailableException(`Unknown procedure type: ${consentType}`);
    }

    const isSummary = mode === 'summary';

    const systemPrompt = isSummary
      ? [
          'You are a caring dermatologist giving a patient a very brief summary of what they are consenting to.',
          'Write exactly 2-3 short sentences in plain, non-medical language.',
          'Cover: what the procedure does, the most important risk, and that it is temporary/reversible if applicable.',
          'Do NOT use bullet points, headers, or formatting. Just plain sentences.',
          `Respond entirely in ${LOCALE_NAMES[safeLocale] || 'German'}.`,
        ].join(' ')
      : [
          'You are a caring and experienced dermatologist explaining a consent form to a patient.',
          'Your goal is to help the patient understand what they are consenting to, in plain, non-medical language.',
          'Be honest about risks but reassuring about the procedure.',
          'Do NOT use headers, markdown formatting, or numbered lists.',
          'Use simple bullet points (starting with •) separated by newlines.',
          'Keep it to 5-7 bullet points covering: what the procedure is, what to expect, main risks, what to tell the doctor beforehand, and aftercare.',
          `Respond entirely in ${LOCALE_NAMES[safeLocale] || 'German'}.`,
        ].join(' ');

    const userPrompt = [
      `The patient is about to sign a consent form for: ${procedure.name}`,
      `Procedure description: ${procedure.description}`,
      isSummary
        ? 'Give a very brief 2-3 sentence summary so the patient quickly understands what this is about.'
        : 'Please explain this in plain language so the patient understands what they are agreeing to.',
    ].join('\n');

    const explanation = await this.ai.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: isSummary ? 150 : 500, temperature: 0.3 },
    );

    this.cache.set(cacheKey, { text: explanation, cachedAt: Date.now() });
    await this.logExplainerEvent(consent.practiceId, consentType, safeLocale, false);

    return { explanation, cached: false };
  }

  private async logExplainerEvent(
    practiceId: string,
    consentType: string,
    locale: string,
    cached: boolean,
  ) {
    try {
      await this.auditService?.log({
        practiceId,
        action: 'CONSENT_EXPLAINER_REQUESTED',
        entityType: 'ConsentForm',
        metadata: { consentType, locale, cached },
      });
    } catch {
      // Audit logging should never break the explainer
    }
  }
}
