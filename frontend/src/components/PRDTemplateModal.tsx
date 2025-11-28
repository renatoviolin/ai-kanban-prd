import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Eye, Edit2 } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';
import { useModalKeyboard } from '../hooks/useModalKeyboard';

export interface PRDTemplate {
  id: string;
  template_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface PRDTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: { template_name: string; content: string }) => void;
  template?: Partial<PRDTemplate>;
  loading?: boolean;
}

export function PRDTemplateModal({ isOpen, onClose, onSave, template, loading }: PRDTemplateModalProps) {
  const [name, setName] = useState(template?.template_name || '');
  const [content, setContent] = useState(template?.content || '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Use shared keyboard hook for ESC key handling
  useModalKeyboard(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setName(template?.template_name || '');
      setContent(template?.content || '');
      setIsPreviewMode(false);
    }
  }, [isOpen, template]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    onSave({
      template_name: name,
      content: content,
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-6xl flex flex-col h-[85vh]">
        {/* Sticky Header with Actions */}
        <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {template?.id ? 'Edit Template' : 'New Template'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Action Buttons at Top */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !name.trim() || !content.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Saving...' : (template?.id ? 'Update Template' : 'Create Template')}
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="template_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                id="template_name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Bug Report Analysis"
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Prompt Template <span className="text-red-500">*</span>
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
                    onClick={handleCopy}
                    disabled={!content}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy size={14} />
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {isPreviewMode ? (
                <div className="w-full block box-border p-3 border border-slate-300 dark:border-slate-600 rounded-lg h-[400px] overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                  {content ? (
                    <MarkdownViewer content={content} />
                  ) : (
                    <p className="text-slate-400 italic">No template content provided.</p>
                  )}
                </div>
              ) : (
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your prompt template here..."
                  rows={12}
                  required
                  className="w-full block box-border p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm resize-none h-[400px]"
                />
              )}
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                This template will be used to generate prompts for the AI assistant (Markdown supported)
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
