import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/Card'
import type { NotificationDto, NotificationPriority } from '@/types/notification'
import type { SwitchToClientResponse } from '@/types/auth'

const PRIORITY_FILTERS: { value: NotificationPriority | 'all'; label: string }[] = [
  { value: 'all',    label: 'Alles' },
  { value: 'High',   label: 'Hoog' },
  { value: 'Medium', label: 'Middel' },
  { value: 'Low',    label: 'Laag' },
]

const PRIORITY_ICON: Record<NotificationPriority, React.ReactNode> = {
  High:   <AlertCircle size={14} className="text-red-500" />,
  Medium: <AlertTriangle size={14} className="text-amber-500" />,
  Low:    <Info size={14} className="text-slate-400" />,
}

export function NotificationCenterView() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<NotificationPriority | 'all'>('all')
  const [openingId, setOpeningId] = useState<string | null>(null)
  const navigate = useNavigate()
  const { switchToClient } = useAuthStore()

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<NotificationDto[]>('/msp/notifications')
      setNotifications(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifications() }, [])

  const counts: Record<NotificationPriority | 'all', number> = {
    all:    notifications.length,
    High:   notifications.filter(n => n.priority === 'High').length,
    Medium: notifications.filter(n => n.priority === 'Medium').length,
    Low:    notifications.filter(n => n.priority === 'Low').length,
  }

  const visible = activeFilter === 'all' ? notifications : notifications.filter(n => n.priority === activeFilter)

  const handleOpen = async (n: NotificationDto) => {
    setOpeningId(n.id)
    try {
      await api.put(`/msp/notifications/${n.id}/read`)
      const { data } = await api.post<SwitchToClientResponse>(`/clients/${n.tenantId}/switch`)
      switchToClient(data.switchToken)
      navigate(`/client?openEntity=${n.entityType}:${n.entityId}`)
    } catch {
      // afgehandeld door globale interceptor
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center gap-1.5 flex-wrap">
        {PRIORITY_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeFilter === f.value
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {f.label}
            {counts[f.value] > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeFilter === f.value
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-400 text-center py-10">Laden…</p>}
      {!loading && visible.length === 0 && <p className="text-sm text-slate-400 text-center py-10">Geen meldingen.</p>}

      {!loading && visible.length > 0 && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[24px_1fr_1fr_100px] gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            {['', 'Melding', 'Klant', 'Datum'].map(h => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {visible.map(n => (
              <button
                key={n.id}
                onClick={() => handleOpen(n)}
                disabled={openingId === n.id}
                className={`w-full grid grid-cols-[24px_1fr_1fr_100px] gap-3 px-4 py-3 items-center text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 disabled:opacity-50 ${
                  !n.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                }`}
              >
                <span>{PRIORITY_ICON[n.priority]}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{n.title}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{n.message}</span>
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{n.tenantName}</span>
                <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString('nl-NL')}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
