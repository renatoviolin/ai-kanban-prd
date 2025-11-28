import { Router, Response } from 'express';
import { AuthRequest, ensureAuth } from '../middleware/ensureAuth';
import { createClient } from '@supabase/supabase-js';
import { AIServiceFactory } from '../services/ai/AIServiceFactory';
import { ChatMessage, ProjectContext, CardContext } from '../services/ai/types';

const router = Router();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// POST /api/ai/analyze - Analyze if card needs clarification
router.post('/analyze', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const { cardId, provider } = req.body;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!cardId) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Fetch card with project context
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Get user's AI settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('gemini_api_key, openai_key, anthropic_key')
      .eq('user_id', userId)
      .single();

    if (!settings) {
      return res.status(400).json({
        error: 'NO_API_KEY',
        message: 'Please configure at least one AI provider (Gemini, OpenAI, or Anthropic) in Settings'
      });
    }

    // Create AI service based on provider selection
    let aiService;
    if (provider && provider !== 'auto') {
      // Use specific provider
      const apiKey = (settings as any)[`${provider}_api_key`] || (settings as any)[`${provider}_key`];
      if (!apiKey) {
        return res.status(400).json({
          error: 'NO_API_KEY',
          message: `${provider.toUpperCase()} API key not configured`
        });
      }
      aiService = AIServiceFactory.create(provider, apiKey);
    } else {
      // Auto-select provider
      aiService = AIServiceFactory.createFromUserSettings(settings);
    }

    if (!aiService) {
      return res.status(400).json({
        error: 'NO_API_KEY',
        message: 'Please configure at least one AI provider in Settings'
      });
    }

    // Build context
    const projectContext: ProjectContext = {
      projectId: card.project.id,
      projectName: card.project.name,
      techStack: card.project.tech_stack,
      contextRules: card.project.context_rules,
      fileStructure: card.project.file_structure
    };

    const cardContext: CardContext = {
      cardId: card.id,
      title: card.title,
      description: card.description,
      priority: card.priority
    };

    // Analyze card
    const result = await aiService.analyzeCard(projectContext, cardContext);

    return res.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/ai/analyze:', error);

    if (error.status === 429) {
      return res.status(429).json({
        error: 'RATE_LIMIT',
        message: 'API rate limit exceeded. Please try again in a few moments.'
      });
    }

    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /api/ai/chat - Send message for clarification
