import { useEffect, useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Users, LogOut, Layers, Search, ChevronRight, ArrowLeft,
  Laptop, Shield, CreditCard, Phone as PhoneIcon,
  PackageCheck, BarChart3, History, FileText,
  Settings, Building2, MapPin, UserPlus,
  Plus, Pencil, Trash2, X,
  Package, Activity, Archive, XCircle, CheckCircle2, Clock,
  MoreVertical, Wifi, Moon, Sun, ArrowLeftCircle,
  AlertTriangle, Smartphone, ChevronDown, Download,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserDetailPanel } from '@/components/UserDetailPanel'
import { AddUserModal } from '@/components/AddUserModal'
import { HardwareModal } from '@/components/HardwareModal'
import { LicenseModal } from '@/components/LicenseModal'
import { AddEmployeeModal } from '@/components/AddEmployeeModal'
import { PhoneModal } from '@/components/PhoneModal'
import { PhoneSetupWizard } from '@/components/PhoneSetupWizard'
import { SimCardModal } from '@/components/SimCardModal'
import { SubscriptionModal } from '@/components/SubscriptionModal'
import { DepartmentModal } from '@/components/DepartmentModal'
import { LocationModal } from '@/components/LocationModal'
import type { ClientUserListItem, ClientUserDetailResponse } from '@/types/clientUser'
import { STATUS_LABEL, STATUS_TONE } from '@/types/clientUser'
import type { HardwareAssetListItem } from '@/types/hardware'
import { HARDWARE_STATUS_LABEL, HARDWARE_STATUS_TONE, HARDWARE_TYPE_LABEL } from '@/types/hardware'
import type { LicenseListItem, LicenseUserDto } from '@/types/license'
import { LICENSE_TYPE_LABEL, LICENSE_TYPE_TONE } from '@/types/license'
import type { PhoneListItem, PhoneHistoryItem } from '@/types/phone'
import { PHONE_STATUS_LABEL, PHONE_STATUS_TONE } from '@/types/phone'
import type { SimCardListItem } from '@/types/simcard'
import { SIM_STATUS_LABEL, SIM_STATUS_TONE, SIM_TYPE_LABEL } from '@/types/simcard'
import type { SubscriptionListItem } from '@/types/subscription'
import { SUB_STATUS_LABEL, SUB_STATUS_TONE, SUB_TYPE_LABEL } from '@/types/subscription'
import type { DepartmentListItem, DepartmentDetailResponse } from '@/types/department'
import type { LocationListItem, LocationDetailResponse } from '@/types/location'
import type { SoftwareListItem } from '@/types/software'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

// ── Types ─────────────────────────────────────────────────────────────────────

type View =
  | 'employees' | 'employee-detail'
  | 'departments' | 'locations'
  | 'hardware' | 'software' | 'phones'
  | 'starter-checklist' | 'leaver-checklist'
  | 'overviews' | 'history' | 'contracts'
  | 'settings' | 'help'

const VIEW_TITLES: Record<View, string> = {
  employees: 'Medewerkers',
  'employee-detail': 'Medewerker details',
  departments: 'Afdelingen',
  locations: 'Locaties',
  hardware: 'Hardware',
  software: 'Software',
  phones: 'Telefonie',
  'starter-checklist': 'Aantreden checklist',
  'leaver-checklist': 'Checklist uit dienst',
  overviews: 'Overzichten',
  history: 'Historie',
  contracts: 'Contracten',
  settings: 'Instellingen',
  help: 'Help',
}

