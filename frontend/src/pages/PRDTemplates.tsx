import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/Header';
import { PRDTemplateModal, PRDTemplate } from '../components/PRDTemplateModal';
import { Toast } from '../components/Toast';
import { API_URL } from '../config/env';

export function PRDTemplates() {
  const { session } = useAuth();
  const [templates, setTemplates] = useState<PRDTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<PRDTemplate>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [session]);

  const loadTemplates = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`${API_URL}/api/prd-templates`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (templateData: { template_name: string; content: string }) => {
    setSaving(true);
    setMessage(null);

    try {
      const url = currentTemplate.id
        ? `${API_URL}/api/prd-templates/${currentTemplate.id}`
        : `${API_URL}/api/prd-templates`;
      const method = currentTemplate.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: currentTemplate.id ? 'Template updated successfully!' : 'Template created successfully!'
        });
        setIsModalOpen(false);
        setCurrentTemplate({});
        loadTemplates();
      } else {
        setMessage({ type: 'error', text: 'Failed to save template. Please try again.' });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template: PRDTemplate) => {
    setCurrentTemplate(template);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/prd-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Template deleted successfully!' });
        loadTemplates();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete template.' });
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setMessage({ type: 'error', text: 'An error occurred.' });
    }
  };

  const handleNewTemplate = () => {
    setCurrentTemplate({});
    setIsModalOpen(true);
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

        {message && (
          <Toast
            message={message.text}
            type={message.type}
            onClose={() => setMessage(null)}
          />
        )}

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading templates...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">PRD Templates</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {templates.length} template{templates.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={handleNewTemplate}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                <Plus size={16} />
                New Template
              </button>
            </div>

            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex justify-between items-start p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 dark:text-white">{template.template_name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">{template.content}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      Updated {new Date(template.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {templates.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400 mb-4">No templates found</p>
                  <button
                    onClick={handleNewTemplate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    <Plus size={16} />
                    Create your first template
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <PRDTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCurrentTemplate({});
        }}
        onSave={handleSave}
        template={currentTemplate}
        loading={saving}
      />
    </div>
  );
}
