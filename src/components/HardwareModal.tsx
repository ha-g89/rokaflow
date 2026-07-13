import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Lock, Package, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'
import type { ClientUserListItem } from '@/types/clientUser'
import type { HardwareAssetListItem } from '@/types/hardware'
import {
  HARDWARE_TYPE_OPTIONS, HARDWARE_STATUS_OPTIONS,
  HARDWARE_TYPE_LABEL, HARDWARE_STATUS_LABEL, HARDWARE_STATUS_TONE,
} from '@/types/hardware'
import type { LocationListItem } from '@/types/location'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name:             z.string().min(1, 'Naam is verplicht').max(256),
  brand:            z.string().max(200),
  type:             z.string(),
  assetNumber:      z.string().max(100),
  serialNumber:     z.string().max(100),
  status:           z.string(),
  locationId:       z.string(),
  purchaseValue:    z.string(),
  supplier:         z.string().max(200),
  assignedToUserId: z.string(),
  issuedAt:         z.string(),
  returnedAt:       z.string(),
  orderedAt:        z.string(),
})

type FormValues = z.infer<typeof schema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  teammates: ClientUserListItem[]
  locations: LocationListItem[]
  asset?: HardwareAssetListItem | null
  lockedUser?: { id: string; name: string }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors'

function toDateInput(v: string | null | undefined) {
  return v ? v.substring(0, 10) : ''
}

function typeNameToValue(typeName: string): number {
  const map: Record<string, number> = {
    Laptop: 0, Desktop: 1, Phone: 2, Tablet: 3, Monitor: 4, Other: 5,
  }
  return map[typeName] ?? 0
}

function statusNameToValue(statusName: string): number {
  const map: Record<string, number> = { InStock: 0, InUse: 1, Decommissioned: 2, UnderRepair: 3, OnOrder: 4 }
  return map[statusName] ?? 0
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: 'existing' | 'new'; onChange: (t: 'existing' | 'new') => void }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
      {(['existing', 'new'] as const).map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            active === t
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t === 'existing' ? 'Bestaand hardware' : 'Nieuwe hardware'}
        </button>
      ))}
    </div>
  )
}

// ── Existing hardware detail card ─────────────────────────────────────────────

