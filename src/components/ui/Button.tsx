import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-violet-600 hover:bg-violet-700 text-white',
        variant === 'secondary' && [
          'bg-slate-100 hover:bg-slate-200 text-slate-700',
          'dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200',
        ],
        variant === 'ghost' && 'hover:bg-white/10 text-current',
        variant === 'danger' && 'bg-red-600 hover:bg-red-700 text-white',
        size === 'sm' && 'text-xs px-3 py-1.5',
        size === 'md' && 'text-sm px-4 py-2',
        size === 'lg' && 'text-base px-5 py-2.5',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
