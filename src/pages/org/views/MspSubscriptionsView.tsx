import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard, CheckCircle2, AlertTriangle, Zap, Lock,
  Pencil, X, Save, Loader2, RefreshCw,
} from 'lucide-react'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import type { TenantPlanDto, PlatformPlanDto, TenantPlanStatus } from '@/types/platformPlan'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function trialDays(endsAt: string | null) {
  if (!endsAt) return null
  return Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000)
}

function StatusBadge({ status }: { status: TenantPlanStatus }) {
  const map: Record<TenantPlanStatus, { cls: string; icon: React.ReactNode; label: string }> = {
    Trial:       { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',     icon: <Zap size={11} />,           label: 'Trial' },
    GracePeriod: { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: <AlertTriangle size={11} />, label: 'Grace' },
    Active:      { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: <CheckCircle2 size={11} />, label: 'Actief' },
    Blocked:     { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',         icon: <Lock size={11} />,          label: 'Geblokkeerd' },
  }
  const { cls, icon, label } = map[status] ?? map.Blocked
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {icon}{label}
    </span>
  )
}

// ── edit row ─────────────────────────────────────────────────────────────────

interface EditRowProps {
  row: TenantPlanDto
  plans: PlatformPlanDto[]
  onSave: (updated: TenantPlanDto) => void
  onCancel: () => void
}

const STATUSES: TenantPlanStatus[] = ['Trial', 'GracePeriod', 'Active', 'Blocked']
const STATUS_LABELS: Record<TenantPlanStatus, string> = {
  Trial: 'Trial', GracePeriod: 'Grace period', Active: 'Actief', Blocked: 'Geblokkeerd',
}

function toDateInput(iso: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function EditRow({ row, plans, onSave, onCancel }: EditRowProps) {
  const [planId,      setPlanId]      = useState<string>(row.planId ?? '')
  const [status,      setStatus]      = useState<TenantPlanStatus>(row.status)
  const [trialEndsAt, setTrialEndsAt] = useState(toDateInput(row.trialEndsAt))
  const [graceEndsAt, setGraceEndsAt] = useState(toDateInput(row.graceEndsAt))
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const sel = 'text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 px-2 py-1.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25'
  const inp = `${sel} w-32`

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      const { data } = await api.put<TenantPlanDto>(`/msp/subscriptions/${row.tenantId}`, {
        planId: planId || null,
        status,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
        graceEndsAt: graceEndsAt ? new Date(graceEndsAt).toISOString() : null,
      })
      onSave(data)
    } catch {
      setError('Opslaan mislukt.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="bg-blue-50 dark:bg-blue-950/20">
      <td className="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
        {row.tenantName}
      </td>
      <td className="px-4 py-2">
        <select value={planId} onChange={e => setPlanId(e.target.value)} className={sel}>
          <option value="">— Geen plan —</option>
          {plans.filter(p => p.isActive).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2">
        <select value={status} onChange={e => setStatus(e.target.value as TenantPlanStatus)} className={sel}>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <input type="date" value={trialEndsAt} onChange={e => setTrialEndsAt(e.target.value)} className={inp} />
      </td>
      <td className="px-4 py-2">
        <input type="date" value={graceEndsAt} onChange={e => setGraceEndsAt(e.target.value)} className={inp} />
      </td>
      <td className="px-4 py-2">
        {error && <span className="text-xs text-red-600 mr-2">{error}</span>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Opslaan
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── main view ─────────────────────────────────────────────────────────────────

export function MspSubscriptionsView() {
  const [subscriptions, setSubscriptions] = useState<TenantPlanDto[]>([])
  const [plans,         setPlans]         = useState<PlatformPlanDto[]>([])
  const [loading,       setLoading]       = useState(true)
  const [editingId,     setEditingId]     = useState<string | null>(null)
  const [statusFilter,  setStatusFilter]  = useState<TenantPlanStatus | 'all'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [subRes, planRes] = await Promise.all([
        api.get<TenantPlanDto[]>('/msp/subscriptions'),
        api.get<PlatformPlanDto[]>('/msp/subscriptions/plans'),
      ])
      setSubscriptions(subRes.data)
      setPlans(planRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = (updated: TenantPlanDto) => {
    setSubscriptions(prev => prev.map(s => s.tenantId === updated.tenantId ? updated : s))
    setEditingId(null)
  }

  const filtered = subscriptions.filter(s => statusFilter === 'all' || s.status === statusFilter)

  const statusCounts = subscriptions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex flex-col gap-5">

      {/* Header stats */}
      <div className="grid grid-cols-4 gap-3">
        {(['Trial', 'GracePeriod', 'Active', 'Blocked'] as TenantPlanStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(prev => prev === s ? 'all' : s)}
            className={`rounded-xl p-3 text-left border transition-all ${
              statusFilter === s
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'
            }`}
          >
            <StatusBadge status={s} />
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">{statusCounts[s] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Abonnementen
              </span>
              <span className="text-xs text-slate-400">{filtered.length}</span>
            </div>
            <button
              onClick={load}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Verversen"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <div className="py-10 flex justify-center">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">Geen abonnementen gevonden.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-4 py-2.5 text-left font-semibold">Client</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Plan</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Trial tot</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Grace tot</th>
                    <th className="px-4 py-2.5 text-left font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map(row =>
                    editingId === row.tenantId ? (
                      <EditRow
                        key={row.tenantId}
                        row={row}
                        plans={plans}
                        onSave={handleSave}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <tr key={row.tenantId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          {row.tenantName}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                          {row.planName ?? <span className="text-slate-400 italic">Geen plan</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={row.status} />
                            {row.status === 'Trial' && row.trialEndsAt && (() => {
                              const d = trialDays(row.trialEndsAt)
                              return d !== null && d <= 7
                                ? <span className="text-xs text-amber-600 font-medium">{d}d</span>
                                : null
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmt(row.trialEndsAt)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmt(row.graceEndsAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setEditingId(row.tenantId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                            title="Wijzigen"
                          >
                            <Pencil size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
