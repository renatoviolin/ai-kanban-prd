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

export abstract class BaseAIService {
  protected apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Build system prompt for card analysis
  protected buildAnalysisPrompt(projectContext: ProjectContext, cardContext: CardContext): string {
    return `You are a Specialist Software Architect analyzing a task card.

PROJECT CONTEXT:
- Name: ${projectContext.projectName}
- Tech Stack: ${projectContext.techStack || 'Not specified'}
- Coding Standards: ${projectContext.contextRules || 'Not specified'}
${projectContext.fileStructure ? `- File Structure:\n${projectContext.fileStructure}` : ''}

TASK CARD:
- Title: ${cardContext.title}
- Description: ${cardContext.description || 'Not provided'}
- Priority: ${cardContext.priority || 'Not set'}

YOUR TASK:
Analyze if this card has enough technical detail to generate a complete PRD (Product Requirements Document) for an AI Coding Assistant.

Respond in JSON format:
{
  "needsClarification": boolean,
  "questions": ["Question 1", "Question 2"] // only if needsClarification is true
}

A card needs clarification if:
- Technical approach is unclear
- Missing information about data structures
- Unclear about API endpoints or database changes
- Ambiguous acceptance criteria
- Conflicts with existing architecture

If the card has sufficient detail, respond with: {"needsClarification": false}`;
  }

  // Build system prompt for PRD generation
  protected buildPRDPrompt(request: PRDGenerationRequest): string {
    const { projectContext, cardContext, clarifications, template } = request;

    let clarificationSection = '';
    if (clarifications && clarifications.length > 0) {
      clarificationSection = `\n\nCLARIFICATIONS FROM USER:\n${clarifications.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')
        }`;
    }

    // If a custom template is provided, use it instead of the default
    if (template) {
      return `You are a Specialist Software Architect generating a detailed PRD (Product Requirements Document) for an AI Coding Assistant.

PROJECT CONTEXT:
- Name: ${projectContext.projectName}
- Tech Stack: ${projectContext.techStack || 'Not specified'}
- Coding Standards: ${projectContext.contextRules || 'Not specified'}
${projectContext.fileStructure ? `- File Structure:\n${projectContext.fileStructure}` : ''}

TASK CARD:
- Title: ${cardContext.title}
- Description: ${cardContext.description || 'Not provided'}
- Priority: ${cardContext.priority || 'Not set'}
${clarificationSection}

${template}`;
    }

    // Default template
    return `You are a Specialist Software Architect generating a detailed PRD (Product Requirements Document) for an AI Coding Assistant.

PROJECT CONTEXT:
- Name: ${projectContext.projectName}
- Tech Stack: ${projectContext.techStack || 'Not specified'}
- Coding Standards: ${projectContext.contextRules || 'Not specified'}
${projectContext.fileStructure ? `- File Structure:\n${projectContext.fileStructure}` : ''}

TASK CARD:
- Title: ${cardContext.title}
- Description: ${cardContext.description || 'Not provided'}
- Priority: ${cardContext.priority || 'Not set'}
${clarificationSection}

YOUR TASK:
Generate a complete, detailed PRD for a AI Coding assistant following this structure:

# ${cardContext.title}

## Overview
Brief description of what this task accomplishes.

## Requirements
- Functional requirements
- Non-functional requirements

## Technical Approach
### Database Changes
- Tables to create/modify
- Columns to add
- Indexes needed

### Backend Changes
- API endpoints to create/modify
- Services/business logic
- Data validation

### Frontend Changes
- Components to create/modify
- State management
- User interactions

## Implementation Steps
1. Step-by-step implementation guide
2. In logical order (backend → frontend)

## Testing Strategy
- Unit tests
- Integration tests
- Manual testing steps

## Acceptance Criteria
- [ ] Specific, testable criteria
- [ ] Based on the requirements

Follow the project's tech stack and coding standards strictly.
Use markdown with code blocks where appropriate.
Be specific and actionable. 
Your output will be used as input to a AI Coding Assistant to generate production grade code.`;
  }

