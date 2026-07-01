import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import api from '@/lib/axios'
import type { UnreadCountDto } from '@/types/notification'

interface NotificationBellProps {
  countEndpoint: string
  /** Als meegegeven: wordt eenmalig bij mount aangeroepen (vóór de eerste telling), niet bij elke poll. */
  checkEndpoint?: string
  onClick: () => void
}

export function NotificationBell({ countEndpoint, checkEndpoint, onClick }: NotificationBellProps) {
  const [unread, setUnread] = useState(0)
  // Voorkomt dat de check-aanroep dubbel vuurt onder React StrictMode (dat elke effect in
  // development 2x uitvoert) — de ref overleeft die dubbele mount/cleanup-cyclus.
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    const fetchCount = async () => {
      try {
        const { data } = await api.get<UnreadCountDto>(countEndpoint)
        if (!cancelled) setUnread(data.unread)
      } catch {
        // stil falen, volgende poll probeert opnieuw
      }
    }
    const init = async () => {
      if (checkEndpoint && !hasCheckedRef.current) {
        hasCheckedRef.current = true
        try {
          await api.post(checkEndpoint)
        } catch {
          // niet kritiek — de telling hieronder gebeurt sowieso
        }
      }
      await fetchCount()
    }
    init()
    const timer = setInterval(fetchCount, 60000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [countEndpoint, checkEndpoint])

  return (
    <button
      onClick={onClick}
      title="Notificaties"
      className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      <Bell size={16} className="text-slate-500 dark:text-slate-400" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  )
}
