import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Trash2, ChevronUp, ChevronDown, Lock, Check, X,
  ClipboardList, Pencil, Users, Laptop, Phone as PhoneIcon,
  CreditCard, Key, MapPin, AlertCircle, GripVertical, Zap, ChevronRight,
} from 'lucide-react'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import type {
  ProcessTemplateListItem,
  ProcessTemplateDetail,
  ProcessTemplateItem,
  TargetEntityType,
} from '@/types/processTemplate'
import {
  TARGET_ENTITY_LABEL,
  TARGET_ENTITY_TONE,
  CHECKLIST_TYPE_LABEL,
  CHECKLIST_TYPE_TONE,
  AUTOMATION_KEY_OPTIONS,
  AUTOMATION_KEY_LABEL,
} from '@/types/processTemplate'

const ENTITY_ICON: Record<TargetEntityType, React.ReactNode> = {
  Employee: <Users size={13} />,
  Hardware: <Laptop size={13} />,
  Phone:    <PhoneIcon size={13} />,
  SimCard:  <CreditCard size={13} />,
  License:  <Key size={13} />,
  Location: <MapPin size={13} />,
}

// ── New template modal ────────────────────────────────────────────────────────

function NewTemplateModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (t: ProcessTemplateDetail) => void
}) {
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [entityType, setEntityType]   = useState<TargetEntityType>('Employee')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Naam is verplicht'); return }
    setSaving(true); setError('')
    try {
      const { data } = await api.post<ProcessTemplateDetail>('/portal/process-templates', {
        name: name.trim(),
        description: description.trim() || null,
        targetEntityType: entityType,
      })
      onCreated(data)
    } catch { setError('Kon template niet aanmaken. Probeer het opnieuw.') }
    finally { setSaving(false) }
  }

  const ENTITY_TYPES: TargetEntityType[] = ['Employee', 'Hardware', 'Phone', 'SimCard', 'License', 'Location']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Nieuw template</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Naam</label>
            <input
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="bijv. Hardware installatie"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Omschrijving <span className="font-normal normal-case text-slate-400">(optioneel)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Korte beschrijving van dit process..."
              rows={2}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Van toepassing op</label>
            <div className="grid grid-cols-3 gap-2">
              {ENTITY_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEntityType(type)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    entityType === type
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={entityType === type ? 'text-blue-600' : 'text-slate-400'}>
                    {ENTITY_ICON[type]}
                  </span>
                  {TARGET_ENTITY_LABEL[type]}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Annuleren</Button>
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Opslaan…' : 'Aanmaken'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <ClipboardList size={28} className="text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-600 mb-1">Selecteer een template</p>
      <p className="text-xs text-slate-400 max-w-[200px]">Kies een checklist-template uit de lijst om de stappen te bekijken en aan te passen</p>
    </div>
  )
}

// ── Item row ──────────────────────────────────────────────────────────────────

