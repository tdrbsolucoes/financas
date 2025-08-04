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
    <div className="modal-overlay">
      <div className="modal-content confirmation-modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onCancel}>
            <X />
          </button>
        </div>

        <div className="modal-body">
          <p>{message}</p>
        </div>

        <div className="confirmation-actions">
          <button className="form-button cancel-button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="form-button confirm-button" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal