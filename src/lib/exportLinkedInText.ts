// Compatibility shim. The generalized renderer now lives in exportText.ts and
// the counting/status helpers in counting.ts + constants.ts; this module keeps
// the LinkedIn-named API that the web app, the browser extension, and the
// existing test suite import.
import { LINKEDIN_POST_CHARACTER_LIMIT, getCharacterCountStatus } from './constants';
import { countCharacters } from './counting';
import { exportText, type EditorNode } from './exportText';

export type { EditorMark, EditorNode } from './exportText';

export function exportLinkedInText(document: EditorNode | null | undefined): string {
  return exportText(document, { unicodeStyling: true });
}

export function countLinkedInCharacters(text: string): number {
  return countCharacters(text, 'nfc-codepoints');
}

export function getLinkedInCharacterStatus(text: string) {
  return getCharacterCountStatus(countLinkedInCharacters(text));
}

export function getLinkedInCharacterSummary(text: string) {
  const count = countLinkedInCharacters(text);

  return {
    count,
    limit: LINKEDIN_POST_CHARACTER_LIMIT,
    remaining: LINKEDIN_POST_CHARACTER_LIMIT - count,
    status: getCharacterCountStatus(count),
  };
}
