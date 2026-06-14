// Mention tokens: "@[Display Name]" in exported text marks a LinkedIn mention.
// Posting through the extension resolves each token into a real mention via
// LinkedIn's composer typeahead; the copy/preview paths flatten tokens to
// plain "@Display Name" text since paste can never produce a mention.
export type MentionSegment = { kind: 'text'; text: string } | { kind: 'mention'; name: string };

const MENTION_TOKEN_SOURCE = String.raw`@\[([^\][\n]+)\]`;

function createMentionTokenPattern(): RegExp {
  return new RegExp(MENTION_TOKEN_SOURCE, 'g');
}

export function hasMentionTokens(text: string): boolean {
  return parseMentionSegments(text).some((segment) => segment.kind === 'mention');
}

// Splits text into literal-text and mention segments. Tokens with a blank
// name ("@[ ]") stay literal text.
export function parseMentionSegments(text: string): MentionSegment[] {
  const segments: MentionSegment[] = [];
  const pattern = createMentionTokenPattern();
  let consumedIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const name = match[1].trim();

    if (!name) {
      continue;
    }

    if (match.index > consumedIndex) {
      segments.push({ kind: 'text', text: text.slice(consumedIndex, match.index) });
    }

    segments.push({ kind: 'mention', name });
    consumedIndex = match.index + match[0].length;
  }

  if (consumedIndex < text.length) {
    segments.push({ kind: 'text', text: text.slice(consumedIndex) });
  }

  return segments;
}

// Replaces "@[Display Name]" tokens with "@Display Name" for surfaces where a
// real mention is impossible (copy, preview, character counts). `collapseSpaces`
// removes the spaces in the name ("@DisplayName") so a single-word handle-style
// token triggers the whole-name autocomplete on platforms that mention by handle
// (Threads, X, Bluesky, Mastodon) instead of splitting a multi-word name.
export function flattenMentionTokens(text: string, options: { collapseSpaces?: boolean } = {}): string {
  const collapseSpaces = options.collapseSpaces ?? false;
  return text.replace(createMentionTokenPattern(), (token, name: string) => {
    const trimmed = name.trim();

    if (!trimmed) {
      return token;
    }

    return `@${collapseSpaces ? trimmed.replace(/\s+/g, '') : trimmed}`;
  });
}

// Applies a transform (e.g. Unicode styling) to the text between mention
// tokens while keeping the tokens themselves verbatim: token text must stay
// pristine for the typeahead lookup, and LinkedIn renders mentions unstyled.
export function transformAroundMentionTokens(text: string, transform: (chunk: string) => string): string {
  const pattern = createMentionTokenPattern();
  let output = '';
  let consumedIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (!match[1].trim()) {
      continue;
    }

    output += transform(text.slice(consumedIndex, match.index)) + match[0];
    consumedIndex = match.index + match[0].length;
  }

  return output + transform(text.slice(consumedIndex));
}
