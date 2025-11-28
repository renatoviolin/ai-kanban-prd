import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Toast } from '../components/Toast';

export function Settings() {
  const { session } = useAuth();
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiModified, setOpenaiModified] = useState(false);
  const [anthropicModified, setAnthropicModified] = useState(false);
  const [geminiModified, setGeminiModified] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing settings
  useEffect(() => {
    async function loadSettings() {
      if (!session?.access_token) return;

      try {
        const response = await fetch('/api/settings', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOpenaiKey(data.openai_key || '');
          setAnthropicKey(data.anthropic_key || '');
          setGeminiKey(data.gemini_api_key || '');
          // Reset modified flags after loading initial data
          setOpenaiModified(false);
          setAnthropicModified(false);
          setGeminiModified(false);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoadingData(false);
      }
    }

    loadSettings();
  }, [session]);

  const handleOpenaiChange = (value: string) => {
    setOpenaiKey(value);
    setOpenaiModified(true);
  };

  const handleAnthropicChange = (value: string) => {
    setAnthropicKey(value);
    setAnthropicModified(true);
  };

  const handleGeminiChange = (value: string) => {
    setGeminiKey(value);
    setGeminiModified(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Only send modified keys
      const payload: { openai_key?: string; anthropic_key?: string; gemini_api_key?: string } = {};

      if (openaiModified) {
        payload.openai_key = openaiKey;
      }

      if (anthropicModified) {
        payload.anthropic_key = anthropicKey;
      }

      if (geminiModified) {
        payload.gemini_api_key = geminiKey;
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: 'Settings saved successfully!' });

        // Update with obfuscated keys and reset modified flags
        if (openaiModified) {
          setOpenaiKey(data.openai_key || '');
          setOpenaiModified(false);
        }

        if (anthropicModified) {
          setAnthropicKey(data.anthropic_key || '');
          setAnthropicModified(false);
        }

        if (geminiModified) {
          setGeminiKey(data.gemini_api_key || '');
          setGeminiModified(false);
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Configure your AI provider API keys
          </p>

          {message && (
            <Toast
              message={message.text}
              type={message.type}
              onClose={() => setMessage(null)}
            />
          )}

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading settings...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label htmlFor="openaiKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  OpenAI API Key {openaiModified && <span className="text-xs text-amber-600">(modified)</span>}
                </label>
                <div className="relative">
                  <input
                    id="openaiKey"
                    type={showOpenaiKey ? 'text' : 'password'}
                    value={openaiKey}
                    onChange={(e) => handleOpenaiChange(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showOpenaiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">OpenAI Platform</a>
                </p>
              </div>

              <div>
                <label htmlFor="anthropicKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Anthropic API Key {anthropicModified && <span className="text-xs text-amber-600">(modified)</span>}
                </label>
                <div className="relative">
                  <input
                    id="anthropicKey"
                    type={showAnthropicKey ? 'text' : 'password'}
                    value={anthropicKey}
                    onChange={(e) => handleAnthropicChange(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showAnthropicKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Anthropic Console</a>
                </p>
              </div>

              <div>
                <label htmlFor="geminiKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Google Gemini API Key {geminiModified && <span className="text-xs text-amber-600">(modified)</span>}
                </label>
                <div className="relative">
                  <input
                    id="geminiKey"
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => handleGeminiChange(e.target.value)}
                    placeholder="AI..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showGeminiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google AI Studio</a>
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || (!openaiModified && !anthropicModified && !geminiModified)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Saving...' : 'Save API Keys'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">🔒 Security Note</h3>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Your API keys are stored securely and are only accessible to you. They will be used to power the AI features in your projects. Only modified keys will be updated.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
