import { HelpContent } from './HelpContent';

// Used by the browser extension overlay. The web app shows help in a modal
// (HelpModal) opened from the header instead.
export function HelpPanel() {
  return (
    <details className="help-panel">
      <summary>How previews and formatting work</summary>
      <HelpContent />
    </details>
  );
}
