import React from 'react'
import { X } from 'lucide-react'

interface ConfirmationModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 backdrop-blur-sm">
      <div className="bg-card p-6 rounded-lg max-w-sm shadow-2xl border border-border">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
          <h3 className="m-0 text-xl font-semibold">{title}</h3>
          <button className="bg-transparent border-none text-xl cursor-pointer text-muted-foreground" onClick={onCancel}>
            <X />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-muted-foreground leading-relaxed">{message}</p>
        </div>

        <div className="flex justify-end gap-4">
          <button className="p-3 border-none rounded-lg bg-muted text-muted-foreground text-base font-semibold cursor-pointer transition-all hover:brightness-90" onClick={onCancel}>
            Cancelar
          </button>
          <button className="p-3 border-none rounded-lg bg-destructive text-destructive-foreground text-base font-semibold cursor-pointer transition-all hover:brightness-110" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal