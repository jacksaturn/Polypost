import { useEffect } from 'react';

// Calls the handler when Escape is pressed — used to dismiss modal dialogs.
export function useEscape(onEscape: () => void): void {
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onEscape();
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onEscape]);
}
