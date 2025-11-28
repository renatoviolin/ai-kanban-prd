import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { X, Sparkles, Check, Loader2, Trash2 } from 'lucide-react';
import { FeatureSuggestion } from '../types/board';

interface AISuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCards: (cards: FeatureSuggestion[]) => void;
  projectId: string;
}

export function AISuggestionModal({ isOpen, onClose, onAddCards, projectId }: AISuggestionModalProps) {
  const { session } = useAuth();
  const [guidance, setGuidance] = useState('');
  const [count, setCount] = useState<number | ''>(3);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use shared keyboard hook for ESC key handling
  useModalKeyboard(isOpen, onClose);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setSelectedIndices([]);

    try {
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('Unauthorized');
      }

      const response = await fetch('/api/ai/suggest-features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          projectId,
          guidance,
          count: count === '' ? 1 : count,
          provider: 'auto' // Or let user select
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
      // Select all by default
      setSelectedIndices(data.suggestions.map((_: any, i: number) => i));

    } catch (err: any) {
      console.error('Error generating suggestions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (index: number) => {
    setSelectedIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleAddSelected = () => {
    const selectedCards = suggestions.filter((_, i) => selectedIndices.includes(i));
    onAddCards(selectedCards);
    onClose();
  };

  const handleClear = () => {
    setSuggestions([]);
    setSelectedIndices([]);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                AI Feature Suggestions
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Generate innovative feature ideas for your project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Guidance for AI (Optional)
              </label>
              <textarea
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                placeholder="E.g., Focus on gamification features, or security improvements..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Number of Suggestions
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={count}
                onChange={(e) => {
                  const value = e.target.value;
                  setCount(value === '' ? '' : parseInt(value, 10));
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Suggestions
                </>
              )}
            </button>

            {suggestions.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 py-2.5 rounded-lg font-medium transition-all"
              >
                <Trash2 className="w-5 h-5" />
                Clear Suggestions
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Results Section */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider">
                Suggestions
              </h3>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${selectedIndices.includes(index)
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800'
                      }`}
                    onClick={() => toggleSelection(index)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {suggestion.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {suggestion.description}
                        </p>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${suggestion.priority === 'High'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : suggestion.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                          {suggestion.priority} Priority
                        </span>
                      </div>
                      <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${selectedIndices.includes(index)
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                        }`}>
                        {selectedIndices.includes(index) && <Check size={14} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddSelected}
            disabled={selectedIndices.length === 0}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Add Selected Cards ({selectedIndices.length})
          </button>
        </div>
      </div>
    </div>
  );
}
