import { useEffect, useRef, useState, useMemo } from 'react'
import {
  Laptop, KeyRound, History, CheckCircle2, AlertTriangle,
  LogOut, ShieldCheck, ClipboardList, Mail,
  Briefcase, Calendar, User, RotateCcw, Smartphone, Phone,
  Users, FileText, Pencil, Trash2, X, MapPin, Plus, Layers, StickyNote, Unlink,
  Search, Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { ClientUserDetailResponse, ClientUserListItem, UserStatus, SoftwareAssignmentDto, UserLicenseDto, ClientUserSubscriptionDto } from '@/types/clientUser'
import { STATUS_LABEL } from '@/types/clientUser'
import { HARDWARE_STATUS_LABEL, HARDWARE_STATUS_TONE, HARDWARE_TYPE_LABEL } from '@/types/hardware'
import type { HardwareAssetListItem } from '@/types/hardware'
import { PHONE_STATUS_LABEL, PHONE_STATUS_TONE } from '@/types/phone'
import type { PhoneListItem } from '@/types/phone'
import { SUB_STATUS_LABEL, SUB_STATUS_TONE } from '@/types/subscription'

const SUB_TYPE_TO_VALUE: Record<string, number> = { Mobile: 0, Data: 1 }
const SUB_STATUS_TO_VALUE: Record<string, number> = { Active: 0, Cancelled: 1, Inactive: 2, Incomplete: 3 }
import type { LocationListItem } from '@/types/location'
import type { ProcessTemplateListItem } from '@/types/processTemplate'
import { HardwareModal } from '@/components/HardwareModal'
import { PhoneSetupWizard } from '@/components/PhoneSetupWizard'
import { LicenseModal } from '@/components/LicenseModal'
import api from '@/lib/axios'
import { NotesPanel } from '@/components/NotesPanel'
import type { SoftwareListItem } from '@/types/software'

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
    case 'PortalAccessGranted': return 'Portaaltoegang gegeven'
    case 'PortalAccessRevoked': return 'Portaaltoegang ingetrokken'
    default:                return entry.action
  }
}

const USER_FIELD_LABEL: Record<string, string> = {
  FirstName: 'Voornaam', Tussenvoegsel: 'Tussenvoegsel', LastName: 'Achternaam',
  Email: 'E-mail', JobTitle: 'Functie', Phone: 'Telefoon', Department: 'Afdeling',
  Status: 'Status', ContractType: 'Contract', StartDate: 'Startdatum',
  LeaveDate: 'Vertrekdatum', ManagerId: 'Manager', LocationId: 'Locatie', IsActive: 'Actief',
}

const USER_STATUS_NL: Record<string, string> = {
  InService: 'In dienst', StartPlanned: 'In dienst gepland',
  LeavePlanned: 'Uit dienst gepland', Left: 'Uit dienst',
}

// Korte detailregels voor een profiel-update: "Functie: Analist → Consultant"
function auditDetailLines(entry: AuditLogEntry): string[] {
  if (entry.action !== 'Updated') return []
  const c = parseChanges(entry.changes)
  const lines: string[] = []
  const isGuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  const fmtVal = (field: string, raw: unknown): string | null => {
    if (raw === null || raw === undefined || raw === '') return '—'
    const s = String(raw)
    if (isGuid(s)) return null
    if (field === 'Status') return USER_STATUS_NL[s] ?? s
    if (field === 'StartDate' || field === 'LeaveDate') {
      const d = new Date(s)
      return isNaN(d.getTime()) ? s : d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }
    return s
  }
  for (const [k, v] of Object.entries(c)) {
    if (k.startsWith('_') || !Array.isArray(v)) continue
    const label = USER_FIELD_LABEL[k] ?? k
    const oldStr = fmtVal(k, v[0])
    const newStr = fmtVal(k, v[1])
    if (oldStr === null || newStr === null) { lines.push(`${label} gewijzigd`); continue }
    if (oldStr !== newStr) lines.push(`${label}: ${oldStr} → ${newStr}`)
  }
  return lines
}

function AuditIcon({ action }: { action: string }) {
  const cls = 'mt-0.5 flex-shrink-0'
  if (action.startsWith('Hardware')) return <Laptop size={16} className={`${cls} text-blue-500`} />
  if (action.startsWith('Phone'))    return <Smartphone size={16} className={`${cls} text-blue-500`} />
  if (action.startsWith('License'))  return <KeyRound size={16} className={`${cls} text-amber-500`} />
  if (action.startsWith('Software')) return <ShieldCheck size={16} className={`${cls} text-emerald-500`} />
  if (action.startsWith('PortalAccess')) return <KeyRound size={16} className={`${cls} text-blue-500`} />
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
    <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl flex-shrink-0 select-none">
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
  { value: '3', label: 'Extern' },
]
const STATUS_TO_INT: Record<string, string> = { InService: '0', LeavePlanned: '1', Left: '2', StartPlanned: '0' }
const CONTRACT_TO_INT: Record<string, string> = { Vast: '0', Tijdelijk: '1', Stagiair: '2', Extern: '3' }

