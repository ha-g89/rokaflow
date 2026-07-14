import { useState, useEffect } from 'react'
import { History, XCircle } from 'lucide-react'
import api from '@/lib/axios'
import type { AuditEntry } from '@/types/auditLog'
import type { PhoneHistoryItem } from '@/types/phone'

// ── Helpers ──────────────────────────────────────────────────────────────────

export function parseAuditChanges(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

export function fmtAuditDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Hardware ──────────────────────────────────────────────────────────────────

export function hardwareAuditLabel(entry: AuditEntry): string {
  const c = parseAuditChanges(entry.changes)
  switch (entry.action) {
    case 'Created': return 'Hardware aangemaakt'
    case 'Deleted': return 'Hardware verwijderd'
    case 'Updated':
      if ('Status' in c)           return 'Status gewijzigd'
      if ('AssignedToUserId' in c) return 'Toewijzing gewijzigd'
      return 'Hardware bijgewerkt'
    default: return entry.action
  }
}

// ── License ───────────────────────────────────────────────────────────────────

export function licenseAuditLabel(entry: AuditEntry): string {
  const c = parseAuditChanges(entry.changes)
  const who = typeof c.UserName === 'string' && c.UserName ? `: ${c.UserName}` : ''
  switch (entry.action) {
    case 'Created':      return 'Licentie aangemaakt'
    case 'Deleted':      return 'Licentie verwijderd'
    case 'Updated':      return 'Licentie bijgewerkt'
    case 'UserAssigned': return `Gebruiker toegewezen${who}`
    case 'UserRevoked':  return `Gebruiker ingetrokken${who}`
    default: return entry.action
  }
}

export const LICENSE_FIELD_LABEL: Record<string, string> = {
  Name: 'Naam', Vendor: 'Leverancier', Type: 'Type',
  MaxUsers: 'Max. seats', StartsAt: 'Startdatum', ExpiresAt: 'Vervaldatum',
  IsActive: 'Actief', Notes: 'Notities',
}

export function licenseDescriptionFn(entry: AuditEntry): string {
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

// ── Software ──────────────────────────────────────────────────────────────────

export function softwareAuditLabel(entry: AuditEntry): string {
  const c = parseAuditChanges(entry.changes)
  const who = typeof c.UserName === 'string' && c.UserName ? `: ${c.UserName}` : ''
  switch (entry.action) {
    case 'Created':      return 'Software aangemaakt'
    case 'Deleted':      return 'Software verwijderd'
    case 'Updated':      return 'Software bijgewerkt'
    case 'UserAssigned': return `Toegewezen aan gebruiker${who}`
    case 'UserRevoked':  return `Ingetrokken van gebruiker${who}`
    default: return entry.action
  }
}

export const SW_FIELD_LABEL: Record<string, string> = {
  Name: 'Naam', Publisher: 'Uitgever', Vendor: 'Leverancier',
  IsPaid: 'Type', LicenseId: 'Licentie',
}

export function softwareDescriptionFn(entry: AuditEntry): string {
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

// ── HistoryBlock (audit log — hardware, license, software) ───────────────────

export function HistoryBlock({ entityType, entityId, labelFn, descriptionFn }: {
  entityType: string
  entityId: string
  labelFn: (entry: AuditEntry) => string
  descriptionFn?: (entry: AuditEntry) => string
}) {
  const [entries, setEntries]           = useState<AuditEntry[]>([])
  const [loading, setLoading]           = useState(true)
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
                {(() => {
                  const first = descriptionFn?.(e)?.split('\n')[0]
                  return first ? <p className="text-xs text-slate-500 truncate">{first}</p> : null
                })()}
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

// ── ItemHistoryBlock (phones / simcards / subscriptions) ─────────────────────

export function ItemHistoryBlock({ url, subtitle }: { url: string; subtitle?: string }) {
  const [entries, setEntries]           = useState<PhoneHistoryItem[]>([])
  const [loading, setLoading]           = useState(true)
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
                {e.description && e.description.split('\n')[0] !== e.summary && (
                  <p className="text-xs text-slate-500 truncate">{e.description.split('\n')[0]}</p>
                )}
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
