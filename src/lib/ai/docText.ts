import { type EditorNode, exportText } from '../exportText';
import { flattenMentionTokens } from '../mentions';

// Editor document -> plain text the LLM reads (no styled Unicode, mentions flattened).
export function docToPlainText(doc: EditorNode | null | undefined): string {
  return flattenMentionTokens(exportText(doc, { unicodeStyling: false }));
}

// Plain text from the LLM -> a TipTap document. Blank lines separate paragraphs;
// single newlines within a paragraph become hard breaks.
export function plainTextToDoc(text: string): EditorNode {
  const normalized = text.replace(/\r\n?/g, '\n').trim();

  if (!normalized) {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }

  const paragraphs = normalized.split(/\n{2,}/);

  const content: EditorNode[] = paragraphs.map((paragraph) => {
    const lines = paragraph.split('\n');
    const inline: EditorNode[] = [];

    lines.forEach((line, index) => {
      if (index > 0) {
        inline.push({ type: 'hardBreak' });
      }

      if (line) {
        inline.push({ type: 'text', text: line });
      }
    });

    return { type: 'paragraph', content: inline };
  });

  return { type: 'doc', content };
}
