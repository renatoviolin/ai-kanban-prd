import Anthropic from '@anthropic-ai/sdk';
import { BaseAIService } from './BaseAIService';
import {
  ChatMessage,
  ProjectContext,
  CardContext,
  AIResponse,
  ChatResponse,
  PRDGenerationRequest,
  CardAnalysisResult,
  DescriptionGenerationRequest,
  FeatureSuggestionRequest,
  FeatureSuggestionResponse
} from './types';

export class AnthropicService extends BaseAIService {
  private client: Anthropic;

  constructor(apiKey: string) {
    super(apiKey);
    this.client = new Anthropic({ apiKey });
  }

  async analyzeCard(
    projectContext: ProjectContext,
    cardContext: CardContext
  ): Promise<CardAnalysisResult> {
    try {
      const systemPrompt = this.buildAnalysisPrompt(projectContext, cardContext);

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: 'Analyze this card and tell me if it needs clarification. Respond with valid JSON.' }
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      // Extract JSON from response (may be wrapped in markdown)
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Anthropic analyzeCard error:', error);
      throw error;
    }
  }

  async chat(
    messages: ChatMessage[],
    projectContext: ProjectContext,
    cardContext: CardContext
  ): Promise<ChatResponse> {
    try {
      const systemPrompt = this.buildChatPrompt(projectContext, cardContext);

      const anthropicMessages = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: anthropicMessages,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      // Extract JSON from response (may be wrapped in markdown)
      let text = content.text.trim();
      if (text.startsWith('```json')) {
        text = text.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Parse structured JSON response
      try {
        const parsed = JSON.parse(text);
        return {
          content: parsed.message || text,
          isComplete: parsed.isComplete || false,
          nextAction: parsed.nextAction || 'continue_chat'
        };
      } catch (parseError) {
        console.error('Failed to parse Anthropic chat response as JSON:', text);
        // Fallback: treat as incomplete conversation
        return {
          content: text,
          isComplete: false,
          nextAction: 'continue_chat'
        };
      }
    } catch (error) {
      console.error('Anthropic chat error:', error);
      throw error;
    }
  }

  async generatePRD(request: PRDGenerationRequest): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildPRDPrompt(request);

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: 'Generate the complete PRD for this task.' }
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      return {
        content: content.text,
        provider: 'anthropic'
      };
    } catch (error) {
      console.error('Anthropic generatePRD error:', error);
      throw error;
    }
  }

  async generateDescription(request: DescriptionGenerationRequest): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildDescriptionPrompt(request);

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: 'user', content: 'Generate the description.' }
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      return {
        content: content.text,
        provider: 'anthropic'
      };
    } catch (error) {
      console.error('Anthropic generateDescription error:', error);
      throw error;
    }
  }
  async suggestFeatures(request: FeatureSuggestionRequest): Promise<FeatureSuggestionResponse> {
    try {
      const systemPrompt = this.buildFeatureSuggestionPrompt(request);

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: 'Generate feature suggestions.' }
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      // Extract JSON from response (may be wrapped in markdown)
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonText);

      return {
        suggestions: parsed.suggestions,
        provider: 'anthropic'
      };
    } catch (error) {
      console.error('Anthropic suggestFeatures error:', error);
      throw error;
    }
  }
}
