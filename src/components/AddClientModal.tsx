import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ImagePlus, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import api from '@/lib/axios'

const schema = z.object({
  name: z.string().min(1, 'Naam is verplicht').max(256),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  endpoint: string
}

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors'

export function AddClientModal({ open, onClose, onSuccess, endpoint }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const clearLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    setApiError(null)
    clearLogo()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    setApiError(null)
    try {
      const { data } = await api.post<{ id: string }>(endpoint, { name: values.name })

      if (logoFile && data.id) {
        const form = new FormData()
        form.append('file', logoFile)
        await api.post(`/clients/${data.id}/logo`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      handleClose()
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg ?? 'Aanmaken mislukt.')
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nieuwe client">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Logo upload */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Logo (optioneel)</label>
          <div className="flex items-center gap-3">
            {logoPreview ? (
              <div className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0">
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1" />
                <button
                  type="button"
                  onClick={clearLogo}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-700/80 text-white flex items-center justify-center hover:bg-slate-900"
                >
                  <X size={9} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-violet-400 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-violet-500 transition-colors flex-shrink-0"
              >
                <ImagePlus size={18} />
                <span className="text-[10px] leading-none">Upload</span>
              </button>
            )}
            <div className="text-xs text-slate-500 leading-relaxed">
              PNG, JPG of WebP<br />Maximaal 512×512px
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Naam *</label>
          <input {...register('name')} className={field} placeholder="Bedrijfsnaam" autoFocus />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        {apiError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Aanmaken…' : 'Client aanmaken'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
