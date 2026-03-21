import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { NotificationService } from '../notifications/notification.service';
import type { CommunicationContext } from './communications.dto';

const LOCALE_NAMES: Record<string, string> = {
  de: 'German', en: 'English', es: 'Spanish', fr: 'French',
  ar: 'Arabic', tr: 'Turkish', pl: 'Polish', ru: 'Russian',
};

const CONTEXT_DESCRIPTIONS: Record<CommunicationContext, string> = {
  CONSENT_REMINDER: 'Remind the patient to complete their digital consent form before their upcoming appointment.',
  APPOINTMENT_CONFIRMATION: 'Confirm an upcoming appointment with the patient, including date and preparation notes.',
  APPOINTMENT_REMINDER: 'Remind the patient about their appointment tomorrow or in the next few days.',
  FOLLOW_UP: 'Follow up with the patient after their recent treatment to check on their recovery.',
  TREATMENT_PREPARATION: 'Inform the patient about how to prepare for their upcoming procedure (fasting, medication, skincare).',
  RESULT_READY: 'Notify the patient that their results or documents are ready for review.',
  GENERAL: 'A general professional message from the dermatology practice to a patient.',
};

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(
    private readonly ai: AiService,
    private readonly notificationService: NotificationService,
  ) {}

  async generateDraft(
    context: CommunicationContext,
    locale: string,
    practiceName: string,
  ): Promise<{ draft: string }> {
    const language = LOCALE_NAMES[locale] || 'German';
    const contextDescription = CONTEXT_DESCRIPTIONS[context];

    const systemPrompt = [
      `You are a professional, friendly medical receptionist at "${practiceName}", a dermatology practice in Germany.`,
      'Draft a short patient message for the given context.',
      'Be warm but professional. Use formal address (Sie in German, Usted in Spanish, etc.).',
      'Write 3-5 sentences maximum. Plain text only — no headers, no markdown, no bullet points.',
      'Include a placeholder [Patient Name] where the patient name should go.',
      'Include a placeholder [Date/Time] where a date or time should go (if relevant).',
      `Respond entirely in ${language}.`,
    ].join(' ');

    const draft = await this.ai.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context: ${contextDescription}` },
      ],
      { maxTokens: 300, temperature: 0.4 },
    );

    return { draft };
  }

  async sendMessage(
    practiceId: string,
    channel: 'email' | 'sms' | 'whatsapp',
    recipient: string,
    message: string,
    subject: string,
    userId?: string,
  ): Promise<{ sent: boolean }> {
    await this.notificationService.sendCustomMessage({
      practiceId,
      channel,
      ...(channel === 'email' ? { recipientEmail: recipient } : { recipientPhone: recipient }),
      message,
      subject,
      isHtml: false,
      userId,
    });
    return { sent: true };
  }
}
