import { useEffect, useState } from 'react'
import { Edit2, Check, X, Users, Package, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import api from '@/lib/axios'
import type { PlatformPlanDto, TenantPlanDto, TenantPlanStatus } from '@/types/platformPlan'

const STATUS_LABELS: Record<TenantPlanStatus, { label: string; color: string }> = {
  Trial:       { label: 'Trial',       color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  GracePeriod: { label: 'Grace',       color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  Active:      { label: 'Actief',      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  Blocked:     { label: 'Geblokkeerd', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  None:        { label: 'Geen abonnement', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
}

function daysLeft(dateStr: string | null) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  return diff
}

function fmt(n: number) { return n === 0 ? '∞' : n.toString() }
function fmtRate(rate: number | null, discount: number) {
  if (!rate) return '—'
  const msp = rate * (1 - discount / 100)
  return `€${rate.toFixed(2)} / €${msp.toFixed(2)}`
}

// ── Plan edit row ─────────────────────────────────────────────────────────────

function PlanRow({ plan, onSaved }: { plan: PlatformPlanDto; onSaved: (p: PlatformPlanDto) => void }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    maxAssets:      plan.maxAssets,
    maxEmployees:   plan.maxEmployees,
    maxPortalUsers: plan.maxPortalUsers,
    directRate:     plan.directRate ?? '',
    mspDiscountPct: plan.mspDiscountPct,
    isActive:       plan.isActive,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.put<PlatformPlanDto>(`/platform-plans/${plan.id}`, {
        maxAssets:      Number(form.maxAssets),
        maxEmployees:   Number(form.maxEmployees),
        maxPortalUsers: Number(form.maxPortalUsers),
        directRate:     form.directRate === '' ? null : Number(form.directRate),
        mspDiscountPct: Number(form.mspDiscountPct),
        isActive:       form.isActive,
      })
      onSaved(data)
      setEditing(false)
    } catch { /* errors handled globally */ } finally { setSaving(false) }
  }

  const mspRate = form.directRate !== '' && form.directRate !== null
    ? (Number(form.directRate) * (1 - Number(form.mspDiscountPct) / 100)).toFixed(2)
    : null

  if (!editing) {
    return (
      <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{plan.name}</td>
        <td className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">{fmt(plan.maxAssets)}</td>
        <td className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">{fmt(plan.maxEmployees)}</td>
        <td className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">{fmt(plan.maxPortalUsers)}</td>
        <td className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">{fmtRate(plan.directRate, plan.mspDiscountPct)}</td>
        <td className="px-4 py-3 text-sm text-center text-slate-500 dark:text-slate-400">{plan.tenantCount}</td>
        <td className="px-4 py-3 text-center">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${plan.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            {plan.isActive ? 'Actief' : 'Inactief'}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <Edit2 size={13} />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 bg-blue-50/40 dark:bg-blue-900/10">
      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{plan.name}</td>
      {(['maxAssets', 'maxEmployees', 'maxPortalUsers'] as const).map(f => (
        <td key={f} className="px-4 py-2 text-center">
          <input type="number" min={0} value={form[f]}
            onChange={e => setForm(p => ({ ...p, [f]: Number(e.target.value) }))}
            className="w-20 text-center text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400" />
        </td>
      ))}
      <td className="px-4 py-2">
        <div className="flex items-center gap-1 justify-center">
          <input type="number" min={0} step={0.01} placeholder="0.00"
            value={form.directRate}
            onChange={e => setForm(p => ({ ...p, directRate: e.target.value }))}
            className="w-20 text-center text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400" />
          <span className="text-xs text-slate-400">/</span>
          <input type="number" min={0} max={100} step={1}
            value={form.mspDiscountPct}
            onChange={e => setForm(p => ({ ...p, mspDiscountPct: Number(e.target.value) }))}
            className="w-14 text-center text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400" />
          <span className="text-xs text-slate-400">%</span>
          {mspRate && <span className="text-xs text-slate-500 ml-1">→ €{mspRate}</span>}
        </div>
      </td>
      <td className="px-4 py-2 text-center text-sm text-slate-500">{plan.tenantCount}</td>
      <td className="px-4 py-2 text-center">
        <button onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
          className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${form.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
          {form.isActive ? 'Actief' : 'Inactief'}
        </button>
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={handleSave} disabled={saving}
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50">
            <Check size={13} />
          </button>
          <button onClick={() => setEditing(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Tenant plan row ───────────────────────────────────────────────────────────

function TenantRow({
  tp, plans, onSaved,
}: {
  tp: TenantPlanDto
  plans: PlatformPlanDto[]
  onSaved: (t: TenantPlanDto) => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    planId:      tp.planId ?? '',
    status:      tp.status,
    trialEndsAt: tp.trialEndsAt ? tp.trialEndsAt.split('T')[0] : '',
    graceEndsAt: tp.graceEndsAt ? tp.graceEndsAt.split('T')[0] : '',
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.put<TenantPlanDto>(`/platform-plans/tenant-plans/${tp.tenantId}`, {
        planId:      form.planId || null,
        status:      form.status,
        trialEndsAt: form.trialEndsAt ? new Date(form.trialEndsAt).toISOString() : null,
        graceEndsAt: form.graceEndsAt ? new Date(form.graceEndsAt).toISOString() : null,
      })
      onSaved(data)
      setEditing(false)
    } catch { } finally { setSaving(false) }
  }

  const s = STATUS_LABELS[tp.status]
  const trialLeft = daysLeft(tp.trialEndsAt)
  const graceLeft = daysLeft(tp.graceEndsAt)

  if (!editing) {
    return (
      <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{tp.tenantName}</td>
        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{tp.planName ?? <span className="text-slate-400">—</span>}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
        </td>
        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
          {tp.status === 'Trial' && trialLeft !== null && (
            <span className={trialLeft <= 7 ? 'text-amber-600 font-medium' : ''}>
              {trialLeft > 0 ? `${trialLeft} dag${trialLeft !== 1 ? 'en' : ''} resterend` : 'Verlopen'}
            </span>
          )}
          {tp.status === 'GracePeriod' && graceLeft !== null && (
            <span className="text-red-600 font-medium">
              {graceLeft > 0 ? `${graceLeft} dag${graceLeft !== 1 ? 'en' : ''} grace` : 'Verlopen'}
            </span>
          )}
          {tp.status === 'Active' && tp.activatedAt && (
            <span>Actief sinds {new Date(tp.activatedAt).toLocaleDateString('nl-NL')}</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <Edit2 size={13} />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 bg-blue-50/40 dark:bg-blue-900/10">
      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{tp.tenantName}</td>
      <td className="px-4 py-2">
        <select value={form.planId}
          onChange={e => setForm(p => ({ ...p, planId: e.target.value }))}
          className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 w-full">
          <option value="">— Geen plan —</option>
          {plans.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <select value={form.status}
          onChange={e => setForm(p => ({ ...p, status: e.target.value as TenantPlanStatus }))}
          className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 w-full">
          <option value="Trial">Trial</option>
          <option value="GracePeriod">Grace Period</option>
          <option value="Active">Actief</option>
          <option value="Blocked">Geblokkeerd</option>
        </select>
      </td>
      <td className="px-4 py-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="w-12">Trial:</span>
            <input type="date" value={form.trialEndsAt}
              onChange={e => setForm(p => ({ ...p, trialEndsAt: e.target.value }))}
              className="text-xs px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400" />
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="w-12">Grace:</span>
            <input type="date" value={form.graceEndsAt}
              onChange={e => setForm(p => ({ ...p, graceEndsAt: e.target.value }))}
              className="text-xs px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400" />
          </div>
        </div>
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={handleSave} disabled={saving}
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50">
            <Check size={13} />
          </button>
          <button onClick={() => setEditing(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function SubscriptionsView() {
  const [plans, setPlans]         = useState<PlatformPlanDto[]>([])
  const [tenantPlans, setTenantPlans] = useState<TenantPlanDto[]>([])
  const [loading, setLoading]     = useState(true)
  const [section, setSection]     = useState<'plans' | 'tenants'>('plans')

  const [statusFilter, setStatusFilter] = useState<TenantPlanStatus | 'all'>('all')
  const [tenantSearch, setTenantSearch] = useState('')

  useEffect(() => {
    Promise.all([
      api.get<PlatformPlanDto[]>('/platform-plans'),
      api.get<TenantPlanDto[]>('/platform-plans/tenant-plans'),
    ]).then(([p, t]) => {
      setPlans(p.data)
      setTenantPlans(t.data)
    }).finally(() => setLoading(false))
  }, [])

  const filteredTenants = tenantPlans
    .filter(tp => statusFilter === 'all' || tp.status === statusFilter)
    .filter(tp => tp.tenantName.toLowerCase().includes(tenantSearch.toLowerCase()))

  const stats = {
    trial:   tenantPlans.filter(t => t.status === 'Trial').length,
    grace:   tenantPlans.filter(t => t.status === 'GracePeriod').length,
    active:  tenantPlans.filter(t => t.status === 'Active').length,
    blocked: tenantPlans.filter(t => t.status === 'Blocked').length,
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Laden…
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Trial',         value: stats.trial,   color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20',    icon: Shield },
            { label: 'Grace period',  value: stats.grace,   color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',  icon: ChevronDown },
            { label: 'Actief',        value: stats.active,  color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: Check },
            { label: 'Geblokkeerd',   value: stats.blocked, color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20',      icon: X },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
              <s.icon size={18} className={s.color} />
              <div>
                <p className={`text-2xl font-bold leading-none ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {([['plans', 'Platform plans'], ['tenants', 'Tenant abonnementen']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setSection(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                section === key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Platform plans table */}
        {section === 'plans' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Platform plans</h2>
              <p className="text-xs text-slate-400 mt-0.5">0 = onbeperkt · Prijs: direct / MSP (berekend)</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-2 text-left font-medium">Plan</th>
                  <th className="px-4 py-2 text-center font-medium"><Package size={11} className="inline mr-1" />Assets</th>
                  <th className="px-4 py-2 text-center font-medium"><Users size={11} className="inline mr-1" />Medewerkers</th>
                  <th className="px-4 py-2 text-center font-medium"><Shield size={11} className="inline mr-1" />Portaalgebruikers</th>
                  <th className="px-4 py-2 text-center font-medium">Prijs direct / MSP%</th>
                  <th className="px-4 py-2 text-center font-medium">Tenants</th>
                  <th className="px-4 py-2 text-center font-medium">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {plans.map(plan => (
                  <PlanRow key={plan.id} plan={plan}
                    onSaved={updated => setPlans(ps => ps.map(p => p.id === updated.id ? updated : p))} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tenant plans table */}
        {section === 'tenants' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tenant abonnementen</h2>
                <p className="text-xs text-slate-400 mt-0.5">{filteredTenants.length} van {tenantPlans.length} tenants</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Zoeken…"
                  value={tenantSearch}
                  onChange={e => setTenantSearch(e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 w-48"
                />
                <select value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as TenantPlanStatus | 'all')}
                  className="text-sm px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400">
                  <option value="all">Alle statussen</option>
                  <option value="Trial">Trial</option>
                  <option value="GracePeriod">Grace Period</option>
                  <option value="Active">Actief</option>
                  <option value="Blocked">Geblokkeerd</option>
                  <option value="None">Geen abonnement</option>
                </select>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-2 text-left font-medium">Tenant</th>
                  <th className="px-4 py-2 text-left font-medium">Plan</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Info</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                      Geen tenants gevonden
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map(tp => (
                    <TenantRow key={tp.tenantId} tp={tp} plans={plans}
                      onSaved={updated => setTenantPlans(ts => ts.map(t => t.tenantId === updated.tenantId ? updated : t))} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
