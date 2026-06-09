import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'

export default function OrgSettings() {
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useThemeStore()
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">

      {/* Header */}
      <header className="bg-slate-900 dark:bg-slate-950 border-b border-slate-800 text-white px-6 py-3.5 flex items-center gap-3 shadow-md flex-shrink-0">
        <button
          onClick={() => navigate('/org')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Terug"
        >
          <ArrowLeft size={16} />
        </button>
        <Building2 size={18} className="text-violet-400 flex-shrink-0" />
        <span className="font-bold text-sm truncate">{user?.tenantName ?? 'Organisatie'}</span>
        <span className="text-slate-500 text-xs uppercase tracking-wider">/ Instellingen</span>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 flex flex-col gap-6">

        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Instellingen</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Beheer jouw portaalvoorkeuren</p>
        </div>

        {/* Appearance card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Weergave</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pas het uiterlijk van het portaal aan</p>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  darkMode ? 'bg-slate-700 text-violet-400' : 'bg-amber-50 text-amber-500'
                }`}>
                  {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {darkMode ? 'Donkere modus' : 'Lichte modus'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {darkMode ? 'Schakel over naar lichte weergave' : 'Schakel over naar donkere weergave'}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={toggleDarkMode}
                aria-label="Thema wisselen"
                className={`relative w-12 h-6 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                  darkMode ? 'bg-violet-600' : 'bg-slate-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  darkMode ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
