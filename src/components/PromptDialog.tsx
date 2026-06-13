import { useState } from 'react';
import { X } from 'lucide-react';

import { useEscape } from '../lib/useEscape';

interface PromptDialogProps {
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({ title, label, initialValue = '', placeholder, submitLabel = 'Apply', onSubmit, onCancel }: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEscape(onCancel);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(value);
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="prompt-title" onMouseDown={onCancel}>
      <form className="modal-card confirm-card" onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2 id="prompt-title">{title}</h2>
          <button type="button" className="card-icon-button" aria-label="Cancel" onClick={onCancel}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <label className="field-row">
          <span>{label}</span>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input type="text" autoFocus value={value} placeholder={placeholder} onChange={(event) => setValue(event.target.value)} />
        </label>
        <div className="modal-actions">
          <button type="button" className="card-copy-button" onClick={onCancel}>Cancel</button>
          <button type="submit" className="primary-action">{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}
