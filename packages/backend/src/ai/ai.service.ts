import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PlatformConfigService } from '../platform-config/platform-config.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const DEFAULT_BASE_URL = 'https://api.cerebras.ai/v1';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly platformConfig: PlatformConfigService) {}

  async isConfigured(): Promise<boolean> {
    const enabled = await this.platformConfig.get('ai.explainerEnabled');
    if (enabled === 'false') return false;

    const baseUrl = await this.getBaseUrl();
    const apiKey = await this.platformConfig.get('ai.apiKey');

    // Local providers (Ollama) don't need an API key
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    if (isLocal) return true;

    return !!apiKey;
  }

  async chat(
    messages: ChatMessage[],
    opts?: { maxTokens?: number; temperature?: number },
  ): Promise<string> {
    const baseUrl = await this.getBaseUrl();
    const apiKey = await this.platformConfig.get('ai.apiKey');
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

    if (!isLocal && !apiKey) {
      throw new ServiceUnavailableException('AI is not configured');
    }

    const model = (await this.platformConfig.get('ai.model')) || 'llama3.1-8b';

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey || 'local'}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: opts?.maxTokens ?? 500,
          temperature: opts?.temperature ?? 0.3,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        this.logger.error(`AI API error (${baseUrl}, model: ${model}): ${res.status} ${errorBody.substring(0, 200)}`);

        // Surface model-not-found errors clearly
        if (errorBody.includes('not found')) {
          throw new ServiceUnavailableException(
            `AI model '${model}' not found. Check your ai.model setting in Admin > Config`,
          );
        }

        throw new ServiceUnavailableException('AI temporarily unavailable');
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim() || '';

      if (!content) {
        throw new ServiceUnavailableException('AI returned empty response');
      }

      return content;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error(`AI call failed (${baseUrl}): ${error}`);
      throw new ServiceUnavailableException('AI temporarily unavailable');
    }
  }

  private async getBaseUrl(): Promise<string> {
    const url = (await this.platformConfig.get('ai.baseUrl')) || DEFAULT_BASE_URL;
    return url.trim();
  }
}
