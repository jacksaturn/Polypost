import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Settings, Sparkles } from 'lucide-react';

interface AiAssistProps {
  ready: boolean;
  busy: boolean;
  error: string | null;
  onSubmit: (instruction: string) => void;
  onOpenSettings: () => void;
}

export function AiAssist({ ready, busy, error, onSubmit, onOpenSettings }: AiAssistProps) {
  const [instruction, setInstruction] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  // -1 means "live input"; otherwise an index into history.
  const [historyIndex, setHistoryIndex] = useState(-1);
  const prevBusy = useRef(busy);

  // Clear the box once a generation finishes (busy goes true -> false).
  useEffect(() => {
    if (prevBusy.current && !busy) {
      setInstruction('');
      setHistoryIndex(-1);
    }
    prevBusy.current = busy;
  }, [busy]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = instruction.trim();

    if (!trimmed || busy) {
      return;
    }

    setHistory((prev) => (prev[prev.length - 1] === trimmed ? prev : [...prev, trimmed]));
    setHistoryIndex(-1);
    onSubmit(trimmed);
  }

  // Up/Down walk previously submitted prompts (most recent first).
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      if (history.length === 0) {
        return;
      }
      event.preventDefault();
      const next = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setInstruction(history[next]);
    } else if (event.key === 'ArrowDown') {
      if (historyIndex === -1) {
        return;
      }
      event.preventDefault();
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(-1);
        setInstruction('');
      } else {
        setHistoryIndex(next);
        setInstruction(history[next]);
      }
    }
  }

  if (!ready) {
    return (
      <div className="ai-assist is-disabled">
        <Sparkles aria-hidden="true" size={16} />
        <span>Connect an AI endpoint to write and auto-fit posts.</span>
        <button type="button" className="ai-assist-link" onClick={onOpenSettings}>
          <Settings aria-hidden="true" size={14} /> Set up
        </button>
      </div>
    );
  }

  return (
    <form className="ai-assist" onSubmit={handleSubmit}>
      <div className="ai-assist-row">
        <Sparkles aria-hidden="true" size={16} className="ai-assist-icon" />
        <input
          type="text"
          value={instruction}
          placeholder="Ask AI to write or improve this post… (↑/↓ for history)"
          aria-label="AI instruction"
          disabled={busy}
          onChange={(event) => setInstruction(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className="primary-action" disabled={busy || !instruction.trim()}>
          {busy ? 'Working…' : 'Generate'}
        </button>
      </div>
      {error ? (
        <p className="ai-assist-error" role="status">
          <AlertTriangle aria-hidden="true" size={14} /> {error}
        </p>
      ) : null}
    </form>
  );
}
