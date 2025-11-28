import { BaseAIService } from './BaseAIService';
import { OpenAIService } from './OpenAIService';
import { AnthropicService } from './AnthropicService';
import { GeminiService } from './GeminiService';

export class AIServiceFactory {
  /**
   * Create an AI service instance for the specified provider
   */
  static create(
    provider: 'openai' | 'anthropic' | 'gemini',
    apiKey: string
  ): BaseAIService {
    switch (provider) {
      case 'openai':
        return new OpenAIService(apiKey);
      case 'anthropic':
        return new AnthropicService(apiKey);
      case 'gemini':
        return new GeminiService(apiKey);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Get the first available AI provider based on user's configured API keys
   * Priority: Gemini > OpenAI > Anthropic
   */
  static getAvailableProvider(userSettings: {
    gemini_api_key?: string;
    openai_api_key?: string;
    anthropic_api_key?: string;
    openai_key?: string;
    anthropic_key?: string;
  }): { provider: 'openai' | 'anthropic' | 'gemini'; apiKey: string } | null {
    // Priority order: Gemini first (as requested), then OpenAI, then Anthropic
    if (userSettings.gemini_api_key) {
      return { provider: 'gemini', apiKey: userSettings.gemini_api_key };
    }

    const openaiKey = userSettings.openai_api_key || userSettings.openai_key;
    if (openaiKey) {
      return { provider: 'openai', apiKey: openaiKey };
    }

    const anthropicKey = userSettings.anthropic_api_key || userSettings.anthropic_key;
    if (anthropicKey) {
      return { provider: 'anthropic', apiKey: anthropicKey };
    }

    return null;
  }

  /**
   * Get AI service instance using the first available provider from user settings
   */
  static createFromUserSettings(userSettings: {
    gemini_api_key?: string;
    openai_api_key?: string;
    anthropic_api_key?: string;
    openai_key?: string;
    anthropic_key?: string;
  }): BaseAIService | null {
    const available = this.getAvailableProvider(userSettings);
    if (!available) {
      return null;
    }
    return this.create(available.provider, available.apiKey);
  }
}