// ── AddSoftwareModal ──────────────────────────────────────────────────────────

function AddSoftwareModal({ userId, softwarePath, alreadyAssignedIds, onClose, onAssigned }: {
  userId: string
  softwarePath: string
  alreadyAssignedIds: Set<string>
  onClose: () => void
  onAssigned: () => void
}) {
  const [catalog, setCatalog]     = useState<SoftwareListItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [assigning, setAssigning] = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const overlayRef                = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get<SoftwareListItem[]>(softwarePath)
      .then(r => setCatalog(r.data))
      .catch(() => setError('Kon softwarelijst niet laden.'))
      .finally(() => setLoading(false))
  }, [softwarePath])

  const available = catalog
    .filter(s => s.licenseId && !alreadyAssignedIds.has(s.licenseId))
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) ||
                 s.publisher.toLowerCase().includes(search.toLowerCase()))

  const handleAssign = async (s: SoftwareListItem) => {
    if (!s.licenseId) return
    setAssigning(s.licenseId)
    setError(null)
    try {
      await api.post(`/portal/licenses/${s.licenseId}/assign`, { userId })
      onAssigned()
      onClose()
    } catch {
      setError('Toewijzen mislukt. Probeer het opnieuw.')
      setAssigning(null)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onMouseDown={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Software toevoegen</h2>
            <p className="text-xs text-slate-400 mt-0.5">Kies software uit de catalogus om toe te wijzen</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek op naam of uitgever…"
              autoFocus
              className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Laden…</span>
            </div>
          ) : available.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-6">
              <ShieldCheck size={28} className="text-slate-200 dark:text-slate-700" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {catalog.length === 0
                  ? 'Geen software in de catalogus.'
                  : search
                    ? 'Geen resultaten voor deze zoekopdracht.'
                    : 'Alle software is al gekoppeld aan deze medewerker.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {available.map(s => {
                const isAssigning = assigning === s.licenseId
                const isFull = !!(s.maxUsers && s.maxUsers > 0 && (s.assignedUsers ?? 0) >= s.maxUsers)
                return (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={16} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                      <p className="text-xs text-slate-400 truncate">{s.publisher}{s.vendor ? ` · ${s.vendor}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.isPaid
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}>
                        {s.isPaid ? 'Betaald' : 'Gratis'}
                      </span>
                      {isFull ? (
                        <span className="text-xs text-red-500 font-medium">Vol</span>
                      ) : (
                        <button
                          onClick={() => handleAssign(s)}
                          disabled={!!assigning}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {isAssigning ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                          Toevoegen
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── EditUserModal ─────────────────────────────────────────────────────────────

function EditUserModal({ user, departments, managers, locations, onClose, onSaved }: {
  user: ClientUserDetailResponse
  departments: { id: string; name: string; managerId: string | null }[]
  managers: { id: string; fullName: string }[]
  locations: { id: string; name: string }[]
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
  const [locationId, setLocationId]     = useState(user.locationId ?? '')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [leaverTemplates, setLeaverTemplates] = useState<ProcessTemplateListItem[]>([])
  const [leaverTemplateId, setLeaverTemplateId] = useState<string>('')
  const overlayRef                      = useRef<HTMLDivElement>(null)

  const hadLeaveDate = useMemo(() => !!user.leaveDate, [user.leaveDate])

  useEffect(() => {
    api.get<ProcessTemplateListItem[]>('/portal/process-templates')
      .then(res => {
        const employee = res.data.filter(t => t.targetEntityType === 'Employee')
        setLeaverTemplates(employee)
        const defaultLeaver = employee.find(t => t.defaultChecklistType === 'Leaver')
        if (defaultLeaver) setLeaverTemplateId(defaultLeaver.id)
      })
      .catch(() => {})
  }, [])

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
    if (!email.trim()) { setError('E-mailadres is verplicht.'); return }
    setSaving(true); setError(null)
    try {
      await api.put(`/portal/users/${user.id}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        jobTitle: jobTitle.trim() || null,
        status: parseInt(status, 10),
        contractType: contractType !== '' ? parseInt(contractType, 10) : null,
        startDate: startDate || null,
        leaveDate: leaveDate || null,
        departmentId: departmentId || null,
        managerId: managerId || null,
        locationId: locationId || null,
        leaverTemplateId: (!hadLeaveDate && leaveDate && leaverTemplateId) ? leaverTemplateId : null,
      })
      onSaved()
      onClose()
    } catch {
      setError('Opslaan mislukt. Controleer de gegevens en probeer opnieuw.')
    } finally {
      setSaving(false)
    }
  }

  const field = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
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

          {/* locatie */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Locatie</label>
            <select value={locationId} onChange={e => setLocationId(e.target.value)} className={field}>
              <option value="">— Geen locatie —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
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

          {/* Aftreden checklist template — tonen als leaveDate nieuw wordt ingesteld */}
          {!hadLeaveDate && leaveDate && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Aftreden checklist</label>
              <select
                value={leaverTemplateId}
                onChange={e => setLeaverTemplateId(e.target.value)}
                className={field}
              >
                <option value="">— Standaard —</option>
                {leaverTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

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
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60">
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            {icon}
            {title}
          </h3>
          {action}
        </div>
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
  locations?: LocationListItem[]
  teammates?: ClientUserListItem[]
  /** base path for checklist toggle API calls, e.g. "/clients/{id}/users/{uid}" */
  checklistBasePath: string
  /** path to fetch audit history, e.g. "/portal/history/User/{uid}" */
  historyPath?: string
  /** path to fetch software catalog, e.g. "/portal/software" */
  softwarePath?: string
  onChecklistToggle?: (entryId: string, checked: boolean) => void
  onUserUpdated?: () => void
  onDelete?: () => void
  onHardwareClick?: (asset: HardwareAssetListItem) => void
  onPhoneClick?: (phone: PhoneListItem) => void
  onSoftwareClick?: (licenseId: string) => void | Promise<void>
  onLicenseClick?: (licenseId: string) => void | Promise<void>
  onSubscriptionClick?: (subscriptionId: string) => void | Promise<void>
}

export function UserDetailPanel({ user, canEdit, departments = [], managers = [], locations = [], teammates = [], checklistBasePath, historyPath, softwarePath, onChecklistToggle, onUserUpdated, onDelete, onHardwareClick, onPhoneClick, onSoftwareClick, onLicenseClick, onSubscriptionClick }: Props) {
  const status = user.status as UserStatus
  const statusTone = status === 'InService' ? 'good' : status === 'StartPlanned' ? 'info' : status === 'LeavePlanned' ? 'warn' : 'bad'

  const [auditHistory, setAuditHistory] = useState<AuditLogEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [showHardwareModal, setShowHardwareModal] = useState(false)
  const [showPhoneWizard, setShowPhoneWizard] = useState(false)
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [showSoftwareModal, setShowSoftwareModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'notes' | 'history'>('notes')
  const [confirmUnlink, setConfirmUnlink] = useState<{ name: string; subtitle?: string; onConfirm: () => Promise<void> } | null>(null)
  const [unlinking, setUnlinking] = useState(false)
  const [clickingKey, setClickingKey] = useState<string | null>(null)
  const [grantingAccess, setGrantingAccess] = useState(false)
  const [grantError, setGrantError] = useState<string | null>(null)
  const [confirmGrant, setConfirmGrant] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const [revokingAccess, setRevokingAccess] = useState(false)
  const [confirmMfaReset, setConfirmMfaReset] = useState(false)
  const [resettingMfa, setResettingMfa] = useState(false)
  const [mfaResetError, setMfaResetError] = useState<string | null>(null)
  const [mfaResetDone, setMfaResetDone] = useState(false)

  const handleResetMfa = async () => {
    setResettingMfa(true)
    setMfaResetError(null)
    try {
      await api.post('/auth/mfa/reset', { ownerType: 1, ownerId: user.id })
      setConfirmMfaReset(false)
      setMfaResetDone(true)
      setTimeout(() => setMfaResetDone(false), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setMfaResetError(msg ?? 'MFA resetten is mislukt.')
    } finally {
      setResettingMfa(false)
    }
  }

  const handleGrantPortalAccess = async () => {
    setGrantingAccess(true)
    setGrantError(null)
    try {
      await api.put(`${checklistBasePath}/grant-portal-access`)
      setConfirmGrant(false)
      onUserUpdated?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setGrantError(msg ?? 'Portaaltoegang geven is mislukt.')
    } finally {
      setGrantingAccess(false)
    }
  }

  const handleRevokePortalAccess = async () => {
    setRevokingAccess(true)
    try {
      await api.put(`${checklistBasePath}/revoke-portal-access`)
      onUserUpdated?.()
    } finally {
      setRevokingAccess(false)
      setConfirmRevoke(false)
    }
  }

  const handleCatalogClick = async (fn: ((id: string) => void | Promise<void>) | undefined, licenseId: string, key: string) => {
    if (!fn) return
    setClickingKey(key)
    try { await fn(licenseId) } finally { setClickingKey(null) }
  }

  // Local checklist state for optimistic updates
  const [localStarter, setLocalStarter] = useState(user.starterChecklist)
  const [localLeaver, setLocalLeaver] = useState(user.leaverChecklist)

  // Sync when a different user is loaded or when the parent refetches
  useEffect(() => {
    setLocalStarter(user.starterChecklist)
    setLocalLeaver(user.leaverChecklist)
  }, [user.id, user.starterChecklist, user.leaverChecklist])

  const lockedUser = { id: user.id, name: `${user.firstName} ${user.lastName}` }

  useEffect(() => {
    if (!historyPath) return
    const controller = new AbortController()
    setHistoryLoading(true)
    setAuditHistory([])
    api.get<AuditLogEntry[]>(historyPath, { signal: controller.signal })
      .then(r => setAuditHistory(r.data))
      .catch(err => { if (err?.code !== 'ERR_CANCELED') console.error(err) })
      .finally(() => setHistoryLoading(false))
    return () => controller.abort()
  }, [historyPath])

  const handleToggle = async (entryId: string, checked: boolean) => {
    if (!canEdit) return

    // Optimistic update
    const patch = (list: typeof localStarter) =>
      list.map(e => e.id === entryId ? { ...e, isChecked: checked } : e)
    const prevStarter = localStarter
    const prevLeaver = localLeaver
    setLocalStarter(patch(localStarter))
    setLocalLeaver(patch(localLeaver))

    try {
      await api.put(`${checklistBasePath}/checklist/${entryId}`, { isChecked: checked })
      onChecklistToggle?.(entryId, checked)
    } catch {
      // Revert on failure
      setLocalStarter(prevStarter)
      setLocalLeaver(prevLeaver)
    }
  }

  const dept = user.departmentName || user.department

  const typeNameToValue = (typeName: string) => {
    const map: Record<string, number> = { Laptop: 0, Desktop: 1, Phone: 2, Tablet: 3, Monitor: 4, Other: 5 }
    return map[typeName] ?? 0
  }

  const toPhoneListItem = (p: typeof user.phones[0]): PhoneListItem => ({
    id: p.id, brand: p.brand, model: p.model,
    serialNumber: p.serialNumber, imeiNumber: p.imeiNumber,
    supplier: null, purchaseValue: p.purchaseValue, status: p.status as PhoneListItem['status'],
    assignedToUserId: user.id, assignedToName: `${user.firstName} ${user.lastName}`,
    simCardId: null, simCardNumber: p.simCardNumber, simPhoneNumber: p.simPhoneNumber,
    subscriptionName: p.subscriptionName, subscriptionProvider: p.subscriptionProvider, subscriptionStatus: p.subscriptionStatus,
    purchasedAt: p.purchasedAt, returnedAt: null, orderedAt: null, createdAt: '',
  })

  const toHardwareListItem = (h: typeof user.hardware[0]): HardwareAssetListItem => ({
    id: h.id, name: h.name, brand: h.brand, type: h.type,
    assetNumber: h.assetNumber, serialNumber: h.serialNumber,
    status: h.status, location: h.location, purchaseValue: h.purchaseValue,
    supplier: null, locationId: null, locationName: null,
    assignedToUserId: user.id, assignedToName: `${user.firstName} ${user.lastName}`,
    issuedAt: h.issuedAt, returnedAt: h.returnedAt, orderedAt: null, createdAt: '',
    specifications: null,
  })

  const openUnlinkHardware = (h: typeof user.hardware[0]) => {
    setConfirmUnlink({
      name: h.name,
      onConfirm: async () => {
        await api.put(`/portal/hardware/${h.id}`, {
          name: h.name, brand: h.brand, type: typeNameToValue(h.type),
          assetNumber: h.assetNumber || '', serialNumber: h.serialNumber || '',
          location: h.location || '', locationId: null,
          purchaseValue: h.purchaseValue ?? null, supplier: null,
          assignedToUserId: null, issuedAt: h.issuedAt ?? null,
          returnedAt: new Date().toISOString(), status: 0,
        })
        onUserUpdated?.()
      },
    })
  }

  const openUnlinkSoftwareAssignment = (s: SoftwareAssignmentDto) => {
    setConfirmUnlink({
      name: s.name,
      subtitle: 'De softwarekoppeling wordt verwijderd.',
      onConfirm: async () => {
        await api.delete(`/portal/software/${s.id}`)
        onUserUpdated?.()
      },
    })
  }

  const openUnlinkLicense = (l: UserLicenseDto) => {
    setConfirmUnlink({
      name: l.name,
      subtitle: 'De licentie wordt ontkoppeld van de medewerker.',
      onConfirm: async () => {
        await api.delete(`/portal/licenses/${l.licenseId}/users/${user.id}`)
        onUserUpdated?.()
      },
    })
  }

  const openUnlinkPhone = (p: typeof user.phones[0]) => {
    setConfirmUnlink({
      name: `${p.brand} ${p.model}`.trim(),
      onConfirm: async () => {
        await api.put(`/portal/phones/${p.id}`, {
          brand: p.brand, model: p.model || '',
          serialNumber: p.serialNumber || '', imeiNumber: p.imeiNumber || '',
          status: 0, assignedToUserId: null,
          purchaseValue: p.purchaseValue ?? null,
          purchasedAt: p.purchasedAt ?? null, returnedAt: new Date().toISOString(),
        })
        onUserUpdated?.()
      },
    })
  }

  const openUnlinkSubscription = (s: ClientUserSubscriptionDto) => {
    setConfirmUnlink({
      name: s.name,
      subtitle: 'Het abonnement wordt ontkoppeld van de medewerker.',
      onConfirm: async () => {
        await api.put(`/portal/subscriptions/${s.id}`, {
          name: s.name, provider: s.provider, supplier: s.supplier,
          type: SUB_TYPE_TO_VALUE[s.type] ?? 0,
          phoneNumber: s.phoneNumber, monthlyCost: s.monthlyCost,
          status: SUB_STATUS_TO_VALUE[s.status] ?? 0, location: '',
          assignedToUserId: null,
        })
        onUserUpdated?.()
      },
    })
  }

  const handleConfirmUnlink = async () => {
    if (!confirmUnlink) return
    setUnlinking(true)
    try {
      await confirmUnlink.onConfirm()
      setConfirmUnlink(null)
    } finally {
      setUnlinking(false)
    }
  }

  return (
    <>
      {editOpen && (
        <EditUserModal
          user={user}
          departments={departments as { id: string; name: string; managerId: string | null }[]}
          managers={managers}
          locations={locations}
          onClose={() => setEditOpen(false)}
          onSaved={() => { onUserUpdated?.() }}
        />
      )}

      <HardwareModal
        open={showHardwareModal}
        onClose={() => setShowHardwareModal(false)}
        onSuccess={() => { setShowHardwareModal(false); onUserUpdated?.() }}
        teammates={teammates}
        locations={locations}
        lockedUser={lockedUser}
      />

      <PhoneSetupWizard
        open={showPhoneWizard}
        onClose={() => setShowPhoneWizard(false)}
        onSuccess={() => { onUserUpdated?.() }}
        teammates={teammates}
        lockedUser={lockedUser}
      />

      <LicenseModal
        open={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
        onSuccess={() => { setShowLicenseModal(false); onUserUpdated?.() }}
        teammates={teammates}
        lockedUser={lockedUser}
      />

      {showSoftwareModal && softwarePath && (
        <AddSoftwareModal
          userId={user.id}
          softwarePath={softwarePath}
          alreadyAssignedIds={new Set(user.licenses.filter(l => l.isSoftwareLicense).map(l => l.licenseId))}
          onClose={() => setShowSoftwareModal(false)}
          onAssigned={() => { setShowSoftwareModal(false); onUserUpdated?.() }}
        />
      )}

      <Modal
        open={!!confirmUnlink}
        onClose={() => !unlinking && setConfirmUnlink(null)}
        title="Ontkoppelen bevestigen"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
            <Unlink size={22} className="text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Weet je zeker dat je{' '}
              <span className="font-semibold">"{confirmUnlink?.name}"</span>{' '}
              wilt ontkoppelen van deze medewerker?
            </p>
            <p className="text-xs text-slate-400 mt-1">{confirmUnlink?.subtitle ?? 'Het apparaat komt terug op voorraad.'}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmUnlink(null)} disabled={unlinking}>
            Annuleren
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleConfirmUnlink} disabled={unlinking}>
            {unlinking ? 'Bezig…' : 'Ontkoppelen'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmGrant}
        onClose={() => !grantingAccess && setConfirmGrant(false)}
        title="Portaaltoegang geven"
        className="max-w-sm"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <Mail size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold">{user.firstName} {user.lastName}</span>{' '}
              ontvangt een e-mail{user.email ? <> op <span className="font-semibold">{user.email}</span></> : null}{' '}
              met een link om een account aan te maken. Weet je het zeker?
            </p>
            <p className="text-xs text-slate-400 mt-1">
              De link is 48 uur geldig. De medewerker krijgt alleen inzage in eigen gegevens en assets.
            </p>
          </div>
        </div>
        {grantError && (
          <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{grantError}</p>
        )}
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmGrant(false)} disabled={grantingAccess}>
            Annuleren
          </Button>
          <Button className="flex-1" onClick={handleGrantPortalAccess} disabled={grantingAccess}>
            {grantingAccess ? 'Versturen…' : 'Verstuur uitnodiging'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmRevoke}
        onClose={() => !revokingAccess && setConfirmRevoke(false)}
        title="Portaaltoegang intrekken"
        className="max-w-sm"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
            <KeyRound size={22} className="text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Weet je zeker dat je de portaaltoegang van{' '}
              <span className="font-semibold">"{user.firstName} {user.lastName}"</span>{' '}
              wilt intrekken?
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Deze medewerker kan hierna niet meer inloggen. Toegang kan later opnieuw gegeven worden.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmRevoke(false)} disabled={revokingAccess}>
            Annuleren
          </Button>
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleRevokePortalAccess} disabled={revokingAccess}>
            {revokingAccess ? 'Bezig…' : 'Intrekken'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmMfaReset}
        onClose={() => !resettingMfa && setConfirmMfaReset(false)}
        title="MFA resetten"
        className="max-w-sm"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
            <ShieldCheck size={22} className="text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Weet je zeker dat je de tweestapsverificatie van{' '}
              <span className="font-semibold">"{user.firstName} {user.lastName}"</span>{' '}
              wilt resetten?
            </p>
            <p className="text-xs text-slate-400 mt-1">
              De medewerker moet bij de eerstvolgende login opnieuw een authenticator-app koppelen.
              Gebruik dit alleen na identiteitscontrole (bijv. telefoon met de authenticator-app kwijt).
            </p>
          </div>
        </div>
        {mfaResetError && (
          <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{mfaResetError}</p>
        )}
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmMfaReset(false)} disabled={resettingMfa}>
            Annuleren
          </Button>
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleResetMfa} disabled={resettingMfa}>
            {resettingMfa ? 'Bezig…' : 'Resetten'}
          </Button>
        </div>
      </Modal>

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
                <div className="flex items-center gap-2 flex-shrink-0">
                  {user.role === 'Employee' && (
                    user.isPortalUser ? (
                      <button
                        onClick={() => setConfirmRevoke(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
                        title="Klik om portaaltoegang in te trekken"
                      >
                        <KeyRound size={12} />
                        Portaaltoegang actief
                      </button>
                    ) : (
                      <button
                        onClick={() => { setGrantError(null); setConfirmGrant(true) }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                      >
                        <KeyRound size={12} />
                        Geef portaaltoegang
                      </button>
                    )
                  )}
                  {user.isPortalUser && (
                    <button
                      onClick={() => { setMfaResetError(null); setConfirmMfaReset(true) }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                      title="Verwijdert de gekoppelde authenticator-app; gebruiker moet opnieuw instellen bij volgende login"
                    >
                      <ShieldCheck size={12} />
                      {mfaResetDone ? 'MFA gereset ✓' : 'MFA resetten'}
                    </button>
                  )}
                  <button
                    onClick={() => setEditOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    <Pencil size={12} />
                    Wijzigen
                  </button>
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                      <Trash2 size={12} />
                      Verwijderen
                    </button>
                  )}
                </div>
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
            {user.locationName && (
              <InfoRow icon={<MapPin size={13} />} label="Locatie" value={user.locationName} />
            )}
            {user.startDate && (
              <InfoRow icon={<Calendar size={13} />} label="In dienst" value={fmt(user.startDate)} />
            )}
            {user.leaveDate && (
              <InfoRow icon={<LogOut size={13} />} label="Uit dienst" value={fmt(user.leaveDate)} />
            )}
          </div>

          {/* Quick stats */}
          {(() => {
            const activeSoftwareCount = user.software.filter(s => s.isActive).length
              + user.licenses.filter(l => l.isSoftwareLicense && l.isActive).length
            return (
              <div className="mt-3 grid grid-cols-3 gap-2 items-start">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Actieve software</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">
                    {activeSoftwareCount || '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Hardware</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">
                    {user.hardware.length || '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Licenties</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">
                    {user.licenses.length || '—'}
                  </p>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* ── Hardware + Telefonie ── */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Hardware" icon={<Laptop size={16} />} action={
          <button onClick={() => setShowHardwareModal(true)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors">
            <Plus size={11} /> Toevoegen
          </button>
        }>
          {user.hardware.length === 0 ? (
            <p className="text-sm text-slate-400">Geen hardware toegewezen.</p>
          ) : (
            <div className="space-y-3">
              {user.hardware.map(h => (
                <div
                  key={h.id}
                  onClick={() => onHardwareClick?.(toHardwareListItem(h))}
                  className={`rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3 transition-all duration-200 ease-out ${onHardwareClick ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 hover:shadow-[0_0_0_1px_rgba(37,99,235,0.08),0_4px_14px_-4px_rgba(37,99,235,0.35)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_4px_16px_-4px_rgba(59,130,246,0.25)]' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{h.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {[h.brand, h.assetNumber].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${HARDWARE_STATUS_TONE[h.status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                      {HARDWARE_STATUS_LABEL[h.status] ?? h.status}
                    </span>
                  </div>
                  {h.issuedAt && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Uitgifte: {fmt(h.issuedAt)}</p>
                  )}
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{HARDWARE_TYPE_LABEL[h.type] ?? h.type}</span>
                    <button onClick={e => { e.stopPropagation(); openUnlinkHardware(h) }} className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">Ontkoppelen</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Telefonie" icon={<Smartphone size={16} />} action={
          <button onClick={() => setShowPhoneWizard(true)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors">
            <Layers size={11} /> Setup
          </button>
        }>
          {user.phones.length === 0 ? (
            <p className="text-sm text-slate-400">Geen telefoons toegewezen.</p>
          ) : (
            <div className="space-y-3">
              {user.phones.map(p => (
                <div
                  key={p.id}
                  onClick={() => onPhoneClick?.(toPhoneListItem(p))}
                  className={`rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3 transition-all duration-200 ease-out ${onPhoneClick ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 hover:shadow-[0_0_0_1px_rgba(37,99,235,0.08),0_4px_14px_-4px_rgba(37,99,235,0.35)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_4px_16px_-4px_rgba(59,130,246,0.25)]' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.brand} {p.model}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {p.simPhoneNumber || p.serialNumber || '—'}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${PHONE_STATUS_TONE[p.status as keyof typeof PHONE_STATUS_TONE] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                      {PHONE_STATUS_LABEL[p.status as keyof typeof PHONE_STATUS_LABEL] ?? p.status}
                    </span>
                  </div>
                  {p.purchasedAt && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Aanschaf: {fmt(p.purchasedAt)}</p>
                  )}
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Mobiele telefoon</span>
                    <button onClick={e => { e.stopPropagation(); openUnlinkPhone(p) }} className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">Ontkoppelen</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {user.subscriptions.length > 0 && (
            <>
              <div className="mt-4 space-y-3">
                {user.subscriptions.map(s => {
                  const clickable = !!onSubscriptionClick
                  return (
                    <div
                      key={s.id}
                      onClick={clickable ? () => handleCatalogClick(onSubscriptionClick, s.id, s.id) : undefined}
                      className={`rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3 transition-all duration-200 ease-out ${clickable ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 hover:shadow-[0_0_0_1px_rgba(37,99,235,0.08),0_4px_14px_-4px_rgba(37,99,235,0.35)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_4px_16px_-4px_rgba(59,130,246,0.25)]' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {[s.provider, s.phoneNumber].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {clickingKey === s.id && <Loader2 size={13} className="animate-spin text-blue-400" />}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUB_STATUS_TONE[s.status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {SUB_STATUS_LABEL[s.status] ?? s.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Abonnement</span>
                        <button onClick={e => { e.stopPropagation(); openUnlinkSubscription(s) }} className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">Ontkoppelen</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Section>
      </div>

      {/* ── Software + Licenties ── */}
      {/* softwareLicenses = licenses that were assigned via the software catalog (isSoftwareLicense) */}
      {/* pureeLicenses    = standalone licenses not linked to any software catalog entry */}
      {(() => {
        const softwareLicenses = user.licenses.filter(l => l.isSoftwareLicense)
        const pureLicenses     = user.licenses.filter(l => !l.isSoftwareLicense)
        const allSoftware      = [
          ...user.software.map(s => ({ key: s.id, name: s.name, sub: `${s.account ? s.account + ' • ' : ''}vanaf ${fmt(s.issuedAt)}`, active: s.isActive, licenseId: null as string | null, onUnlink: () => openUnlinkSoftwareAssignment(s) })),
          ...softwareLicenses.map(l => ({ key: l.userLicenseId, name: l.name, sub: `${l.vendor || 'Freeware'} • toegewezen ${fmt(l.assignedAt)}`, active: l.isActive, licenseId: l.licenseId as string | null, onUnlink: () => openUnlinkLicense(l) })),
        ]
        return (
          <div className="grid gap-4 xl:grid-cols-2">
            <Section title="Software" icon={<ShieldCheck size={16} />} action={
              softwarePath ? (
                <button onClick={() => setShowSoftwareModal(true)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors">
                  <Plus size={11} /> Toevoegen
                </button>
              ) : undefined
            }>
              {allSoftware.length === 0 ? (
                <p className="text-sm text-slate-400">Geen software gekoppeld.</p>
              ) : (
                <div className="space-y-3">
                  {allSoftware.map(s => {
                    const clickable = !!s.licenseId && !!onSoftwareClick
                    return (
                      <div
                        key={s.key}
                        onClick={clickable ? () => handleCatalogClick(onSoftwareClick, s.licenseId!, s.key) : undefined}
                        className={`rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3 transition-all duration-200 ease-out ${clickable ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 hover:shadow-[0_0_0_1px_rgba(37,99,235,0.08),0_4px_14px_-4px_rgba(37,99,235,0.35)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_4px_16px_-4px_rgba(59,130,246,0.25)]' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{s.sub}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {clickingKey === s.key && <Loader2 size={13} className="animate-spin text-blue-400" />}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Software</span>
                          <button onClick={e => { e.stopPropagation(); s.onUnlink() }} className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">Ontkoppelen</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>

            <Section title="Licenties" icon={<KeyRound size={16} />} action={
              <button onClick={() => setShowLicenseModal(true)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors">
                <Plus size={11} /> Toevoegen
              </button>
            }>
              {pureLicenses.length === 0 ? (
                <p className="text-sm text-slate-400">Geen licenties gekoppeld.</p>
              ) : (
                <div className="space-y-2">
                  {pureLicenses.map(l => {
                    const clickable = !!onLicenseClick
                    return (
                      <div
                        key={l.userLicenseId}
                        onClick={clickable ? () => handleCatalogClick(onLicenseClick, l.licenseId, l.userLicenseId) : undefined}
                        className={`rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-3 transition-all duration-200 ease-out ${clickable ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 hover:shadow-[0_0_0_1px_rgba(37,99,235,0.08),0_4px_14px_-4px_rgba(37,99,235,0.35)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_4px_16px_-4px_rgba(59,130,246,0.25)]' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{l.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{l.vendor || '—'} • Toegewezen {fmt(l.assignedAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {clickingKey === l.userLicenseId && <Loader2 size={13} className="animate-spin text-blue-400" />}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Licentie</span>
                          <button onClick={e => { e.stopPropagation(); openUnlinkLicense(l) }} className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">Ontkoppelen</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>
          </div>
        )
      })()}

      {/* ── Checklists ── */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ChecklistCard
          title="Checklist aantreden"
          completedLabel="Checklist aantreden afgewerkt"
          icon={<ClipboardList size={16} />}
          entries={localStarter}
          canEdit={canEdit}
          onToggle={handleToggle}
        />
        {(status === 'LeavePlanned' || status === 'Left') && (
          <ChecklistCard
            title="Checklist aftreden"
            completedLabel="Checklist aftreden afgewerkt"
            icon={<LogOut size={16} />}
            entries={localLeaver}
            canEdit={canEdit}
            onToggle={handleToggle}
          />
        )}
      </div>

      {/* ── Notities / Historie tabs ── */}
      {historyPath && (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-1 mb-4 border-b border-slate-100 dark:border-slate-700 -mx-5 px-5 pb-3">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <StickyNote size={13} /> Notities
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <History size={13} /> Historie
              </button>
            </div>

            {activeTab === 'notes' && (
              <NotesPanel entityType="Employee" entityId={user.id} canEdit={canEdit} />
            )}

            {activeTab === 'history' && (
              historyLoading ? (
                <p className="text-sm text-slate-400">Laden…</p>
              ) : auditHistory.length === 0 ? (
                <p className="text-sm text-slate-400">Nog geen activiteiten.</p>
              ) : (
                <div className="space-y-2">
                  {auditHistory.map(a => (
                    <div key={a.id} className="flex gap-3 rounded-xl bg-white dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700">
                      <AuditIcon action={a.action} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{auditLabel(a)}</p>
                        {auditDetailLines(a).slice(0, 3).map((line, i) => (
                          <p key={i} className="text-xs text-slate-500 dark:text-slate-400 truncate">{line}</p>
                        ))}
                        <p className="text-xs text-slate-400">
                          {fmt(a.createdAt)}{a.userName ? ` • door ${a.userName}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>
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
  title, completedLabel, icon, entries, canEdit, onToggle,
}: {
  title: string
  completedLabel: string
  icon: React.ReactNode
  entries: ClientUserDetailResponse['starterChecklist']
  canEdit: boolean
  onToggle: (id: string, checked: boolean) => void
}) {
  const checkedCount = entries.filter(e => e.isChecked).length
  const allDone = entries.length > 0 && checkedCount === entries.length

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            {icon}
            {title}
          </h3>
          <span className="text-xs text-slate-400">{checkedCount}/{entries.length}</span>
        </div>

        {allDone ? (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center rounded-2xl bg-emerald-50 border border-emerald-100">
            <CheckCircle2 size={36} className="text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-800">{completedLabel}</p>
            <button
              onClick={() => onToggle(entries[entries.length - 1].id, false)}
              className="text-xs text-emerald-600 hover:text-emerald-800 underline underline-offset-2"
            >
              Item terugzetten
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <Progress value={entries.length ? Math.round((checkedCount / entries.length) * 100) : 0} />
            </div>
            <div className="grid gap-1.5">
              {entries.map(e => (
                <label
                  key={e.id}
                  className={`flex items-center gap-3 rounded-xl p-3 text-sm transition-colors ${
                    canEdit ? 'cursor-pointer' : 'cursor-default'
                  } ${e.isChecked ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-700'}`}
                >
                  <input
                    type="checkbox"
                    checked={e.isChecked}
                    disabled={!canEdit}
                    onChange={ev => onToggle(e.id, ev.target.checked)}
                    className="accent-slate-900 w-4 h-4 flex-shrink-0"
                  />
                  <span className={e.isChecked ? 'line-through opacity-60' : ''}>{e.item}</span>
                  {e.isChecked
                    ? <CheckCircle2 size={14} className="ml-auto text-emerald-500 flex-shrink-0" />
                    : <AlertTriangle size={14} className="ml-auto text-slate-300 flex-shrink-0" />}
                </label>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
