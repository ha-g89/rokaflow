import { Trash2 } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  itemName?: string
}

export function ConfirmDeleteModal({ open, onClose, onConfirm, itemName }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Verwijderen bevestigen">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Weet je zeker dat je{' '}
            {itemName
              ? <span className="font-semibold">"{itemName}"</span>
              : 'dit item'
            }{' '}
            wilt verwijderen?
          </p>
          <p className="text-xs text-slate-400 mt-1">Dit kan niet ongedaan worden gemaakt.</p>
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Annuleren
        </Button>
        <Button variant="danger" className="flex-1" onClick={onConfirm}>
          <Trash2 size={13} /> Ja, verwijder
        </Button>
      </div>
    </Modal>
  )
}
