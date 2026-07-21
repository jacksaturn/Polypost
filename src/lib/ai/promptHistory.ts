// The AI instruction history, persisted so the up/down recall survives reloads.
// Uses the existing omnipost: storage namespace (see the keys in config/storage).
const PROMPT_HISTORY_KEY = 'omnipost:ai-prompt-history-v1';
const MAX_PROMPT_HISTORY = 50;

export function loadPromptHistory(): string[] {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PROMPT_HISTORY_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function savePromptHistory(history: string[]): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(history.slice(-MAX_PROMPT_HISTORY)));
  } catch {
    // Non-fatal: history still works in memory for this session.
  }
}

// Append a submitted prompt, skipping an immediate duplicate and capping length.
export function appendPrompt(history: string[], prompt: string): string[] {
  const trimmed = prompt.trim();

  if (!trimmed || history[history.length - 1] === trimmed) {
    return history;
  }

  return [...history, trimmed].slice(-MAX_PROMPT_HISTORY);
}
