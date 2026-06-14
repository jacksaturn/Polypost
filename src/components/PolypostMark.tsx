// Polypost brand mark: a gradient rounded-square app icon with a white
// paper-plane ("send to everywhere"). Self-contained — owns its own background.
export function PolypostMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="polypost-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#polypost-grad)" />
      <g transform="translate(9 9) scale(1.25)" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
        <path d="M21.854 2.147 10.914 13.086" />
      </g>
    </svg>
  );
}
