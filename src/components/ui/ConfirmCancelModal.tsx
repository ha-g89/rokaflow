import { XCircle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  itemName?: string
}

export function ConfirmCancelModal({ open, onClose, onConfirm, itemName }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Opzeggen bevestigen">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
          <XCircle size={22} className="text-amber-500" />
        </div>
        <div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Weet je zeker dat je{' '}
            {itemName
              ? <span className="font-semibold">"{itemName}"</span>
              : 'dit item'
            }{' '}
            wilt opzeggen?
          </p>
          <p className="text-xs text-slate-400 mt-1">De status wordt op "Opgezegd" gezet.</p>
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Annuleren
        </Button>
        <button
          onClick={onConfirm}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
        >
          <XCircle size={13} /> Ja, opzeggen
        </button>
      </div>
    </Modal>
  )
}
