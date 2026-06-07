import { useEffect, useRef, useState } from 'react'
import {
  Laptop, KeyRound, History, CheckCircle2, AlertTriangle,
  LogOut, ShieldCheck, ClipboardList, Mail,
  Briefcase, Calendar, User, RotateCcw, Smartphone, Phone,
  Users, FileText, Pencil, X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import type { ClientUserDetailResponse, UserStatus } from '@/types/clientUser'
import { STATUS_LABEL } from '@/types/clientUser'
import { HARDWARE_STATUS_LABEL, HARDWARE_STATUS_TONE, HARDWARE_TYPE_LABEL } from '@/types/hardware'
import { LICENSE_TYPE_LABEL, LICENSE_TYPE_TONE } from '@/types/license'
import api from '@/lib/axios'

interface AuditLogEntry {
  id: string
  action: string
  changes: string | null
  userName: string | null
  createdAt: string
}

function parseChanges(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

function auditLabel(entry: AuditLogEntry): string {
  const c = parseChanges(entry.changes)
  switch (entry.action) {
    case 'Created':         return 'Medewerker aangemaakt'
    case 'Updated':         return 'Profiel bijgewerkt'
    case 'HardwareAssigned': return `Hardware toegewezen: ${c.AssetName ?? ''}${c.Brand ? ` (${c.Brand})` : ''}`
    case 'HardwareReturned': return `Hardware teruggegeven: ${c.AssetName ?? ''}`
    case 'PhoneAssigned':   return `Telefoon toegewezen: ${[c.Brand, c.Model].filter(Boolean).join(' ')}`
    case 'PhoneReturned':   return `Telefoon teruggegeven: ${[c.Brand, c.Model].filter(Boolean).join(' ')}`
    case 'LicenseAssigned': return `Licentie gekoppeld: ${c.LicenseName ?? ''}`
    case 'LicenseRevoked':  return `Licentie ingetrokken: ${c.LicenseName ?? ''}`
    case 'SoftwareAssigned': return `Software toegewezen: ${c.Name ?? ''}`
    case 'SoftwareRevoked': return `Software verwijderd: ${c.Name ?? ''}`
    default:                return entry.action
  }
}

function AuditIcon({ action }: { action: string }) {
  const cls = 'mt-0.5 flex-shrink-0'
  if (action.startsWith('Hardware')) return <Laptop size={16} className={`${cls} text-blue-500`} />
  if (action.startsWith('Phone'))    return <Smartphone size={16} className={`${cls} text-violet-500`} />
  if (action.startsWith('License'))  return <KeyRound size={16} className={`${cls} text-amber-500`} />
  if (action.startsWith('Software')) return <ShieldCheck size={16} className={`${cls} text-emerald-500`} />
  if (action === 'Created')          return <User size={16} className={`${cls} text-slate-500`} />
  return <RotateCcw size={16} className={`${cls} text-slate-400`} />
}

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
    good:    'bg-emerald-100 text-emerald-700',
    info:    'bg-blue-100 text-blue-700',
    warn:    'bg-amber-100 text-amber-800',
    bad:     'bg-red-100 text-red-700',
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone] ?? tones.default}`}>
      {children}
    </span>
  )
}

function Avatar({ first, last }: { first: string; last: string }) {
  return (
    <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl flex-shrink-0 select-none">
      {(first[0] ?? '').toUpperCase()}{(last[0] ?? '').toUpperCase()}
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: '0', label: 'In dienst' },
  { value: '1', label: 'Uit dienst gepland' },
  { value: '2', label: 'Uit dienst' },
]
const CONTRACT_OPTIONS = [
  { value: '', label: '— Geen —' },
  { value: '0', label: 'Vast' },
  { value: '1', label: 'Tijdelijk' },
  { value: '2', label: 'Stagiair' },
  { value: '3', label: 'Inhuur' },
]
const STATUS_TO_INT: Record<string, string> = { InService: '0', LeavePlanned: '1', Left: '2', StartPlanned: '0' }
const CONTRACT_TO_INT: Record<string, string> = { Vast: '0', Tijdelijk: '1', Stagiair: '2', Inhuur: '3' }

function EditUserModal({ user, departments, managers, onClose, onSaved }: {
  user: ClientUserDetailResponse
  departments: { id: string; name: string; managerId: string | null }[]
  managers: { id: string; fullName: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const toDateInput = (d: string | null | undefined) =>
    d ? new Date(d).toISOString().split('T')[0] : ''

  const [firstName, setFirstName]       = useState(user.firstName)
  const [lastName, setLastName]         = useState(user.lastName)
  const [email, setEmail]               = useState(user.email)
  const [jobTitle, setJobTitle]         = useState(user.jobTitle ?? '')
  const [departmentId, setDepartmentId] = useState(user.departmentId ?? '')
  const [managerId, setManagerId]       = useState(user.managerId ?? '')
  const [status, setStatus]             = useState(STATUS_TO_INT[user.status] ?? '0')
  const [contractType, setContractType] = useState(user.contractType ? (CONTRACT_TO_INT[user.contractType] ?? '') : '')
  const [startDate, setStartDate]       = useState(toDateInput(user.startDate))
  const [leaveDate, setLeaveDate]       = useState(toDateInput(user.leaveDate))
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const overlayRef                      = useRef<HTMLDivElement>(null)

  const handleDepartmentChange = (deptId: string) => {
    setDepartmentId(deptId)
    if (deptId) {
      const dept = departments.find(d => d.id === deptId)
      if (dept?.managerId) setManagerId(dept.managerId)
    }
  }

  const startIsPlanned = startDate ? new Date(startDate) > new Date() : false

  // derive displayed status: leaveDate takes priority, then startDate in future
  const derivedStatus = leaveDate
    ? (new Date(leaveDate) <= new Date() ? 'Uit dienst' : 'Uit dienst gepland')
    : startIsPlanned
    ? 'In dienst gepland'
    : null

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) { setError('Voor- en achternaam zijn verplicht.'); return }
    setSaving(true); setError(null)
    try {
      await api.put(`/portal/users/${user.id}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || null,
        jobTitle: jobTitle.trim() || null,
        status: parseInt(status, 10),
        contractType: contractType !== '' ? parseInt(contractType, 10) : null,
        startDate: startDate || null,
        leaveDate: leaveDate || null,
        departmentId: departmentId || null,
        managerId: managerId || null,
      })
      onSaved()
      onClose()
    } catch {
      setError('Opslaan mislukt. Controleer de gegevens en probeer opnieuw.')
    } finally {
      setSaving(false)
    }
  }

  const field = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors'

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onMouseDown={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Medewerker wijzigen</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* naam */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Voornaam *</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} className={field} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Achternaam *</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} className={field} />
            </div>
          </div>

          {/* email + functie */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">E-mailadres</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={field} placeholder="jan@bedrijf.nl" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Functie</label>
              <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className={field} placeholder="Medewerker" />
            </div>
          </div>

          {/* afdeling + manager */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Afdeling</label>
              <select value={departmentId} onChange={e => handleDepartmentChange(e.target.value)} className={field}>
                <option value="">— Geen afdeling —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Manager</label>
              <select value={managerId} onChange={e => setManagerId(e.target.value)} className={field}>
                <option value="">— Geen manager —</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
              </select>
            </div>
          </div>

          {/* contracttype */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Contracttype</label>
            <select value={contractType} onChange={e => setContractType(e.target.value)} className={field}>
              {CONTRACT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* datums */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">In dienst datum</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={field} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Uit dienst datum</label>
              <input
                type="date"
                value={leaveDate}
                onChange={e => {
                  const val = e.target.value
                  setLeaveDate(val)
                  if (!val) setStatus('0')
                }}
                className={field}
              />
            </div>
          </div>

          {/* status — auto wanneer datums een status bepalen */}
          {derivedStatus ? (
            <div className={`rounded-xl border px-4 py-3 text-xs ${
              leaveDate
                ? 'bg-amber-50 border-amber-100 text-amber-700'
                : 'bg-blue-50 border-blue-100 text-blue-700'
            }`}>
              Status wordt automatisch ingesteld op <strong>{derivedStatus}</strong> op basis van de {leaveDate ? 'uit dienst' : 'in dienst'} datum.
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={field}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Annuleren
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-60">
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
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
  departments?: { id: string; name: string; managerId?: string | null }[]
  managers?: { id: string; fullName: string }[]
  /** base path for checklist toggle API calls, e.g. "/clients/{id}/users/{uid}" */
  checklistBasePath: string
  /** path to fetch audit history, e.g. "/portal/history/ClientUser/{uid}" */
  historyPath?: string
  onChecklistToggle?: (entryId: string, checked: boolean) => void
  onUserUpdated?: () => void
}

export function UserDetailPanel({ user, canEdit, departments = [], managers = [], checklistBasePath, historyPath, onChecklistToggle, onUserUpdated }: Props) {
  const status = user.status as UserStatus
  const statusTone = status === 'InService' ? 'good' : status === 'StartPlanned' ? 'info' : status === 'LeavePlanned' ? 'warn' : 'bad'

  const [auditHistory, setAuditHistory] = useState<AuditLogEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!historyPath) return
    setHistoryLoading(true)
    api.get<AuditLogEntry[]>(historyPath)
      .then(r => setAuditHistory(r.data))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [historyPath])

  const handleToggle = async (entryId: string, checked: boolean) => {
    if (!canEdit) return
    try {
      await api.put(`${checklistBasePath}/checklist/${entryId}`, { isChecked: checked })
      onChecklistToggle?.(entryId, checked)
    } catch {
      // silently ignore — optimistic update handled by parent
    }
  }

  const dept = user.departmentName || user.department

  return (
    <>
      {editOpen && (
        <EditUserModal
          user={user}
          departments={departments as { id: string; name: string; managerId: string | null }[]}
          managers={managers}
          onClose={() => setEditOpen(false)}
          onSaved={() => { onUserUpdated?.() }}
        />
      )}

      <div className="space-y-4">
      {/* ── Profile header ── */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">

          {/* Top row: avatar + name block + wijzigen button */}
          <div className="flex items-start gap-4">
            <Avatar first={user.firstName} last={user.lastName} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="mt-1">
                    <Badge tone={statusTone}>{STATUS_LABEL[status]}</Badge>
                  </div>
                </div>
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <Pencil size={12} />
                  Wijzigen
                </button>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
            {user.email && (
              <InfoRow icon={<Mail size={13} />} label="E-mail" value={user.email} />
            )}
            {user.phone && (
              <InfoRow icon={<Phone size={13} />} label="Telefoon" value={user.phone} />
            )}
            {user.jobTitle && (
              <InfoRow icon={<User size={13} />} label="Functie" value={user.jobTitle} />
            )}
            {dept && (
              <InfoRow icon={<Briefcase size={13} />} label="Afdeling" value={dept} />
            )}
            {user.managerName && (
              <InfoRow icon={<Users size={13} />} label="Manager" value={user.managerName} />
            )}
            {user.contractType && (
              <InfoRow icon={<FileText size={13} />} label="Contract" value={user.contractType} />
            )}
            {user.startDate && (
              <InfoRow icon={<Calendar size={13} />} label="In dienst" value={fmt(user.startDate)} />
            )}
            {user.leaveDate && (
              <InfoRow icon={<LogOut size={13} />} label="Uit dienst" value={fmt(user.leaveDate)} />
            )}
          </div>

          {/* Completeness */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-slate-500">Dossier volledigheid</span>
              <span className="text-xs font-semibold text-slate-700">{user.completeness}%</span>
            </div>
            <Progress value={user.completeness} />
          </div>

          {/* Quick stats */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Actieve software</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800 truncate">
                {user.software.find(s => s.isActive)?.name || '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Device</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800 truncate">
                {user.hardware[0]?.name || '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Licenties</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {user.licenses.length || '—'}
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
      {historyPath && (
        <Section title="Historie" icon={<History size={16} />}>
          {historyLoading ? (
            <p className="text-sm text-slate-400">Laden…</p>
          ) : auditHistory.length === 0 ? (
            <p className="text-sm text-slate-400">Nog geen activiteiten.</p>
          ) : (
            <div className="space-y-2">
              {auditHistory.map(a => (
                <div key={a.id} className="flex gap-3 rounded-xl bg-white p-3 border border-slate-100">
                  <AuditIcon action={a.action} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{auditLabel(a)}</p>
                    <p className="text-xs text-slate-400">
                      {fmt(a.createdAt)}{a.userName ? ` • door ${a.userName}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
    </>
  )
}

// ── InfoRow sub-component ─────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-slate-400 flex-shrink-0">{icon}</span>
      <span className="text-xs text-slate-400 flex-shrink-0 w-14">{label}</span>
      <span className="text-xs font-medium text-slate-700 truncate">{value}</span>
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
