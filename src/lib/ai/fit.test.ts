import { describe, expect, it, vi } from 'vitest';

import { xSpec } from '../platforms/x';
import { defaultLlmConfig } from './config';

vi.mock('./llmClient', () => ({ generateText: vi.fn() }));
import { generateText } from './llmClient';
import { generateFit } from './fit';

const mockGenerate = vi.mocked(generateText);

const config = { ...defaultLlmConfig(), enabled: true, apiKey: 'k' };

describe('generateFit deterministic length check', () => {
  it('accepts the first attempt when it is already within the limit', async () => {
    mockGenerate.mockReset();
    mockGenerate.mockResolvedValueOnce('Short enough for X.');

    const result = await generateFit({ config, spec: xSpec, masterText: 'a'.repeat(600) });

    expect(result.withinLimit).toBe(true);
    expect(result.attempts).toBe(1);
    expect(result.count).toBeLessThanOrEqual(xSpec.charLimit);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it('regenerates when the model returns an over-limit version, then succeeds', async () => {
    mockGenerate.mockReset();
    mockGenerate
      .mockResolvedValueOnce('x'.repeat(400)) // 400 > 280 → retry
      .mockResolvedValueOnce('Now it fits.'); // within limit

    const result = await generateFit({ config, spec: xSpec, masterText: 'long', maxAttempts: 3 });

    expect(mockGenerate).toHaveBeenCalledTimes(2);
    expect(result.withinLimit).toBe(true);
    expect(result.text).toBe('Now it fits.');
    // The retry prompt must carry the over-limit feedback.
    expect(mockGenerate.mock.calls[1][0].prompt).toContain('over the 280');
  });

  it('returns the shortest best effort when every attempt exceeds the limit', async () => {
    mockGenerate.mockReset();
    mockGenerate
      .mockResolvedValueOnce('x'.repeat(500))
      .mockResolvedValueOnce('x'.repeat(320)) // shortest
      .mockResolvedValueOnce('x'.repeat(400));

    const result = await generateFit({ config, spec: xSpec, masterText: 'long', maxAttempts: 3 });

    expect(mockGenerate).toHaveBeenCalledTimes(3);
    expect(result.withinLimit).toBe(false);
    expect(result.count).toBe(320);
  });
});
