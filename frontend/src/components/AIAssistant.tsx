import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Copy, RotateCcw, Send, Loader2, AlertCircle, Edit2, Save, X } from 'lucide-react';
import { Card } from '../types/board';
import { ChatMessage } from './ChatMessage';
import { MarkdownViewer } from './MarkdownViewer';
import { API_URL } from '../config/env';

type AIState = 'idle' | 'loading' | 'analyzing' | 'clarifying' | 'generating' | 'complete' | 'error';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  card: Card;
}

interface PRDTemplate {
  id: string;
  template_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function AIAssistant({ card }: AIAssistantProps) {
  const { session } = useAuth();
  // Initialize state based on whether we have initial PRD or need to fetch
  const [state, setState] = useState<AIState>(card.generated_prd ? 'complete' : 'idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [prdContent, setPrdContent] = useState(card.generated_prd || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [provider, setProvider] = useState<'auto' | 'openai' | 'anthropic' | 'gemini'>('auto');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Fetch PRD templates
  const { data: templates } = useQuery({
    queryKey: ['prdTemplates'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/prd-templates`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json() as Promise<PRDTemplate[]>;
    },
    enabled: !!session?.access_token,
  });

  // Load existing messages and PRD on mount
  useEffect(() => {
    if (card.generated_prd) {
      setState('complete');
      setPrdContent(card.generated_prd);
    } else {
      setState('idle');
    }
    // We don't need to load existing data as we have the full card now
  }, [card]);



  const handleGeneratePRD = async () => {
    try {
      // If we have chat history, skip analysis and generate directly
      // This prevents re-analyzing and asking the same questions again
      if (messages.length > 0) {
        await generatePRD();
        return;
      }

      setState('analyzing');
      setError(null);

      // Analyze if clarification is needed
      const analyzeRes = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          cardId: card.id,
          provider: provider === 'auto' ? undefined : provider
        }),
      });

      if (!analyzeRes.ok) {
        const errorData = await analyzeRes.json();
        throw new Error(errorData.message || 'Failed to analyze card');
      }

      const analysis = await analyzeRes.json();

      if (analysis.needsClarification && analysis.questions) {
        // Show clarification chat
        setState('clarifying');
        const aiMessage: Message = {
          role: 'assistant',
          content: `I need some clarifications:\n${analysis.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
        };
        setMessages([aiMessage]);
      } else {
        // Generate PRD directly
        await generatePRD();
      }
    } catch (err: any) {
      console.error('Error:', err);
      setState('error');
      setError(err.message || 'An error occurred');
    }
  };

  const generatePRD = async (conversationMessages?: Message[]) => {
    try {
      setState('generating');

      // Use provided messages or fall back to state
      const clarificationMessages = conversationMessages || messages;

      const response = await fetch('/api/ai/generate-prd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          cardId: card.id,
          provider: provider === 'auto' ? undefined : provider,
          templateId: selectedTemplateId || undefined,
          clarifications: clarificationMessages.length > 0 ? clarificationMessages : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate PRD');
      }

      const data = await response.json();
      setPrdContent(data.content);
      setState('complete');
    } catch (err: any) {
      console.error('Error generating PRD:', err);
      setState('error');
      setError(err.message || 'Failed to generate PRD');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          cardId: card.id,
          message: inputMessage,
          provider: provider === 'auto' ? undefined : provider,
          conversationHistory: messages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const aiMessage: Message = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, aiMessage]);

      // Check if AI has enough information using structured response
      if (data.isComplete && data.nextAction === 'generate_prd') {
        // Automatically trigger PRD generation with the full conversation
        // Include both the user message and AI response that were just added
        const updatedMessages = [...messages, userMessage, aiMessage];
        await generatePRD(updatedMessages);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prdContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegenerate = () => {
    setPrdContent('');
    setMessages([]);
    setState('idle');
  };

  const handleEdit = () => {
    setEditContent(prdContent);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleSavePRD = async () => {
    if (!editContent.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/cards/${card.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          title: card.title,
          description: card.description,
          priority: card.priority,
          column_id: card.column_id,
          generated_prd: editContent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update PRD');
      }

      setPrdContent(editContent);
      setIsEditing(false);
      // Ideally we should update the parent state too, but for now local state is enough
      // The parent will update when the modal closes/reopens or if we add a callback
    } catch (err) {
      console.error('Error saving PRD:', err);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Idle state - Show Generate PRD button
  if (state === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Generate Technical PRD
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
          The AI will analyze your card and project context to create a detailed Product Requirement Page.
        </p>

        {/* Provider Selection */}
        <div className="mb-4 w-full max-w-xs">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            AI Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="auto">Auto (Gemini → OpenAI → Anthropic)</option>
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI (GPT-4o)</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
        </div>

        {/* Template Selection */}
        {templates && templates.length > 0 && (
          <div className="mb-6 w-full max-w-xs">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              PRD Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Default Template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.template_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {messages.length > 0 && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
            ✓ Clarifications complete. Ready to generate!
          </p>
        )}
        <button
          onClick={handleGeneratePRD}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
        >
          <Sparkles size={20} />
          Generate PRD
        </button>
      </div>
    );
  }

  // Loading state (initial fetch)
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  // Analyzing state
  if (state === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Analyzing your card...</p>
      </div>
    );
  }

  // Clarification state - Show chat
  if (state === 'clarifying') {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg shrink-0 flex items-center justify-between">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 The AI needs some clarifications before generating the PRD
          </p>
          <button
            onClick={handleRegenerate}
            className="text-xs flex items-center gap-1 px-2 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded transition-colors"
            title="Cancel conversation and start over"
          >
            <X size={14} />
            Cancel
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-2 min-h-0">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} role={msg.role} content={msg.content} />
          ))}
        </div>

        <div className="flex gap-2 items-end shrink-0">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your answer... (Shift+Enter for new line)"
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Generating state
  if (state === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Generating your PRD...</p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">This may take a moment</p>
      </div>
    );
  }

  // Complete state - Show PRD
  if (state === 'complete' && prdContent) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEditing ? 'Edit PRD' : 'Generated PRD'}
          </h3>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  disabled={isSaving}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSavePRD}
                  disabled={isSaving || !editContent.trim()}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Copy size={16} />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw size={16} />
                  Regenerate
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-full p-4 bg-transparent border-none focus:ring-0 dark:text-white font-mono text-sm resize-none"
              placeholder="Edit your PRD here..."
            />
          ) : (
            <div className="p-4">
              <MarkdownViewer content={prdContent} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Something went wrong
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">
          {error || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => setState('idle')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return null;
}
