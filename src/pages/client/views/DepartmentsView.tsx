import { useState, useEffect } from 'react'
import { Building2, Pencil, Plus, Trash2, ArrowLeft } from 'lucide-react'
import api from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { DepartmentModal } from '@/components/DepartmentModal'
import type { DepartmentListItem, DepartmentDetailResponse } from '@/types/department'

const USER_STATUS_LABEL: Record<string, string> = {
  InService: 'In dienst', LeavePlanned: 'Uitdienst gepland', Left: 'Uit dienst',
}

export function DepartmentsView() {
  const [departments, setDepartments]     = useState<DepartmentListItem[]>([])
  const [loading, setLoading]             = useState(true)
  const [showModal, setShowModal]         = useState(false)
  const [editTarget, setEditTarget]       = useState<DepartmentListItem | null>(null)
  const [detailDept, setDetailDept]       = useState<DepartmentDetailResponse | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [deletingId, setDeletingId]       = useState<string | null>(null)

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
    fetchDepartments()
  }

  // ── Detail panel ──────────────────────────────────────────────────────────────
  if (detailDept) {
    return (
      <div className="h-full flex flex-col gap-4 overflow-y-auto">
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

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? 'Laden…' : `${departments.length} afdeling${departments.length !== 1 ? 'en' : ''}`}
        </p>
        <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
          <Plus size={14} /> Afdeling toevoegen
        </Button>
      </div>

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
            <div key={d.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{d.name}</h3>
                  {d.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{d.description}</p>}
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
              {d.managerName && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manager: <span className="font-medium text-slate-700 dark:text-slate-300">{d.managerName}</span>
                </p>
              )}
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
