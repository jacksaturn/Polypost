import { describe, expect, it } from 'vitest';

import { appendPrompt } from './promptHistory';

describe('appendPrompt', () => {
  it('appends a new prompt', () => {
    expect(appendPrompt(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('trims and ignores empty prompts', () => {
    expect(appendPrompt(['a'], '   ')).toEqual(['a']);
    expect(appendPrompt(['a'], '  b  ')).toEqual(['a', 'b']);
  });

  it('skips an immediate duplicate of the most recent prompt', () => {
    expect(appendPrompt(['a', 'b'], 'b')).toEqual(['a', 'b']);
    // A non-adjacent duplicate is still appended (recency matters for ↑/↓).
    expect(appendPrompt(['b', 'a'], 'b')).toEqual(['b', 'a', 'b']);
  });

  it('caps history length at 50', () => {
    const long = Array.from({ length: 50 }, (_, i) => `p${i}`);
    const result = appendPrompt(long, 'new');
    expect(result).toHaveLength(50);
    expect(result[result.length - 1]).toBe('new');
    expect(result[0]).toBe('p1');
  });
});
