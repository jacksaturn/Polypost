import { describe, expect, it } from 'vitest';

import { exportLinkedInText, getLinkedInCharacterSummary, type EditorNode } from '../exportLinkedInText';
import { flattenMentionTokens } from '../mentions';
import { instagramSpec } from './instagram';
import { linkedinSpec } from './linkedin';
import { PLATFORMS, PLATFORMS_BY_ID, renderForPlatform } from './index';

function doc(content: EditorNode[]): EditorNode {
  return { type: 'doc', content };
}

function paragraph(content: EditorNode[]): EditorNode {
  return { type: 'paragraph', content };
}

function text(value: string, marks: EditorNode['marks'] = []): EditorNode {
  return { type: 'text', text: value, marks };
}

describe('renderForPlatform (LinkedIn parity)', () => {
  const document = doc([
    paragraph([text('Hello ', [{ type: 'bold' }]), text('@[Ada Lovelace]'), text(' — ship it!')]),
  ]);

  it('produces the same text the web app produces today for LinkedIn', () => {
    const expectedText = flattenMentionTokens(exportLinkedInText(document));
    const render = renderForPlatform(document, linkedinSpec);

    expect(render.text).toBe(expectedText);
  });

  it('produces the same character summary as getLinkedInCharacterSummary', () => {
    const expectedText = flattenMentionTokens(exportLinkedInText(document));
    const expected = getLinkedInCharacterSummary(expectedText);
    const render = renderForPlatform(document, linkedinSpec);

    expect(render.summary).toEqual(expected);
  });
});

describe('platform registry', () => {
  it('indexes every platform by id', () => {
    for (const spec of PLATFORMS) {
      expect(PLATFORMS_BY_ID[spec.id]).toBe(spec);
    }
  });

  it('keeps every spec internally consistent (warn ≤ limit)', () => {
    for (const spec of PLATFORMS) {
      expect(spec.charLimit).toBeGreaterThan(0);
      expect(spec.warningThreshold).toBeLessThanOrEqual(spec.charLimit);
      expect(spec.capabilities.copy).toBe(true);
    }
  });

  it('builds composer intent URLs that safely encode special characters', () => {
    const tricky = 'Hello #launch & <friends>\nnew line';

    for (const spec of PLATFORMS) {
      const composer = spec.capabilities.openComposer;

      if (!composer || !composer.prefillsText) {
        continue;
      }

      const url = composer.url(tricky);
      // No raw delimiters that would break the query string.
      expect(url).not.toContain('#launch');
      expect(url).not.toContain(' & ');
      expect(url).not.toContain('\n');
      expect(url).toContain(encodeURIComponent(tricky));
    }
  });
});

describe('platform warnings', () => {
  const docWithLink: Parameters<typeof renderForPlatform>[0] = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Read more at https://example.com today' }],
      },
    ],
  };

  const docWithoutLink: Parameters<typeof renderForPlatform>[0] = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'No links here' }] }],
  };

  it('warns about non-clickable Instagram links only when a link is present', () => {
    expect(renderForPlatform(docWithLink, instagramSpec).warnings.map((w) => w.id)).toContain('instagram-links');
    expect(renderForPlatform(docWithoutLink, instagramSpec).warnings).toHaveLength(0);
  });
});
