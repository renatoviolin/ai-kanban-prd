import { GoogleGenerativeAI } from '@google/generative-ai';
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

export class GeminiService extends BaseAIService {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    super(apiKey);
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async analyzeCard(
    projectContext: ProjectContext,
    cardContext: CardContext
  ): Promise<CardAnalysisResult> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const systemPrompt = this.buildAnalysisPrompt(projectContext, cardContext);

      const prompt = `${systemPrompt}\n\nAnalyze this card and tell me if it needs clarification. Respond with valid JSON only, no markdown formatting.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      let text = response.text().trim();

      // Clean up markdown formatting if present
      if (text.startsWith('```json')) {
        text = text.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini analyzeCard error:', error);
      throw error;
    }
  }

  async chat(
    messages: ChatMessage[],
    projectContext: ProjectContext,
    cardContext: CardContext
  ): Promise<ChatResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const systemPrompt = this.buildChatPrompt(projectContext, cardContext);

      // Build conversation history
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. I will respond with valid JSON.' }] },
          ...history
        ]
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;
      let text = response.text().trim();

      // Clean up markdown formatting if present
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
        console.error('Failed to parse Gemini chat response as JSON:', text);
        // Fallback: treat as incomplete conversation
        return {
          content: text,
          isComplete: false,
          nextAction: 'continue_chat'
        };
      }
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw error;
    }
  }

  async generatePRD(request: PRDGenerationRequest): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const systemPrompt = this.buildPRDPrompt(request);

      const prompt = `${systemPrompt}\n\nGenerate the complete PRD for this task.`;

      const result = await model.generateContent(prompt);
      const response = result.response;

      return {
        content: response.text(),
        provider: 'gemini'
      };
    } catch (error) {
      console.error('Gemini generatePRD error:', error);
      throw error;
    }
  }
  async generateDescription(request: DescriptionGenerationRequest): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const systemPrompt = this.buildDescriptionPrompt(request);

      const result = await model.generateContent(systemPrompt);
      const response = result.response;

      return {
        content: response.text(),
        provider: 'gemini'
      };
    } catch (error) {
      console.error('Gemini generateDescription error:', error);
      throw error;
    }
  }
  async suggestFeatures(request: FeatureSuggestionRequest): Promise<FeatureSuggestionResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const systemPrompt = this.buildFeatureSuggestionPrompt(request);

      const result = await model.generateContent(systemPrompt);
      const response = result.response;
      let text = response.text().trim();

      // Clean up markdown formatting if present
      if (text.startsWith('```json')) {
        text = text.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(text);

      return {
        suggestions: parsed.suggestions,
        provider: 'gemini'
      };
    } catch (error) {
      console.error('Gemini suggestFeatures error:', error);
      throw error;
    }
  }
}
