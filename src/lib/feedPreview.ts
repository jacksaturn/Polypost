import { isTextTruncated, type PreviewMode, type TruncationConfig } from './truncation';

// LinkedIn-specific feed cutoff configs. The generic estimation logic lives in
// truncation.ts; this module keeps the LinkedIn-named API the editor and the
// browser extension already import.
export type FeedPreviewMode = PreviewMode;

export const FEED_CUTOFF_CONFIG: Record<FeedPreviewMode, TruncationConfig> = {
  desktop: {
    visibleLines: 3,
    approximateCharacters: 210,
    approximateCharactersPerLine: 70,
  },
  mobile: {
    visibleLines: 3,
    approximateCharacters: 140,
    approximateCharactersPerLine: 47,
  },
};

export function isFeedCutoffLikely(text: string, mode: FeedPreviewMode): boolean {
  return isTextTruncated(text, FEED_CUTOFF_CONFIG[mode]);
}
