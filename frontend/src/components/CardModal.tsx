import { useState, useEffect } from 'react';
import { X, FileText, Sparkles, Loader2, Eye, Edit2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { useParams } from 'react-router-dom';
import { Card, Column } from '../types/board';
import { AIAssistant } from './AIAssistant';
import { MarkdownViewer } from './MarkdownViewer';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Partial<Card>) => void;
  card?: Card | null;
  columns: Column[];
  loading?: boolean;
}

type TabType = 'details' | 'ai';

export function CardModal({ isOpen, onClose, onSave, card, columns, loading }: CardModalProps) {
  const { session } = useAuth();
  const { id: projectId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [title, setTitle] = useState(card?.title || '');
  const [description, setDescription] = useState(card?.description || '');
  const [priority, setPriority] = useState(card?.priority || '');
  const [columnId, setColumnId] = useState(card?.column_id || columns[0]?.id || '');
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Use shared keyboard hook for ESC key handling
  useModalKeyboard(isOpen, onClose);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setPriority(card.priority || '');
      setColumnId(card.column_id);
    } else {
      setTitle('');
      setDescription('');
      setPriority('');
      setColumnId(columns[0]?.id || '');
    }
    // Reset to details tab when modal opens/closes
    setActiveTab('details');
  }, [card, columns, isOpen]);

  const handleGenerateDescription = async () => {
    if (!title.trim()) return;

    setGeneratingDescription(true);
    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          cardId: card?.id,
          projectId: projectId,
          title,
          description,
          priority
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDescription(data.content);
      } else {
        console.error('Failed to generate description');
        // Ideally show a toast here, but for now console error is fine as per plan
      }
    } catch (error) {
      console.error('Error generating description:', error);
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim() || null,
      priority: priority || null,
      column_id: columnId,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-6xl flex flex-col h-[85vh]">
        {/* Header with Tabs */}
        <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between p-6 pb-0">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {card ? 'Edit Card' : 'New Card'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 px-6 mt-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${activeTab === 'details'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              <FileText size={18} />
              <span className="font-medium">Details</span>
            </button>
            {card && (
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${activeTab === 'ai'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <Sparkles size={18} />
                <span className="font-medium">AI Assistant</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {/* Details Tab */}
        <div className={`${activeTab === 'details' ? 'flex' : 'hidden'} flex-col flex-1 min-h-0`}>
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form id="card-form" onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex-shrink-0">
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Card title..."
                    required
                    autoFocus
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-1 flex-shrink-0">
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Description
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className="text-xs flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        title={isPreviewMode ? "Switch to edit mode" : "Switch to preview mode"}
                      >
                        {isPreviewMode ? (
                          <>
                            <Edit2 size={14} />
                            Edit
                          </>
                        ) : (
                          <>
                            <Eye size={14} />
                            Preview
                          </>
                        )}
                      </button>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                      <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={generatingDescription || !title.trim() || isPreviewMode}
                        className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Generate improved description with AI"
                      >
                        {generatingDescription ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        AI Assist
                      </button>
                    </div>
                  </div>

                  {isPreviewMode ? (
                    <div className="w-full block box-border px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                      {description ? (
                        <MarkdownViewer content={description} />
                      ) : (
                        <p className="text-slate-400 italic">No description provided.</p>
                      )}
                    </div>
                  ) : (
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Card description... (Markdown supported)"
                      className="w-full block box-border px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none font-mono text-sm flex-1 min-h-0"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                  {/* Rest of your form fields remain the same */}
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">None</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  {!card && (
                    <div>
                      <label htmlFor="column" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Column
                      </label>
                      <select
                        id="column"
                        value={columnId}
                        onChange={(e) => setColumnId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                      >
                        {columns.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Footer with Action Buttons */}
          <div className="flex-shrink-0 p-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="card-form"
                disabled={loading || !title.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Saving...' : (card ? 'Update Card' : 'Create Card')}
              </button>
            </div>
          </div>
        </div>

        {/* AI Assistant Tab */}
        {card && (
          <div className={`${activeTab === 'ai' ? 'flex' : 'hidden'} flex-1 overflow-hidden p-6 flex-col min-h-0`}>
            <AIAssistant card={card} />
          </div>
        )}
      </div>
    </div>
  );
}
