import { X } from 'lucide-react';

import { useEscape } from '../lib/useEscape';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }: ConfirmDialogProps) {
  useEscape(onCancel);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={onCancel}>
      <div className="modal-card confirm-card" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 id="confirm-title">{title}</h2>
          <button type="button" className="card-icon-button" aria-label="Cancel" onClick={onCancel}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <p className="modal-hint">{message}</p>
        <div className="modal-actions">
          <button type="button" className="card-copy-button" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="primary-action" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
