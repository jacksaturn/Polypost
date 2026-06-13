// Generic "see more" cutoff estimation shared by every platform's feed
// preview. The LinkedIn-specific configs live in feedPreview.ts; per-platform
// configs live on each PlatformSpec.
export type PreviewMode = 'desktop' | 'mobile';

export interface TruncationConfig {
  visibleLines: number;
  approximateCharacters: number;
  approximateCharactersPerLine: number;
}

export function isTextTruncated(text: string, config: TruncationConfig): boolean {
  const normalized = text.replace(/\r\n?/g, '\n').trimEnd();

  if (!normalized.trim()) {
    return false;
  }

  return (
    countApproximateLines(normalized, config.approximateCharactersPerLine) > config.visibleLines ||
    Array.from(normalized).length > config.approximateCharacters
  );
}

function countApproximateLines(text: string, approximateCharactersPerLine: number): number {
  return text.split('\n').reduce((lineCount, line) => {
    if (!line.trim()) {
      return lineCount + 1;
    }

    return lineCount + Math.max(1, Math.ceil(Array.from(line).length / approximateCharactersPerLine));
  }, 0);
}
