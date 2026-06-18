// Herbruikbare laad-animaties

export function LoadingSpinner({
  size = 'md',
  className,
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const cls =
    size === 'xs' ? 'w-3 h-3 border-[1.5px]' :
    size === 'sm' ? 'w-4 h-4 border-2' :
    size === 'lg' ? 'w-8 h-8 border-[3px]' :
                    'w-6 h-6 border-2'
  return (
    <div
      className={`${cls} rounded-full border-slate-200 border-t-blue-500 animate-spin flex-shrink-0 ${className ?? ''}`}
    />
  )
}

export function LoadingState({
  label = 'Laden…',
  size = 'md',
  className,
}: {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const spinnerSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'
  const py = size === 'sm' ? 'py-6' : 'py-12'
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${py} ${className ?? ''}`}>
      <LoadingSpinner size={spinnerSize} />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  )
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0" />
      <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-full bg-slate-100"
            style={{ width: `${60 + (i % 3) * 15}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-100 p-4 space-y-2 animate-pulse">
      <div className="h-3.5 w-2/3 rounded-full bg-slate-100" />
      <div className="h-2.5 w-1/2 rounded-full bg-slate-100" />
    </div>
  )
}
