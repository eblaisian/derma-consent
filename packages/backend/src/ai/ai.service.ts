import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PlatformConfigService } from '../platform-config/platform-config.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly platformConfig: PlatformConfigService) {}

  async isConfigured(): Promise<boolean> {
    const enabled = await this.platformConfig.get('openai.explainerEnabled');
    if (enabled === 'false') return false;

    const baseUrl = await this.getBaseUrl();
    const apiKey = await this.platformConfig.get('openai.apiKey');

    // Ollama (non-OpenAI base URL) doesn't need a real API key
    const isOllama = baseUrl !== DEFAULT_BASE_URL;
    if (isOllama) return true;

    return !!apiKey;
  }

  async chat(
    messages: ChatMessage[],
    opts?: { maxTokens?: number; temperature?: number },
  ): Promise<string> {
    const baseUrl = await this.getBaseUrl();
    const apiKey = await this.platformConfig.get('openai.apiKey');
    const isOllama = baseUrl !== DEFAULT_BASE_URL;

    if (!isOllama && !apiKey) {
      throw new ServiceUnavailableException('AI is not configured');
    }

    const model = (await this.platformConfig.get('openai.model')) || 'gpt-4o-mini';

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey || 'ollama'}`,
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
            `AI model '${model}' not found. Check your OPENAI_MODEL setting or pull the model with: ollama pull ${model}`,
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
    const url = (await this.platformConfig.get('openai.baseUrl')) || DEFAULT_BASE_URL;
    return url.trim();
  }
}
