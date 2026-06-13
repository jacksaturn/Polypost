import type { PlatformCharacterSummary } from '../lib/platforms/types';

interface CharacterMeterProps {
  summary: PlatformCharacterSummary;
  // Shown when the count is an approximation (e.g. X's weighted counting).
  disclaimer?: string;
}

// Within this many characters of the limit, the count number turns dark yellow.
const NEAR_LIMIT_MARGIN = 25;

export function CharacterMeter({ summary, disclaimer }: CharacterMeterProps) {
  const { count, limit, status } = summary;
  const near = status !== 'over' && limit - count <= NEAR_LIMIT_MARGIN;

  return (
    <div className={`character-meter is-${status}${near ? ' is-near' : ''}`} aria-live="polite">
      <div>
        <strong>{count.toLocaleString()}</strong> / {limit.toLocaleString()} characters
      </div>
      <meter
        className="meter-track"
        min={0}
        max={limit}
        value={Math.min(count, limit)}
        aria-label="Character count"
      />
      {disclaimer ? <p className="meter-disclaimer">{disclaimer}</p> : null}
    </div>
  );
}
