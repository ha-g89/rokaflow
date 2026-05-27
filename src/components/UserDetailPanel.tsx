import {
  Laptop, KeyRound, History, CheckCircle2, AlertTriangle,
  PackageCheck, LogOut, ShieldCheck, ClipboardList, Mail,
  Briefcase, Phone, Calendar, User,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import type { ClientUserDetailResponse, UserStatus } from '@/types/clientUser'
import { STATUS_LABEL, STATUS_TONE } from '@/types/clientUser'
import { HARDWARE_STATUS_LABEL, HARDWARE_STATUS_TONE, HARDWARE_TYPE_LABEL } from '@/types/hardware'
import { LICENSE_TYPE_LABEL, LICENSE_TYPE_TONE } from '@/types/license'
import api from '@/lib/axios'

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div
        className="h-2 rounded-full bg-slate-900 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700',
    good: 'bg-emerald-100 text-emerald-700',
    warn: 'bg-amber-100 text-amber-800',
    bad: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone] ?? tones.default}`}>
      {children}
    </span>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
          {icon}
          {title}
        </h3>
        {children}
      </CardContent>
    </Card>
  )
}

// ── main component ────────────────────────────────────────────────────────────

interface Props {
  user: ClientUserDetailResponse
  canEdit: boolean
  /** base path for checklist toggle API calls, e.g. "/clients/{id}/users/{uid}" */
  checklistBasePath: string
  onChecklistToggle?: (entryId: string, checked: boolean) => void
}

export function UserDetailPanel({ user, canEdit, checklistBasePath, onChecklistToggle }: Props) {
  const status = user.status as UserStatus
  const statusTone =
    status === 'InService' ? 'good' : status === 'LeavePlanned' ? 'warn' : 'bad'

  const handleToggle = async (entryId: string, checked: boolean) => {
    if (!canEdit) return
    try {
      await api.put(`${checklistBasePath}/checklist/${entryId}`, { isChecked: checked })
      onChecklistToggle?.(entryId, checked)
    } catch {
      // silently ignore — optimistic update handled by parent
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Profile header ── */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  {user.firstName} {user.lastName}
                </h2>
                <Badge tone={statusTone}>{STATUS_LABEL[status]}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                {user.email && (
                  <span className="flex items-center gap-1"><Mail size={13} />{user.email}</span>
                )}
                {user.department && (
                  <span className="flex items-center gap-1"><Briefcase size={13} />{user.department}</span>
                )}
                {user.jobTitle && (
                  <span className="flex items-center gap-1"><User size={13} />{user.jobTitle}</span>
                )}
                {user.startDate && (
                  <span className="flex items-center gap-1"><Calendar size={13} />Gestart {fmt(user.startDate)}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                <PackageCheck size={13} />
                Aantreden
              </button>
              {(status === 'LeavePlanned' || status === 'Left') && (
                <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                  <LogOut size={13} />
                  Weggaan
                </button>
              )}
            </div>
          </div>

          {/* Completeness */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-slate-500">Dossier volledigheid</span>
              <span className="text-xs font-semibold text-slate-700">{user.completeness}%</span>
            </div>
            <Progress value={user.completeness} />
          </div>

          {/* Info grid */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Licentie</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 truncate">
                {user.software.find(s => s.isActive)?.name || '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Device</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 truncate">
                {user.hardware[0]?.name || '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Telefoon</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 truncate">
                {user.phone || '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Hardware + Software ── */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Hardware" icon={<Laptop size={16} />}>
          {user.hardware.length === 0 ? (
            <p className="text-sm text-slate-400">Geen hardware toegewezen.</p>
          ) : (
            <div className="space-y-3">
              {user.hardware.map(h => (
                <div key={h.id} className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{h.name}</p>
                      <p className="text-xs text-slate-500">
                        {h.brand && `${h.brand} • `}{HARDWARE_TYPE_LABEL[h.type] ?? h.type}
                        {h.assetNumber && ` • ${h.assetNumber}`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HARDWARE_STATUS_TONE[h.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {HARDWARE_STATUS_LABEL[h.status] ?? h.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    {h.serialNumber && <p><span className="text-slate-400">Serienr:</span><br />{h.serialNumber}</p>}
                    {h.location && <p><span className="text-slate-400">Locatie:</span><br />{h.location}</p>}
                    {h.issuedAt && <p><span className="text-slate-400">Uitgifte:</span><br />{fmt(h.issuedAt)}</p>}
                    {h.purchaseValue != null && (
                      <p><span className="text-slate-400">Waarde:</span><br />€ {h.purchaseValue.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Software & toegang" icon={<ShieldCheck size={16} />}>
          {user.software.length === 0 ? (
            <p className="text-sm text-slate-400">Geen software gekoppeld.</p>
          ) : (
            <div className="space-y-3">
              {user.software.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.account} • vanaf {fmt(s.issuedAt)}</p>
                  </div>
                  <Badge tone={s.isActive ? 'good' : 'bad'}>{s.isActive ? 'Actief' : 'Inactief'}</Badge>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* ── Licenses ── */}
      <Section title="Licenties" icon={<KeyRound size={16} />}>
        {user.licenses.length === 0 ? (
          <p className="text-sm text-slate-400">Geen licenties gekoppeld.</p>
        ) : (
          <div className="space-y-2">
            {user.licenses.map(l => (
              <div key={l.userLicenseId} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{l.name}</p>
                  <p className="text-xs text-slate-500">{l.vendor || '—'} • Toegewezen {fmt(l.assignedAt)}</p>
                </div>
                <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${LICENSE_TYPE_TONE[l.type] ?? 'bg-slate-100 text-slate-600'}`}>
                  {LICENSE_TYPE_LABEL[l.type] ?? l.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Checklists ── */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ChecklistCard
          title="Checklist aantreden"
          icon={<ClipboardList size={16} />}
          entries={user.starterChecklist}
          canEdit={canEdit}
          onToggle={handleToggle}
        />
        {(status === 'LeavePlanned' || status === 'Left') && (
          <ChecklistCard
            title="Checklist weggaan"
            icon={<LogOut size={16} />}
            entries={user.leaverChecklist}
            canEdit={canEdit}
            onToggle={handleToggle}
          />
        )}
      </div>

      {/* ── History ── */}
      <Section title="Historie" icon={<History size={16} />}>
        {user.history.length === 0 ? (
          <p className="text-sm text-slate-400">Nog geen activiteiten.</p>
        ) : (
          <div className="space-y-3">
            {user.history.map(a => (
              <div key={a.id} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm border border-slate-50">
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-slate-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{a.description}</p>
                  <p className="text-xs text-slate-400">
                    {fmt(a.occurredAt)} • verwerkt door {a.processedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

// ── Checklist sub-component ───────────────────────────────────────────────────

function ChecklistCard({
  title, icon, entries, canEdit, onToggle,
}: {
  title: string
  icon: React.ReactNode
  entries: ClientUserDetailResponse['starterChecklist']
  canEdit: boolean
  onToggle: (id: string, checked: boolean) => void
}) {
  const checked = entries.filter(e => e.isChecked).length

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            {icon}
            {title}
          </h3>
          <span className="text-xs text-slate-400">{checked}/{entries.length}</span>
        </div>
        <div className="mb-3">
          <Progress value={entries.length ? Math.round((checked / entries.length) * 100) : 0} />
        </div>
        <div className="grid gap-1.5">
          {entries.map(e => (
            <label
              key={e.id}
              className={`flex items-center gap-3 rounded-xl p-3 text-sm cursor-${canEdit ? 'pointer' : 'default'} transition-colors ${
                e.isChecked ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={e.isChecked}
                disabled={!canEdit}
                onChange={ev => onToggle(e.id, ev.target.checked)}
                className="accent-slate-900 w-4 h-4 flex-shrink-0"
              />
              <span className={e.isChecked ? 'line-through opacity-60' : ''}>{e.item}</span>
              {e.isChecked && <CheckCircle2 size={14} className="ml-auto text-emerald-500 flex-shrink-0" />}
              {!e.isChecked && <AlertTriangle size={14} className="ml-auto text-slate-300 flex-shrink-0" />}
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