function HwDetailCard({ hw }: { hw: HardwareAssetListItem }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{hw.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {[hw.brand, HARDWARE_TYPE_LABEL[hw.type] ?? hw.type].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${HARDWARE_STATUS_TONE[hw.status] ?? 'bg-slate-100 text-slate-600'}`}>
          {HARDWARE_STATUS_LABEL[hw.status] ?? hw.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
        {hw.serialNumber && (
          <p><span className="text-slate-400">Serienr:</span> {hw.serialNumber}</p>
        )}
        {hw.assetNumber && (
          <p><span className="text-slate-400">Assetnr:</span> {hw.assetNumber}</p>
        )}
        {hw.locationName && (
          <p><span className="text-slate-400">Locatie:</span> {hw.locationName}</p>
        )}
        {hw.purchaseValue != null && (
          <p><span className="text-slate-400">Waarde:</span> € {hw.purchaseValue.toFixed(2)}</p>
        )}
      </div>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function HardwareModal({ open, onClose, onSuccess, teammates, locations, asset, lockedUser }: Props) {
  const [apiError, setApiError]       = useState<string | null>(null)
  const [tab, setTab]                 = useState<'existing' | 'new'>('existing')
  const [hwList, setHwList]           = useState<HardwareAssetListItem[]>([])
  const [hwLoading, setHwLoading]     = useState(false)
  const [hwSearch, setHwSearch]       = useState('')
  const [selectedHw, setSelectedHw]   = useState<HardwareAssetListItem | null>(null)
  const [linking, setLinking]         = useState(false)
  const [linkError, setLinkError]     = useState<string | null>(null)

  const isEdit      = !!asset
  const showTabs    = !!lockedUser && !isEdit

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const statusValue = watch('status')
  const isOnOrder   = statusValue === '4'

  // Serienummer is nog niet bekend zolang de hardware in bestelling staat
  useEffect(() => {
    if (isOnOrder) setValue('serialNumber', '')
  }, [isOnOrder, setValue])

  // Reset form + state when modal opens
  useEffect(() => {
    if (open) {
      setTab('existing')
      setSelectedHw(null)
      setHwSearch('')
      setApiError(null)
      setLinkError(null)

      if (asset) {
        reset({
          name:             asset.name,
          brand:            asset.brand,
          type:             String(typeNameToValue(asset.type)),
          assetNumber:      asset.assetNumber,
          serialNumber:     asset.serialNumber,
          status:           String(statusNameToValue(asset.status)),
          locationId:       asset.locationId ?? '',
          purchaseValue:    asset.purchaseValue != null ? String(asset.purchaseValue) : '',
          supplier:         asset.supplier ?? '',
          assignedToUserId: asset.assignedToUserId ?? '',
          issuedAt:         toDateInput(asset.issuedAt),
          returnedAt:       toDateInput(asset.returnedAt),
          orderedAt:        toDateInput(asset.orderedAt),
        })
      } else {
        reset({
          name: '', brand: '', type: '0', assetNumber: '', serialNumber: '',
          status: lockedUser ? '1' : '0', locationId: '', purchaseValue: '',
          supplier: '',
          assignedToUserId: lockedUser?.id ?? '', issuedAt: '', returnedAt: '', orderedAt: '',
        })
      }
    }
  }, [open, asset, reset]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch unlinked hardware when in existing tab
  useEffect(() => {
    if (!open || !lockedUser) return
    setHwLoading(true)
    api.get<HardwareAssetListItem[]>('/portal/hardware')
      .then(r => setHwList(r.data.filter(h => !h.assignedToUserId && h.status !== 'Decommissioned')))
      .catch(() => setHwList([]))
      .finally(() => setHwLoading(false))
  }, [open, lockedUser])

  const handleClose = () => { reset(); setApiError(null); onClose() }

  // Link existing hardware to user
  const handleLink = async () => {
    if (!selectedHw || !lockedUser) return
    setLinking(true)
    setLinkError(null)
    try {
      await api.put(`/portal/hardware/${selectedHw.id}`, {
        name:             selectedHw.name,
        brand:            selectedHw.brand || '',
        type:             typeNameToValue(selectedHw.type),
        assetNumber:      selectedHw.assetNumber || '',
        serialNumber:     selectedHw.serialNumber || '',
        status:           1, // InUse
        location:         selectedHw.location || '',
        locationId:       selectedHw.locationId || null,
        purchaseValue:    selectedHw.purchaseValue ?? null,
        supplier:         selectedHw.supplier ?? null,
        assignedToUserId: lockedUser.id,
        issuedAt:         selectedHw.issuedAt ?? null,
        returnedAt:       null,
      })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setLinkError(msg ?? 'Koppelen mislukt.')
    } finally {
      setLinking(false)
    }
  }

  // Create new hardware
  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const payload = {
        name:             values.name,
        brand:            values.brand || '',
        type:             parseInt(values.type, 10),
        assetNumber:      values.assetNumber || '',
        serialNumber:     values.serialNumber || '',
        status:           values.assignedToUserId && parseInt(values.status, 10) === 0
                            ? 1  // toegewezen → automatisch InUse
                            : parseInt(values.status, 10),
        location:         '',
        locationId:       values.locationId || null,
        purchaseValue:    values.purchaseValue !== '' ? parseFloat(values.purchaseValue) : null,
        supplier:         values.supplier || null,
        assignedToUserId: values.assignedToUserId || null,
        issuedAt:         values.issuedAt ? new Date(values.issuedAt).toISOString() : null,
        returnedAt:       values.returnedAt ? new Date(values.returnedAt).toISOString() : null,
        orderedAt:        values.orderedAt ? new Date(values.orderedAt).toISOString() : null,
      }
      if (isEdit) {
        await api.put(`/portal/hardware/${asset!.id}`, payload)
      } else {
        await api.post('/portal/hardware', payload)
      }
      reset()
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Opslaan mislukt.')
    }
  }

  const filtered = hwList.filter(h =>
    `${h.name} ${h.brand} ${h.serialNumber} ${h.assetNumber} ${h.type}`
      .toLowerCase().includes(hwSearch.toLowerCase())
  )

  const modalTitle = isEdit
    ? 'Hardware wijzigen'
    : showTabs ? 'Hardware koppelen' : 'Hardware toevoegen'

  return (
    <Modal open={open} onClose={handleClose} title={modalTitle} className="max-w-xl">

      {/* Tabs — only shown when adding from user detail */}
      {showTabs && <TabBar active={tab} onChange={setTab} />}

      {/* ── Tab: Bestaand ── */}
      {showTabs && tab === 'existing' && (
        <div className="space-y-4">
          {hwLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-sm">
              <Loader2 size={16} className="animate-spin" /> Laden…
            </div>
          ) : hwList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <Package size={32} className="text-slate-200" />
              <p className="text-sm text-slate-400">Geen vrije hardware beschikbaar.</p>
              <button
                type="button"
                onClick={() => setTab('new')}
                className="text-xs text-blue-600 hover:underline"
              >
                Nieuwe hardware aanmaken →
              </button>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={hwSearch}
                  onChange={e => { setHwSearch(e.target.value); setSelectedHw(null) }}
                  placeholder="Zoek op naam, merk, serienummer…"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors"
                />
              </div>

              {/* List */}
              <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-400">Geen resultaten.</p>
                ) : (
                  filtered.map(h => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setSelectedHw(prev => prev?.id === h.id ? null : h)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors
                        ${selectedHw?.id === h.id
                          ? 'bg-blue-50 border-l-2 border-blue-500'
                          : 'hover:bg-slate-50'}`}
                    >
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${selectedHw?.id === h.id ? 'text-blue-800' : 'text-slate-800'}`}>
                          {h.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {[h.brand, HARDWARE_TYPE_LABEL[h.type] ?? h.type, h.serialNumber ? `S/N: ${h.serialNumber}` : null]
                            .filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${HARDWARE_STATUS_TONE[h.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {HARDWARE_STATUS_LABEL[h.status] ?? h.status}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Detail card */}
              {selectedHw && <HwDetailCard hw={selectedHw} />}

              {linkError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{linkError}</p>
              )}

              {/* Footer */}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
                  Annuleren
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={!selectedHw || linking}
                  onClick={handleLink}
                >
                  {linking
                    ? <><Loader2 size={13} className="animate-spin" /> Koppelen…</>
                    : selectedHw
                    ? `Koppelen aan ${lockedUser!.name.split(' ')[0]}`
                    : 'Selecteer hardware'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Nieuw / default form ── */}
      {(!showTabs || tab === 'new') && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Naam *</label>
            <input {...register('name')} className={field} placeholder="Dell Latitude 5520" autoFocus />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Merk / model</label>
              <input {...register('brand')} className={field} placeholder="Dell" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
              <select {...register('type')} className={field}>
                {HARDWARE_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Assetnummer</label>
              <input {...register('assetNumber')} className={field} placeholder="ASS-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Serienummer</label>
              <input
                {...register('serialNumber')}
                className={`${field} disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800`}
                placeholder={isOnOrder ? 'Nog niet bekend' : 'SN1234567'}
                disabled={isOnOrder}
              />
              {isOnOrder && (
                <p className="mt-1 text-xs text-slate-400">Vul dit in zodra de hardware is ontvangen.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status *</label>
              <select {...register('status')} className={field}>
                {HARDWARE_STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Locatie</label>
              <select {...register('locationId')} className={field}>
                <option value="">— Geen locatie —</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}{l.city ? ` · ${l.city}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Aanschafwaarde (€)</label>
              <input {...register('purchaseValue')} type="number" step="0.01" min="0" className={field} placeholder="0.00" />
              {errors.purchaseValue && (
                <p className="mt-1 text-xs text-red-600">{errors.purchaseValue.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Leverancier</label>
              <input {...register('supplier')} className={field} placeholder="Coolblue, Dell…" />
            </div>
          </div>

          <div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Toegewezen aan</label>
              {lockedUser ? (
                <div className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-700 truncate">{lockedUser.name}</span>
                  <Lock size={12} className="text-slate-400 flex-shrink-0" />
                </div>
              ) : (
                <select {...register('assignedToUserId')} className={field}>
                  <option value="">— Niemand —</option>
                  {teammates.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isOnOrder ? (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Besteldatum</label>
                <input {...register('orderedAt')} type="date" className={field} />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Uitgiftedatum</label>
                <input {...register('issuedAt')} type="date" className={field} />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Inleverdatum</label>
              <input {...register('returnedAt')} type="date" className={field} />
            </div>
          </div>

          {apiError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
              Annuleren
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Hardware toevoegen'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
