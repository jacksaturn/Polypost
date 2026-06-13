import type { EditorNode } from '../exportText';
import { markdownToTipTap } from '../markdownToTipTap';
import { renderForPlatform } from '../platforms';
import type { PlatformSpec } from '../platforms/types';
import type { LlmConfig } from './config';
import { generateText } from './llmClient';
import { buildFitRequest, buildOverLimitFeedback } from './prompts';

export interface FitResult {
  doc: EditorNode;
  text: string;
  count: number;
  withinLimit: boolean;
  attempts: number;
}

export interface FitOptions {
  config: LlmConfig;
  spec: PlatformSpec;
  masterText: string;
  style?: string;
  signal?: AbortSignal;
  maxAttempts?: number;
}

// Measures a candidate exactly the way its preview card will (same render path),
// so the deterministic check matches what the user sees.
function measure(text: string, spec: PlatformSpec): { doc: EditorNode; count: number } {
  // Parse Markdown so **bold**/*italic*/lists become real marks; platforms that
  // don't allow styling flatten them back to plain text at render time.
  const doc = markdownToTipTap(text);
  return { doc, count: renderForPlatform(doc, spec).summary.count };
}

// Generates a platform-fitted version, then deterministically checks the length
// and re-prompts the model to shorten until it fits (or attempts run out). The
// model isn't trusted to count — we verify and feed the real overage back.
export async function generateFit({ config, spec, masterText, style, signal, maxAttempts = 4 }: FitOptions): Promise<FitResult> {
  const base = buildFitRequest(spec, masterText, style);
  let best: { doc: EditorNode; text: string; count: number } | null = null;
  let feedback = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const prompt = feedback ? `${base.prompt}\n\n${feedback}` : base.prompt;
    const text = await generateText({ config, system: base.system, prompt, signal });
    const { doc, count } = measure(text, spec);

    if (count <= spec.charLimit) {
      return { doc, text, count, withinLimit: true, attempts: attempt };
    }

    if (!best || count < best.count) {
      best = { doc, text, count };
    }

    feedback = buildOverLimitFeedback(spec, text, count);

    if (signal?.aborted) {
      break;
    }
  }

  // Couldn't get fully under the limit — return the shortest attempt as a best effort.
  const fallback = best ?? measureToResult('', spec);
  return { ...fallback, withinLimit: false, attempts: maxAttempts };
}

function measureToResult(text: string, spec: PlatformSpec): { doc: EditorNode; text: string; count: number } {
  const { doc, count } = measure(text, spec);
  return { doc, text, count };
}