function ItemRow({
  item, index, total, isEditing, isSaving,
  onStartEdit, onSaveEdit, onCancelEdit,
  onMoveUp, onMoveDown, onDeleteClick, onDeleteConfirm, onDeleteCancel,
  isConfirmingDelete,
  isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: {
  item: ProcessTemplateItem
  index: number
  total: number
  isEditing: boolean
  isSaving: boolean
  onStartEdit: () => void
  onSaveEdit: (title: string, isRequired: boolean, automationKey: string | null) => void
  onCancelEdit: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDeleteClick: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
  isConfirmingDelete: boolean
  isDragging: boolean
  isDragOver: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
}) {
  const [draftTitle, setDraftTitle]       = useState(item.title)
  const [draftRequired, setDraftRequired] = useState(item.isRequired)
  const [draftAutoKey, setDraftAutoKey]   = useState(item.automationKey ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      setDraftTitle(item.title)
      setDraftRequired(item.isRequired)
      setDraftAutoKey(item.automationKey ?? '')
      // slight delay so the grid animation plays first
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isEditing, item.title, item.isRequired, item.automationKey])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); onSaveEdit(draftTitle, draftRequired, draftAutoKey || null) }
    if (e.key === 'Escape') onCancelEdit()
  }

  return (
    <div
      draggable={!isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group border-b border-slate-100 last:border-0 transition-all select-none ${
        isDragging         ? 'opacity-40 bg-slate-50 scale-[0.99]' :
        isDragOver         ? 'border-t-2 border-t-blue-400 bg-blue-50/40' :
        isConfirmingDelete ? 'bg-red-50' :
        isEditing          ? 'bg-blue-50/40' :
        'hover:bg-slate-50'
      }`}
    >
      {/* ── Always-visible row — titel wordt input bij bewerken ── */}
      <div className={`flex items-center gap-3 px-4 py-3 transition-all ${
        isEditing          ? 'bg-blue-50/40 border-l-[3px] border-l-blue-500' :
        isDragOver         ? '' :
        isConfirmingDelete ? '' :
        'border-l-[3px] border-l-transparent cursor-pointer'
      }`}
        onClick={isEditing ? undefined : onStartEdit}
      >
        {/* Drag handle */}
        <GripVertical
          size={13}
          onClick={e => e.stopPropagation()}
          className="text-slate-300 flex-shrink-0 cursor-grab active:cursor-grabbing group-hover:text-slate-400 transition-colors"
        />

        {/* Step number */}
        <span className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 select-none transition-colors ${
          isEditing ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
        }`}>
          {index + 1}
        </span>

        {/* Titel OF textbox */}
        {isEditing ? (
          <input
            ref={inputRef}
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
            placeholder="Stap omschrijving…"
            className="flex-1 text-sm text-slate-800 px-2.5 py-1 rounded-lg border border-blue-200 bg-white shadow-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all min-w-0"
          />
        ) : (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-sm text-slate-800 font-medium truncate group-hover:text-blue-600 transition-colors">
              {item.title}
            </span>
            {item.isRequired && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 ring-1 ring-orange-200 flex-shrink-0">
                Verplicht
              </span>
            )}
            {item.automationKey && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 ring-1 ring-violet-200 flex-shrink-0">
                <Zap size={9} /> {AUTOMATION_KEY_LABEL[item.automationKey] ?? item.automationKey}
              </span>
            )}
          </div>
        )}

        {/* Acties */}
        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {isEditing ? (
            <>
              <button
                onClick={() => onSaveEdit(draftTitle, draftRequired, draftAutoKey || null)}
                disabled={isSaving || !draftTitle.trim()}
                title="Opslaan (Enter)"
                className="h-7 px-2.5 flex items-center gap-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {isSaving
                  ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Check size={11} />}
                <span>Opslaan</span>
              </button>
              <button
                onClick={onCancelEdit}
                title="Annuleren (Esc)"
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white ring-1 ring-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:ring-red-200 transition-all shadow-sm"
              >
                <X size={12} />
              </button>
            </>
          ) : isConfirmingDelete ? (
            <>
              <span className="text-xs text-red-500 font-medium mr-1">Verwijderen?</span>
              <button onClick={onDeleteConfirm} className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">Ja</button>
              <button onClick={onDeleteCancel}  className="px-2 py-0.5 rounded text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">Nee</button>
            </>
          ) : (
            <>
              <button onClick={onMoveUp}    disabled={index === 0}         title="Omhoog" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all opacity-0 group-hover:opacity-100"><ChevronUp size={13} /></button>
              <button onClick={onMoveDown}  disabled={index === total - 1} title="Omlaag" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all opacity-0 group-hover:opacity-100"><ChevronDown size={13} /></button>
              <button onClick={onDeleteClick} title="Verwijderen"          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
            </>
          )}
        </div>
      </div>

      {/* ── Chips — animeren in als bewerken actief is ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isEditing ? '1fr' : '0fr',
          transition: 'grid-template-rows 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div className="flex items-center gap-3 px-4 pt-2 pb-3 border-t border-t-blue-100 border-l-[3px] border-l-blue-500 bg-blue-50/40">
            {/* spacer gelijk aan grip + step number + gap */}
            <div className="w-[52px] flex-shrink-0" />

            {/* Verplicht toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={draftRequired}
              onClick={() => setDraftRequired(!draftRequired)}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ${
                draftRequired ? 'bg-orange-400' : 'bg-slate-200'
              }`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  draftRequired ? 'translate-x-3.5' : 'translate-x-0.5'
                }`} />
              </span>
              <span className={`text-[10px] font-semibold transition-colors ${
                draftRequired ? 'text-orange-600' : 'text-slate-400'
              }`}>Verplicht</span>
            </button>

            {/* Automatisering dropdown */}
            <div className={`flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 transition-all ${
              draftAutoKey ? 'bg-violet-100 ring-1 ring-violet-200' : 'bg-slate-100'
            }`}>
              <Zap size={9} className={draftAutoKey ? 'text-violet-500' : 'text-slate-400'} />
              <select
                value={draftAutoKey}
                onChange={e => setDraftAutoKey(e.target.value)}
                className={`text-[10px] font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer ${
                  draftAutoKey ? 'text-violet-600' : 'text-slate-400'
                }`}
              >
                {AUTOMATION_KEY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function ProcessesView() {
  const [templates, setTemplates]           = useState<ProcessTemplateListItem[]>([])
  const [selected, setSelected]             = useState<ProcessTemplateDetail | null>(null)
  const [loadingList, setLoadingList]       = useState(true)
  const [loadingDetail, setLoadingDetail]   = useState(false)

  const [editingHeader, setEditingHeader]   = useState(false)
  const [headerName, setHeaderName]         = useState('')
  const [headerDesc, setHeaderDesc]         = useState('')
  const [savingHeader, setSavingHeader]     = useState(false)

  const [editingItemId, setEditingItemId]   = useState<string | null>(null)
  const [savingItemId, setSavingItemId]     = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  const [addingItem, setAddingItem]         = useState(false)
  const [newItemTitle, setNewItemTitle]     = useState('')
  const [savingNewItem, setSavingNewItem]   = useState(false)
  const newItemRef = useRef<HTMLInputElement>(null)

  const [showNewModal, setShowNewModal]                   = useState(false)
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState(false)
  const [deletingTemplate, setDeletingTemplate]           = useState(false)

  // ── Drag and drop state ──────────────────────────────────────────────────
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  useEffect(() => {
    if (addingItem) setTimeout(() => newItemRef.current?.focus(), 0)
  }, [addingItem])

  const fetchTemplates = useCallback(async () => {
    setLoadingList(true)
    try {
      const { data } = await api.get<ProcessTemplateListItem[]>('/portal/process-templates')
      setTemplates(data)
    } finally { setLoadingList(false) }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const handleSelectTemplate = async (id: string) => {
    if (selected?.id === id) return
    setEditingHeader(false)
    setEditingItemId(null)
    setAddingItem(false)
    setLoadingDetail(true)
    setSelected(null)
    try {
      const { data } = await api.get<ProcessTemplateDetail>(`/portal/process-templates/${id}`)
      setSelected(data)
    } finally { setLoadingDetail(false) }
  }

  const startEditHeader = () => {
    if (!selected) return
    setHeaderName(selected.name)
    setHeaderDesc(selected.description ?? '')
    setEditingHeader(true)
  }

  const saveHeader = async () => {
    if (!selected || !headerName.trim()) return
    setSavingHeader(true)
    try {
      const { data } = await api.put<ProcessTemplateDetail>(`/portal/process-templates/${selected.id}`, {
        name: headerName.trim(),
        description: headerDesc.trim() || null,
      })
      setSelected(data)
      setTemplates(prev => prev.map(t => t.id === data.id ? { ...t, name: data.name, description: data.description } : t))
      setEditingHeader(false)
    } finally { setSavingHeader(false) }
  }

  const saveItem = async (itemId: string, title: string, isRequired: boolean, automationKey: string | null) => {
    if (!selected || !title.trim()) return
    setSavingItemId(itemId)
    try {
      const { data } = await api.put<ProcessTemplateItem>(
        `/portal/process-templates/${selected.id}/items/${itemId}`,
        { title: title.trim(), isRequired, automationKey: automationKey || null }
      )
      setSelected(prev => prev ? { ...prev, items: prev.items.map(i => i.id === itemId ? data : i) } : null)
      setEditingItemId(null)
    } finally { setSavingItemId(null) }
  }

  const deleteItem = async (itemId: string) => {
    if (!selected) return
    try {
      await api.delete(`/portal/process-templates/${selected.id}/items/${itemId}`)
      const newItems = selected.items.filter(i => i.id !== itemId).map((i, idx) => ({ ...i, sortOrder: idx }))
      setSelected({ ...selected, items: newItems })
      setTemplates(prev => prev.map(t => t.id === selected.id ? { ...t, itemCount: newItems.length } : t))
      setDeletingItemId(null)
    } catch { /* keep confirm state open on error */ }
  }

  const moveItem = async (itemId: string, direction: 'up' | 'down') => {
    if (!selected) return
    const items = [...selected.items]
    const idx   = items.findIndex(i => i.id === itemId)
    if (direction === 'up'   && idx === 0) return
    if (direction === 'down' && idx === items.length - 1) return
    const swap = direction === 'up' ? idx - 1 : idx + 1
    ;[items[idx], items[swap]] = [items[swap], items[idx]]
    items.forEach((item, i) => { items[i] = { ...item, sortOrder: i } })
    setSelected({ ...selected, items })
    await api.put(`/portal/process-templates/${selected.id}/items/reorder`, items.map(i => i.id))
  }

  const addItem = async () => {
    if (!selected || !newItemTitle.trim()) return
    setSavingNewItem(true)
    try {
      const { data } = await api.post<ProcessTemplateItem>(
        `/portal/process-templates/${selected.id}/items`,
        { title: newItemTitle.trim(), isRequired: true }
      )
      const newItems = [...selected.items, data]
      setSelected({ ...selected, items: newItems })
      setTemplates(prev => prev.map(t => t.id === selected.id ? { ...t, itemCount: newItems.length } : t))
      setNewItemTitle('')
      setAddingItem(false)
    } finally { setSavingNewItem(false) }
  }

  const deleteTemplate = async () => {
    if (!selected) return
    setDeletingTemplate(true)
    try {
      await api.delete(`/portal/process-templates/${selected.id}`)
      setTemplates(prev => prev.filter(t => t.id !== selected.id))
      setSelected(null)
      setConfirmDeleteTemplate(false)
    } finally { setDeletingTemplate(false) }
  }

  // ── Drag handlers ────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedId(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (itemId !== draggedId) setDragOverId(itemId)
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId || !selected) {
      setDraggedId(null); setDragOverId(null); return
    }
    const items   = [...selected.items]
    const fromIdx = items.findIndex(i => i.id === draggedId)
    const toIdx   = items.findIndex(i => i.id === targetId)
    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)
    items.forEach((item, i) => { items[i] = { ...item, sortOrder: i } })
    setSelected({ ...selected, items })
    setDraggedId(null); setDragOverId(null)
    await api.put(`/portal/process-templates/${selected.id}/items/reorder`, items.map(i => i.id))
  }

  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null) }

  // ── Group templates ──────────────────────────────────────────────────────

  const grouped = templates.reduce<Partial<Record<string, ProcessTemplateListItem[]>>>((acc, t) => {
    const key = t.targetEntityType
    if (!acc[key]) acc[key] = []
    acc[key]!.push(t)
    return acc
  }, {})

  const entityOrder: TargetEntityType[] = ['Employee', 'Hardware', 'Phone', 'SimCard', 'License', 'Location']
  const presentTypes = entityOrder.filter(t => (grouped[t]?.length ?? 0) > 0)

  return (
    <div className="flex h-full gap-4 min-h-0">

      {/* ── Left panel ───────────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3 min-h-0">
        <div className="flex items-center justify-between flex-shrink-0">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Checklist Templates</h2>
          <Button size="sm" onClick={() => setShowNewModal(true)}>
            <Plus size={12} /> Nieuw
          </Button>
        </div>

        <Card className="flex-1 overflow-hidden flex flex-col min-h-0">
          {loadingList ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <ClipboardList size={28} className="text-slate-200 mb-3" />
              <p className="text-xs text-slate-400">Nog geen templates</p>
              <button onClick={() => setShowNewModal(true)} className="mt-3 text-xs font-medium text-blue-600 hover:underline">
                Eerste template aanmaken
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto py-2">
              {presentTypes.map(entityType => (
                <div key={entityType}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 mt-1">
                    <span className="text-slate-400">{ENTITY_ICON[entityType]}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {TARGET_ENTITY_LABEL[entityType as TargetEntityType]}
                    </span>
                  </div>
                  {grouped[entityType]!.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t.id)}
                      className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors border-l-2 ${
                        selected?.id === t.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-medium truncate ${selected?.id === t.id ? 'text-blue-700' : 'text-slate-700'}`}>
                            {t.name}
                          </span>
                          {t.isSystemDefault && (
                            <Lock size={10} className="flex-shrink-0 text-slate-400" title="Standaard template" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {t.defaultChecklistType && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CHECKLIST_TYPE_TONE[t.defaultChecklistType]}`}>
                              {CHECKLIST_TYPE_LABEL[t.defaultChecklistType]}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">{t.itemCount} stappen</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Right panel ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 min-h-0">
        <Card className="h-full flex flex-col min-h-0 overflow-hidden">
          {loadingDetail ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : !selected ? (
            <EmptyState />
          ) : (
            <>
              {/* Template header */}
              <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
                {editingHeader ? (
                  <div className="space-y-2">
                    <input
                      value={headerName}
                      onChange={e => setHeaderName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveHeader(); if (e.key === 'Escape') setEditingHeader(false) }}
                      className="w-full text-base font-bold text-slate-900 border-b border-blue-400 bg-transparent outline-none pb-0.5"
                      placeholder="Naam template…"
                      autoFocus
                    />
                    <input
                      value={headerDesc}
                      onChange={e => setHeaderDesc(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Escape') setEditingHeader(false) }}
                      className="w-full text-sm text-slate-500 border-b border-slate-200 bg-transparent outline-none pb-0.5"
                      placeholder="Omschrijving (optioneel)…"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="sm" onClick={saveHeader} disabled={savingHeader}>{savingHeader ? 'Opslaan…' : 'Opslaan'}</Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingHeader(false)}>Annuleren</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-slate-900">{selected.name}</h2>
                        {selected.isSystemDefault && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                            <Lock size={9} /> Standaard
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TARGET_ENTITY_TONE[selected.targetEntityType as TargetEntityType]}`}>
                          {TARGET_ENTITY_LABEL[selected.targetEntityType as TargetEntityType]}
                        </span>
                        {selected.defaultChecklistType && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CHECKLIST_TYPE_TONE[selected.defaultChecklistType]}`}>
                            Gebruikt voor: {CHECKLIST_TYPE_LABEL[selected.defaultChecklistType]}
                          </span>
                        )}
                      </div>
                      {selected.description && (
                        <p className="text-sm text-slate-500 mt-0.5">{selected.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={startEditHeader} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                        <Pencil size={12} /> Bewerken
                      </button>
                      {!selected.isSystemDefault && (
                        <button onClick={() => setConfirmDeleteTemplate(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={12} /> Verwijderen
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {selected.items.length === 0 && !addingItem ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-sm text-slate-400 mb-3">Nog geen stappen toegevoegd</p>
                    <button onClick={() => setAddingItem(true)} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
                      <Plus size={14} /> Eerste stap toevoegen
                    </button>
                  </div>
                ) : (
                  <>
                    {selected.items.map((item, idx) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        index={idx}
                        total={selected.items.length}
                        isEditing={editingItemId === item.id}
                        isSaving={savingItemId === item.id}
                        isConfirmingDelete={deletingItemId === item.id}
                        isDragging={draggedId === item.id}
                        isDragOver={dragOverId === item.id}
                        onStartEdit={() => { setEditingItemId(item.id); setDeletingItemId(null) }}
                        onSaveEdit={(title, isRequired, automationKey) => saveItem(item.id, title, isRequired, automationKey)}
                        onCancelEdit={() => setEditingItemId(null)}
                        onMoveUp={() => moveItem(item.id, 'up')}
                        onMoveDown={() => moveItem(item.id, 'down')}
                        onDeleteClick={() => { setDeletingItemId(item.id); setEditingItemId(null) }}
                        onDeleteConfirm={() => deleteItem(item.id)}
                        onDeleteCancel={() => setDeletingItemId(null)}
                        onDragStart={e => handleDragStart(e, item.id)}
                        onDragOver={e => handleDragOver(e, item.id)}
                        onDrop={e => handleDrop(e, item.id)}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                  </>
                )}

                {/* Add item row */}
                {addingItem && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/60 border-t border-slate-100">
                    <GripVertical size={13} className="text-slate-300 flex-shrink-0" />
                    <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {selected.items.length + 1}
                    </span>
                    <input
                      ref={newItemRef}
                      value={newItemTitle}
                      onChange={e => setNewItemTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); addItem() }
                        if (e.key === 'Escape') { setAddingItem(false); setNewItemTitle('') }
                      }}
                      placeholder="Nieuwe stap omschrijving…"
                      className="flex-1 text-sm text-slate-800 border-b border-blue-400 bg-transparent outline-none pb-0.5"
                    />
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={addItem}
                        disabled={savingNewItem || !newItemTitle.trim()}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                      >
                        {savingNewItem
                          ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          : <Check size={12} />}
                      </button>
                      <button
                        onClick={() => { setAddingItem(false); setNewItemTitle('') }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3">
                <button
                  onClick={() => { setAddingItem(true); setEditingItemId(null) }}
                  disabled={addingItem}
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40 transition-colors"
                >
                  <Plus size={14} /> Stap toevoegen
                </button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showNewModal && (
        <NewTemplateModal
          onClose={() => setShowNewModal(false)}
          onCreated={t => {
            setTemplates(prev => [...prev, { ...t, itemCount: 0 }])
            setSelected(t)
            setShowNewModal(false)
          }}
        />
      )}

      <ConfirmDeleteModal
        open={confirmDeleteTemplate}
        onClose={() => setConfirmDeleteTemplate(false)}
        onConfirm={deleteTemplate}
        itemName={selected?.name ?? ''}
      />
    </div>
  )
}