  // Build system prompt for description generation
  protected buildDescriptionPrompt(request: DescriptionGenerationRequest): string {
    const { projectContext, cardContext } = request;

    return `You are a Senior Product Manager and Technical Lead helping to write comprehensive, actionable card descriptions.

PROJECT CONTEXT:
- Name: ${projectContext.projectName}
- Tech Stack: ${projectContext.techStack || 'Not specified'}
- Coding Standards: ${projectContext.contextRules || 'Not specified'}
${projectContext.fileStructure ? `- File Structure:\n${projectContext.fileStructure}` : ''}

TASK CARD:
- Title: ${cardContext.title}
- Current Description: ${cardContext.description || 'Not provided'}
- Priority: ${cardContext.priority || 'Not set'}

YOUR TASK:
Generate a comprehensive, well-structured card description that helps both product managers and developers understand the full scope of work. The output MUST follow this exact structure with all sections:

## Description
Write a concise paragraph (2-4 sentences) that explains:
- WHAT needs to be done
- WHY it's valuable (user/business value)
- WHEN/WHERE this feature would be used (context)
Focus on user/product perspective. Avoid overly technical details unless critical for understanding.

## Happy Path Flow
Provide a step-by-step breakdown of the expected user interaction or system behavior for the success scenario:
- Step 1: [Action/Behavior]
- Step 2: [Action/Behavior]
- Step 3: [Action/Behavior]
(Include 3-6 steps as appropriate)

## Acceptance Criteria
List specific, testable requirements that define when this card is complete. Use checkbox format:
- [ ] Specific criterion 1
- [ ] Specific criterion 2
- [ ] Specific criterion 3
(Include 3-5 criteria that are measurable and verifiable)

## Edge Cases & Error Handling
Identify potential edge cases and how the system should handle them:
- Edge case 1: [Description and expected handling]
- Edge case 2: [Description and expected handling]
- Error scenario: [Description and expected handling]
(Include 2-4 relevant scenarios)

## Implementation Notes
Optional section - include only if there are important technical considerations:
- High-level technical approach or architecture notes
- Dependencies or prerequisites
- Performance considerations
- Security considerations
(Keep this section concise and high-level. Omit if not needed.)

GUIDELINES:
- If a description already exists, enhance it while preserving relevant information
- If no description exists, create one based on the title and project context
- Be specific and actionable - avoid vague language
- Keep each section focused and concise
- Use markdown formatting for headers (##) and lists (-)
- Generate ONLY the structured description content. Do not include conversational text.`;
  }

  // Build system prompt for clarification chat
  protected buildChatPrompt(projectContext: ProjectContext, cardContext: CardContext): string {
    return `You are a Senior Software Architect helping to clarify requirements for a task.

PROJECT CONTEXT:
- Name: ${projectContext.projectName}
- Tech Stack: ${projectContext.techStack || 'Not specified'}
- Coding Standards: ${projectContext.contextRules || 'Not specified'}
${projectContext.fileStructure ? `- File Structure:\n${projectContext.fileStructure}` : ''}

TASK CARD:
- Title: ${cardContext.title}
- Description: ${cardContext.description || 'Not provided'}
- Priority: ${cardContext.priority || 'Not set'}

YOUR ROLE:
- Ask focused, technical questions
- One or two questions at a time maximum
- Be specific about what information is missing
- Validate answers against project architecture

RESPONSE FORMAT:
You MUST respond with valid JSON in this exact format:
{
  "message": "Your response to the user",
  "isComplete": boolean,
  "nextAction": "continue_chat" or "generate_prd"
}

Set "isComplete" to true and "nextAction" to "generate_prd" when you have enough information to generate a complete PRD.
Set "isComplete" to false and "nextAction" to "continue_chat" when you need more clarification.

Keep responses concise and professional.`;
  }

  // Build system prompt for feature suggestion
  protected buildFeatureSuggestionPrompt(request: FeatureSuggestionRequest): string {
    const { projectContext, guidance, count, existingCards } = request;

    // Build the "WORK ALREADY DONE" section if there are existing cards
    let existingWorkSection = '';
    if (existingCards && existingCards.length > 0) {
      existingWorkSection = `\nWORK ALREADY DONE:\nThe following features/cards already exist in this project. DO NOT suggest features that are similar or duplicate this work:\n\n`;
      existingCards.forEach((card, index) => {
        existingWorkSection += `---------\n${index + 1}. ${card.title}\n`;
        if (card.description) {
          existingWorkSection += `   Description: ${card.description}\n`;
        }
        existingWorkSection += '\n';
      });
    }

    return `You are a Creative Product Manager and Software Architect suggesting new features for a project.

PROJECT CONTEXT:
- Name: ${projectContext.projectName}
- Tech Stack: ${projectContext.techStack || 'Not specified'}
- Coding Standards: ${projectContext.contextRules || 'Not specified'}
${projectContext.fileStructure ? `- File Structure:\n${projectContext.fileStructure}` : ''}
${existingWorkSection}
YOUR TASK:
Generate ${count || 3} innovative feature suggestions for this project based on the context provided.
${guidance ? `\nUSER GUIDANCE:\n${guidance}\n` : ''}
${existingCards && existingCards.length > 0 ? '\nIMPORTANT: Review the "WORK ALREADY DONE" section above and ensure your suggestions are COMPLEMENTARY and DO NOT DUPLICATE existing features. Focus on innovative ideas that extend or enhance what already exists.\n' : ''}
RESPONSE FORMAT:
You MUST respond with valid JSON in this exact format:
{
  "suggestions": [
    {
      "title": "Feature Title",
      "description": "Brief description of the feature and its value.",
      "priority": "Low" | "Medium" | "High"
    }
  ]
}

Ensure the suggestions are relevant, actionable, and aligned with the project context.`;
  }

  // Abstract methods to be implemented by concrete services
  abstract analyzeCard(
    projectContext: ProjectContext,
    cardContext: CardContext
  ): Promise<CardAnalysisResult>;

  abstract chat(
    messages: ChatMessage[],
    projectContext: ProjectContext,
    cardContext: CardContext
  ): Promise<ChatResponse>;

  abstract generatePRD(request: PRDGenerationRequest): Promise<AIResponse>;

  abstract generateDescription(request: DescriptionGenerationRequest): Promise<AIResponse>;

  abstract suggestFeatures(request: FeatureSuggestionRequest): Promise<FeatureSuggestionResponse>;
}
