import { useState, useEffect } from 'react'
import { MapPin, Pencil, Plus, Trash2, Users, Laptop, ArrowLeft, Search } from 'lucide-react'
import api from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/portal/PortalUI'
import { LocationModal } from '@/components/LocationModal'
import { LoadingState, LoadingSpinner } from '@/components/ui/LoadingState'
import type { LocationListItem, LocationDetailResponse } from '@/types/location'
import { STATUS_TONE, STATUS_LABEL } from '@/types/clientUser'
import { HARDWARE_TYPE_LABEL, HARDWARE_STATUS_LABEL, HARDWARE_STATUS_TONE } from '@/types/hardware'

export function LocationsView() {
  const [locations, setLocations]         = useState<LocationListItem[]>([])
  const [loading, setLoading]             = useState(true)
  const [showModal, setShowModal]         = useState(false)
  const [editTarget, setEditTarget]       = useState<LocationListItem | null>(null)
  const [deletingId, setDeletingId]       = useState<string | null>(null)
  const [detailLoc, setDetailLoc]         = useState<LocationDetailResponse | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeTab, setActiveTab]         = useState<'medewerkers' | 'hardware'>('medewerkers')
  const [memberSearch, setMemberSearch]   = useState('')
  const [hwSearch, setHwSearch]           = useState('')

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
    } catch { /* silent */ }
    finally { setDeletingId(null) }
  }

  const handleSuccess = () => {
    setShowModal(false)
    fetchLocations()
    if (detailLoc) openDetail(detailLoc.id)
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (detailLoc) {
    const filteredMembers  = detailLoc.members.filter(m =>
      `${m.firstName} ${m.lastName} ${m.email} ${m.jobTitle}`.toLowerCase().includes(memberSearch.toLowerCase())
    )
    const filteredHardware = detailLoc.hardware.filter(h =>
      `${h.name} ${h.brand} ${h.type} ${h.serialNumber} ${h.assignedToName ?? ''}`.toLowerCase().includes(hwSearch.toLowerCase())
    )

    return (
      <div className="h-full flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDetailLoc(null)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Terug naar overzicht
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{detailLoc.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {[detailLoc.address, detailLoc.postalCode, detailLoc.city].filter(Boolean).join(', ')}
                {detailLoc.province ? ` · ${detailLoc.province}` : ''}
              </p>
              {detailLoc.phone && <p className="text-xs text-slate-400 mt-1">{detailLoc.phone}</p>}
            </div>
            <button
              onClick={() => { setEditTarget(locations.find(l => l.id === detailLoc.id) ?? null); setShowModal(true) }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Pencil size={12} /> Bewerken
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Medewerkers', value: detailLoc.members.length,  color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
              { label: 'Hardware',    value: detailLoc.hardware.length, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl px-4 py-3 flex items-center gap-3 ${s.color}`}>
                <span className="text-2xl font-bold">{s.value}</span>
                <span className="text-xs font-medium leading-tight">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

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

  // ── List view ────────────────────────────────────────────────────────────────
  const totaalLocaties    = locations.length
  const totaalMedewerkers = locations.reduce((s, l) => s + l.employeeCount, 0)
  const totaalHardware    = locations.reduce((s, l) => s + l.hardwareCount, 0)

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <StatCard label="Locaties"    value={totaalLocaties}    icon={<MapPin size={18} />} />
        <StatCard label="Medewerkers" value={totaalMedewerkers} icon={<Users size={18} />}  tone="blue" />
        <StatCard label="Hardware"    value={totaalHardware}    icon={<Laptop size={18} />} tone="blue" />
      </div>

      <div className="flex items-center justify-between flex-shrink-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? <span className="inline-flex items-center gap-1.5"><LoadingSpinner size="xs" />Laden…</span> : `${locations.length} locatie${locations.length !== 1 ? 's' : ''}`}
        </p>
        <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
          <Plus size={13} /> Locatie toevoegen
        </Button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><LoadingState label="Locaties laden…" /></div>
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
            <div key={loc.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{loc.name}</h3>
                  {loc.address && <p className="text-xs text-slate-600 dark:text-slate-200 mt-0.5 truncate">{loc.address}</p>}
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
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {[loc.postalCode, loc.city].filter(Boolean).join('  ')}
                  {loc.province ? <span className="text-slate-400 font-normal"> · {loc.province}</span> : null}
                </p>
                {loc.country && loc.country !== 'Nederland' && <p className="text-xs text-slate-400">{loc.country}</p>}
                {loc.phone && <p className="text-xs text-slate-500">{loc.phone}</p>}
              </div>
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
