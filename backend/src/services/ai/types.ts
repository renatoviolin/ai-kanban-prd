export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ProjectContext {
  projectId: string;
  projectName: string;
  techStack?: string;
  contextRules?: string;
  fileStructure?: string;
}

export interface CardContext {
  cardId: string;
  title: string;
  description?: string;
  priority?: string;
}

export interface AIResponse {
  content: string;
  provider: 'openai' | 'anthropic' | 'gemini';
}

export interface ChatResponse {
  content: string;
  isComplete: boolean;
  nextAction: 'continue_chat' | 'generate_prd';
}


export interface PRDGenerationRequest {
  projectContext: ProjectContext;
  cardContext: CardContext;
  clarifications?: ChatMessage[];
  template?: string; // Optional custom template content
}

export interface CardAnalysisResult {
  needsClarification: boolean;
  questions?: string[];
}

export interface DescriptionGenerationRequest {
  projectContext: ProjectContext;
  cardContext: CardContext;
}

export interface FeatureSuggestionRequest {
  projectContext: ProjectContext;
  guidance?: string;
  count?: number;
  existingCards?: Array<{ title: string; description?: string }>;
}

export interface FeatureSuggestion {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
}

export interface FeatureSuggestionResponse {
  suggestions: FeatureSuggestion[];
  provider: 'openai' | 'anthropic' | 'gemini';
}