router.post('/chat', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const { cardId, message, provider, conversationHistory } = req.body;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!cardId || !message) {
      return res.status(400).json({ error: 'Card ID and message are required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Fetch card with project context
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Get user's AI settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('gemini_api_key, openai_key, anthropic_key')
      .eq('user_id', userId)
      .single();

    if (!settings) {
      return res.status(400).json({
        error: 'NO_API_KEY',
        message: 'Please configure at least one AI provider (Gemini, OpenAI, or Anthropic) in Settings'
      });
    }

    // Create AI service based on provider selection
    let aiService;
    if (provider && provider !== 'auto') {
      const apiKey = (settings as any)[`${provider}_api_key`] || (settings as any)[`${provider}_key`];
      if (!apiKey) {
        return res.status(400).json({
          error: 'NO_API_KEY',
          message: `${provider.toUpperCase()} API key not configured`
        });
      }
      aiService = AIServiceFactory.create(provider, apiKey);
    } else {
      aiService = AIServiceFactory.createFromUserSettings(settings);
    }

    if (!aiService) {
      return res.status(400).json({
        error: 'NO_API_KEY',
        message: 'Please configure at least one AI provider in Settings'
      });
    }

    // Use conversation history from request body (ephemeral, not from database)
    const history: ChatMessage[] = conversationHistory || [];

    // Add current user message to history
    const currentMessage: ChatMessage = { role: 'user', content: message };
    const allMessages = [...history, currentMessage];

    // Build context
    const projectContext: ProjectContext = {
      projectId: card.project.id,
      projectName: card.project.name,
      techStack: card.project.tech_stack,
      contextRules: card.project.context_rules,
      fileStructure: card.project.file_structure
    };

    const cardContext: CardContext = {
      cardId: card.id,
      title: card.title,
      description: card.description,
      priority: card.priority
    };

    // Get AI response
    const aiResponse = await aiService.chat(allMessages, projectContext, cardContext);

    // Don't save to database - keep conversations ephemeral

    return res.json(aiResponse);
  } catch (error: any) {
    console.error('Error in POST /api/ai/chat:', error);

    if (error.status === 429) {
      return res.status(429).json({
        error: 'RATE_LIMIT',
        message: 'API rate limit exceeded. Please try again in a few moments.'
      });
    }

    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /api/ai/generate-prd - Generate PRD for card
router.post('/generate-prd', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const { cardId, provider, templateId, clarifications } = req.body;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!cardId) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Fetch card with project context
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Get user's AI settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('gemini_api_key, openai_key, anthropic_key')
      .eq('user_id', userId)
      .single();

    if (!settings) {
      return res.status(400).json({
        error: 'NO_API_KEY',
        message: 'Please configure at least one AI provider (Gemini, OpenAI, or Anthropic) in Settings'
      });
    }

    // Create AI service based on provider selection
    let aiService;
    if (provider && provider !== 'auto') {
      const apiKey = (settings as any)[`${provider}_api_key`] || (settings as any)[`${provider}_key`];
      if (!apiKey) {
        return res.status(400).json({
          error: 'NO_API_KEY',
          message: `${provider.toUpperCase()} API key not configured`
        });
      }
      aiService = AIServiceFactory.create(provider, apiKey);
    } else {
      aiService = AIServiceFactory.createFromUserSettings(settings);
    }

    if (!aiService) {
      return res.status(400).json({
        error: 'NO_API_KEY',
        message: 'Please configure at least one AI provider in Settings'
      });
    }

    // Use clarifications from request body (ephemeral conversation)
    const clarificationMessages: ChatMessage[] = clarifications || [];

    // Build context
    const projectContext: ProjectContext = {
      projectId: card.project.id,
      projectName: card.project.name,
      techStack: card.project.tech_stack,
      contextRules: card.project.context_rules,
      fileStructure: card.project.file_structure
    };

    const cardContext: CardContext = {
      cardId: card.id,
      title: card.title,
      description: card.description,
      priority: card.priority
    };

    // Fetch custom template if templateId is provided
    let templateContent: string | undefined;
    if (templateId) {
      const { data: templateData, error: templateError } = await supabase
        .from('prd_templates')
        .select('content')
        .eq('id', templateId)
        .single();

      if (!templateError && templateData) {
        templateContent = templateData.content;
      }
    }

    // Generate PRD
    const prdResponse = await aiService.generatePRD({
      projectContext,
      cardContext,
      clarifications: clarificationMessages.length > 0 ? clarificationMessages : undefined,
      template: templateContent
    });

    // Save PRD to card
    await supabase
      .from('cards')
      .update({ generated_prd: prdResponse.content })
      .eq('id', cardId);

    return res.json(prdResponse);
  } catch (error: any) {
    console.error('Error in POST /api/ai/generate-prd:', error);

    if (error.status === 429) {
      return res.status(429).json({
        error: 'RATE_LIMIT',
        message: 'API rate limit exceeded. Please try again in a few moments.'
      });
    }

    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /api/ai/generate-description - Generate description for card
router.post('/generate-description', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const { cardId, provider, title, description } = req.body;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // We need either a cardId (existing card) or at least a title (new card)
    if (!cardId && !title) {
      return res.status(400).json({ error: 'Card ID or Title is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Get user's AI settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('gemini_api_key, openai_key, anthropic_key')
      .eq('user_id', userId)
      .single();

    if (!settings) {
      return res.status(400).json({
        error: 'NO_API_KEY',
        message: 'Please configure at least one AI provider (Gemini, OpenAI, or Anthropic) in Settings'
      });
    }

    // Create AI service based on provider selection
    let aiService;
    if (provider && provider !== 'auto') {
      const apiKey = (settings as any)[`${provider}_api_key`] || (settings as any)[`${provider}_key`];
      if (!apiKey) {
        return res.status(400).json({
          error: 'NO_API_KEY',
          message: `${provider.toUpperCase()} API key not configured`
        });
      }
      aiService = AIServiceFactory.create(provider, apiKey);
    } else {
      aiService = AIServiceFactory.createFromUserSettings(settings);
    }

    if (!aiService) {
      return res.status(400).json({
        error: 'NO_API_KEY',
        message: 'Please configure at least one AI provider in Settings'
      });
    }

    let projectContext: ProjectContext;
    let cardContext: CardContext;

    if (cardId) {
      // Fetch existing card with project context
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('id', cardId)
        .single();

      if (cardError || !card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      projectContext = {
        projectId: card.project.id,
        projectName: card.project.name,
        techStack: card.project.tech_stack,
        contextRules: card.project.context_rules,
        fileStructure: card.project.file_structure
      };

      cardContext = {
        cardId: card.id,
        title: card.title,
        description: card.description,
        priority: card.priority
      };
    } else {
      // For new cards (not saved yet), we need project ID from body
      const { projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required for new cards' });
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      projectContext = {
        projectId: project.id,
        projectName: project.name,
        techStack: project.tech_stack,
        contextRules: project.context_rules,
        fileStructure: project.file_structure
      };

      cardContext = {
        cardId: 'new',
        title: title,
        description: description,
        priority: req.body.priority
      };
    }

    // Generate Description
    const aiResponse = await aiService.generateDescription({
      projectContext,
      cardContext
    });

    return res.json(aiResponse);
  } catch (error: any) {
    console.error('Error in POST /api/ai/generate-description:', error);

    if (error.status === 429) {
      return res.status(429).json({
        error: 'RATE_LIMIT',
        message: 'API rate limit exceeded. Please try again in a few moments.'
      });
    }

    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /api/ai/suggest-features - Suggest features for project
router.post('/suggest-features', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const { projectId, provider, guidance, count } = req.body;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Get user's AI settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('gemini_api_key, openai_key, anthropic_key')
      .eq('user_id', userId)
      .single();

    if (!settings) {
      return res.status(400).json({
        error: 'NO_API_KEY',
        message: 'Please configure at least one AI provider (Gemini, OpenAI, or Anthropic) in Settings'
      });
    }

    // Create AI service based on provider selection
    let aiService;
    if (provider && provider !== 'auto') {
      const apiKey = (settings as any)[`${provider}_api_key`] || (settings as any)[`${provider}_key`];
      if (!apiKey) {
        return res.status(400).json({
          error: 'NO_API_KEY',
          message: `${provider.toUpperCase()} API key not configured`
        });
      }
      aiService = AIServiceFactory.create(provider, apiKey);
    } else {
      aiService = AIServiceFactory.createFromUserSettings(settings);
    }

    if (!aiService) {
      return res.status(400).json({
        error: 'NO_API_KEY',
        message: 'Please configure at least one AI provider in Settings'
      });
    }

    // Fetch project context
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectContext: ProjectContext = {
      projectId: project.id,
      projectName: project.name,
      techStack: project.tech_stack,
      contextRules: project.context_rules,
      fileStructure: project.file_structure
    };

    // Fetch all existing cards for the project to provide context
    const { data: existingCards } = await supabase
      .from('cards')
      .select('title, description')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    // Suggest Features
    const aiResponse = await aiService.suggestFeatures({
      projectContext,
      guidance,
      count,
      existingCards: existingCards || []
    });

    return res.json(aiResponse);
  } catch (error: any) {
    console.error('Error in POST /api/ai/suggest-features:', error);

    if (error.status === 429) {
      return res.status(429).json({
        error: 'RATE_LIMIT',
        message: 'API rate limit exceeded. Please try again in a few moments.'
      });
    }

    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// GET /api/ai/messages/:cardId - Get message history
router.get('/messages/:cardId', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const { cardId } = req.params;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Verify card ownership via RLS
    const { data: card } = await supabase
      .from('cards')
      .select('id')
      .eq('id', cardId)
      .single();

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('card_messages')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    return res.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error in GET /api/ai/messages/:cardId:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
