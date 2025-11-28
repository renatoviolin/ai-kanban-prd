import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit2, Trash2, ArrowLeft, LayoutGrid } from 'lucide-react';
import { Project } from '../types/project';
import { ProjectModal } from '../components/ProjectModal';
import { Header } from '../components/Header';
import { Toast } from '../components/Toast';

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProject();
  }, [id, session]);

  const loadProject = async () => {
    if (!session?.access_token || !id) return;

    try {
      const response = await fetch(`/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else if (response.status === 404) {
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async (projectData: Partial<Project>) => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
        setMessage({ type: 'success', text: 'Project updated successfully!' });
        setIsModalOpen(false);
      } else {
        setMessage({ type: 'error', text: 'Failed to update project. Please try again.' });
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        navigate('/projects');
      } else {
        setMessage({ type: 'error', text: 'Failed to delete project. Please try again.' });
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading project...</p>
            </div>
          </div>
        ) : !project ? null : (
          <>
            <div className="mb-6">
              <Link to="/projects" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
                <ArrowLeft size={16} />
                Back to Projects
              </Link>
            </div>

            {message && (
              <Toast
                message={message.text}
                type={message.type}
                onClose={() => setMessage(null)}
              />
            )}

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex-1 max-w-3xl">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{project.name}</h1>
                  {project.description && (
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-words">{project.description}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 ml-4 flex-shrink-0">
                  <Link
                    to={`/projects/${id}/board`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                  >
                    <LayoutGrid size={18} />
                    Board
                  </Link>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors font-medium"
                  >
                    <Edit2 size={18} />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 dark:border-red-400 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 transition-colors font-medium"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              </div>

              {project.tech_stack && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tech Stack</h2>
                  <pre className="text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">{project.tech_stack}</pre>
                </div>
              )}

              {project.context_rules && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Context Rules / Coding Standards</h2>
                  <pre className="text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {project.context_rules}
                  </pre>
                </div>
              )}

              {project.file_structure && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">File Structure</h2>
                  <pre className="text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto">
                    {project.file_structure}
                  </pre>
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                Created {new Date(project.created_at).toLocaleString()} •
                Last updated {new Date(project.updated_at).toLocaleString()}
              </div>
            </div>
          </>
        )}
      </main>

      {showDeleteConfirm && project && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Delete Project?</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        project={project}
        loading={saving}
      />
    </div>
  );
}
