import type { PlatformSpec } from './types';

export const threadsSpec: PlatformSpec = {
  id: 'threads',
  label: 'Threads',
  brandColor: '#000000',
  charLimit: 500,
  warningThreshold: 465,
  counting: 'nfc-codepoints',
  allowUnicodeStyling: false,
  // Feed collapses early (~175 chars); front-load the hook.
  truncation: {
    desktop: { visibleLines: 4, approximateCharacters: 175, approximateCharactersPerLine: 45 },
  },
  truncationLabel: '... more',
  capabilities: {
    copy: true,
    // Threads migrated to threads.com (April 2025); threads.net still redirects.
    openComposer: {
      url: (text) => `https://www.threads.com/intent/post?text=${encodeURIComponent(text)}`,
      prefillsText: true,
    },
  },
  warnings: [],
};
