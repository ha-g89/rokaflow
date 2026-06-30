import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import api from '@/lib/axios'
import type { NotificationDto, NotificationPriority } from '@/types/notification'

const PRIORITY_ICON: Record<NotificationPriority, React.ReactNode> = {
  High:   <AlertCircle size={14} className="text-red-500 flex-shrink-0" />,
  Medium: <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />,
  Low:    <Info size={14} className="text-slate-400 flex-shrink-0" />,
}

interface NotificationDropdownProps {
  listEndpoint: string
  readAllEndpoint: string
  onItemClick: (notification: NotificationDto) => void
}

export function NotificationDropdown({ listEndpoint, readAllEndpoint, onItemClick }: NotificationDropdownProps) {
  const [items, setItems] = useState<NotificationDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get<NotificationDto[]>(listEndpoint)
      .then(({ data }) => { if (!cancelled) setItems(data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [listEndpoint])

  const handleMarkAllRead = async () => {
    await api.put(readAllEndpoint)
    setItems(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-96 max-h-[28rem] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notificaties</span>
        <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">Alles gelezen</button>
      </div>
      {loading && <p className="px-4 py-6 text-sm text-slate-400 text-center">Laden…</p>}
      {!loading && items.length === 0 && <p className="px-4 py-6 text-sm text-slate-400 text-center">Geen meldingen.</p>}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map(n => (
          <button
            key={n.id}
            onClick={() => onItemClick(n)}
            className={`w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${!n.isRead ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
          >
            <span className="mt-0.5">{PRIORITY_ICON[n.priority]}</span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{n.title}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{n.message}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
