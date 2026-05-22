import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  )
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn('p-5', className)}>{children}</div>
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn('px-5 py-4 border-b border-slate-100 flex items-center justify-between', className)}>{children}</div>
}
