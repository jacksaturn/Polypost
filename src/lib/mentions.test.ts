import { describe, expect, it } from 'vitest';

import { flattenMentionTokens, hasMentionTokens, parseMentionSegments, transformAroundMentionTokens } from './mentions';

describe('mentions', () => {
  it('parses text around mention tokens into segments', () => {
    expect(parseMentionSegments('Thanks @[Scott Hanselman] for the demo with @[Jane Doe]!')).toEqual([
      { kind: 'text', text: 'Thanks ' },
      { kind: 'mention', name: 'Scott Hanselman' },
      { kind: 'text', text: ' for the demo with ' },
      { kind: 'mention', name: 'Jane Doe' },
      { kind: 'text', text: '!' },
    ]);
  });

  it('returns a single text segment when there are no tokens', () => {
    expect(parseMentionSegments('No mentions here')).toEqual([{ kind: 'text', text: 'No mentions here' }]);
    expect(parseMentionSegments('')).toEqual([]);
  });

  it('handles tokens at the start and end of the text', () => {
    expect(parseMentionSegments('@[Scott Hanselman] and @[Jane Doe]')).toEqual([
      { kind: 'mention', name: 'Scott Hanselman' },
      { kind: 'text', text: ' and ' },
      { kind: 'mention', name: 'Jane Doe' },
    ]);
  });

  it('keeps blank-name and unterminated tokens as literal text', () => {
    expect(parseMentionSegments('Hello @[ ] and @[broken')).toEqual([{ kind: 'text', text: 'Hello @[ ] and @[broken' }]);
  });

  it('trims whitespace inside the token name', () => {
    expect(parseMentionSegments('@[ Scott Hanselman ]')).toEqual([{ kind: 'mention', name: 'Scott Hanselman' }]);
  });

  it('does not match tokens spanning newlines', () => {
    expect(hasMentionTokens('@[Scott\nHanselman]')).toBe(false);
  });

  it('detects whether text contains mention tokens', () => {
    expect(hasMentionTokens('Hi @[Scott Hanselman]')).toBe(true);
    expect(hasMentionTokens('Hi @Scott')).toBe(false);
  });

  it('flattens tokens to plain @Name text', () => {
    expect(flattenMentionTokens('Thanks @[Scott Hanselman]! See @[ ]')).toBe('Thanks @Scott Hanselman! See @[ ]');
  });

  it('transforms only the text between tokens', () => {
    const result = transformAroundMentionTokens('bold @[Scott Hanselman] text', (chunk) => chunk.toUpperCase());

    expect(result).toBe('BOLD @[Scott Hanselman] TEXT');
  });

  it('transforms the whole text when there are no tokens', () => {
    expect(transformAroundMentionTokens('plain', (chunk) => chunk.toUpperCase())).toBe('PLAIN');
  });
});
