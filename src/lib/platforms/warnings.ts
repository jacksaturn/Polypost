import { URL_PATTERN } from '../unicodeStyles';

export function containsUrl(text: string): boolean {
  // Fresh, non-global regex so we don't carry lastIndex state between calls.
  return new RegExp(URL_PATTERN.source, 'u').test(text);
}
