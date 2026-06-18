import { useState, useCallback, useEffect } from 'react'
import { Users, Laptop, CreditCard, Phone as PhoneIcon, Shield, Activity, History, Wifi, Search } from 'lucide-react'
import api from '@/lib/axios'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { StatCard } from '@/components/portal/PortalUI'
import type { TenantHistoryItem, HistoryCategory } from '@/types/tenantHistory'

const ENTITY_ICON: Record<string, React.ReactNode> = {
  User:          <Users size={14} />,
  HardwareAsset: <Laptop size={14} />,
  Software:      <Shield size={14} />,
  License:       <CreditCard size={14} />,
  Phone:         <PhoneIcon size={14} />,
  SimCard:       <Wifi size={14} />,
  Subscription:  <Activity size={14} />,
}

function getActionStyle(action: string): string {
  if (action === 'Created' || action.endsWith('Assigned'))
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (action === 'Deleted' || action.endsWith('Revoked') || action.endsWith('Returned'))
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
}

function groupByDate(items: TenantHistoryItem[]): { label: string; items: TenantHistoryItem[] }[] {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today.getTime() - 86400000)
  const map = new Map<string, TenantHistoryItem[]>()
  for (const item of items) {
    const d = new Date(item.occurredAt); d.setHours(0, 0, 0, 0)
    let label: string
    if (d.getTime() === today.getTime())         label = 'Vandaag'
    else if (d.getTime() === yesterday.getTime()) label = 'Gisteren'
    else label = new Date(item.occurredAt).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(item)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

const HISTORY_PAGE_SIZE = 50

const CHIPS: { key: HistoryCategory; label: string }[] = [
  { key: null,        label: 'Alles' },
  { key: 'employees', label: 'Medewerkers' },
  { key: 'hardware',  label: 'Hardware' },
  { key: 'software',  label: 'Software' },
  { key: 'licenses',  label: 'Licenties' },
  { key: 'phones',    label: 'Telefonie' },
]

export function HistoryView() {
  const [items, setItems]             = useState<TenantHistoryItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage]               = useState(1)
  const [hasMore, setHasMore]         = useState(true)
  const [category, setCategory]       = useState<HistoryCategory>(null)
  const [search, setSearch]           = useState('')

  const load = useCallback(async (p: number, cat: HistoryCategory, replace: boolean) => {
    if (replace) setLoading(true)
    else setLoadingMore(true)
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(HISTORY_PAGE_SIZE) })
      if (cat) params.set('category', cat)
      const { data } = await api.get<TenantHistoryItem[]>(`/portal/history/tenant?${params}`)
      setItems(prev => replace ? data : [...prev, ...data])
      setHasMore(data.length === HISTORY_PAGE_SIZE)
      setPage(p)
    } catch { /* silent */ }
    finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { load(1, category, true) }, [category, load])

  const filtered = search
    ? items.filter(i => `${i.summary} ${i.performedBy ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    : items

  const grouped      = groupByDate(filtered)
  const uniqueActors = new Set(items.map(i => i.performedBy).filter(Boolean)).size
  const todayCount   = items.filter(i => {
    const d = new Date(i.occurredAt); d.setHours(0, 0, 0, 0)
    const t = new Date(); t.setHours(0, 0, 0, 0)
    return d.getTime() === t.getTime()
  }).length

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <StatCard label="Geladen"     value={items.length}  icon={<History size={18} />} />
        <StatCard label="Uitvoerders" value={uniqueActors}  icon={<Users size={18} />}    tone="blue" />
        <StatCard label="Vandaag"     value={todayCount}    icon={<Activity size={18} />} tone="emerald" />
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {CHIPS.map(chip => (
            <button
              key={String(chip.key)}
              onClick={() => setCategory(chip.key)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                category === chip.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek activiteit…"
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <LoadingState />
        ) : grouped.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <History size={28} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">Geen activiteiten gevonden.</p>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {grouped.map(group => (
              <div key={group.label}>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
                  {group.label}
                </p>
                <Card className="overflow-hidden">
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                    {group.items.map(item => (
                      <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                        <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${getActionStyle(item.action)}`}>
                          {ENTITY_ICON[item.entityType] ?? <Activity size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                            {item.summary}
                          </p>
                          {item.performedBy && (
                            <p className="text-xs text-slate-400 mt-0.5">door {item.performedBy}</p>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 flex-shrink-0 mt-0.5 tabular-nums">
                          {new Date(item.occurredAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            ))}

            {hasMore && !search && (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" size="sm" onClick={() => load(page + 1, category, false)} disabled={loadingMore}>
                  {loadingMore ? 'Laden…' : 'Meer laden'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
