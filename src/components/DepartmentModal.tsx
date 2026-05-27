import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Search, UserPlus, Trash2 } from 'lucide-react'
import api from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import type { DepartmentListItem } from '@/types/department'
import type { ClientUserListItem } from '@/types/clientUser'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name:        z.string().min(1, 'Naam is verplicht').max(256),
  description: z.string().max(1000).optional(),
  managerUserId: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open:       boolean
  onClose:    () => void
  onSuccess:  (dept: DepartmentListItem) => void
  editTarget?: DepartmentListItem | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DepartmentModal({ open, onClose, onSuccess, editTarget }: Props) {
  const isEdit = !!editTarget

  const [allUsers, setAllUsers]           = useState<ClientUserListItem[]>([])
  const [selectedMembers, setSelectedMembers] = useState<ClientUserListItem[]>([])
  const [memberSearch, setMemberSearch]   = useState('')
  const [saving, setSaving]               = useState(false)
  const [apiError, setApiError]           = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  // Fetch all portal users once
  useEffect(() => {
    if (!open) return
    api.get<ClientUserListItem[]>('/portal/users').then(r => setAllUsers(r.data)).catch(() => {})
  }, [open])

  // Populate form when editing
  useEffect(() => {
    if (!open) return
    if (editTarget) {
      reset({
        name:          editTarget.name,
        description:   editTarget.description,
        managerUserId: editTarget.managerUserId ?? '',
      })
      // Load current members from the detail endpoint
      api.get(`/portal/departments/${editTarget.id}`).then(r => {
        const memberIds: string[] = r.data.members.map((m: { id: string }) => m.id)
        const members = allUsers.filter(u => memberIds.includes(u.id))
        setSelectedMembers(members)
      }).catch(() => {})
    } else {
      reset({ name: '', description: '', managerUserId: '' })
      setSelectedMembers([])
    }
    setMemberSearch('')
    setApiError(null)
  }, [open, editTarget]) // eslint-disable-line react-hooks/exhaustive-deps

  const addMember = (user: ClientUserListItem) => {
    if (!selectedMembers.find(m => m.id === user.id))
      setSelectedMembers(prev => [...prev, user])
  }

  const removeMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== userId))
  }

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    setApiError(null)
    try {
      const payload = {
        name:          values.name.trim(),
        description:   values.description?.trim() ?? '',
        managerUserId: values.managerUserId || null,
        memberIds:     selectedMembers.map(m => m.id),
      }

      const { data } = isEdit
        ? await api.put<DepartmentListItem>(`/portal/departments/${editTarget!.id}`, payload)
        : await api.post<DepartmentListItem>('/portal/departments', payload)

      onSuccess(data)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Er is iets misgegaan.')
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = allUsers.filter(u => {
    if (selectedMembers.find(m => m.id === u.id)) return false
    const q = memberSearch.toLowerCase()
    return `${u.firstName} ${u.lastName} ${u.email} ${u.department}`.toLowerCase().includes(q)
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {isEdit ? 'Afdeling bewerken' : 'Nieuwe afdeling'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Naam <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="bijv. IT, Sales, HR"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Omschrijving
            </label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Korte omschrijving van deze afdeling…"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400 resize-none"
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
          </div>

          {/* Manager */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Manager <span className="text-slate-400">(optioneel)</span>
            </label>
            <select
              {...register('managerUserId')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
            >
              <option value="">— Geen manager —</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}{u.jobTitle ? ` — ${u.jobTitle}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Members */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Medewerkers
            </label>

            {/* Selected members chips */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedMembers.map(m => (
                  <span key={m.id} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                    {m.firstName} {m.lastName}
                    <button type="button" onClick={() => removeMember(m.id)} className="hover:text-red-500">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search + add */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Zoek medewerker om toe te voegen…"
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
              />
            </div>

            {memberSearch && filteredUsers.length > 0 && (
              <ul className="mt-1 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                {filteredUsers.slice(0, 8).map(u => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => addMember(u)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <UserPlus size={12} className="text-indigo-400 flex-shrink-0" />
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{u.firstName} {u.lastName}</span>
                      {u.jobTitle && <span className="text-slate-400">— {u.jobTitle}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {memberSearch && filteredUsers.length === 0 && (
              <p className="mt-1 text-xs text-slate-400 px-1">Geen resultaten.</p>
            )}
          </div>

          {apiError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3">
              <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 flex-shrink-0">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Annuleren</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={saving}>
            {saving ? 'Opslaan…' : isEdit ? 'Opslaan' : 'Afdeling aanmaken'}
          </Button>
        </div>
      </div>
    </div>
  )
}
