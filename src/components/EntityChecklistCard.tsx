import { useEffect, useState } from 'react'
import { ClipboardList, CheckCircle2, Trash2, Zap, Plus } from 'lucide-react'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { EntityChecklist } from '@/types/entityChecklist'
import type { ProcessTemplateListItem } from '@/types/processTemplate'

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function EntityChecklistCard({ entityType, entityId }: {
  entityType: 'Hardware' | 'Phone'
  entityId: string
}) {
  const [checklist, setChecklist]   = useState<EntityChecklist | null>(null)
  const [templates, setTemplates]   = useState<ProcessTemplateListItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [templateId, setTemplateId] = useState('')
  const [applying, setApplying]     = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removing, setRemoving]     = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      api.get<EntityChecklist | null>(`/portal/entity-checklists/${entityType}/${entityId}`),
      api.get<ProcessTemplateListItem[]>(`/portal/process-templates?entityType=${entityType}`),
    ])
      .then(([checklistRes, templatesRes]) => {
        if (cancelled) return
        // Geen actieve checklist → backend antwoordt 204 (lege body); axios geeft dan '' terug i.p.v. null
        setChecklist(checklistRes.data && typeof checklistRes.data === 'object' ? checklistRes.data : null)
        setTemplates(templatesRes.data.filter(t => t.itemCount > 0))
      })
      .catch(() => { if (!cancelled) { setChecklist(null); setTemplates([]) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [entityType, entityId])

  const handleApply = async () => {
    if (!templateId) return
    setApplying(true)
    setError(null)
    try {
      const { data } = await api.post<EntityChecklist>('/portal/entity-checklists', {
        templateId, entityType, entityId,
      })
      setChecklist(data)
      setTemplateId('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Checklist toepassen mislukt.')
    } finally { setApplying(false) }
  }

  const handleToggle = async (itemId: string, isChecked: boolean) => {
    if (!checklist) return
    // Optimistic update
    const prev = checklist
    setChecklist({
      ...checklist,
      items: checklist.items.map(i => i.id === itemId ? { ...i, isChecked } : i),
    })
    try {
      const { data } = await api.put<EntityChecklist>(`/portal/entity-checklists/${checklist.id}/items/${itemId}`, { isChecked })
      setChecklist(data)
    } catch {
      setChecklist(prev)
    }
  }

  const handleRemove = async () => {
    if (!checklist) return
    setRemoving(true)
    try {
      await api.delete(`/portal/entity-checklists/${checklist.id}`)
      setChecklist(null)
    } finally {
      setRemoving(false)
      setConfirmRemove(false)
    }
  }

  // Niets te tonen: geen actieve checklist én geen templates om toe te passen
  if (!loading && !checklist && templates.length === 0) return null

  const checkedCount = checklist?.items.filter(i => i.isChecked).length ?? 0
  const totalCount   = checklist?.items.length ?? 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Checklist</h3>
            {checklist && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                checklist.completedAt
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {checkedCount}/{totalCount}{checklist.completedAt ? ' · Voltooid' : ''}
              </span>
            )}
          </div>
          {checklist && (
            <button
              onClick={() => setConfirmRemove(true)}
              title="Checklist verwijderen"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Laden…</p>
        ) : checklist ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span className="font-medium text-slate-600 dark:text-slate-300">{checklist.templateName}</span>
              <span>·</span>
              {checklist.appliedBy === 'systeem' ? (
                <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 font-medium">
                  <Zap size={10} /> automatisch toegepast {fmtDate(checklist.createdAt)}
                </span>
              ) : (
                <span>toegepast {fmtDate(checklist.createdAt)}</span>
              )}
            </div>

            <div className="space-y-2">
              {checklist.items.map(item => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.isChecked}
                    onChange={e => handleToggle(item.id, e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${item.isChecked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                      {item.title}
                    </p>
                    {item.isChecked && item.checkedAt && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {fmtDate(item.checkedAt)}{item.checkedBy ? ` · ${item.checkedBy}` : ''}
                      </p>
                    )}
                  </div>
                  {item.isChecked && <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Geen checklist actief op dit item.</p>
            <div className="flex items-center gap-2">
              <select
                value={templateId}
                onChange={e => setTemplateId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors"
              >
                <option value="">— Kies een checklist —</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.itemCount} stappen)</option>
                ))}
              </select>
              <Button size="sm" onClick={handleApply} disabled={!templateId || applying}>
                <Plus size={13} /> {applying ? 'Bezig…' : 'Toepassen'}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
      </CardContent>

      <Modal
        open={confirmRemove}
        onClose={() => !removing && setConfirmRemove(false)}
        title="Checklist verwijderen"
        className="max-w-sm"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <ClipboardList size={22} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Weet je zeker dat je de checklist{' '}
              <span className="font-semibold">"{checklist?.templateName}"</span>{' '}
              van dit item wilt verwijderen?
            </p>
            <p className="text-xs text-slate-400 mt-1">
              De voortgang gaat verloren. Een automatisch toegepaste checklist komt niet vanzelf terug.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmRemove(false)} disabled={removing}>
            Annuleren
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleRemove} disabled={removing}>
            {removing ? 'Bezig…' : 'Verwijderen'}
          </Button>
        </div>
      </Modal>
    </Card>
  )
}
