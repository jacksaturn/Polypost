import { describe, expect, it } from 'vitest';

import { exportLinkedInText } from './exportLinkedInText';
import { exportText, type EditorNode } from './exportText';
import { styleText } from './unicodeStyles';

function doc(content: EditorNode[]): EditorNode {
  return { type: 'doc', content };
}

function paragraph(content: EditorNode[]): EditorNode {
  return { type: 'paragraph', content };
}

function text(value: string, marks: EditorNode['marks'] = []): EditorNode {
  return { type: 'text', text: value, marks };
}

const STYLED_FIXTURES: EditorNode[] = [
  doc([paragraph([text('First')]), paragraph([text('Second')])]),
  doc([
    paragraph([
      text('Bold', [{ type: 'bold' }]),
      text(' and '),
      text('italic', [{ type: 'italic' }]),
      text('.'),
    ]),
  ]),
  doc([{ type: 'heading', attrs: { level: 2 }, content: [text('Launch notes')] }]),
  doc([paragraph([text('Underlined', [{ type: 'underline' }])])]),
  doc([paragraph([text('Thanks @[Scott Hanselman] again', [{ type: 'bold' }])])]),
  doc([
    paragraph([
      text('Read the guide', [{ type: 'link', attrs: { href: 'https://example.com/guide' } }]),
    ]),
  ]),
  doc([
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [paragraph([text('First')])] },
        { type: 'listItem', content: [paragraph([text('Second')])] },
      ],
    },
  ]),
  doc([
    { type: 'blockquote', content: [paragraph([text('Quoted')])] },
    { type: 'horizontalRule' },
    paragraph([text('After')]),
  ]),
];

describe('exportText', () => {
  it('is byte-identical to exportLinkedInText when unicodeStyling is on', () => {
    for (const fixture of STYLED_FIXTURES) {
      expect(exportText(fixture, { unicodeStyling: true })).toBe(exportLinkedInText(fixture));
    }
  });

  it('emits raw text instead of styled Unicode when unicodeStyling is off', () => {
    const document = doc([
      paragraph([text('Bold', [{ type: 'bold' }]), text(' plain'), text(' italic', [{ type: 'italic' }])]),
    ]);

    expect(exportText(document, { unicodeStyling: true })).toBe(
      `${styleText('Bold', { bold: true })} plain${styleText(' italic', { italic: true })}`,
    );
    expect(exportText(document, { unicodeStyling: false })).toBe('Bold plain italic');
  });

  it('drops heading bold styling when unicodeStyling is off but keeps block structure', () => {
    const document = doc([
      { type: 'heading', attrs: { level: 2 }, content: [text('Title')] },
      paragraph([text('Body')]),
    ]);

    expect(exportText(document, { unicodeStyling: false })).toBe('Title\n\nBody');
  });

  it('keeps link rendering and mention tokens intact regardless of styling', () => {
    const document = doc([
      paragraph([
        text('Guide', [{ type: 'link', attrs: { href: 'https://example.com' } }]),
        text(' for @[Ada Lovelace]'),
      ]),
    ]);

    expect(exportText(document, { unicodeStyling: false })).toBe('Guide (https://example.com) for @[Ada Lovelace]');
  });
});
