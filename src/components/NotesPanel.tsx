import { useEffect, useState, useCallback } from 'react'
import { StickyNote, Trash2, Plus, Loader2, Pencil, Check, X } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import type { EntityNote, NoteEntityType } from '@/types/notes'

function fmt(d: string) {
  return new Date(d).toLocaleString('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  entityType: NoteEntityType
  entityId: string
  canEdit?: boolean
}

export function NotesPanel({ entityType, entityId, canEdit = true }: Props) {
  const currentUserId = useAuthStore(s => s.user?.id ?? null)

  const [notes, setNotes]           = useState<EntityNote[]>([])
  const [loading, setLoading]       = useState(true)
  const [content, setContent]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<EntityNote[]>(`/notes/${entityType}/${entityId}`)
      setNotes(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [entityType, entityId])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const handleAdd = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      const { data } = await api.post<EntityNote>(`/notes/${entityType}/${entityId}`, { content: content.trim() })
      setNotes(prev => [data, ...prev])
      setContent('')
    } catch { /* silent */ }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await api.delete(`/notes/${id}`)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch { /* silent */ }
    finally { setDeletingId(null) }
  }

  const startEdit = (note: EntityNote) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return
    setUpdatingId(id)
    try {
      const { data } = await api.put<EntityNote>(`/notes/${id}`, { content: editContent.trim() })
      setNotes(prev => prev.map(n => n.id === id ? data : n))
      setEditingId(null)
      setEditContent('')
    } catch { /* silent */ }
    finally { setUpdatingId(null) }
  }

  const isOwn = (note: EntityNote) =>
    currentUserId !== null && note.createdByUserId === currentUserId

  return (
    <div className="flex flex-col gap-3">

      {/* Add form */}
      {canEdit && (
        <div className="flex flex-col gap-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Schrijf een notitie…"
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd() }}
          />
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              disabled={saving || !content.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Toevoegen
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-slate-400 text-center py-4">Laden…</p>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
          <StickyNote size={20} />
          <p className="text-sm">Nog geen notities.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map(note => (
            <div
              key={note.id}
              className="group rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex gap-3"
            >
              <div className="flex-1 min-w-0">
                {editingId === note.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={3}
                      autoFocus
                      className="w-full px-2 py-1.5 text-sm rounded-lg border border-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none resize-none"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleUpdate(note.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleUpdate(note.id)}
                        disabled={updatingId === note.id || !editContent.trim()}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {updatingId === note.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                        Opslaan
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-500 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X size={11} /> Annuleren
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">{note.content}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {note.isFromMsp && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 leading-none">
                          MSP
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {note.createdByName && <span className="font-medium text-slate-500 dark:text-slate-400">{note.createdByName} · </span>}
                        {fmt(note.createdAt)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Own-note actions — only visible on hover, only for author */}
              {canEdit && isOwn(note) && editingId !== note.id && (
                <div className="opacity-0 group-hover:opacity-100 flex flex-row gap-1 flex-shrink-0 transition-opacity items-start">
                  <button
                    onClick={() => startEdit(note)}
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    disabled={deletingId === note.id}
                    className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {deletingId === note.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
