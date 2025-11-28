import OpenAI from 'openai';
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

export class OpenAIService extends BaseAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    super(apiKey);
    this.client = new OpenAI({ apiKey });
  }

  async analyzeCard(
    projectContext: ProjectContext,
    cardContext: CardContext
  ): Promise<CardAnalysisResult> {
    try {
      const systemPrompt = this.buildAnalysisPrompt(projectContext, cardContext);

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Analyze this card and tell me if it needs clarification.' }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI analyzeCard error:', error);
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

      const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: openaiMessages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse structured JSON response
      try {
        const parsed = JSON.parse(content);
        return {
          content: parsed.message || content,
          isComplete: parsed.isComplete || false,
          nextAction: parsed.nextAction || 'continue_chat'
        };
      } catch (parseError) {
        console.error('Failed to parse OpenAI chat response as JSON:', content);
        // Fallback: treat as incomplete conversation
        return {
          content,
          isComplete: false,
          nextAction: 'continue_chat'
        };
      }
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw error;
    }
  }

  async generatePRD(request: PRDGenerationRequest): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildPRDPrompt(request);

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the complete PRD for this task.' }
        ],
        temperature: 0.5,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return {
        content,
        provider: 'openai'
      };
    } catch (error) {
      console.error('OpenAI generatePRD error:', error);
      throw error;
    }
  }

  async generateDescription(request: DescriptionGenerationRequest): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildDescriptionPrompt(request);

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the description.' }
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return {
        content,
        provider: 'openai'
      };
    } catch (error) {
      console.error('OpenAI generateDescription error:', error);
      throw error;
    }
  }
  async suggestFeatures(request: FeatureSuggestionRequest): Promise<FeatureSuggestionResponse> {
    try {
      const systemPrompt = this.buildFeatureSuggestionPrompt(request);
      console.log(systemPrompt)
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate feature suggestions.' }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);

      return {
        suggestions: parsed.suggestions,
        provider: 'openai'
      };
    } catch (error) {
      console.error('OpenAI suggestFeatures error:', error);
      throw error;
    }
  }
}
