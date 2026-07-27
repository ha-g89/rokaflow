import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import api from '@/lib/axios'
import { LoadingState } from '@/components/ui/LoadingState'
import type { LogFileInfo, LogContentDto } from '@/types/logs'

const POLL_INTERVAL_MS = 4000
const PAGE_SIZE = 500

function todayIso(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function lineClass(line: string): string {
  if (line.includes('[ERR]') || line.includes('[FTL]')) return 'text-red-400'
  if (line.includes('[WRN]')) return 'text-amber-400'
  return 'text-slate-300'
}

export function LogsView() {
  const [dates, setDates] = useState<LogFileInfo[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [lines, setLines] = useState<string[]>([])
  const [totalLines, setTotalLines] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [datesError, setDatesError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const selectedDateRef = useRef(selectedDate)
  useEffect(() => { selectedDateRef.current = selectedDate }, [selectedDate])

  useEffect(() => {
    api.get<LogFileInfo[]>('/logs/dates')
      .then(r => {
        setDates(r.data)
        if (r.data.length > 0) setSelectedDate(r.data[0].date)
        else setLoading(false)
      })
      .catch(() => {
        setDatesError('Kon logbestanden niet laden.')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    const dateForThisFetch = selectedDate
    setLoading(true)
    api.get<LogContentDto>(`/logs/${selectedDate}`, { params: { skip: 0, take: PAGE_SIZE } })
      .then(r => {
        if (selectedDateRef.current !== dateForThisFetch) return
        setLines(r.data.lines)
        setTotalLines(r.data.totalLines)
      })
      .finally(() => {
        if (selectedDateRef.current !== dateForThisFetch) return
        setLoading(false)
        requestAnimationFrame(() => {
          if (panelRef.current) panelRef.current.scrollTop = panelRef.current.scrollHeight
        })
      })
  }, [selectedDate])

  useEffect(() => {
    if (!selectedDate || selectedDate !== todayIso()) return
    const dateForThisPoll = selectedDate

    const interval = setInterval(() => {
      const el = panelRef.current
      const wasAtBottom = !el || (el.scrollHeight - el.scrollTop - el.clientHeight < 40)

      api.get<LogContentDto>(`/logs/${dateForThisPoll}`, { params: { skip: 0, take: PAGE_SIZE } })
        .then(r => {
          if (selectedDateRef.current !== dateForThisPoll) return
          setLines(r.data.lines)
          setTotalLines(r.data.totalLines)
          if (wasAtBottom) {
            requestAnimationFrame(() => {
              if (panelRef.current) panelRef.current.scrollTop = panelRef.current.scrollHeight
            })
          }
        })
        .catch(() => {})
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [selectedDate])

  const handleLoadMore = async () => {
    if (!selectedDate) return
    const dateForThisFetch = selectedDate
    setLoadingMore(true)
    try {
      const { data } = await api.get<LogContentDto>(`/logs/${selectedDate}`, {
        params: { skip: lines.length, take: PAGE_SIZE },
      })
      if (selectedDateRef.current !== dateForThisFetch) return
      const el = panelRef.current
      const prevScrollHeight = el?.scrollHeight ?? 0
      const prevScrollTop = el?.scrollTop ?? 0
      setLines(prev => [...data.lines, ...prev])
      requestAnimationFrame(() => {
        if (el) el.scrollTop = prevScrollTop + (el.scrollHeight - prevScrollHeight)
      })
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-6 min-h-0">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Serverlogs</h2>
          <p className="text-xs text-slate-400 mt-0.5">rokaflow-*.log — 30 dagen bewaard.</p>
        </div>
        <select
          value={selectedDate ?? ''}
          onChange={e => setSelectedDate(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
        >
          {dates.map(d => (
            <option key={d.date} value={d.date}>
              {d.date}{d.date === todayIso() ? ' (vandaag)' : ''} — {fmtSize(d.sizeBytes)}
            </option>
          ))}
        </select>
      </div>

      {datesError && (
        <p className="text-sm text-red-500 py-4">{datesError}</p>
      )}

      {loading && lines.length === 0 ? (
        <LoadingState label="Log laden…" />
      ) : dates.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">Geen logbestanden gevonden.</p>
      ) : (
        <div
          ref={panelRef}
          tabIndex={0}
          aria-label="Serverlog inhoud"
          className="flex-1 min-h-0 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs leading-relaxed"
        >
          {lines.length < totalLines && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full text-center text-slate-500 hover:text-slate-300 py-2 mb-2 border-b border-slate-800 disabled:opacity-50"
            >
              {loadingMore ? 'Laden…' : `↑ Meer laden (${totalLines - lines.length} regels ouder)`}
            </button>
          )}
          {lines.map((line, i) => (
            <div key={i} className={`whitespace-pre-wrap break-all ${lineClass(line)}`}>
              {line}
            </div>
          ))}
        </div>
      )}

      {selectedDate === todayIso() && (
        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 flex-shrink-0">
          <RefreshCw size={11} /> Ververst automatisch elke {POLL_INTERVAL_MS / 1000} seconden
        </p>
      )}
    </div>
  )
}
