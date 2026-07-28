import { useState, useEffect } from 'react'
import { Wifi, Pencil, Plus, Trash2, XCircle } from 'lucide-react'
import api from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { LoadingState, LoadingSpinner } from '@/components/ui/LoadingState'
import { InternetConnectionModal } from '@/components/InternetConnectionModal'
import type { InternetConnectionListItem } from '@/types/internetConnection'
import {
  CONNECTION_TYPE_LABEL,
  INTERNET_CONNECTION_STATUS_LABEL,
  INTERNET_CONNECTION_STATUS_TONE,
} from '@/types/internetConnection'

export function InternetConnectionsView() {
  const [connections, setConnections] = useState<InternetConnectionListItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [editTarget, setEditTarget]   = useState<InternetConnectionListItem | null>(null)
  const [busyId, setBusyId]           = useState<string | null>(null)

  const fetchConnections = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<InternetConnectionListItem[]>('/portal/internet-connections')
      setConnections(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchConnections() }, [])

  const handleCancel = async (id: string) => {
    if (!window.confirm('Deze verbinding opzeggen?')) return
    setBusyId(id)
    try {
      await api.post(`/portal/internet-connections/${id}/cancel`)
      fetchConnections()
    } catch { /* silent */ }
    finally { setBusyId(null) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deze verbinding verwijderen?')) return
    setBusyId(id)
    try {
      await api.delete(`/portal/internet-connections/${id}`)
      setConnections(prev => prev.filter(c => c.id !== id))
    } catch { /* silent */ }
    finally { setBusyId(null) }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? <span className="inline-flex items-center gap-1.5"><LoadingSpinner size="xs" />Laden…</span> : `${connections.length} verbinding${connections.length !== 1 ? 'en' : ''}`}
        </p>
        <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
          <Plus size={13} /> Verbinding toevoegen
        </Button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><LoadingState label="Verbindingen laden…" /></div>
      ) : connections.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Wifi size={28} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nog geen vaste-internetverbindingen</p>
          <p className="text-xs text-slate-400">Voeg een verbinding toe om te starten.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-2">
          {connections.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{c.product}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {[CONNECTION_TYPE_LABEL[c.type] ?? c.type, c.provider].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${INTERNET_CONNECTION_STATUS_TONE[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {INTERNET_CONNECTION_STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-300">
                {(c.postalCode || c.houseNumber) && <p>{[c.postalCode, c.houseNumber].filter(Boolean).join(' ')}</p>}
                {c.ipAddress && <p className="font-mono text-slate-400">{c.ipAddress}{c.hostCount ? ` · ${c.hostCount} hosts` : ''}</p>}
                {c.supplier && <p>Leverancier: {c.supplier}</p>}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-auto">
                <button
                  onClick={() => { setEditTarget(c); setShowModal(true) }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Pencil size={12} /> Bewerken
                </button>
                {c.status !== 'Cancelled' && (
                  <button
                    onClick={() => handleCancel(c.id)}
                    disabled={busyId === c.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-40"
                  >
                    <XCircle size={12} /> Opzeggen
                  </button>
                )}
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={busyId === c.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                  title="Verwijderen"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <InternetConnectionModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(null) }}
        onSuccess={() => { setShowModal(false); fetchConnections() }}
        connection={editTarget}
      />
    </div>
  )
}
