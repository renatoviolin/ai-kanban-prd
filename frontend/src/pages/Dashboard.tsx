import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome to AI-Kanban! 🎉
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Hello, <span className="font-semibold text-blue-600 dark:text-blue-400">{user?.email}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/projects" className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-lg transition-shadow block">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Projects</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Create and manage your kanban projects
              </p>
              <span className="mt-4 text-blue-600 dark:text-blue-400 font-medium hover:underline inline-block">
                Manage projects →
              </span>
            </Link>

            <Link to="/prd-templates" className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-lg transition-shadow block">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">PRD Templates</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Create and manage your Product Requirements Document templates
              </p>
              <span className="mt-4 text-blue-600 dark:text-blue-400 font-medium hover:underline inline-block">
                Manage templates →
              </span>
            </Link>

            <Link to="/settings" className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-lg transition-shadow block">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Settings</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Configure your API keys and preferences
              </p>
              <span className="mt-4 text-blue-600 dark:text-blue-400 font-medium hover:underline inline-block">
                Configure now →
              </span>
            </Link>
          </div>


        </div>
      </main>
    </div>
  );
}
