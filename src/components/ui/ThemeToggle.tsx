import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

interface ThemeToggleProps {
  className?: string
  size?: number
}

export function ThemeToggle({ className, size = 15 }: ThemeToggleProps) {
  const { darkMode, toggleDarkMode } = useThemeStore()

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className={className}
      aria-label={darkMode ? 'Lichte modus' : 'Donkere modus'}
      title={darkMode ? 'Lichte modus' : 'Donkere modus'}
    >
      {darkMode ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  )
}
