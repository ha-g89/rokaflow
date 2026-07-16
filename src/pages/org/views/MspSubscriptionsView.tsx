import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard, CheckCircle2, AlertTriangle, Zap, Lock, CircleSlash,
  Pencil, X, Save, Loader2, RefreshCw,
} from 'lucide-react'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import type { TenantPlanDto, PlatformPlanDto, TenantPlanStatus } from '@/types/platformPlan'
import { BillingInterval } from '@/types/billing'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Datum-only strings ("2026-07-01" of "...T00:00:00") component-gebaseerd parsen:
// `new Date('YYYY-MM-DD')` interpreteert als UTC-middernacht, waardoor de weergave
// op machines met negatieve UTC-offset een dag verschuift.
function parseDateOnly(iso: string) {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmtDateOnly(iso: string) {
  return parseDateOnly(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
    None:        { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', icon: <CircleSlash size={11} />,   label: 'Geen abonnement' },
  }
  const { cls, icon, label } = map[status] ?? map.Blocked
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {icon}{label}
    </span>
  )
}

function IntervalDisplay({ interval, yearAnchorDate }: { interval: BillingInterval; yearAnchorDate: string | null }) {
  if (interval === BillingInterval.Yearly) {
    return (
      <div>
        <span className="text-xs text-slate-600 dark:text-slate-300">Jaarcontract</span>
        {yearAnchorDate && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500">contract loopt vanaf {fmtDateOnly(yearAnchorDate)}</p>
        )}
      </div>
    )
  }
  return <span className="text-xs text-slate-600 dark:text-slate-300">Maandelijks</span>
}

// ── edit row ─────────────────────────────────────────────────────────────────

interface EditRowProps {
  row: TenantPlanDto
  plans: PlatformPlanDto[]
  onSave: (updated: TenantPlanDto) => void
  onCancel: () => void
}

// 'None' is niet opneembaar in het edit-formulier — die status bestaat alleen
// zolang er geen plan gekoppeld is, en wordt door de backend niet geparsed als
// geldige input. Zodra een plan gekoppeld wordt, moet een echte status gekozen zijn.
const STATUSES: TenantPlanStatus[] = ['Trial', 'GracePeriod', 'Active', 'Blocked']
const STATUS_LABELS: Record<TenantPlanStatus, string> = {
  Trial: 'Trial', GracePeriod: 'Grace period', Active: 'Actief', Blocked: 'Geblokkeerd', None: 'Geen abonnement',
}

const INTERVAL_OPTIONS: { value: BillingInterval; label: string }[] = [
  { value: BillingInterval.Monthly, label: 'Maandelijks' },
  { value: BillingInterval.Yearly, label: 'Jaarcontract — maandelijks gefactureerd (met jaarkorting)' },
]

// Backend UpdateMspClientPlanCommand.Interval verwacht een string ("Monthly" |
// "Yearly", case-insensitief geparsed), terwijl de rest van de app het interval
// als getal (BillingInterval.Monthly = 0 / Yearly = 1) representeert.
const INTERVAL_WIRE: Record<BillingInterval, 'Monthly' | 'Yearly'> = {
  [BillingInterval.Monthly]: 'Monthly',
  [BillingInterval.Yearly]: 'Yearly',
}

function toDateInput(iso: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function EditRow({ row, plans, onSave, onCancel }: EditRowProps) {
  const isUnassigned = row.status === 'None'
  const [planId,      setPlanId]      = useState<string>(row.planId ?? '')
  // 'None' is geen keuzeoptie in het formulier (de backend accepteert die status
  // niet als input) — bij een nog-niet-gekoppelde omgeving starten we daarom op
  // Actief, zodat "Opslaan" altijd een geldige status verstuurt.
  const [status,      setStatus]      = useState<TenantPlanStatus>(isUnassigned ? 'Active' : row.status)
  const [interval,    setInterval_]   = useState<BillingInterval>(row.interval)
  const [trialEndsAt, setTrialEndsAt] = useState(toDateInput(row.trialEndsAt))
  const [graceEndsAt, setGraceEndsAt] = useState(toDateInput(row.graceEndsAt))
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const sel = 'text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 px-2 py-1.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25'
  const inp = `${sel} w-32`

  const showActivateNotice = status === 'Active' && !!planId

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      const { data } = await api.put<TenantPlanDto>(`/msp/subscriptions/${row.tenantId}`, {
        planId: planId || null,
        status,
        interval: INTERVAL_WIRE[interval],
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
        graceEndsAt: graceEndsAt ? new Date(graceEndsAt).toISOString() : null,
      })
      onSave(data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Opslaan mislukt.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="bg-blue-50 dark:bg-blue-950/20">
      <td className="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap align-top">
        {row.tenantName}
      </td>
      <td className="px-4 py-2 align-top">
        <select value={planId} onChange={e => setPlanId(e.target.value)} className={sel}>
          <option value="">— Geen plan —</option>
          {plans.filter(p => p.isActive).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {isUnassigned && (
          <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 max-w-[10rem]">
            Koppel een abonnement; de omgeving is tot die tijd alleen-lezen.
          </p>
        )}
      </td>
      <td className="px-4 py-2 align-top">
        <select value={status} onChange={e => setStatus(e.target.value as TenantPlanStatus)} className={sel}>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </td>
      <td className="px-4 py-2 align-top">
        <select value={interval} onChange={e => setInterval_(Number(e.target.value) as BillingInterval)} className={sel}>
          {INTERVAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {interval === BillingInterval.Yearly && row.yearAnchorDate && (
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">contract loopt vanaf {fmtDateOnly(row.yearAnchorDate)}</p>
        )}
      </td>
      <td className="px-4 py-2 align-top">
        <input type="date" value={trialEndsAt} onChange={e => setTrialEndsAt(e.target.value)} className={inp} />
      </td>
      <td className="px-4 py-2 align-top">
        <input type="date" value={graceEndsAt} onChange={e => setGraceEndsAt(e.target.value)} className={inp} />
      </td>
      <td className="px-4 py-2 align-top">
        {showActivateNotice && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1.5">Vanaf vandaag factureerbaar.</p>
        )}
        {error && <p className="text-xs text-red-600 dark:text-red-400 mb-1.5">{error}</p>}
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
      <div className="grid grid-cols-5 gap-3">
        {(['Trial', 'GracePeriod', 'Active', 'Blocked', 'None'] as TenantPlanStatus[]).map(s => (
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
                    <th className="px-4 py-2.5 text-left font-semibold">Frequentie</th>
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
                          {row.planName ?? <span className="text-slate-400">—</span>}
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
                        <td className="px-4 py-3">
                          <IntervalDisplay interval={row.interval} yearAnchorDate={row.yearAnchorDate} />
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
