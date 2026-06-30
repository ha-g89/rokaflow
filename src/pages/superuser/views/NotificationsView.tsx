import { useEffect, useState } from 'react'
import { Check, X, Edit2 } from 'lucide-react'
import api from '@/lib/axios'
import type { NotificationTypeDto, NotificationRunLogDto, NotificationPriority } from '@/types/notification'

const PRIORITY_OPTIONS: NotificationPriority[] = ['Low', 'Medium', 'High']

// Dit project gebruikt geen JsonStringEnumConverter — PUT/POST-bodies verwachten enums als
// integers (zie feedback-backend-patterns), ook al geven GET-responses ze als string terug.
const PRIORITY_TO_INT: Record<NotificationPriority, number> = { Low: 0, Medium: 1, High: 2 }

function TypeRow({ item, onSaved }: { item: NotificationTypeDto; onSaved: (t: NotificationTypeDto) => void }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ isEnabled: item.isEnabled, priority: item.priority })

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/platform/notification-types/${item.type}`, {
        isEnabled: form.isEnabled,
        priority: PRIORITY_TO_INT[form.priority],
      })
      onSaved({ ...item, isEnabled: form.isEnabled, priority: form.priority })
      setEditing(false)
    } catch {
      // afgehandeld door globale interceptor
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.displayName}</td>
        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.description}</td>
        <td className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">{item.priority}</td>
        <td className="px-4 py-3 text-center">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.isEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            {item.isEnabled ? 'Actief' : 'Uit'}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <Edit2 size={13} />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 bg-blue-50/40 dark:bg-blue-900/10">
      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.displayName}</td>
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.description}</td>
      <td className="px-4 py-2 text-center">
        <select
          value={form.priority}
          onChange={e => setForm(p => ({ ...p, priority: e.target.value as NotificationPriority }))}
          className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </td>
      <td className="px-4 py-2 text-center">
        <button onClick={() => setForm(p => ({ ...p, isEnabled: !p.isEnabled }))}
          className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${form.isEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
          {form.isEnabled ? 'Actief' : 'Uit'}
        </button>
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50">
            <Check size={13} />
          </button>
          <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export function NotificationsView() {
  const [types, setTypes] = useState<NotificationTypeDto[]>([])
  const [lastRun, setLastRun] = useState<NotificationRunLogDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [typesRes, lastRunRes] = await Promise.all([
        api.get<NotificationTypeDto[]>('/platform/notification-types'),
        api.get<NotificationRunLogDto | null>('/platform/notification-types/last-run'),
      ])
      setTypes(typesRes.data)
      setLastRun(lastRunRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleRunNow = async () => {
    setRunning(true)
    try {
      await api.post('/platform/notification-types/run-check')
      await fetchAll()
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <p className="p-6 text-sm text-slate-400">Laden…</p>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {lastRun
            ? `Laatste run: ${new Date(lastRun.runAt).toLocaleString('nl-NL')} — ${lastRun.tenantsProcessed} tenants, ${lastRun.notificationsCreated} nieuwe meldingen (${lastRun.durationMs}ms)`
            : 'Nog geen run uitgevoerd.'}
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
        >
          {running ? 'Bezig…' : 'Nu uitvoeren'}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Type</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Omschrijving</th>
              <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Prioriteit</th>
              <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {types.map(t => (
              <TypeRow key={t.type} item={t} onSaved={updated => setTypes(prev => prev.map(x => x.type === updated.type ? updated : x))} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