// ── Sidebar helpers ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {label}
    </p>
  )
}

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Avatar({ first, last, size = 32 }: { first: string; last: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {(first[0] ?? '').toUpperCase()}{(last[0] ?? '').toUpperCase()}
    </div>
  )
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Layers size={28} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-xs text-slate-400 mt-1">Komt binnenkort beschikbaar</p>
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, tone = 'default' }: {
  label: string; value: number; icon: React.ReactNode; tone?: string
}) {
  const iconTones: Record<string, string> = {
    default: 'bg-slate-100 text-slate-500',
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    slate: 'bg-slate-100 text-slate-400',
    blue: 'bg-blue-100 text-blue-600',
  }
  return (
    <div className="bg-white rounded-2xl px-5 py-4 border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconTones[tone] ?? iconTones.default}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── History helpers ───────────────────────────────────────────────────────────

interface AuditEntry {
  id: string
  action: string
  changes: string | null
  userName: string | null
  createdAt: string
}

function parseAuditChanges(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

function hardwareAuditLabel(entry: AuditEntry): string {
  const c = parseAuditChanges(entry.changes)
  switch (entry.action) {
    case 'Created': return 'Hardware aangemaakt'
    case 'Deleted': return 'Hardware verwijderd'
    case 'Updated':
      if ('Status' in c) return 'Status gewijzigd'
      if ('AssignedToUserId' in c) return 'Toewijzing gewijzigd'
      return 'Hardware bijgewerkt'
    default: return entry.action
  }
}

function licenseAuditLabel(entry: AuditEntry): string {
  switch (entry.action) {
    case 'Created':      return 'Licentie aangemaakt'
    case 'Deleted':      return 'Licentie verwijderd'
    case 'Updated':      return 'Licentie bijgewerkt'
    case 'UserAssigned': return 'Gebruiker toegewezen'
    case 'UserRevoked':  return 'Gebruiker ingetrokken'
    default: return entry.action
  }
}

const LICENSE_FIELD_LABEL: Record<string, string> = {
  Name: 'Naam', Vendor: 'Leverancier', Type: 'Type',
  MaxUsers: 'Max. seats', StartsAt: 'Startdatum', ExpiresAt: 'Vervaldatum',
  IsActive: 'Actief', Notes: 'Notities',
}

function licenseDescriptionFn(entry: AuditEntry): string {
  const c = parseAuditChanges(entry.changes)
  if (entry.action === 'Created') {
    const parts: string[] = []
    for (const [k, v] of Object.entries(c)) {
      if (k.startsWith('_') || v === null || v === undefined || v === '') continue
      const label = LICENSE_FIELD_LABEL[k] ?? k
      const val = (k === 'StartsAt' || k === 'ExpiresAt') && typeof v === 'string'
        ? new Date(v).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : k === 'IsActive' ? (v ? 'Ja' : 'Nee') : String(v)
      parts.push(`${label}: ${val}`)
    }
    return parts.join('\n')
  }
  if (entry.action === 'Updated') {
    const parts: string[] = []
    for (const [k, v] of Object.entries(c)) {
      if (k.startsWith('_') || !Array.isArray(v)) continue
      const label = LICENSE_FIELD_LABEL[k] ?? k
      const fmt = (raw: unknown) => {
        if (raw === null || raw === undefined) return '—'
        if ((k === 'StartsAt' || k === 'ExpiresAt') && typeof raw === 'string')
          return new Date(raw).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
        if (k === 'IsActive') return raw ? 'Ja' : 'Nee'
        return String(raw)
      }
      const oldStr = fmt(v[0])
      const newStr = fmt(v[1])
      if (oldStr !== newStr) parts.push(`${label}: ${oldStr} → ${newStr}`)
    }
    return parts.join('\n')
  }
  return ''
}

function softwareAuditLabel(entry: AuditEntry): string {
  switch (entry.action) {
    case 'Created': return 'Software aangemaakt'
    case 'Deleted': return 'Software verwijderd'
    case 'Updated': return 'Software bijgewerkt'
    default: return entry.action
  }
}

const SW_FIELD_LABEL: Record<string, string> = {
  Name: 'Naam', Publisher: 'Uitgever', Vendor: 'Leverancier',
  IsPaid: 'Type', LicenseId: 'Licentie',
}

function softwareDescriptionFn(entry: AuditEntry): string {
  const c = parseAuditChanges(entry.changes)
  if (entry.action === 'Created') {
    const parts: string[] = []
    for (const [k, v] of Object.entries(c)) {
      if (k.startsWith('_') || v === null || v === undefined || v === '') continue
      const label = SW_FIELD_LABEL[k] ?? k
      const val = k === 'IsPaid' ? (v ? 'Betaald' : 'Gratis') : String(v)
      parts.push(`${label}: ${val}`)
    }
    return parts.join('\n')
  }
  if (entry.action === 'Updated') {
    const parts: string[] = []
    for (const [k, v] of Object.entries(c)) {
      if (k.startsWith('_') || !Array.isArray(v)) continue
      const label = SW_FIELD_LABEL[k] ?? k
      const fmt = (raw: unknown) => {
        if (raw === null || raw === undefined) return '—'
        if (k === 'IsPaid') return raw ? 'Betaald' : 'Gratis'
        return String(raw)
      }
      const oldStr = fmt(v[0])
      const newStr = fmt(v[1])
      if (oldStr !== newStr) parts.push(`${label}: ${oldStr} → ${newStr}`)
    }
    return parts.join('\n')
  }
  return ''
}

function fmtAuditDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function HistoryBlock({ entityType, entityId, labelFn, descriptionFn }: {
  entityType: string
  entityId: string
  labelFn: (entry: AuditEntry) => string
  descriptionFn?: (entry: AuditEntry) => string
}) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const [showAllModal, setShowAllModal] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get<AuditEntry[]>(`/portal/history/${entityType}/${entityId}`)
      .then(r => setEntries(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [entityType, entityId])

  return (
    <>
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
            <History size={12} /> Historie
          </p>
          {entries.length > 5 && (
            <button onClick={() => setShowAllModal(true)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Alles bekijken ({entries.length})
            </button>
          )}
        </div>
        {loading ? (
          <p className="text-xs text-slate-400">Laden…</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-slate-400">Nog geen activiteiten.</p>
        ) : (
          <div className="space-y-1">
            {entries.slice(0, 5).map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedEntry(e)}
                className="w-full text-left rounded-lg bg-slate-50 hover:bg-blue-50 px-3 py-2 transition-colors cursor-pointer group"
              >
                <p className="text-xs font-medium text-slate-700 group-hover:text-blue-700">{labelFn(e)}</p>
                <p className="text-xs text-slate-400">{fmtAuditDate(e.createdAt)}{e.userName ? ` · ${e.userName}` : ''}</p>
              </button>
            ))}
            {entries.length > 5 && (
              <button onClick={() => setShowAllModal(true)} className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium py-1">
                + {entries.length - 5} meer bekijken
              </button>
            )}
          </div>
        )}
      </div>

      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-backdrop-animated">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] modal-panel-animated">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-base font-bold text-slate-900">Volledige geschiedenis</h2>
              <button onClick={() => setShowAllModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <div className="space-y-2">
                {entries.map(e => {
                  const desc = descriptionFn?.(e) ?? ''
                  return (
                    <div key={e.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{labelFn(e)}</p>
                      {desc && (
                        <div className="mt-1.5 space-y-0.5">
                          {desc.split('\n').map((line, i) => (
                            <p key={i} className="text-xs text-slate-600 leading-snug">{line}</p>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-1.5">
                        {fmtAuditDate(e.createdAt)}{e.userName ? ` · ${e.userName}` : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-backdrop-animated">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-panel-animated">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">{labelFn(selectedEntry)}</h2>
              <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              {(() => {
                const desc = descriptionFn?.(selectedEntry) ?? ''
                return desc ? (
                  <div className="space-y-1 mb-4">
                    {desc.split('\n').map((line, i) => (
                      <p key={i} className="text-sm text-slate-700 leading-snug">{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 mb-4">Geen aanvullende details.</p>
                )
              })()}
              <p className="text-xs text-slate-400">
                {fmtAuditDate(selectedEntry.createdAt)}{selectedEntry.userName ? ` · ${selectedEntry.userName}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Item history block (phones / simcards / subscriptions) ────────────────────
// Uses endpoints that return { id, occurredAt, summary, description, performedBy }

function ItemHistoryBlock({ url, subtitle }: { url: string; subtitle?: string }) {
  const [entries, setEntries] = useState<PhoneHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<PhoneHistoryItem | null>(null)
  const [showAllModal, setShowAllModal] = useState(false)

  function fmtDT(d: string) {
    return new Date(d).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    setLoading(true)
    api.get<PhoneHistoryItem[]>(url)
      .then(r => setEntries(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [url])

  return (
    <>
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
            <History size={12} /> Historie
          </p>
          {entries.length > 5 && (
            <button onClick={() => setShowAllModal(true)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Alles bekijken ({entries.length})
            </button>
          )}
        </div>
        {loading ? (
          <p className="text-xs text-slate-400">Laden…</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-slate-400">Nog geen activiteiten.</p>
        ) : (
          <div className="space-y-1">
            {entries.slice(0, 5).map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedEntry(e)}
                className="w-full text-left rounded-lg bg-slate-50 hover:bg-blue-50 px-3 py-2 transition-colors cursor-pointer group"
              >
                <p className="text-xs font-medium text-slate-700 group-hover:text-blue-700">{e.summary}</p>
                <p className="text-xs text-slate-400 mt-0.5">{fmtDT(e.occurredAt)}{e.performedBy ? ` · ${e.performedBy}` : ''}</p>
              </button>
            ))}
            {entries.length > 5 && (
              <button onClick={() => setShowAllModal(true)} className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium py-1">
                + {entries.length - 5} meer bekijken
              </button>
            )}
          </div>
        )}
      </div>

      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-backdrop-animated">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] modal-panel-animated">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">Volledige geschiedenis</h2>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={() => setShowAllModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <div className="space-y-2">
                {entries.map(e => (
                  <div key={e.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">{e.summary}</p>
                    {e.description && (
                      <div className="mt-1.5 space-y-0.5">
                        {e.description.split('\n').map((line, i) => (
                          <p key={i} className="text-xs text-slate-600 leading-snug">{line}</p>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5">
                      {fmtDT(e.occurredAt)}{e.performedBy ? ` · ${e.performedBy}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-backdrop-animated">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-panel-animated">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">{selectedEntry.summary}</h2>
              <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              {selectedEntry.description ? (
                <div className="space-y-1 mb-4">
                  {selectedEntry.description.split('\n').map((line, i) => (
                    <p key={i} className="text-sm text-slate-700 leading-snug">{line}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 mb-4">Geen aanvullende details.</p>
              )}
              <p className="text-xs text-slate-400">
                {fmtDT(selectedEntry.occurredAt)}{selectedEntry.performedBy ? ` · ${selectedEntry.performedBy}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Hardware detail panel ─────────────────────────────────────────────────────

function HardwareDetailPanel({ asset, onEdit, onDelete, historyKey }: {
  asset: HardwareAssetListItem
  onEdit: () => void
  onDelete: () => void
  historyKey: number
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-5 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">{asset.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {asset.brand || '—'} • {HARDWARE_TYPE_LABEL[asset.type] ?? asset.type}
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${HARDWARE_STATUS_TONE[asset.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {HARDWARE_STATUS_LABEL[asset.status] ?? asset.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-slate-600">
            {asset.assetNumber && <p><span className="text-slate-400">Assetnummer</span><br /><span className="font-medium text-slate-800">{asset.assetNumber}</span></p>}
            {asset.serialNumber && <p><span className="text-slate-400">Serienummer</span><br /><span className="font-medium text-slate-800">{asset.serialNumber}</span></p>}
            {asset.location && <p><span className="text-slate-400">Locatie</span><br /><span className="font-medium text-slate-800">{asset.location}</span></p>}
            {asset.purchaseValue != null && <p><span className="text-slate-400">Aanschafwaarde</span><br /><span className="font-medium text-slate-800">€ {asset.purchaseValue.toFixed(2)}</span></p>}
            {asset.supplier && <p><span className="text-slate-400">Leverancier</span><br /><span className="font-medium text-slate-800">{asset.supplier}</span></p>}
            {asset.assignedToName && <p className="col-span-2"><span className="text-slate-400">Toegewezen aan</span><br /><span className="font-medium text-slate-800">{asset.assignedToName}</span></p>}
            {asset.issuedAt && <p><span className="text-slate-400">Uitgiftedatum</span><br /><span className="font-medium text-slate-800">{fmt(asset.issuedAt)}</span></p>}
            {asset.returnedAt && <p><span className="text-slate-400">Inleverdatum</span><br /><span className="font-medium text-slate-800">{fmt(asset.returnedAt)}</span></p>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={onEdit}>
              <Pencil size={13} /> Wijzigen
            </Button>
            {!confirmDelete ? (
              <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={13} /> Verwijderen
              </Button>
            ) : (
              <>
                <span className="flex items-center text-xs text-red-700 font-medium">Zeker weten?</span>
                <Button size="sm" variant="danger" onClick={() => { setConfirmDelete(false); onDelete() }}>
                  Ja, verwijder
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>
                  Nee
                </Button>
              </>
            )}
          </div>

          <ItemHistoryBlock
            key={`${asset.id}-${historyKey}`}
            url={`/portal/hardware/${asset.id}/history`}
            subtitle={`${asset.brand} ${asset.name}`}
          />
        </CardContent>
      </Card>
    </>
  )
}

// ── Hardware view ─────────────────────────────────────────────────────────────

function HardwareView({ teammates }: { teammates: ClientUserListItem[] }) {
  const [assets, setAssets] = useState<HardwareAssetListItem[]>([])
  const [locations, setLocations] = useState<LocationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<HardwareAssetListItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<HardwareAssetListItem | null>(null)
  const [historyKey, setHistoryKey] = useState(0)

  const fetchAssets = useCallback(async () => {
    try {
      const [assetsRes, locationsRes] = await Promise.all([
        api.get<HardwareAssetListItem[]>('/portal/hardware'),
        api.get<LocationListItem[]>('/portal/locations'),
      ])
      setAssets(assetsRes.data)
      setLocations(locationsRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  useEffect(() => {
    if (selected) {
      const updated = assets.find(a => a.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [assets])

  const filtered = assets.filter(a =>
    `${a.name} ${a.brand} ${a.assetNumber} ${a.serialNumber} ${a.assignedToName ?? ''} ${a.location}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const totaal = assets.length
  const inGebruik = assets.filter(a => a.status === 'InUse').length
  const opVoorraad = assets.filter(a => a.status === 'InStock').length
  const afgeschreven = assets.filter(a => a.status === 'Decommissioned').length

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/hardware/${id}`)
    setAssets(prev => prev.filter(a => a.id !== id))
    if (selected?.id === id) setSelected(null)
    setHistoryKey(k => k + 1)
  }

  const handleOpenAdd = () => { setEditTarget(null); setShowModal(true) }
  const handleOpenEdit = (asset: HardwareAssetListItem) => { setEditTarget(asset); setShowModal(true) }
  const handleSaved = async () => { await fetchAssets(); setShowModal(false); setHistoryKey(k => k + 1) }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Totaal" value={totaal} icon={<Package size={18} />} />
        <StatCard label="In gebruik" value={inGebruik} icon={<Activity size={18} />} tone="emerald" />
        <StatCard label="Op voorraad" value={opVoorraad} icon={<Archive size={18} />} tone="blue" />
        <StatCard label="Afgeschreven" value={afgeschreven} icon={<XCircle size={18} />} tone="slate" />
      </div>

      {/* Grid: [zoekbalk | —] [tabel | detail] */}
      <div className="grid grid-cols-[1fr_20%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek hardware…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus size={13} /> Toevoegen
          </Button>
        </div>
        <div />

        <Card className="overflow-hidden flex flex-col min-h-0">
            <div className="grid grid-cols-[1fr_1.2fr_2fr_1.2fr_1fr_1.5fr_0.9fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
              {['Type', 'Merk', 'Naam', 'Serienummer', 'Leverancier', 'Toegewezen aan', 'Status'].map(h => (
                <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <Laptop size={36} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm text-slate-400">
                    {search ? 'Geen resultaten gevonden.' : 'Nog geen hardware toegevoegd.'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map(a => (
                    <li
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className={`grid grid-cols-[1fr_1.2fr_2fr_1.2fr_1fr_1.5fr_0.9fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${
                        selected?.id === a.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <p className="text-xs text-slate-600 truncate">{HARDWARE_TYPE_LABEL[a.type] ?? a.type}</p>
                      <p className="text-xs text-slate-600 truncate">{a.brand || '—'}</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.name}</p>
                      <p className="text-xs text-slate-600 truncate tabular-nums">{a.serialNumber || '—'}</p>
                      <p className="text-xs text-slate-600 truncate">{a.supplier || '—'}</p>
                      <p className="text-xs text-slate-600 truncate">{a.assignedToName || '—'}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate ${HARDWARE_STATUS_TONE[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {HARDWARE_STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
        </Card>

        <div className="min-h-0 overflow-y-auto">
          {selected ? (
            <HardwareDetailPanel
              asset={selected}
              onEdit={() => handleOpenEdit(selected)}
              onDelete={() => handleDelete(selected.id)}
              historyKey={historyKey}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Laptop size={28} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Selecteer een item om de details te zien</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <HardwareModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSaved}
        teammates={teammates}
        locations={locations}
        asset={editTarget}
      />
    </div>
  )
}

// ── License detail panel ──────────────────────────────────────────────────────

function LicenseDetailPanel({ license, teammates, onEdit, onDelete, onAssign, onRevoke }: {
  license: LicenseListItem
  teammates: ClientUserListItem[]
  onEdit: () => void
  onDelete: () => void
  onAssign: (userId: string) => void
  onRevoke: (userId: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [assignUserId, setAssignUserId] = useState('')

  const assignableUsers = teammates.filter(t => !license.users.some(u => u.userId === t.id))
  const isUnlimited = license.maxUsers === 0
  const seatsLeft = isUnlimited ? null : license.maxUsers - license.assignedUsers
  const isExpired = license.expiresAt ? new Date(license.expiresAt) < new Date() : false

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function daysUntil(d: string | null | undefined): number | null {
    if (!d) return null
    const diff = new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
    return Math.ceil(diff / 86_400_000)
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">{license.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{license.vendor || '—'}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LICENSE_TYPE_TONE[license.type] ?? 'bg-slate-100 text-slate-600'}`}>
              {LICENSE_TYPE_LABEL[license.type] ?? license.type}
            </span>
            {!license.isActive && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Inactief</span>
            )}
            {isExpired && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Verlopen</span>
            )}
          </div>
        </div>

        {/* Seats bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Gebruikers</span>
            {isUnlimited
              ? <span className="font-semibold">{license.assignedUsers} <span className="font-normal text-slate-400">/ onbeperkt</span></span>
              : <span className="font-semibold">{license.assignedUsers} / {license.maxUsers}</span>
            }
          </div>
          {!isUnlimited && (
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className={`h-2 rounded-full transition-all ${license.assignedUsers >= license.maxUsers ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (license.assignedUsers / license.maxUsers) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400 mb-0.5">Startdatum</p>
            <p className="text-sm font-medium text-slate-800">{fmt(license.startsAt)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400 mb-0.5">Vervaldatum</p>
            <p className={`text-sm font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-slate-800'}`}>{fmt(license.expiresAt)}</p>
            {license.expiresAt && (() => {
              const days = daysUntil(license.expiresAt)
              if (days === null) return null
              const soon = days >= 0 && days <= 30
              return (
                <p className={`text-xs mt-0.5 ${days < 0 ? 'text-red-500' : soon ? 'text-amber-500' : 'text-slate-400'}`}>
                  {days < 0
                    ? `Verlopen (${Math.abs(days)} dagen geleden)`
                    : days === 0 ? 'Verloopt vandaag'
                    : `Nog ${days} dag${days === 1 ? '' : 'en'}`}
                </p>
              )
            })()}
          </div>
          {license.supplier && (
            <div className="rounded-xl bg-slate-50 p-3 col-span-2">
              <p className="text-xs text-slate-400 mb-0.5">Leverancier</p>
              <p className="text-sm font-medium text-slate-800">{license.supplier}</p>
            </div>
          )}
        </div>

        {/* Assign user */}
        {seatsLeft > 0 && assignableUsers.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Gebruiker toewijzen</p>
            <div className="flex gap-2">
              <select
                value={assignUserId}
                onChange={e => setAssignUserId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="">— Selecteer medewerker —</option>
                {assignableUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
              <Button
                size="sm"
                disabled={!assignUserId}
                onClick={() => { if (assignUserId) { onAssign(assignUserId); setAssignUserId('') } }}
              >
                <Plus size={13} /> Toewijzen
              </Button>
            </div>
          </div>
        )}

        {/* Assigned users */}
        {license.users.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Toegewezen gebruikers ({license.users.length})</p>
            <ul className="space-y-1.5">
              {license.users.map(u => (
                <li key={u.userLicenseId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <button
                    onClick={() => onRevoke(u.userId)}
                    className="ml-2 flex-shrink-0 text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Intrekken
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {license.users.length === 0 && (
          <p className="text-sm text-slate-400">Nog geen gebruikers toegewezen.</p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <Pencil size={13} /> Wijzigen
          </Button>
          {!confirmDelete ? (
            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={13} /> Verwijderen
            </Button>
          ) : (
            <>
              <span className="flex items-center text-xs text-red-700 font-medium">Zeker weten?</span>
              <Button size="sm" variant="danger" onClick={() => { setConfirmDelete(false); onDelete() }}>
                Ja, verwijder
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>
                Nee
              </Button>
            </>
          )}
        </div>

        <HistoryBlock entityType="License" entityId={license.id} labelFn={licenseAuditLabel} descriptionFn={licenseDescriptionFn} />
      </CardContent>
    </Card>
  )
}

// ── Software view ─────────────────────────────────────────────────────────────

type SoftwareTab = 'catalog' | 'licenties' | 'toewijzing'

// ── Software wizard schemas ────────────────────────────────────────────────────

const swStep1Schema = z.object({
  name:        z.string().min(1, 'Naam is verplicht'),
  publisher:   z.string().min(1, 'Uitgever is verplicht'),
  vendor:      z.string(),
  isPaid:      z.boolean(),
  trackUsers:  z.boolean(),
})
const swStep2Schema = z.object({
  maxUsers:  z.string().min(1, 'Aantal seats is verplicht'),
  vendor:    z.string(),
  supplier:  z.string(),
  startsAt:  z.string(),
  expiresAt: z.string().min(1, 'Vervaldatum is verplicht'),
})
type SwStep1Values = z.infer<typeof swStep1Schema>
type SwStep2Values = z.infer<typeof swStep2Schema>

// ── SoftwareWizard ─────────────────────────────────────────────────────────────

function SoftwareWizard({
  editTarget,
  onClose,
  onSaved,
}: {
  editTarget: SoftwareListItem | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!editTarget
  const [step, setStep]                       = useState<1 | 2>(1)
  const [step1Data, setStep1Data]             = useState<SwStep1Values | null>(null)
  const [saving, setSaving]                   = useState(false)
  const [apiError, setApiError]               = useState<string | null>(null)
  const [licenseMode, setLicenseMode]         = useState<'select' | 'create' | null>(null)
  const [licenses, setLicenses]               = useState<LicenseListItem[]>([])
  const [selectedLicense, setSelectedLicense] = useState<LicenseListItem | null>(null)
  const [licenseSearch, setLicenseSearch]     = useState('')
  const [loadingLicenses, setLoadingLicenses] = useState(false)

  const form1 = useForm<SwStep1Values>({
    resolver: zodResolver(swStep1Schema),
    defaultValues: {
      name:        editTarget?.name ?? '',
      publisher:   editTarget?.publisher ?? '',
      vendor:      editTarget?.vendor ?? '',
      isPaid:      editTarget?.isPaid ?? false,
      trackUsers:  false,
    },
  })
  const form2 = useForm<SwStep2Values>({
    resolver: zodResolver(swStep2Schema),
    defaultValues: {
      maxUsers:  '',
      vendor:    '',
      supplier:  '',
      startsAt:  new Date().toISOString().slice(0, 10),
      expiresAt: '',
    },
  })

  const isPaid      = form1.watch('isPaid')
  const trackUsers  = form1.watch('trackUsers')

  const handleStep1 = form1.handleSubmit(async (values) => {
    setApiError(null)
    if (isEdit) {
      setSaving(true)
      try {
        await api.put(`/portal/software/${editTarget!.id}`, {
          name:      values.name.trim(),
          publisher: values.publisher.trim(),
          vendor:    values.vendor.trim() || null,
        })
        onSaved()
      } catch (err: unknown) {
        setApiError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Er is iets misgegaan.')
      } finally { setSaving(false) }
      return
    }
    if (!values.isPaid) {
      setSaving(true)
      try {
        await api.post('/portal/software', {
          name:        values.name.trim(),
          publisher:   values.publisher.trim(),
          vendor:      values.vendor.trim() || null,
          isPaid:      false,
          trackUsers:  values.trackUsers,
        })
        onSaved()
      } catch (err: unknown) {
        setApiError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Er is iets misgegaan.')
      } finally { setSaving(false) }
      return
    }
    setStep1Data(values)
    setStep(2)
  })

  const handleStep2 = form2.handleSubmit(async (values) => {
    if (!step1Data) return
    setSaving(true)
    setApiError(null)
    try {
      await api.post('/portal/software', {
        name:             step1Data.name.trim(),
        publisher:        step1Data.publisher.trim(),
        vendor:           step1Data.vendor.trim() || null,
        isPaid:           true,
        licenseMaxUsers:  Number(values.maxUsers),
        licenseVendor:    values.vendor.trim() || null,
        licenseSupplier:  values.supplier.trim() || null,
        licenseStartsAt:  values.startsAt,
        licenseExpiresAt: values.expiresAt || null,
      })
      onSaved()
    } catch (err: unknown) {
      setApiError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Er is iets misgegaan.')
    } finally { setSaving(false) }
  })

  const handleSelectExistingLicense = async () => {
    if (!step1Data || !selectedLicense) return
    setSaving(true)
    setApiError(null)
    try {
      await api.post('/portal/software', {
        name:              step1Data.name.trim(),
        publisher:         step1Data.publisher.trim(),
        vendor:            step1Data.vendor.trim() || null,
        isPaid:            true,
        existingLicenseId: selectedLicense.id,
      })
      onSaved()
    } catch (err: unknown) {
      setApiError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Er is iets misgegaan.')
    } finally { setSaving(false) }
  }

  useEffect(() => {
    if (step !== 2) return
    setLoadingLicenses(true)
    api.get<LicenseListItem[]>('/portal/licenses')
      .then(r => setLicenses(r.data))
      .catch(() => {})
      .finally(() => setLoadingLicenses(false))
  }, [step])

  const filteredLicenses = licenses.filter(l =>
    `${l.name} ${l.vendor}`.toLowerCase().includes(licenseSearch.toLowerCase())
  )

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-400'
  const labelCls = 'block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-backdrop-animated">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col modal-panel-animated">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              {isEdit ? 'Software bewerken' : step === 1 ? 'Software toevoegen' : 'Licentie koppelen'}
            </h2>
            {!isEdit && isPaid && (
              <div className="flex items-center gap-2 mt-2">
                {[{ n: 1, l: 'Software' }, { n: 2, l: 'Licentie' }].map((s, i) => (
                  <div key={s.n} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight size={12} className="text-slate-300" />}
                    <div className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                      step >= s.n ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500'
                    }`}>{s.n}</div>
                    <span className={`text-xs ${step >= s.n ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>{s.l}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>Naam <span className="text-red-500">*</span></label>
              <input {...form1.register('name')} placeholder="bijv. Microsoft Office" className={inputCls} />
              {form1.formState.errors.name && <p className="mt-1 text-xs text-red-500">{form1.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Uitgever <span className="text-red-500">*</span></label>
              <input {...form1.register('publisher')} placeholder="bijv. Microsoft" className={inputCls} />
              {form1.formState.errors.publisher && <p className="mt-1 text-xs text-red-500">{form1.formState.errors.publisher.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Leverancier <span className="text-slate-400">(optioneel)</span></label>
              <input {...form1.register('vendor')} placeholder="bijv. SoftwareOne" className={inputCls} />
            </div>

            {!isEdit && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button type="button" onClick={() => { form1.setValue('isPaid', false); form1.setValue('trackUsers', false) }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        !isPaid ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                      }`}>
                      <CheckCircle2 size={22} className={!isPaid ? 'text-emerald-600' : 'text-slate-300'} />
                      <span className={`text-sm font-medium ${!isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>Gratis</span>
                      <span className="text-xs text-slate-400 text-center">Freeware / gratis tier</span>
                    </button>
                    <button type="button" onClick={() => { form1.setValue('isPaid', true); form1.setValue('trackUsers', false) }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isPaid ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                      }`}>
                      <CreditCard size={22} className={isPaid ? 'text-blue-600' : 'text-slate-300'} />
                      <span className={`text-sm font-medium ${isPaid ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}>Betaald</span>
                      <span className="text-xs text-slate-400 text-center">Licentie koppelen</span>
                    </button>
                  </div>
                </div>

                {/* Gebruikers bijhouden — alleen zichtbaar bij gratis software */}
                {!isPaid && (
                  <button
                    type="button"
                    onClick={() => form1.setValue('trackUsers', !trackUsers)}
                    className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all text-left ${
                      trackUsers
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${trackUsers ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        Gebruikers bijhouden
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {trackUsers ? 'Registreer wie deze software gebruikt' : 'Alleen registreren, geen licentiekosten'}
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full flex-shrink-0 transition-colors relative ${trackUsers ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${trackUsers ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  </button>
                )}
              </div>
            )}

            {apiError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3">
                <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Annuleren</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Opslaan…' : isEdit ? 'Opslaan' : isPaid ? 'Volgende →' : 'Toevoegen'}
              </Button>
            </div>
          </form>
        )}

        {/* Step 2 — Licentie */}
        {step === 2 && (
          <div className="px-6 py-5">

            {/* Mode choice */}
            {!licenseMode && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Wil je een bestaande licentie koppelen of een nieuwe aanmaken?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setLicenseMode('select')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                    <Archive size={22} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bestaande koppelen</span>
                    <span className="text-xs text-slate-400 text-center">Kies uit de bestaande licenties</span>
                  </button>
                  <button type="button" onClick={() => setLicenseMode('create')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                    <Plus size={22} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nieuwe aanmaken</span>
                    <span className="text-xs text-slate-400 text-center">Maak een nieuwe licentie aan</span>
                  </button>
                </div>
                <div className="flex justify-between pt-1">
                  <Button variant="secondary" type="button" onClick={() => setStep(1)}>← Terug</Button>
                  <Button variant="secondary" type="button" onClick={onClose}>Annuleren</Button>
                </div>
              </div>
            )}

            {/* Select existing license */}
            {licenseMode === 'select' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={licenseSearch}
                    onChange={e => setLicenseSearch(e.target.value)}
                    placeholder="Zoek licentie…"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600 divide-y divide-slate-100 dark:divide-slate-700">
                  {loadingLicenses ? (
                    <p className="text-sm text-slate-400 text-center p-4">Laden…</p>
                  ) : filteredLicenses.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center p-4">Geen licenties gevonden.</p>
                  ) : filteredLicenses.map(l => (
                    <button type="button" key={l.id}
                      onClick={() => setSelectedLicense(prev => prev?.id === l.id ? null : l)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                        selectedLicense?.id === l.id
                          ? 'bg-blue-50 dark:bg-blue-900/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${selectedLicense?.id === l.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>{l.name}</p>
                        <p className="text-xs text-slate-400 truncate">{l.vendor || '—'}{l.expiresAt ? ` · tot ${new Date(l.expiresAt).toLocaleDateString('nl-NL')}` : ''}</p>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-3 tabular-nums">
                        {l.assignedUsers} / {l.maxUsers}
                      </span>
                    </button>
                  ))}
                </div>
                {apiError && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3">
                    <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <Button variant="secondary" type="button" onClick={() => { setLicenseMode(null); setSelectedLicense(null) }} disabled={saving}>← Terug</Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Annuleren</Button>
                    <Button type="button" disabled={!selectedLicense || saving} onClick={handleSelectExistingLicense}>
                      {saving ? 'Opslaan…' : 'Koppelen'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Create new license */}
            {licenseMode === 'create' && (
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Aantal seats <span className="text-red-500">*</span></label>
                    <input {...form2.register('maxUsers')} type="number" min="1" placeholder="bijv. 25" className={inputCls} />
                    {form2.formState.errors.maxUsers && <p className="mt-1 text-xs text-red-500">{form2.formState.errors.maxUsers.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Startdatum <span className="text-slate-400">(optioneel)</span></label>
                    <input {...form2.register('startsAt')} type="date" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Vervaldatum <span className="text-red-500">*</span></label>
                  <input {...form2.register('expiresAt')} type="date" className={inputCls} />
                  {form2.formState.errors.expiresAt && <p className="mt-1 text-xs text-red-500">{form2.formState.errors.expiresAt.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Uitgever <span className="text-slate-400">(optioneel)</span></label>
                  <input {...form2.register('vendor')} placeholder="bijv. Microsoft" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Leverancier <span className="text-slate-400">(optioneel)</span></label>
                  <input {...form2.register('supplier')} placeholder="bijv. SoftwareOne" className={inputCls} />
                </div>
                {apiError && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3">
                    <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <Button variant="secondary" type="button" onClick={() => setLicenseMode(null)} disabled={saving}>← Terug</Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Annuleren</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Opslaan…' : 'Software aanmaken'}</Button>
                  </div>
                </div>
              </form>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

// ── Software detail panel ─────────────────────────────────────────────────────

function SoftwareDetailPanel({ software, teammates, onEdit, onDelete, onUsersChanged }: {
  software: SoftwareListItem
  teammates: ClientUserListItem[]
  onEdit: () => void
  onDelete: () => void
  onUsersChanged: () => void
}) {
  const [confirmDelete, setConfirmDelete]   = useState(false)
  const [licenseUsers, setLicenseUsers]     = useState<LicenseUserDto[]>([])
  const [loadingUsers, setLoadingUsers]     = useState(false)
  const [assignUserId, setAssignUserId]     = useState('')
  const [assigning, setAssigning]           = useState(false)

  const fetchLicenseUsers = useCallback(async () => {
    if (!software.licenseId) { setLicenseUsers([]); return }
    setLoadingUsers(true)
    try {
      const { data } = await api.get<LicenseListItem[]>('/portal/licenses')
      const match = data.find(l => l.id === software.licenseId)
      setLicenseUsers(match?.users ?? [])
    } finally { setLoadingUsers(false) }
  }, [software.licenseId])

  useEffect(() => { fetchLicenseUsers() }, [fetchLicenseUsers])

  const handleAssign = async (userId: string) => {
    if (!software.licenseId) return
    setAssigning(true)
    try {
      await api.post(`/portal/licenses/${software.licenseId}/assign`, { userId })
      setAssignUserId('')
      await fetchLicenseUsers()
      onUsersChanged()
    } finally { setAssigning(false) }
  }

  const handleRevoke = async (userId: string) => {
    if (!software.licenseId) return
    await api.delete(`/portal/licenses/${software.licenseId}/users/${userId}`)
    await fetchLicenseUsers()
    onUsersChanged()
  }

  const assignableUsers = teammates.filter(t => !licenseUsers.some(u => u.userId === t.id))
  const isUnlimited = software.maxUsers === 0
  const canAssign = isUnlimited || (software.maxUsers ?? 0) > (software.assignedUsers ?? 0)

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function daysUntil(d: string | null | undefined): number | null {
    if (!d) return null
    const diff = new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
    return Math.ceil(diff / 86_400_000)
  }

  const usedPct = software.maxUsers
    ? Math.min(100, ((software.assignedUsers ?? 0) / software.maxUsers) * 100)
    : 0

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{software.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{software.publisher}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
            software.isPaid
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
          }`}>
            {software.isPaid ? 'Betaald' : 'Gratis'}
          </span>
        </div>

        {/* Info grid */}
        <div className="space-y-2">
          {software.vendor && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
              <p className="text-xs text-slate-400 mb-0.5">Leverancier</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{software.vendor}</p>
            </div>
          )}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
            <p className="text-xs text-slate-400 mb-0.5">Toegevoegd op</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{fmt(software.createdAt)}</p>
          </div>
        </div>

        {/* Linked license — toon voor betaald én voor gratis-met-tracking */}
        {(software.isPaid || software.licenseId) && (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
              <CreditCard size={12} /> {software.isPaid ? 'Gekoppelde licentie' : 'Gebruikers bijhouden'}
            </p>
            {software.licenseId ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{software.licenseName || '—'}</p>
                {software.maxUsers === 0 ? (
                  // Onbeperkte (gratis) licentie — geen progress bar
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Gebruikers</span>
                    <span className="font-semibold">{software.assignedUsers ?? 0} <span className="font-normal text-slate-400">/ onbeperkt</span></span>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Seats gebruikt</span>
                      <span className="font-semibold">{software.assignedUsers ?? 0} / {software.maxUsers ?? 0}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-600">
                      <div
                        className={`h-1.5 rounded-full transition-all ${usedPct >= 100 ? 'bg-red-500' : usedPct >= 80 ? 'bg-amber-400' : 'bg-blue-500'}`}
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                  </div>
                )}
                {software.licenseExpiresAt && (() => {
                  const days = daysUntil(software.licenseExpiresAt)
                  const expired = days !== null && days < 0
                  const soon    = days !== null && days >= 0 && days <= 30
                  return (
                    <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Vervaldatum</span>
                        <span className="text-xs text-slate-500">{fmt(software.licenseExpiresAt)}</span>
                      </div>
                      {days !== null && (
                        <p className={`text-xs mt-0.5 ${expired ? 'text-red-500' : soon ? 'text-amber-500' : 'text-slate-400'}`}>
                          {expired
                            ? `Verlopen (${Math.abs(days)} dagen geleden)`
                            : days === 0
                            ? 'Verloopt vandaag'
                            : `Nog ${days} dag${days === 1 ? '' : 'en'}`}
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Geen licentie gekoppeld.</p>
            )}
          </div>
        )}

        {/* Gebruikers toewijzen — zichtbaar zodra er een licentie gekoppeld is */}
        {software.licenseId && (
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
              Toegewezen gebruikers
            </p>

            {/* Assign row */}
            {canAssign && assignableUsers.length > 0 && (
              <div className="flex gap-2 mb-3">
                <select
                  value={assignUserId}
                  onChange={e => setAssignUserId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-400"
                >
                  <option value="">— Selecteer medewerker —</option>
                  {assignableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
                <Button size="sm" disabled={!assignUserId || assigning} onClick={() => handleAssign(assignUserId)}>
                  <Plus size={13} /> {assigning ? '…' : 'Toewijzen'}
                </Button>
              </div>
            )}

            {/* Users list */}
            {loadingUsers ? (
              <p className="text-xs text-slate-400">Laden…</p>
            ) : licenseUsers.length === 0 ? (
              <p className="text-sm text-slate-400">Nog geen gebruikers toegewezen.</p>
            ) : (
              <ul className="space-y-1.5">
                {licenseUsers.map(u => (
                  <li key={u.userLicenseId} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{u.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <button
                      onClick={() => handleRevoke(u.userId)}
                      className="ml-2 flex-shrink-0 text-xs text-red-600 hover:text-red-800 dark:text-red-400 font-medium"
                    >
                      Intrekken
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <Pencil size={13} /> Wijzigen
          </Button>
          {!confirmDelete ? (
            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={13} /> Verwijderen
            </Button>
          ) : (
            <>
              <span className="flex items-center text-xs text-red-700 font-medium">Zeker weten?</span>
              <Button size="sm" variant="danger" onClick={() => { setConfirmDelete(false); onDelete() }}>
                Ja, verwijder
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>
                Nee
              </Button>
            </>
          )}
        </div>

        <HistoryBlock
          entityType="Software"
          entityId={software.id}
          labelFn={softwareAuditLabel}
          descriptionFn={softwareDescriptionFn}
        />
      </CardContent>
    </Card>
  )
}

// ── Software catalog tab ───────────────────────────────────────────────────────

function SoftwareCatalogTab({ teammates, tabBar }: { teammates: ClientUserListItem[], tabBar: React.ReactNode }) {
  const [software, setSoftware]     = useState<SoftwareListItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState<SoftwareListItem | null>(null)
  const [selected, setSelected]     = useState<SoftwareListItem | null>(null)

  const fetchSoftware = useCallback(async () => {
    try {
      const { data } = await api.get<SoftwareListItem[]>('/portal/software')
      setSoftware(data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSoftware() }, [fetchSoftware])

  useEffect(() => {
    if (selected) {
      const updated = software.find(s => s.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [software])

  const filtered = software.filter(s =>
    `${s.name} ${s.publisher} ${s.vendor ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/software/${id}`)
    setSoftware(prev => prev.filter(s => s.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const cols = 'grid-cols-[2fr_1fr_1fr_90px_90px]'

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <StatCard label="Totaal"  value={software.length}                        icon={<Shield size={18} />} />
        <StatCard label="Betaald" value={software.filter(s => s.isPaid).length}  icon={<CreditCard size={18} />} tone="blue" />
        <StatCard label="Gratis"  value={software.filter(s => !s.isPaid).length} icon={<CheckCircle2 size={18} />} tone="emerald" />
      </div>

      {tabBar}

      {/* Grid: [toolbar | —] [table | detail] */}
      <div className="grid grid-cols-[1fr_20%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek software…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-400"
            />
          </div>
          <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
            <Plus size={13} /> Software toevoegen
          </Button>
        </div>
        <div />

        {/* Table */}
        <Card className="overflow-hidden flex flex-col min-h-0">
          <div className={`grid ${cols} gap-3 px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex-shrink-0`}>
            {['Software', 'Uitgever', 'Leverancier', 'Type', 'Seats'].map(h => (
              <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <Shield size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-400">
                  {search ? 'Geen software gevonden.' : 'Nog geen software toegevoegd.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map(s => (
                  <li
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={`grid ${cols} gap-3 px-5 py-3.5 items-center cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      selected?.id === s.id ? 'bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{s.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{s.publisher || '—'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{s.vendor || '—'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${
                      s.isPaid
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}>
                      {s.isPaid ? 'Betaald' : 'Gratis'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {s.licenseId
                        ? s.maxUsers === 0
                          ? `${s.assignedUsers ?? 0} / ∞`
                          : `${s.assignedUsers ?? 0} / ${s.maxUsers ?? 0}`
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Detail panel */}
        <div className="min-h-0 overflow-y-auto">
          {selected ? (
            <SoftwareDetailPanel
              software={selected}
              teammates={teammates}
              onEdit={() => { setEditTarget(selected); setShowModal(true) }}
              onDelete={() => handleDelete(selected.id)}
              onUsersChanged={fetchSoftware}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Shield size={28} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Selecteer software</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <SoftwareWizard
          editTarget={editTarget}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchSoftware() }}
        />
      )}
    </div>
  )
}

function SoftwareToewijzingTab({ tabBar }: { tabBar: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full gap-3">
      {tabBar}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Toewijzingen</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Hier ziet u alle softwaretoewijzingen per medewerker, inclusief compliance-status.
          </p>
        </div>
      </div>
    </div>
  )
}

function SoftwareView({ teammates }: { teammates: ClientUserListItem[] }) {
  const [tab, setTab] = useState<SoftwareTab>('catalog')

  const tabBar = (
    <div className="flex gap-1 flex-shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
      {([
        { key: 'catalog',    label: 'Software' },
        { key: 'licenties',  label: 'Licenties' },
        { key: 'toewijzing', label: 'Toewijzing' },
      ] as { key: SoftwareTab; label: string }[]).map(t => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            tab === t.key
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="h-full">
      {tab === 'catalog'    && <SoftwareCatalogTab teammates={teammates} tabBar={tabBar} />}
      {tab === 'licenties'  && <LicenseView teammates={teammates} tabBar={tabBar} />}
      {tab === 'toewijzing' && <SoftwareToewijzingTab tabBar={tabBar} />}
    </div>
  )
}

// ── Overview view ─────────────────────────────────────────────────────────────

interface PortalOverview {
  employeeTotal: number; employeeInService: number; employeeLeavePlanned: number; employeeStartPlanned: number
  hardwareTotal: number; hardwareInUse: number; hardwareInStock: number; hardwareUnderRepair: number; hardwareTotalValue: number
  licenseTotal: number; licenseActive: number; licenseExpired: number; licenseTotalSeats: number; licenseUsedSeats: number
  softwareTotal: number; softwarePaid: number; softwareFree: number
  phoneTotal: number; phoneInUse: number; simCardTotal: number; simCardInUse: number
  subscriptionTotal: number; subscriptionActive: number; subscriptionMonthlyCost: number
}

function OverviewCard({
  title, icon, accentBar, iconCls,
  primary, primarySub,
  progress,
  stats,
}: {
  title: string
  icon: React.ReactNode
  accentBar: string
  iconCls: string
  primary: React.ReactNode
  primarySub: string
  progress?: { used: number; total: number; label: string; bar: string }
  stats: { label: string; value: React.ReactNode; tone?: string }[]
}) {
  const pct = progress && progress.total > 0
    ? Math.min(100, Math.round((progress.used / progress.total) * 100))
    : 0

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
      <div className={`h-1 ${accentBar}`} />
      <div className="p-5 flex flex-col flex-1 gap-4">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em]">{title}</p>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconCls}`}>{icon}</div>
        </div>

        {/* Primary metric */}
        <div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none">{primary}</p>
          <p className="text-xs text-slate-400 mt-1 leading-snug">{primarySub}</p>
        </div>

        {/* Optional progress bar */}
        {progress && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>{progress.label}</span>
              <span className="tabular-nums font-semibold">{progress.used} / {progress.total} <span className="font-normal">({pct}%)</span></span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${progress.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Sub-stats */}
        <div className={`mt-auto pt-3 border-t border-slate-100 dark:border-slate-700 grid gap-3`}
          style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
          {stats.map(s => (
            <div key={s.label}>
              <p className={`text-base font-bold tabular-nums leading-none ${s.tone ?? 'text-slate-800 dark:text-slate-200'}`}>{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OverviewView() {
  const [data, setData]           = useState<PortalOverview | null>(null)
  const [loading, setLoading]     = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api.get<PortalOverview>('/portal/overview')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await api.get('/portal/export', { responseType: 'blob' })
      const contentDisposition = response.headers['content-disposition'] as string | undefined
      const fileNameMatch = contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      const fileName = fileNameMatch?.[1]?.replace(/['"]/g, '') ?? 'RokaFlow_export.xlsx'
      const url = URL.createObjectURL(new Blob([response.data]))
      const a   = document.createElement('a')
      a.href    = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // silently ignore — user can retry
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-slate-400">Laden…</p>
      </div>
    )
  }
  if (!data) return null

  const fmt = (n: number) =>
    n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

  const hwPct  = data.hardwareTotal > 0 ? Math.round((data.hardwareInUse  / data.hardwareTotal)   * 100) : 0
  const licPct = data.licenseTotalSeats > 0 ? Math.round((data.licenseUsedSeats / data.licenseTotalSeats) * 100) : 0

  return (
    <div className="h-full overflow-y-auto pb-2">

      {/* Export toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Live overzicht van alle activa binnen deze organisatie
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                     bg-slate-800 text-white hover:bg-slate-700
                     dark:bg-slate-700 dark:hover:bg-slate-600
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          <Download size={13} className={exporting ? 'animate-bounce' : ''} />
          {exporting ? 'Exporteren…' : 'Exporteren naar Excel'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* Medewerkers */}
        <OverviewCard
          title="Medewerkers"
          icon={<Users size={15} />}
          accentBar="bg-emerald-500"
          iconCls="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
          primary={data.employeeTotal}
          primarySub="actieve medewerkers"
          stats={[
            { label: 'In dienst',       value: data.employeeInService },
            { label: 'Vertrek gepland', value: data.employeeLeavePlanned,
              tone: data.employeeLeavePlanned > 0 ? 'text-amber-600 dark:text-amber-400' : undefined },
            { label: 'Startend',        value: data.employeeStartPlanned,
              tone: data.employeeStartPlanned > 0 ? 'text-emerald-600 dark:text-emerald-400' : undefined },
          ]}
        />

        {/* Hardware */}
        <OverviewCard
          title="Hardware"
          icon={<Laptop size={15} />}
          accentBar="bg-amber-500"
          iconCls="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
          primary={data.hardwareTotal}
          primarySub={`assets · ${fmt(data.hardwareTotalValue)} totale waarde`}
          progress={{
            used: data.hardwareInUse, total: data.hardwareTotal,
            label: 'In gebruik',
            bar: hwPct >= 90 ? 'bg-red-500' : hwPct >= 70 ? 'bg-amber-400' : 'bg-amber-500',
          }}
          stats={[
            { label: 'In gebruik',   value: data.hardwareInUse },
            { label: 'Op voorraad',  value: data.hardwareInStock },
            { label: 'In reparatie', value: data.hardwareUnderRepair,
              tone: data.hardwareUnderRepair > 0 ? 'text-orange-600 dark:text-orange-400' : undefined },
          ]}
        />

        {/* Licenties */}
        <OverviewCard
          title="Licenties"
          icon={<CreditCard size={15} />}
          accentBar="bg-blue-500"
          iconCls="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
          primary={data.licenseTotal}
          primarySub={`licenties · ${data.licenseTotalSeats} seats totaal`}
          progress={{
            used: data.licenseUsedSeats, total: data.licenseTotalSeats,
            label: 'Seats in gebruik',
            bar: licPct >= 90 ? 'bg-red-500' : licPct >= 75 ? 'bg-amber-400' : 'bg-blue-500',
          }}
          stats={[
            { label: 'Actief',    value: data.licenseActive,
              tone: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Verlopen', value: data.licenseExpired,
              tone: data.licenseExpired > 0 ? 'text-red-600 dark:text-red-400' : undefined },
            { label: 'Seats vrij', value: Math.max(0, data.licenseTotalSeats - data.licenseUsedSeats) },
          ]}
        />

        {/* Software */}
        <OverviewCard
          title="Software"
          icon={<Shield size={15} />}
          accentBar="bg-indigo-500"
          iconCls="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
          primary={data.softwareTotal}
          primarySub="softwaretitels in de catalogus"
          stats={[
            { label: 'Betaald', value: data.softwarePaid,
              tone: 'text-blue-600 dark:text-blue-400' },
            { label: 'Gratis',  value: data.softwareFree,
              tone: 'text-emerald-600 dark:text-emerald-400' },
          ]}
        />

        {/* Telefonie */}
        <OverviewCard
          title="Telefonie"
          icon={<PhoneIcon size={15} />}
          accentBar="bg-violet-500"
          iconCls="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
          primary={data.phoneTotal + data.simCardTotal}
          primarySub={`${data.phoneTotal} telefoons · ${data.simCardTotal} SIM-kaarten`}
          stats={[
            { label: 'Telefoons in gebruik', value: data.phoneInUse },
            { label: "SIM's in gebruik",     value: data.simCardInUse },
            { label: 'Op voorraad',          value: (data.phoneTotal - data.phoneInUse) + (data.simCardTotal - data.simCardInUse) },
          ]}
        />

        {/* Abonnementen */}
        <OverviewCard
          title="Abonnementen"
          icon={<Activity size={15} />}
          accentBar="bg-orange-500"
          iconCls="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
          primary={fmt(data.subscriptionMonthlyCost)}
          primarySub="maandelijkse kosten (actieve abonnementen)"
          stats={[
            { label: 'Totaal',   value: data.subscriptionTotal },
            { label: 'Actief',   value: data.subscriptionActive,
              tone: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Inactief', value: data.subscriptionTotal - data.subscriptionActive,
              tone: (data.subscriptionTotal - data.subscriptionActive) > 0 ? 'text-slate-500' : undefined },
          ]}
        />

      </div>
    </div>
  )
}

// ── Tenant history view ───────────────────────────────────────────────────────

interface TenantHistoryItem {
  id: string
  occurredAt: string
  entityType: string
  action: string
  summary: string
  performedBy: string | null
}

type HistoryCategory = null | 'employees' | 'hardware' | 'software' | 'licenses' | 'phones'

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
    if (d.getTime() === today.getTime())     label = 'Vandaag'
    else if (d.getTime() === yesterday.getTime()) label = 'Gisteren'
    else label = new Date(item.occurredAt).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(item)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

const HISTORY_PAGE_SIZE = 50

function HistoryView() {
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

  const CHIPS: { key: HistoryCategory; label: string }[] = [
    { key: null,        label: 'Alles' },
    { key: 'employees', label: 'Medewerkers' },
    { key: 'hardware',  label: 'Hardware' },
    { key: 'software',  label: 'Software' },
    { key: 'licenses',  label: 'Licenties' },
    { key: 'phones',    label: 'Telefonie' },
  ]

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <StatCard label="Geladen"     value={items.length}  icon={<History size={18} />} />
        <StatCard label="Uitvoerders" value={uniqueActors}  icon={<Users size={18} />}    tone="blue" />
        <StatCard label="Vandaag"     value={todayCount}    icon={<Activity size={18} />} tone="emerald" />
      </div>

      {/* Filter chips + search */}
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

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
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

// ── License view ──────────────────────────────────────────────────────────────

function LicenseView({ teammates, tabBar }: { teammates: ClientUserListItem[], tabBar: React.ReactNode }) {
  const [licenses, setLicenses] = useState<LicenseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<LicenseListItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<LicenseListItem | null>(null)

  const fetchLicenses = useCallback(async () => {
    try {
      const { data } = await api.get<LicenseListItem[]>('/portal/licenses')
      setLicenses(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLicenses() }, [fetchLicenses])

  // Keep selected in sync after refresh
  useEffect(() => {
    if (selected) {
      const updated = licenses.find(l => l.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [licenses])

  const filtered = licenses.filter(l =>
    `${l.name} ${l.vendor} ${l.type}`.toLowerCase().includes(search.toLowerCase())
  )

  const totaal = licenses.length
  const actief = licenses.filter(l => l.isActive).length
  const verlopen = licenses.filter(l => l.expiresAt && new Date(l.expiresAt) < new Date()).length
  const beschikbaar = licenses.reduce((sum, l) => l.maxUsers === 0 ? sum : sum + Math.max(0, l.maxUsers - l.assignedUsers), 0)

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/licenses/${id}`)
    setLicenses(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const handleAssign = async (licenseId: string, userId: string) => {
    await api.post(`/portal/licenses/${licenseId}/assign`, { userId })
    await fetchLicenses()
  }

  const handleRevoke = async (licenseId: string, userId: string) => {
    await api.delete(`/portal/licenses/${licenseId}/users/${userId}`)
    await fetchLicenses()
  }

  const handleOpenAdd = () => { setEditTarget(null); setShowModal(true) }
  const handleOpenEdit = (l: LicenseListItem) => { setEditTarget(l); setShowModal(true) }
  const handleSaved = async () => { await fetchLicenses(); setShowModal(false) }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Totaal" value={totaal} icon={<CreditCard size={18} />} />
        <StatCard label="Actief" value={actief} icon={<CheckCircle2 size={18} />} tone="emerald" />
        <StatCard label="Verlopen" value={verlopen} icon={<Clock size={18} />} tone="amber" />
        <StatCard label="Seats beschikbaar" value={beschikbaar} icon={<Users size={18} />} tone="blue" />
      </div>

      {tabBar}

      {/* Grid: [zoekbalk | —] [tabel | detail] */}
      <div className="grid grid-cols-[1fr_20%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek licenties…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus size={13} /> Toevoegen
          </Button>
        </div>
        <div />

        <Card className="overflow-hidden flex flex-col min-h-0">
            <div className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1fr_0.7fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
              {['Naam', 'Leverancier', 'Seats', 'Beschikbaar', 'Vervaldatum', 'Status'].map(h => (
                <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <CreditCard size={36} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm text-slate-400">
                    {search ? 'Geen resultaten gevonden.' : 'Nog geen licenties toegevoegd.'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map(l => {
                    const isExpired   = l.expiresAt ? new Date(l.expiresAt) < new Date() : false
                    const isUnlimited = l.maxUsers === 0
                    const seatsLeft   = isUnlimited ? null : l.maxUsers - l.assignedUsers
                    const pct         = isUnlimited ? 0 : Math.min(100, (l.assignedUsers / l.maxUsers) * 100)
                    const barColor    = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
                    return (
                      <li
                        key={l.id}
                        onClick={() => setSelected(l)}
                        className={`grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1fr_0.7fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${
                          selected?.id === l.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                        }`}
                      >
                        {/* Naam + vendor */}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{l.name}</p>
                          <p className="text-xs text-slate-400 truncate">{l.vendor || '—'}</p>
                        </div>

                        {/* Leverancier */}
                        <p className="text-xs text-slate-600 truncate">{l.supplier || '—'}</p>

                        {/* Seats bar */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isUnlimited ? (
                            <span className="text-xs text-emerald-600 font-medium">Onbeperkt</span>
                          ) : (
                            <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </div>

                        {/* Beschikbaar */}
                        <p className={`text-xs tabular-nums font-medium ${seatsLeft === 0 ? 'text-red-600' : 'text-slate-700'}`}>
                          {isUnlimited ? `${l.assignedUsers} / ∞` : `${seatsLeft} / ${l.maxUsers}`}
                        </p>

                        {/* Vervaldatum */}
                        <p className={`text-xs tabular-nums ${isExpired ? 'text-red-500' : 'text-slate-500'}`}>
                          {l.expiresAt
                            ? new Date(l.expiresAt).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            : '—'}
                        </p>

                        {/* Status */}
                        {!l.isActive
                          ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium w-fit">Inactief</span>
                          : isExpired
                            ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium w-fit">Verlopen</span>
                            : <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium w-fit">Actief</span>
                        }
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
        </Card>

        <div className="min-h-0 overflow-y-auto">
          {selected ? (
            <LicenseDetailPanel
              license={selected}
              teammates={teammates}
              onEdit={() => handleOpenEdit(selected)}
              onDelete={() => handleDelete(selected.id)}
              onAssign={userId => handleAssign(selected.id, userId)}
              onRevoke={userId => handleRevoke(selected.id, userId)}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <CreditCard size={28} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Selecteer een licentie</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <LicenseModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSaved}
        teammates={teammates}
        license={editTarget}
      />
    </div>
  )
}

// ── Telefonie view (3 tabs) ───────────────────────────────────────────────────

type TelefonieTab = 'phones' | 'simcards' | 'subscriptions'

function TelefonieView({ teammates }: { teammates: ClientUserListItem[] }) {
  const [tab, setTab] = useState<TelefonieTab>('phones')
  const [totals, setTotals] = useState({
    subscriptions: 0,
    phonesInUse: 0,
    simCardsInUse: 0,
  })

  const fetchTotals = useCallback(async () => {
    try {
      const [phoneRes, simRes, subRes] = await Promise.all([
        api.get<PhoneListItem[]>('/portal/phones'),
        api.get<SimCardListItem[]>('/portal/simcards'),
        api.get<SubscriptionListItem[]>('/portal/subscriptions'),
      ])
      setTotals({
        subscriptions: subRes.data.length,
        phonesInUse: phoneRes.data.filter(p => p.status === 'InUse').length,
        simCardsInUse: simRes.data.filter(s => s.status === 'InUse').length,
      })
    } catch { /* negeer */ }
  }, [])

  useEffect(() => { fetchTotals() }, [fetchTotals])

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Totalen */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <StatCard label="Telefoons in gebruik" value={totals.phonesInUse} icon={<PhoneIcon size={18} />} tone="emerald" />
        <StatCard label="Abonnementen" value={totals.subscriptions} icon={<Layers size={18} />} tone="blue" />
        <StatCard label="Simkaarten in gebruik" value={totals.simCardsInUse} icon={<Wifi size={18} />} tone="blue" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 flex-shrink-0 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: 'phones', label: 'Mobiele Telefoons' },
          { key: 'subscriptions', label: 'Abonnementen' },
          { key: 'simcards', label: 'Simkaarten' },
        ] as { key: TelefonieTab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'phones' && <PhonesTab teammates={teammates} />}
      {tab === 'subscriptions' && <SubscriptionsTab />}
      {tab === 'simcards' && <SimCardsTab teammates={teammates} />}
    </div>
  )
}

// ── Phones tab ────────────────────────────────────────────────────────────────

function PhonesTab({ teammates }: { teammates: ClientUserListItem[] }) {
  const [phones, setPhones] = useState<PhoneListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<PhoneListItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<PhoneListItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)
  const [showWizard, setShowWizard] = useState(false)

  const fetchPhones = useCallback(async () => {
    try {
      const { data } = await api.get<PhoneListItem[]>('/portal/phones')
      setPhones(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPhones() }, [fetchPhones])

  useEffect(() => {
    if (selected) {
      const updated = phones.find(p => p.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [phones])

  const handleSelect = (p: PhoneListItem) => {
    setSelected(p)
    setConfirmDelete(false)
  }

  const filtered = phones.filter(p =>
    `${p.brand} ${p.model} ${p.serialNumber} ${p.imeiNumber} ${p.assignedToName ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/phones/${id}`)
    setPhones(prev => prev.filter(p => p.id !== id))
    setSelected(null)
    setConfirmDelete(false)
  }

  const handleSaved = async () => {
    await fetchPhones()
    setShowModal(false)
    setHistoryKey(k => k + 1)
  }

  const handleUnlinkSim = async (phoneId: string) => {
    const { data } = await api.delete<PhoneListItem>(`/portal/phones/${phoneId}/simcard`)
    setPhones(prev => prev.map(p => p.id === phoneId ? data : p))
    setSelected(data)
    setHistoryKey(k => k + 1)
  }

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Grid: [zoekbalk | —] [tabel | detail] */}
      <div className="grid grid-cols-[1fr_22%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek telefoons…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
            <Plus size={13} /> Toevoegen
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowWizard(true)}>
            <Layers size={13} /> Setup
          </Button>
        </div>
        <div />

        <Card className="overflow-hidden flex flex-col min-h-0">
            <div className="grid grid-cols-[1fr_1.2fr_1.3fr_1fr_1.2fr_1.5fr_1fr_0.9fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
              {['Merk', 'Model', 'IMEI-nummer', 'Leverancier', 'Telefoonnummer', 'Toegewezen aan', 'Uitgiftedatum', 'Status'].map(h => (
                <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <PhoneIcon size={36} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm text-slate-400">{search ? 'Geen resultaten.' : 'Nog geen telefoons.'}</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map(p => (
                    <li
                      key={p.id}
                      onClick={() => handleSelect(p)}
                      className={`grid grid-cols-[1fr_1.2fr_1.3fr_1fr_1.2fr_1.5fr_1fr_0.9fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${selected?.id === p.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                    >
                      <p className="text-sm font-semibold text-slate-800 truncate">{p.brand}</p>
                      <p className="text-xs text-slate-600 truncate">{p.model || '—'}</p>
                      <p className="text-xs text-slate-600 truncate tabular-nums">{p.imeiNumber || '—'}</p>
                      <p className="text-xs text-slate-600 truncate">{p.supplier || '—'}</p>
                      <p className="text-xs text-slate-600 truncate tabular-nums">{p.simPhoneNumber || '—'}</p>
                      <p className="text-xs text-slate-600 truncate">{p.assignedToName || '—'}</p>
                      <p className="text-xs text-slate-600 truncate tabular-nums">{fmt(p.issuedAt)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate ${PHONE_STATUS_TONE[p.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {PHONE_STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
        </Card>

        <div className="min-h-0">
          {selected ? (
            <Card className="h-full overflow-y-auto">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{selected.brand} {selected.model}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{selected.simPhoneNumber || selected.serialNumber || '—'}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${PHONE_STATUS_TONE[selected.status] ?? ''}`}>
                    {PHONE_STATUS_LABEL[selected.status] ?? selected.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-slate-600">
                  {selected.serialNumber && (
                    <p><span className="text-slate-400">Serienummer</span><br /><span className="font-medium text-slate-800">{selected.serialNumber}</span></p>
                  )}
                  {selected.imeiNumber && (
                    <p><span className="text-slate-400">IMEI</span><br /><span className="font-medium text-slate-800">{selected.imeiNumber}</span></p>
                  )}
                  {selected.supplier && (
                    <p className="col-span-2"><span className="text-slate-400">Leverancier</span><br /><span className="font-medium text-slate-800">{selected.supplier}</span></p>
                  )}
                  {selected.assignedToName && (
                    <p className="col-span-2"><span className="text-slate-400">Toegewezen aan</span><br /><span className="font-medium text-slate-800">{selected.assignedToName}</span></p>
                  )}
                  {selected.issuedAt && (
                    <p><span className="text-slate-400">Uitgiftedatum</span><br /><span className="font-medium text-slate-800">{fmt(selected.issuedAt)}</span></p>
                  )}
                  {selected.returnedAt && (
                    <p><span className="text-slate-400">Inleverdatum</span><br /><span className="font-medium text-slate-800">{fmt(selected.returnedAt)}</span></p>
                  )}
                </div>
                {selected.simCardNumber && (
                  <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-blue-400 mb-0.5">Gekoppelde simkaart</p>
                        <p className="text-sm font-medium text-blue-700 truncate">
                          {selected.simCardNumber}
                          {selected.simPhoneNumber ? ` · ${selected.simPhoneNumber}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUnlinkSim(selected.id)}
                        title="Simkaart ontkoppelen"
                        className="flex-shrink-0 text-blue-400 hover:text-red-500 transition-colors"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { setEditTarget(selected); setShowModal(true) }}>
                    <Pencil size={13} /> Wijzigen
                  </Button>
                  {!confirmDelete ? (
                    <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                      <Trash2 size={13} /> Verwijderen
                    </Button>
                  ) : (
                    <>
                      <span className="flex items-center text-xs text-red-700 font-medium">Zeker weten?</span>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(selected.id)}>Ja</Button>
                      <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Nee</Button>
                    </>
                  )}
                </div>
                <ItemHistoryBlock
                  key={`${selected.id}-${historyKey}`}
                  url={`/portal/phones/${selected.id}/history`}
                  subtitle={`${selected.brand} ${selected.model}`}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <PhoneIcon size={28} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Selecteer een telefoon</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <PhoneModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSaved}
        teammates={teammates}
        phone={editTarget}
      />

      <PhoneSetupWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={handleSaved}
        teammates={teammates}
      />
    </div>
  )
}

// ── SimCards tab ──────────────────────────────────────────────────────────────

function SimCardsTab({ teammates }: { teammates: ClientUserListItem[] }) {
  const [simCards, setSimCards] = useState<SimCardListItem[]>([])
  const [phones, setPhones] = useState<PhoneListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SimCardListItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<SimCardListItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      const [simRes, phoneRes] = await Promise.all([
        api.get<SimCardListItem[]>('/portal/simcards'),
        api.get<PhoneListItem[]>('/portal/phones'),
      ])
      setSimCards(simRes.data)
      setPhones(phoneRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (selected) {
      const updated = simCards.find(s => s.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [simCards])

  const filtered = simCards.filter(s =>
    `${s.kaartNummer} ${s.phoneNumber} ${s.provider} ${s.assignedToName ?? ''} ${s.phoneName ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/simcards/${id}`)
    setSimCards(prev => prev.filter(s => s.id !== id))
    setSelected(null)
    setConfirmDelete(false)
  }

  const handleSaved = async () => { await fetchData(); setShowModal(false); setHistoryKey(k => k + 1) }

  return (
    <div className="grid grid-cols-[1fr_22%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek simkaarten…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
          />
        </div>
        <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
          <Plus size={13} /> Toevoegen
        </Button>
      </div>
      <div />

      <Card className="overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-[1.5fr_1.2fr_1fr_1.5fr_1.3fr_0.9fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
            {['Kaartnummer', 'Telefoonnummer', 'Type', 'Toegewezen aan', 'Gekoppelde telefoon', 'Status'].map(h => (
              <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <CreditCard size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-400">{search ? 'Geen resultaten.' : 'Nog geen simkaarten.'}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map(s => (
                  <li
                    key={s.id}
                    onClick={() => { setSelected(s); setConfirmDelete(false) }}
                    className={`grid grid-cols-[1.5fr_1.2fr_1fr_1.5fr_1.3fr_0.9fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${selected?.id === s.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                  >
                    <p className="text-sm font-semibold text-slate-800 truncate tabular-nums">{s.kaartNummer}</p>
                    <p className="text-xs text-slate-600 truncate tabular-nums">{s.phoneNumber || '—'}</p>
                    <p className="text-xs text-slate-600 truncate">{SIM_TYPE_LABEL[s.type] ?? s.type}</p>
                    <p className="text-xs text-slate-600 truncate">{s.assignedToName || '—'}</p>
                    <p className="text-xs text-slate-600 truncate">{s.phoneName || '—'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate ${SIM_STATUS_TONE[s.status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {SIM_STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

      <div className="min-h-0">
        {selected ? (
          <Card className="h-full overflow-y-auto">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selected.kaartNummer}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selected.provider || '—'}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${SIM_STATUS_TONE[selected.status] ?? ''}`}>
                  {SIM_STATUS_LABEL[selected.status] ?? selected.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Type', value: SIM_TYPE_LABEL[selected.type] ?? selected.type },
                  { label: 'Telefoonnummer', value: selected.phoneNumber || '—' },
                  { label: 'Toegewezen aan', value: selected.assignedToName || '—' },
                ].map(row => (
                  <div key={row.label} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400 mb-0.5">{row.label}</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{row.value}</p>
                  </div>
                ))}
              </div>
              {selected.phoneName && (
                <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                  <p className="text-xs text-blue-400 mb-0.5">Gekoppelde telefoon</p>
                  <p className="text-sm font-medium text-blue-700 truncate">{selected.phoneName}</p>
                </div>
              )}
              {selected.subscriptionName && (
                <div className="mt-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                  <p className="text-xs text-blue-400 mb-0.5">Gekoppeld abonnement</p>
                  <p className="text-sm font-medium text-blue-700 truncate">{selected.subscriptionName}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditTarget(selected); setShowModal(true) }}>
                  <Pencil size={13} /> Wijzigen
                </Button>
                {!confirmDelete ? (
                  <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={13} /> Verwijderen
                  </Button>
                ) : (
                  <>
                    <span className="flex items-center text-xs text-red-700 font-medium">Zeker weten?</span>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(selected.id)}>Ja</Button>
                    <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Nee</Button>
                  </>
                )}
              </div>
              <ItemHistoryBlock
                key={`${selected.id}-${historyKey}`}
                url={`/portal/simcards/${selected.id}/history`}
                subtitle={selected.kaartNummer}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <CreditCard size={28} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">Selecteer een simkaart</p>
            </div>
          </div>
        )}
      </div>

      <SimCardModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSaved}
        teammates={teammates}
        phones={phones}
        simCard={editTarget}
      />
    </div>
  )
}

// ── Subscriptions tab ─────────────────────────────────────────────────────────

function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([])
  const [simCards, setSimCards] = useState<SimCardListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SubscriptionListItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<SubscriptionListItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      const [subRes, simRes] = await Promise.all([
        api.get<SubscriptionListItem[]>('/portal/subscriptions'),
        api.get<SimCardListItem[]>('/portal/simcards'),
      ])
      setSubscriptions(subRes.data)
      setSimCards(simRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (selected) {
      const updated = subscriptions.find(s => s.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [subscriptions])

  const filtered = subscriptions.filter(s =>
    `${s.name} ${s.provider} ${s.bundle} ${s.simCardNumber ?? ''} ${s.assignedToName ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    await api.delete(`/portal/subscriptions/${id}`)
    setSubscriptions(prev => prev.filter(s => s.id !== id))
    setSelected(null)
    setConfirmDelete(false)
  }

  const handleSaved = async () => { await fetchData(); setShowModal(false); setHistoryKey(k => k + 1) }

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function fmtCost(cost: number | null) {
    if (cost == null) return '—'
    return `€ ${cost.toFixed(2)}`
  }

  return (
    <div className="grid grid-cols-[1fr_22%] grid-rows-[auto_1fr] gap-x-4 gap-y-3 flex-1 min-h-0">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek abonnementen…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
          />
        </div>
        <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
          <Plus size={13} /> Toevoegen
        </Button>
      </div>
      <div />

      <Card className="overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr_1.5fr_1.3fr_0.9fr] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
            {['Provider', 'Naam', 'Type', 'Kosten/mnd', 'Leverancier', 'Toegewezen aan', 'Simkaart', 'Status'].map(h => (
              <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <Layers size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-400">{search ? 'Geen resultaten.' : 'Nog geen abonnementen.'}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map(s => (
                  <li
                    key={s.id}
                    onClick={() => { setSelected(s); setConfirmDelete(false) }}
                    className={`grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr_1.5fr_1.3fr_0.9fr] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-slate-100 ${selected?.id === s.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                  >
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.provider || '—'}</p>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-600 truncate">{s.name}</p>
                    </div>
                    <p className="text-xs text-slate-600 truncate">{SUB_TYPE_LABEL[s.type] ?? s.type}</p>
                    <p className="text-xs text-slate-600 truncate tabular-nums">{s.monthlyCost != null ? `€${s.monthlyCost.toFixed(2)}` : '—'}</p>
                    <p className="text-xs text-slate-600 truncate">{s.supplier || '—'}</p>
                    <p className="text-xs text-slate-600 truncate">{s.assignedToName || '—'}</p>
                    <p className="text-xs text-slate-600 truncate tabular-nums">{s.simPhoneNumber || s.simCardNumber || '—'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate ${SUB_STATUS_TONE[s.status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {SUB_STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
      </Card>

      <div className="min-h-0">
        {selected ? (
          <Card className="h-full overflow-y-auto">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selected.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selected.provider || '—'}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${SUB_STATUS_TONE[selected.status] ?? ''}`}>
                  {SUB_STATUS_LABEL[selected.status] ?? selected.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Type', value: SUB_TYPE_LABEL[selected.type] ?? selected.type },
                  { label: 'Bundel', value: selected.bundle || '—' },
                  { label: 'Maandelijks', value: fmtCost(selected.monthlyCost) },
                  { label: 'Leverancier', value: selected.supplier || '—' },
                  { label: 'Toegewezen aan', value: selected.assignedToName || '—' },
                  { label: 'Locatie', value: selected.location || '—' },
                  { label: 'Startdatum', value: fmt(selected.startsAt) },
                  { label: 'Einddatum', value: fmt(selected.expiresAt) },
                ].map(row => (
                  <div key={row.label} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400 mb-0.5">{row.label}</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{row.value}</p>
                  </div>
                ))}
              </div>
              {selected.simCardNumber && (
                <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                  <p className="text-xs text-blue-400 mb-0.5">Gekoppelde simkaart</p>
                  <p className="text-sm font-medium text-blue-700 truncate">
                    {selected.simCardNumber}
                    {selected.simPhoneNumber ? ` · ${selected.simPhoneNumber}` : ''}
                  </p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditTarget(selected); setShowModal(true) }}>
                  <Pencil size={13} /> Wijzigen
                </Button>
                {!confirmDelete ? (
                  <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={13} /> Verwijderen
                  </Button>
                ) : (
                  <>
                    <span className="flex items-center text-xs text-red-700 font-medium">Zeker weten?</span>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(selected.id)}>Ja</Button>
                    <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Nee</Button>
                  </>
                )}
              </div>
              <ItemHistoryBlock
                key={`${selected.id}-${historyKey}`}
                url={`/portal/subscriptions/${selected.id}/history`}
                subtitle={selected.name}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Layers size={28} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">Selecteer een abonnement</p>
            </div>
          </div>
        )}
      </div>

      <SubscriptionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSaved}
        simCards={simCards.filter(s =>
          // Toon alleen simkaarten zonder abonnement, of de simkaart die al aan dit abonnement gekoppeld is
          !subscriptions.some(sub => sub.simCardId === s.id && sub.id !== editTarget?.id)
        )}
        subscription={editTarget}
      />
    </div>
  )
}

// ── Employee list view (full-width) ───────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Delete employee modal ─────────────────────────────────────────────────────

type Blocker = { icon: React.ReactNode; type: string; name: string }

function DeleteEmployeeModal({ userId, userName, onClose, onDeleted }: {
  userId: string
  userName: string
  onClose: () => void
  onDeleted: () => void
}) {
  const [detail, setDetail]       = useState<ClientUserDetailResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [deleting, setDeleting]   = useState(false)
  const [apiError, setApiError]   = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    api.get<ClientUserDetailResponse>(`/portal/users/${userId}`)
      .then(r => setDetail(r.data))
      .catch(() => setApiError('Kan medewerkergegevens niet ophalen.'))
      .finally(() => setLoading(false))
  }, [userId])

  const blockers: Blocker[] = detail ? [
    ...detail.hardware
      .filter(h => !h.isReturned)
      .map(h => ({ icon: <Laptop size={12} />, type: 'Hardware', name: `${h.brand} ${h.name}`.trim() || h.name })),
    ...detail.licenses
      .filter(l => l.isActive)
      .map(l => ({ icon: <CreditCard size={12} />, type: 'Licentie', name: l.name })),
    ...detail.phones
      .map(p => ({ icon: <Smartphone size={12} />, type: 'Telefoon', name: `${p.brand} ${p.model}`.trim() })),
  ] : []

  const isBlocked = blockers.length > 0
  const canDelete = !loading && !isBlocked && !apiError && acknowledged

  const handleDelete = async () => {
    setDeleting(true)
    setApiError(null)
    try {
      await api.delete(`/portal/employees/${userId}`)
      onDeleted()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Verwijderen mislukt. Controleer of alle zaken zijn ontkoppeld.')
      setDeleting(false)
    }
  }

  // Group blockers by type for display
  const grouped = blockers.reduce<Record<string, Blocker[]>>((acc, b) => {
    ;(acc[b.type] ??= []).push(b)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-backdrop-animated">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden modal-panel-animated">

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isBlocked ? 'bg-amber-100' : 'bg-red-100'}`}>
              {isBlocked
                ? <AlertTriangle size={18} className="text-amber-600" />
                : <Trash2 size={18} className="text-red-600" />
              }
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Medewerker verwijderen</h2>
              <p className="text-sm text-slate-500 mt-0.5">{userName}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : apiError && !detail ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
              <AlertTriangle size={14} className="flex-shrink-0" /> {apiError}
            </div>
          ) : isBlocked ? (
            <>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 mb-4">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Verwijderen geblokkeerd.</span> Ontkoppel eerst alle gekoppelde zaken van deze medewerker.
                </p>
              </div>

              <div className="space-y-3">
                {Object.entries(grouped).map(([type, items]) => (
                  <div key={type}>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      {items[0].icon}
                      {type} <span className="font-normal text-slate-400">({items.length})</span>
                    </p>
                    <div className="space-y-1">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          <p className="text-sm text-slate-700 truncate">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100 mb-4">
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-600">
                  Alle zaken zijn ontkoppeld. Deze medewerker kan definitief worden verwijderd.
                </p>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Het account van <span className="font-medium text-slate-500">{userName}</span> en alle bijbehorende gegevens worden permanent verwijderd.
              </p>
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={e => setAcknowledged(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-red-600 cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-slate-400 group-hover:text-slate-600 transition-colors">
                  Ik begrijp dat dit <span className="font-medium text-red-400">niet ongedaan kan worden gemaakt</span>.
                </span>
              </label>
            </>
          )}

          {apiError && detail && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700 mt-3">
              <AlertTriangle size={14} className="flex-shrink-0" /> {apiError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Annuleren
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={!canDelete || deleting}
            onClick={handleDelete}
          >
            {deleting ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Verwijderen…</>
            ) : (
              <><Trash2 size={13} /> Definitief verwijderen</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Employee list view ────────────────────────────────────────────────────────

function EmployeeListView({ teammates, loading, search, currentUserId, departmentOptions, onSearch, onSelect, onAddEmployee, onDelete }: {
  teammates: ClientUserListItem[]
  loading: boolean
  search: string
  currentUserId: string | undefined
  departmentOptions: { id: string; name: string; managerName: string }[]
  onSearch: (v: string) => void
  onSelect: (id: string) => void
  onAddEmployee: () => void
  onDelete: (id: string, name: string) => void
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = teammates.filter(t =>
    `${t.firstName} ${t.lastName} ${t.email} ${t.departmentName} ${t.jobTitle}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const cols = 'grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1fr_80px_90px_40px]'

  const totaalMedewerkers = teammates.length
  const inDienst          = teammates.filter(t => t.status === 'InService').length
  const totaleAssets      = teammates.reduce((s, t) => s + t.hardwareCount, 0)
  const totaleLicenties   = teammates.reduce((s, t) => s + t.licenseCount, 0)

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Medewerkers"    value={totaalMedewerkers} icon={<Users size={18} />} />
        <StatCard label="In dienst"      value={inDienst}          icon={<CheckCircle2 size={18} />} tone="emerald" />
        <StatCard label="Totale assets"  value={totaleAssets}      icon={<Laptop size={18} />} tone="blue" />
        <StatCard label="Totale licenties" value={totaleLicenties} icon={<CreditCard size={18} />} tone="blue" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail of afdeling…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400"
          />
        </div>
        <span className="text-xs text-slate-400 flex-1">{filtered.length} medewerker{filtered.length !== 1 ? 's' : ''}</span>
        <Button size="sm" onClick={onAddEmployee}>
          <UserPlus size={13} /> Medewerker toevoegen
        </Button>
      </div>

      {/* Table card */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className={`grid ${cols} gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100`}>
          {['Naam', 'Manager', 'Afdeling', 'Functie', 'Startdatum', 'Status', 'Assets', 'Licenties', ''].map(h => (
            <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{h}</span>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">Laden…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Users size={36} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-400">Geen medewerkers gevonden.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map(u => (
                <li key={u.id} className={`grid ${cols} gap-3 px-5 py-3.5 hover:bg-slate-100 transition-colors items-center`}>
                  {/* Naam + email */}
                  <button className="flex items-center gap-3 min-w-0 text-left" onClick={() => onSelect(u.id)}>
                    <Avatar first={u.firstName} last={u.lastName} size={48} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        {u.id === currentUserId && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">Jij</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{u.email || '—'}</p>
                    </div>
                  </button>

                  {/* Manager */}
                  <p className="text-sm text-slate-500 truncate">
                    {u.managerName || ''}
                  </p>

                  {/* Afdeling */}
                  {u.departmentName ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium truncate w-fit max-w-full">
                      {u.departmentName}
                    </span>
                  ) : (
                    <span />
                  )}

                  {/* Functie */}
                  <p className="text-sm text-slate-500 truncate">{u.jobTitle || '—'}</p>

                  {/* Startdatum */}
                  <p className="text-sm text-slate-500">{fmtDate(u.startDate)}</p>

                  {/* Status */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${STATUS_TONE[u.status]}`}
                    title={
                      u.status === 'StartPlanned' && u.startDate ? `In dienst per ${fmtDate(u.startDate)}`
                      : u.status === 'LeavePlanned' && u.leaveDate ? `Uit dienst per ${fmtDate(u.leaveDate)}`
                      : undefined
                    }
                  >
                    {STATUS_LABEL[u.status]}
                  </span>

                  {/* Hardware count */}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Laptop size={12} className="text-slate-400 flex-shrink-0" />
                    <span>{u.hardwareCount}</span>
                  </div>

                  {/* License count */}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <CreditCard size={12} className="text-slate-400 flex-shrink-0" />
                    <span>{u.licenseCount}</span>
                  </div>

                  {/* 3-dot menu */}
                  <div className="relative flex justify-end">
                    <button
                      onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                      onBlur={() => setTimeout(() => setOpenMenu(null), 150)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <MoreVertical size={15} />
                    </button>
                    {openMenu === u.id && (
                      <div className="absolute right-0 top-7 z-20 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 text-sm">
                        <button
                          onClick={() => { setOpenMenu(null); onSelect(u.id) }}
                          className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                        >
                          <ChevronRight size={13} className="text-slate-400" /> Details bekijken
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          onClick={() => { setOpenMenu(null); onDelete(u.id, `${u.firstName} ${u.lastName}`) }}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={13} /> Verwijderen
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}

// ── Employee detail view (full-page) ──────────────────────────────────────────

function EmployeeDetailView({ user, loading, onBack, onUserUpdated, onDelete, departments, managers, locations, teammates }: {
  user: ClientUserDetailResponse | null
  loading: boolean
  onBack: () => void
  onUserUpdated?: () => void
  onDelete?: (id: string, name: string) => void
  departments?: { id: string; name: string; managerId: string | null }[]
  managers?: { id: string; fullName: string }[]
  locations?: LocationListItem[]
  teammates?: ClientUserListItem[]
}) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={15} />
          Terug naar medewerkers
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <Card className="h-40 flex items-center justify-center">
            <p className="text-sm text-slate-400">Laden…</p>
          </Card>
        ) : !user ? null : (
          <UserDetailPanel
            user={user}
            canEdit
            departments={departments}
            managers={managers}
            locations={locations}
            teammates={teammates}
            checklistBasePath={`/portal/users/${user.id}`}
            historyPath={`/portal/history/User/${user.id}`}
            onUserUpdated={onUserUpdated}
            onDelete={onDelete ? () => onDelete(user.id, `${user.firstName} ${user.lastName}`) : undefined}
          />
        )}
      </div>
    </div>
  )
}

// ── Settings view ─────────────────────────────────────────────────────────────

function SettingsView({ teammates, tenantName, onAddUser, mspStatus, onMspStatusRefresh, onSwitchToMsp, mspSwitching }: {
  teammates: ClientUserListItem[]
  tenantName: string
  onAddUser: () => void
  mspStatus: { hasMspAccount: boolean; orgName?: string; hasMspManager: boolean; mspManagerName?: string } | null
  onMspStatusRefresh: () => void
  onSwitchToMsp: () => void
  mspSwitching: boolean
}) {
  const { darkMode, toggleDarkMode } = useThemeStore()

  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)

  const handleUpgrade = async () => {
    setUpgradeLoading(true)
    setUpgradeError(null)
    try {
      await api.post('/portal/upgrade-to-msp')
      setUpgradeSuccess(true)
      onMspStatusRefresh()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setUpgradeError(msg ?? 'Er is een fout opgetreden. Probeer het opnieuw.')
    } finally {
      setUpgradeLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Weergave */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Weergave</h2>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                {darkMode ? <Moon size={15} className="text-blue-400" /> : <Sun size={15} className="text-amber-500" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Donkere modus</p>
                <p className="text-xs text-slate-400 mt-0.5">Schakel tussen licht en donker thema</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                darkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Portaalgebruikers */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Portaalgebruikers</h2>
              <p className="text-xs text-slate-500 mt-0.5">Medewerkers met toegang tot het portaal van {tenantName}</p>
            </div>
            <Button size="sm" onClick={onAddUser}>
              <UserPlus size={13} /> Gebruiker toevoegen
            </Button>
          </div>
          {(() => {
            const portalUsers = teammates.filter(u => u.isPortalUser)
            return (
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 grid grid-cols-[1fr_auto] gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Gebruiker</span>
                  <span>Status</span>
                </div>
                {portalUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Nog geen portaalgebruikers aangemaakt.</div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                    {portalUsers.map(u => (
                      <li key={u.id} className="px-4 py-3 grid grid-cols-[1fr_auto] gap-4 items-center">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar first={u.firstName} last={u.lastName} size={28} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {u.isActive ? 'Actief' : 'Inactief'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* MSP Partner */}
      {mspStatus !== null && (
        <Card>
          <CardContent className="p-5">
            {mspStatus.hasMspAccount ? (
              /* ── Already an MSP ── */
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">MSP Partner</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Uw account is gekoppeld aan <span className="font-medium text-blue-600 dark:text-blue-400">{mspStatus.orgName}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      U kunt vanuit het MSP-portaal klanten beheren en toevoegen.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onSwitchToMsp}
                  disabled={mspSwitching}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ArrowLeftCircle size={13} className="rotate-180" />
                  {mspSwitching ? 'Even wachten…' : 'Naar MSP Portaal'}
                </button>
              </div>
            ) : mspStatus.hasMspManager ? (
              /* ── Client already managed by external MSP ── */
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield size={15} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Beheerd door MSP</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dit portaal wordt al beheerd door{' '}
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {mspStatus.mspManagerName ?? 'een MSP'}
                    </span>. Het is niet mogelijk om een eigen MSP-account aan te maken.
                  </p>
                </div>
              </div>
            ) : (
              /* ── Upgrade to MSP ── */
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield size={15} className="text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Wordt MSP Partner</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upgrade uw account om meerdere klanten te beheren vanuit een eigen MSP-omgeving. Uw huidige bedrijfsnaam en logo worden overgenomen.
                    </p>
                  </div>
                </div>

                {upgradeSuccess ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">MSP account aangemaakt!</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Log nu in op het MSP Portaal met hetzelfde e-mailadres en wachtwoord.</p>
                    </div>
                    <button
                      onClick={onSwitchToMsp}
                      disabled={mspSwitching}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ArrowLeftCircle size={13} className="rotate-180" />
                      {mspSwitching ? 'Even wachten…' : 'Naar MSP Portaal'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upgradeError && (
                      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
                        <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                        {upgradeError}
                      </div>
                    )}
                    <button
                      onClick={handleUpgrade}
                      disabled={upgradeLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <ArrowLeftCircle size={14} className="rotate-180" />
                      {upgradeLoading ? 'Bezig…' : 'MSP account aanmaken'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Locations view ────────────────────────────────────────────────────────────

function LocationsView() {
  const [locations, setLocations]     = useState<LocationListItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [editTarget, setEditTarget]   = useState<LocationListItem | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [detailLoc, setDetailLoc]     = useState<LocationDetailResponse | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeTab, setActiveTab]     = useState<'medewerkers' | 'hardware'>('medewerkers')
  const [memberSearch, setMemberSearch] = useState('')
  const [hwSearch, setHwSearch]       = useState('')

  const fetchLocations = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<LocationListItem[]>('/portal/locations')
      setLocations(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchLocations() }, [])

  const openDetail = async (id: string) => {
    setLoadingDetail(true)
    setDetailLoc(null)
    setActiveTab('medewerkers')
    setMemberSearch('')
    setHwSearch('')
    try {
      const { data } = await api.get<LocationDetailResponse>(`/portal/locations/${id}`)
      setDetailLoc(data)
    } finally { setLoadingDetail(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Locatie verwijderen? Hardware die aan deze locatie is gekoppeld wordt losgekoppeld.')) return
    setDeletingId(id)
    try {
      await api.delete(`/portal/locations/${id}`)
      setLocations(prev => prev.filter(l => l.id !== id))
      if (detailLoc?.id === id) setDetailLoc(null)
    } catch {
    } finally { setDeletingId(null) }
  }

  const handleSuccess = () => {
    setShowModal(false)
    fetchLocations()
    if (detailLoc) openDetail(detailLoc.id)
  }

  const USER_STATUS_LABEL: Record<string, string> = {
    InService: 'In dienst', LeavePlanned: 'Uitdienst gepland', Left: 'Uit dienst', StartPlanned: 'Start gepland',
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (detailLoc) {
    const filteredMembers = detailLoc.members.filter(m =>
      `${m.firstName} ${m.lastName} ${m.email} ${m.jobTitle}`.toLowerCase().includes(memberSearch.toLowerCase())
    )
    const filteredHardware = detailLoc.hardware.filter(h =>
      `${h.name} ${h.brand} ${h.type} ${h.serialNumber} ${h.assignedToName ?? ''}`.toLowerCase().includes(hwSearch.toLowerCase())
    )

    return (
      <div className="h-full flex flex-col gap-4 overflow-y-auto">
        {/* Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDetailLoc(null)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Terug naar overzicht
          </button>
        </div>

        {/* Summary card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{detailLoc.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {[detailLoc.address, detailLoc.postalCode, detailLoc.city].filter(Boolean).join(', ')}
                {detailLoc.province ? ` · ${detailLoc.province}` : ''}
              </p>
              {detailLoc.phone && (
                <p className="text-xs text-slate-400 mt-1">{detailLoc.phone}</p>
              )}
            </div>
            <button
              onClick={() => { setEditTarget(locations.find(l => l.id === detailLoc.id) ?? null); setShowModal(true) }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Pencil size={12} /> Bewerken
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Medewerkers', value: detailLoc.members.length, color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
              { label: 'Hardware',    value: detailLoc.hardware.length, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl px-4 py-3 flex items-center gap-3 ${s.color}`}>
                <span className="text-2xl font-bold">{s.value}</span>
                <span className="text-xs font-medium leading-tight">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden flex-1 min-h-0">
          <div className="flex border-b border-slate-100 dark:border-slate-700">
            {(['medewerkers', 'hardware'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab === 'medewerkers' ? `Medewerkers (${detailLoc.members.length})` : `Hardware (${detailLoc.hardware.length})`}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'medewerkers' && (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder="Zoeken op naam, e-mail, functie…"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">
                    {memberSearch ? 'Geen resultaten gevonden.' : 'Geen medewerkers op deze locatie.'}
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700">
                        {['Naam', 'Functie', 'E-mail', 'Status'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-400 pb-2 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredMembers.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="py-2.5 pr-4">
                            <p className="font-medium text-slate-800 dark:text-slate-200">{m.firstName} {m.lastName}</p>
                          </td>
                          <td className="py-2.5 pr-4 text-xs text-slate-500 dark:text-slate-400">{m.jobTitle || '—'}</td>
                          <td className="py-2.5 pr-4 text-xs text-slate-500 dark:text-slate-400">{m.email || '—'}</td>
                          <td className="py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_TONE[m.status as keyof typeof STATUS_TONE] ?? 'bg-slate-100 text-slate-600'}`}>
                              {STATUS_LABEL[m.status as keyof typeof STATUS_LABEL] ?? m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'hardware' && (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={hwSearch}
                    onChange={e => setHwSearch(e.target.value)}
                    placeholder="Zoeken op naam, merk, type, serienummer…"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                {filteredHardware.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">
                    {hwSearch ? 'Geen resultaten gevonden.' : 'Geen hardware op deze locatie.'}
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700">
                        {['Naam', 'Merk', 'Type', 'Status', 'Serienummer', 'Toegewezen aan'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-400 pb-2 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredHardware.map(hw => (
                        <tr key={hw.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-200">{hw.name}</td>
                          <td className="py-2.5 pr-4 text-xs text-slate-500 dark:text-slate-400">{hw.brand || '—'}</td>
                          <td className="py-2.5 pr-4 text-xs text-slate-500 dark:text-slate-400">{HARDWARE_TYPE_LABEL[hw.type] ?? hw.type}</td>
                          <td className="py-2.5 pr-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HARDWARE_STATUS_TONE[hw.status] ?? 'bg-slate-100 text-slate-600'}`}>
                              {HARDWARE_STATUS_LABEL[hw.status] ?? hw.status}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-xs text-slate-400 font-mono">{hw.serialNumber || '—'}</td>
                          <td className="py-2.5 text-xs text-slate-500 dark:text-slate-400">{hw.assignedToName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        <LocationModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSuccess={handleSuccess}
          location={editTarget}
        />
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────
  const totaalLocaties    = locations.length
  const totaalMedewerkers = locations.reduce((s, l) => s + l.employeeCount, 0)
  const totaalHardware    = locations.reduce((s, l) => s + l.hardwareCount, 0)

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <StatCard label="Locaties"     value={totaalLocaties}    icon={<MapPin size={18} />} />
        <StatCard label="Medewerkers"  value={totaalMedewerkers} icon={<Users size={18} />} tone="blue" />
        <StatCard label="Hardware"     value={totaalHardware}    icon={<Laptop size={18} />} tone="blue" />
      </div>

      <div className="flex items-center justify-between flex-shrink-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? 'Laden…' : `${locations.length} locatie${locations.length !== 1 ? 's' : ''}`}
        </p>
        <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
          <Plus size={13} /> Locatie toevoegen
        </Button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Laden…</div>
      ) : locations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <MapPin size={28} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nog geen locaties</p>
          <p className="text-xs text-slate-400">Voeg een locatie toe om hardware aan te koppelen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-2">
          {locations.map(loc => (
            <div
              key={loc.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3 shadow-sm"
            >
              {/* Card header: name + icon buttons */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{loc.name}</h3>
                  {loc.address && (
                    <p className="text-xs text-slate-600 dark:text-slate-200 mt-0.5 truncate">{loc.address}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditTarget(loc); setShowModal(true) }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title="Bewerken"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id)}
                    disabled={deletingId === loc.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                    title="Verwijderen"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Address details */}
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {[loc.postalCode, loc.city].filter(Boolean).join('  ')}
                  {loc.province ? <span className="text-slate-400 font-normal"> · {loc.province}</span> : null}
                </p>
                {loc.country && loc.country !== 'Nederland' && (
                  <p className="text-xs text-slate-400">{loc.country}</p>
                )}
                {loc.phone && (
                  <p className="text-xs text-slate-500">{loc.phone}</p>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                {[
                  { label: 'Medewerkers', value: loc.employeeCount, color: 'text-slate-600 dark:text-slate-300' },
                  { label: 'Hardware',    value: loc.hardwareCount,  color: 'text-blue-600 dark:text-blue-400' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-lg font-bold leading-tight ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-400 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Bekijken button */}
              <button
                onClick={() => openDetail(loc.id)}
                disabled={loadingDetail}
                className="mt-auto w-full py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-1.5"
              >
                {loadingDetail ? 'Laden…' : 'Bekijken →'}
              </button>
            </div>
          ))}
        </div>
      )}

      <LocationModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(null) }}
        onSuccess={() => { setShowModal(false); fetchLocations() }}
        location={editTarget}
      />
    </div>
  )
}

// ── Departments view ──────────────────────────────────────────────────────────

function DepartmentsView() {
  const [departments, setDepartments] = useState<DepartmentListItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [editTarget, setEditTarget]   = useState<DepartmentListItem | null>(null)
  const [detailDept, setDetailDept]   = useState<DepartmentDetailResponse | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<DepartmentListItem[]>('/portal/departments')
      setDepartments(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchDepartments() }, [])

  const openDetail = async (id: string) => {
    setLoadingDetail(true)
    setDetailDept(null)
    try {
      const { data } = await api.get<DepartmentDetailResponse>(`/portal/departments/${id}`)
      setDetailDept(data)
    } finally { setLoadingDetail(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Afdeling verwijderen?')) return
    setDeletingId(id)
    try {
      await api.delete(`/portal/departments/${id}`)
      setDepartments(prev => prev.filter(d => d.id !== id))
      if (detailDept?.id === id) setDetailDept(null)
    } finally { setDeletingId(null) }
  }

  const handleSuccess = (dept: DepartmentListItem) => {
    setDepartments(prev => {
      const idx = prev.findIndex(d => d.id === dept.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = dept; return next }
      return [...prev, dept]
    })
    fetchDepartments() // refresh to get updated counts
  }

  const USER_STATUS_LABEL: Record<string, string> = {
    InService: 'In dienst', LeavePlanned: 'Uitdienst gepland', Left: 'Uit dienst',
  }

  // ── Detail panel ───────────────────────────────────────────────────────────
  if (detailDept) {
    return (
      <div className="h-full flex flex-col gap-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDetailDept(null)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Terug naar overzicht
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{detailDept.name}</h2>
              {detailDept.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{detailDept.description}</p>
              )}
              {detailDept.managerName && (
                <p className="text-xs text-slate-400 mt-1">Manager: <span className="text-slate-600 dark:text-slate-300 font-medium">{detailDept.managerName}</span></p>
              )}
            </div>
            <button
              onClick={() => { setEditTarget(departments.find(d => d.id === detailDept.id) ?? null); setShowModal(true) }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Pencil size={12} /> Bewerken
            </button>
          </div>

          {/* Aggregate stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Hardware items', value: detailDept.hardwareCount, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
              { label: 'Licenties',      value: detailDept.licenseCount,  color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
              { label: 'Software',       value: detailDept.softwareCount, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl px-4 py-3 flex items-center gap-3 ${s.color}`}>
                <span className="text-2xl font-bold">{s.value}</span>
                <span className="text-xs font-medium leading-tight">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Members table */}
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Medewerkers ({detailDept.members.length})
          </h3>

          {detailDept.members.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Geen medewerkers in deze afdeling.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {['Naam', 'Functie', 'Status', 'HW', 'Lic', 'SW'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-400 pb-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {detailDept.members.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{m.firstName} {m.lastName}</p>
                        {m.email && <p className="text-xs text-slate-400">{m.email}</p>}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500 dark:text-slate-400">{m.jobTitle || '—'}</td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {USER_STATUS_LABEL[m.status] ?? m.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-xs font-medium text-slate-700 dark:text-slate-300">{m.hardwareCount}</td>
                      <td className="py-2.5 pr-4 text-xs font-medium text-slate-700 dark:text-slate-300">{m.licenseCount}</td>
                      <td className="py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">{m.softwareCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DepartmentModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSuccess={dept => { handleSuccess(dept); openDetail(dept.id) }}
          editTarget={editTarget}
        />
      </div>
    )
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? 'Laden…' : `${departments.length} afdeling${departments.length !== 1 ? 'en' : ''}`}
        </p>
        <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
          <Plus size={14} /> Afdeling toevoegen
        </Button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-400">Laden…</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Building2 size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nog geen afdelingen</p>
            <p className="text-xs text-slate-400 mt-1">Voeg een afdeling toe om te beginnen</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto">
          {departments.map(d => (
            <div
              key={d.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3 shadow-sm"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{d.name}</h3>
                  {d.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{d.description}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditTarget(d); setShowModal(true) }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title="Bewerken"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    disabled={deletingId === d.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                    title="Verwijderen"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Manager */}
              {d.managerName && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manager: <span className="font-medium text-slate-700 dark:text-slate-300">{d.managerName}</span>
                </p>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                {[
                  { label: 'Medewerkers', value: d.memberCount,   color: 'text-slate-600 dark:text-slate-300' },
                  { label: 'Hardware',    value: d.hardwareCount, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Licenties',  value: d.licenseCount,  color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Software',   value: d.softwareCount, color: 'text-emerald-600 dark:text-emerald-400' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-lg font-bold leading-tight ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-400 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* View button */}
              <button
                onClick={() => openDetail(d.id)}
                disabled={loadingDetail}
                className="mt-auto w-full py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-1.5"
              >
                {loadingDetail ? 'Laden…' : 'Bekijken →'}
              </button>
            </div>
          ))}
        </div>
      )}

      <DepartmentModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(null) }}
        onSuccess={handleSuccess}
        editTarget={editTarget}
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClientPortal() {
  const { user, login, logout, switchBack } = useAuthStore()
  const { darkMode, toggleDarkMode } = useThemeStore()
  const navigate = useNavigate()

  // MSP context-switch: true when an org-admin is managing this client portal
  const isMspMode = user?.switchedFromOrgId !== null && user?.switchedFromOrgId !== undefined

  const handleSwitchBack = () => {
    switchBack()
    navigate('/org')
  }

  const [view, setView] = useState<View>('employees')
  const [teammates, setTeammates] = useState<ClientUserListItem[]>([])
  const [selectedUser, setSelectedUser] = useState<ClientUserDetailResponse | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [search, setSearch] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(null)
  const [departmentOptions, setDepartmentOptions] = useState<{ id: string; name: string; managerName: string; managerId: string | null }[]>([])
  const [managers, setManagers] = useState<{ id: string; fullName: string }[]>([])
  const [locationOptions, setLocationOptions] = useState<LocationListItem[]>([])

  // ── User menu + MSP ───────────────────────────────────────────────────────
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mspStatus, setMspStatus] = useState<{ hasMspAccount: boolean; orgName?: string; hasMspManager: boolean; mspManagerName?: string } | null>(null)
  const [mspSwitching, setMspSwitching] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const fetchMspStatus = useCallback(async () => {
    try {
      const { data } = await api.get<{ hasMspAccount: boolean; orgName?: string; hasMspManager: boolean; mspManagerName?: string }>('/portal/msp-status')
      setMspStatus(data)
    } catch { /* non-critical */ }
  }, [])

  const handleSwitchToMsp = async () => {
    setMspSwitching(true)
    setShowUserMenu(false)
    try {
      const { data } = await api.post<import('@/types/auth').LoginResponse>('/portal/msp-token')
      login(data.accessToken, data.refreshToken, data.user)
      navigate('/org')
    } catch { /* ignore */ } finally {
      setMspSwitching(false)
    }
  }

  useEffect(() => {
    if (!isMspMode) fetchMspStatus()
  }, [fetchMspStatus, isMspMode])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchDepartmentOptions = useCallback(async () => {
    try {
      const { data } = await api.get<DepartmentListItem[]>('/portal/departments')
      setDepartmentOptions(data.map(d => ({ id: d.id, name: d.name, managerName: d.managerName, managerId: d.managerUserId })))
    } catch { /* non-critical */ }
  }, [])

  const fetchManagers = useCallback(async () => {
    try {
      const { data } = await api.get<{ id: string; fullName: string }[]>('/portal/managers')
      setManagers(data)
    } catch { /* non-critical */ }
  }, [])

  const fetchLocationOptions = useCallback(async () => {
    try {
      const { data } = await api.get<LocationListItem[]>('/portal/locations')
      setLocationOptions(data)
    } catch { /* non-critical */ }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get<ClientUserListItem[]>('/portal/users')
      setTeammates(data)
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  const fetchUserDetail = useCallback(async (userId: string) => {
    setLoadingDetail(true)
    setSelectedUser(null)
    try {
      const { data } = await api.get<ClientUserDetailResponse>(`/portal/users/${userId}`)
      setSelectedUser(data)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { fetchDepartmentOptions() }, [fetchDepartmentOptions])
  useEffect(() => { fetchManagers() }, [fetchManagers])
  useEffect(() => { fetchLocationOptions() }, [fetchLocationOptions])

  const handleSelectEmployee = (id: string) => {
    fetchUserDetail(id)
    setView('employee-detail')
  }

  const handleBackToList = () => {
    setView('employees')
    setSelectedUser(null)
  }

  const handleOpenDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const handleEmployeeDeleted = () => {
    setDeleteTarget(null)
    setView('employees')
    setSelectedUser(null)
    fetchUsers()
  }

  const handleNavClick = (v: View) => {
    setView(v)
    if (v !== 'employee-detail') setSelectedUser(null)
    // herlaad gedeelde portaaldata zodat andere secties altijd actuele lijsten zien
    fetchUsers()
    fetchDepartmentOptions()
    fetchManagers()
  }

  useEffect(() => {
    api.get<{ logoDataUrl: string | null }>('/portal/logo')
      .then(r => setClientLogoUrl(r.data.logoDataUrl))
      .catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }
  const tenantName = user?.tenantName ?? 'Portal'

  // "Medewerkers" nav item is active for both list and detail views
  const employeesActive = view === 'employees' || view === 'employee-detail'

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">

      {/* ── Shared top bar ──────────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 h-16">
        <div className="w-56 bg-slate-900 dark:bg-slate-950 px-4 flex flex-col justify-center flex-shrink-0 border-b border-slate-800">
          <span className="font-bold text-white text-sm truncate">{tenantName}</span>
          <p className="text-xs text-slate-500 mt-0.5">Portaal</p>
        </div>
        <div className="flex-1 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{VIEW_TITLES[view]}</h1>

          {/* Account dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 transition-colors select-none">
                {(user?.email?.[0] ?? '?').toUpperCase()}
              </div>
              <ChevronDown size={13} className={`text-slate-400 dark:text-slate-500 transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 z-50 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

                {/* User info */}
                <div className="px-4 py-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white text-base font-bold flex items-center justify-center flex-shrink-0 select-none">
                      {(user?.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{tenantName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  {/* MSP Portal (only if MSP account exists) */}
                  {mspStatus?.hasMspAccount && (
                    <button
                      onClick={handleSwitchToMsp}
                      disabled={mspSwitching}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                    >
                      <ArrowLeftCircle size={15} className="flex-shrink-0 rotate-180" />
                      <span className="flex-1 text-left">{mspSwitching ? 'Even wachten…' : `MSP Portaal — ${mspStatus.orgName}`}</span>
                    </button>
                  )}

                  {/* Settings */}
                  <button
                    onClick={() => { setShowUserMenu(false); handleNavClick('settings') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Settings size={15} className="text-slate-400 flex-shrink-0" />
                    Instellingen
                  </button>

                  {/* Dark mode */}
                  <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    {darkMode
                      ? <Sun size={15} className="text-slate-400 flex-shrink-0" />
                      : <Moon size={15} className="text-slate-400 flex-shrink-0" />
                    }
                    <span className="flex-1 text-left">{darkMode ? 'Lichte modus' : 'Donkere modus'}</span>
                    <span className={`w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </span>
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                  <button
                    onClick={() => { setShowUserMenu(false); handleLogout() }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={15} className="flex-shrink-0" />
                    Uitloggen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-56 bg-slate-900 dark:bg-slate-950 flex flex-col flex-shrink-0">

        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1">
          <SectionLabel label="Medewerkers" />
          <NavItem icon={<Users size={14} />} label="Medewerkers" active={employeesActive} onClick={() => handleNavClick('employees')} />
          <NavItem icon={<Building2 size={14} />} label="Afdelingen" active={view === 'departments'} onClick={() => handleNavClick('departments')} />
          <NavItem icon={<MapPin size={14} />} label="Locaties" active={view === 'locations'} onClick={() => handleNavClick('locations')} />

          <SectionLabel label="Assets" />
          <NavItem icon={<Laptop size={14} />} label="Hardware" active={view === 'hardware'} onClick={() => handleNavClick('hardware')} />
          <NavItem icon={<Shield size={14} />} label="Software" active={view === 'software'} onClick={() => handleNavClick('software')} />
          <NavItem icon={<PhoneIcon size={14} />} label="Telefonie" active={view === 'phones'} onClick={() => handleNavClick('phones')} />

          <SectionLabel label="Processen" />
          <NavItem icon={<PackageCheck size={14} />} label="Aantreden checklist" active={view === 'starter-checklist'} onClick={() => handleNavClick('starter-checklist')} />
          <NavItem icon={<LogOut size={14} />} label="Checklist uit dienst" active={view === 'leaver-checklist'} onClick={() => handleNavClick('leaver-checklist')} />

          <SectionLabel label="Rapportages" />
          <NavItem icon={<BarChart3 size={14} />} label="Overzichten" active={view === 'overviews'} onClick={() => handleNavClick('overviews')} />
          <NavItem icon={<History size={14} />} label="Historie" active={view === 'history'} onClick={() => handleNavClick('history')} />
          <NavItem icon={<FileText size={14} />} label="Contracten" active={view === 'contracts'} onClick={() => handleNavClick('contracts')} />
        </nav>

        <div className="px-2 pb-3 flex-shrink-0 border-t border-slate-800 pt-2 space-y-1">
          {clientLogoUrl && (
            <div className="px-3 py-2">
              <img src={clientLogoUrl} alt="Logo" className="h-8 max-w-full object-contain opacity-90" />
            </div>
          )}
          <NavItem icon={<Settings size={14} />} label="Instellingen" active={view === 'settings'} onClick={() => handleNavClick('settings')} />
          <NavItem icon={<LogOut size={14} />} label="Uitloggen" active={false} onClick={handleLogout} />
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* MSP banner — only visible when an org-admin has switched context */}
        {isMspMode && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-6 py-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <ArrowLeftCircle size={15} />
              <span className="text-xs font-medium">
                MSP beheer modus — je beheert <strong>{user?.tenantName}</strong> namens{' '}
                <strong>{user?.switchedFromOrgName}</strong>
              </span>
            </div>
            <button
              onClick={handleSwitchBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
            >
              <ArrowLeft size={13} />
              Terug naar {user?.switchedFromOrgName}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden p-6 bg-slate-200 dark:bg-slate-900">
          {view === 'employees' && (
            <EmployeeListView
              teammates={teammates}
              loading={loadingUsers}
              search={search}
              currentUserId={user?.id}
              departmentOptions={departmentOptions}
              onSearch={setSearch}
              onSelect={handleSelectEmployee}
              onAddEmployee={() => { fetchDepartmentOptions(); setShowAddEmployee(true) }}
              onDelete={handleOpenDelete}
            />
          )}

          {view === 'employee-detail' && (
            <EmployeeDetailView
              user={selectedUser}
              loading={loadingDetail}
              onBack={handleBackToList}
              onUserUpdated={() => { if (selectedUser) { fetchUserDetail(selectedUser.id); fetchUsers() } }}
              onDelete={handleOpenDelete}
              departments={departmentOptions}
              managers={managers}
              locations={locationOptions}
              teammates={teammates}
            />
          )}

          {view === 'settings' && (
            <SettingsView
              teammates={teammates}
              tenantName={tenantName}
              onAddUser={() => setShowAddUser(true)}
              mspStatus={mspStatus}
              onMspStatusRefresh={fetchMspStatus}
              onSwitchToMsp={handleSwitchToMsp}
              mspSwitching={mspSwitching}
            />
          )}

          {view === 'hardware' && (
            <HardwareView teammates={teammates} />
          )}

          {view === 'software' && (
            <SoftwareView teammates={teammates} />
          )}

          {view === 'phones' && (
            <TelefonieView teammates={teammates} />
          )}

          {view === 'departments' && (
            <DepartmentsView />
          )}

          {view === 'locations' && (
            <LocationsView />
          )}

          {view === 'overviews' && <OverviewView />}

          {view === 'history' && <HistoryView />}

          {(view === 'starter-checklist' || view === 'leaver-checklist' ||
            view === 'contracts' || view === 'help') && (
            <PlaceholderView title={VIEW_TITLES[view]} />
          )}
        </div>
      </div>
      </div>

      <AddUserModal
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSuccess={() => { fetchUsers(); setShowAddUser(false) }}
        clientName={tenantName}
        apiEndpoint="/portal/users"
        departments={departmentOptions}
      />

      <AddEmployeeModal
        open={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        onSuccess={() => { fetchUsers(); setShowAddEmployee(false) }}
        departments={departmentOptions}
        managers={managers}
        locations={locationOptions}
      />

      {deleteTarget && (
        <DeleteEmployeeModal
          userId={deleteTarget.id}
          userName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleEmployeeDeleted}
        />
      )}

    </div>
  )
}
