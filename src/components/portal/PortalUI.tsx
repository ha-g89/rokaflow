import { Layers } from 'lucide-react'

export function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {label}
    </p>
  )
}

export function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}

export function Avatar({ first, last, size = 32 }: { first: string; last: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {(first[0] ?? '').toUpperCase()}{(last[0] ?? '').toUpperCase()}
    </div>
  )
}

export function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Layers size={28} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-xs text-slate-400 mt-1">Komt binnenkort beschikbaar</p>
      </div>
    </div>
  )
}

export function StatCard({ label, value, icon, tone = 'default' }: {
  label: string; value: number; icon: React.ReactNode; tone?: string
}) {
  const iconTones: Record<string, string> = {
    default: 'bg-slate-100 text-slate-500',
    emerald: 'bg-emerald-100 text-emerald-600',
    blue:    'bg-blue-100 text-blue-600',
    amber:   'bg-amber-100 text-amber-600',
    slate:   'bg-slate-100 text-slate-400',
  }
  return (
    <div className="bg-white rounded-2xl px-5 py-4 border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconTones[tone] ?? iconTones.default}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
