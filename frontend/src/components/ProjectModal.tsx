import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Project } from '../types/project';
import { useModalKeyboard } from '../hooks/useModalKeyboard';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>) => void;
  project?: Project | null;
  loading?: boolean;
}

export function ProjectModal({ isOpen, onClose, onSave, project, loading }: ProjectModalProps) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [techStack, setTechStack] = useState(project?.tech_stack || '');
  const [contextRules, setContextRules] = useState(project?.context_rules || '');
  const [fileStructure, setFileStructure] = useState(project?.file_structure || '');

  // Use shared keyboard hook for ESC key handling
  useModalKeyboard(isOpen, onClose);

  // Update form state when project prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(project?.name || '');
      setDescription(project?.description || '');
      setTechStack(project?.tech_stack || '');
      setContextRules(project?.context_rules || '');
      setFileStructure(project?.file_structure || '');
    }
  }, [isOpen, project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      tech_stack: techStack.trim() || null,
      context_rules: contextRules.trim() || null,
      file_structure: fileStructure.trim() || null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-6xl flex flex-col h-[85vh]">
        {/* Sticky Header with Actions */}
        <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {project ? 'Edit Project' : 'New Project'}
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
              disabled={loading || !name.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Project"
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your project..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm resize-y"
              />
            </div>

            <div>
              <label htmlFor="techStack" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tech Stack
              </label>
              <textarea
                id="techStack"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="React, Node.js, PostgreSQL, TypeScript..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm resize-y"
              />
            </div>

            <div>
              <label htmlFor="contextRules" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Context Rules / Coding Standards
              </label>
              <textarea
                id="contextRules"
                value={contextRules}
                onChange={(e) => setContextRules(e.target.value)}
                placeholder="- Use functional components&#10;- Strict TypeScript&#10;- Follow Clean Code principles..."
                rows={5}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm resize-y"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                These rules will help the AI understand your project's coding standards
              </p>
            </div>

            <div>
              <label htmlFor="fileStructure" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                File Structure
              </label>
              <textarea
                id="fileStructure"
                value={fileStructure}
                onChange={(e) => setFileStructure(e.target.value)}
                placeholder="Paste the output from 'tree' command or describe your file structure..."
                rows={8}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm resize-y"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Run <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">tree -I 'node_modules|dist'</code> in your project directory
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

