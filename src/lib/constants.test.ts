import { describe, expect, it } from 'vitest';

import { getCharacterCountStatus } from './constants';

describe('getCharacterCountStatus', () => {
  it('flags over when above the limit', () => {
    expect(getCharacterCountStatus(281, 280, 260)).toBe('over');
  });

  it('warns within 50 of the limit even below the platform warning threshold', () => {
    // 280 - 231 = 49 → within 50 → warning, despite being under the 260 threshold.
    expect(getCharacterCountStatus(231, 280, 260)).toBe('warning');
  });

  it('warns at or above the platform warning threshold', () => {
    expect(getCharacterCountStatus(265, 280, 260)).toBe('warning');
  });

  it('is normal when comfortably under both thresholds', () => {
    // 280 - 229 = 51 → outside the 50-char margin and under 260.
    expect(getCharacterCountStatus(229, 280, 260)).toBe('normal');
  });
});
