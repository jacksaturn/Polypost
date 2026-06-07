import type { EditorNode } from './exportLinkedInText';

export const SAMPLE_DOCUMENT: EditorNode = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Formatting examples ✨', marks: [{ type: 'bold' }] }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ', ' },
        { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
        { type: 'text', text: ', ' },
        { type: 'text', text: 'bold italic', marks: [{ type: 'bold' }, { type: 'italic' }] },
        { type: 'text', text: ', ' },
        { type: 'text', text: 'underline', marks: [{ type: 'underline' }] },
        { type: 'text', text: ', ' },
        { type: 'text', text: 'strikethrough', marks: [{ type: 'strike' }] },
        { type: 'text', text: ', ' },
        { type: 'text', text: 'code', marks: [{ type: 'code' }] },
        { type: 'text', text: ', and ' },
        { type: 'text', text: 'links', marks: [{ type: 'link', attrs: { href: 'https://www.linkedin.com/' } }] },
        { type: 'text', text: ' export into LinkedIn-ready plain text.' },
      ],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Emoji stay intact in the editor and export: 🚀 💡 ✅' }],
    },
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet list item' }] }] },
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Nested bullet list item' }] },
            {
              type: 'bulletList',
              content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Indented child bullet' }] }] }],
            },
          ],
        },
      ],
    },
    {
      type: 'orderedList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Numbered list item' }] }] },
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Nested numbered list item' }] },
            {
              type: 'orderedList',
              content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Indented child number' }] }] }],
            },
          ],
        },
      ],
    },
    {
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Blockquotes export as indented plain text.' }] }],
    },
    {
      type: 'horizontalRule',
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '@mentions and #hashtags stay plain for LinkedIn recognition.' }],
    },
  ],
};