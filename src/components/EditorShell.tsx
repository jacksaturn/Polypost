import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { LINKEDIN_POST_CHARACTER_LIMIT } from '../lib/constants';
import type { EditorNode } from '../lib/exportLinkedInText';
import { Toolbar } from './Toolbar';

interface EditorShellProps {
  initialContent: EditorNode;
  onDocumentChange: (document: EditorNode) => void;
  onReset: () => void;
}

const extensions = [
  StarterKit.configure({
    codeBlock: false,
    heading: {
      levels: [2, 3],
    },
  }),
  Underline,
  Link.configure({
    autolink: true,
    defaultProtocol: 'https',
    openOnClick: true,
    HTMLAttributes: {
      target: '_blank',
      rel: 'noopener noreferrer nofollow',
      title: 'Click to open. Use the Link toolbar button to edit.',
    },
  }),
  Placeholder.configure({
    placeholder: 'Paste or write your LinkedIn post draft...',
  }),
  CharacterCount.configure({
    limit: LINKEDIN_POST_CHARACTER_LIMIT,
  }),
];

export function EditorShell({ initialContent, onDocumentChange, onReset }: EditorShellProps) {
  const editor = useEditor({
    extensions,
    content: initialContent as JSONContent,
    editorProps: {
      attributes: {
        'aria-label': 'LinkedIn post draft editor',
        class: 'rich-editor-content',
      },
      transformPastedHTML(html) {
        return html
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<table[\s\S]*?<\/table>/gi, '')
          .replace(/<img[^>]*>/gi, '');
      },
    },
    immediatelyRender: false,
    onCreate({ editor: currentEditor }) {
      onDocumentChange(currentEditor.getJSON() as EditorNode);
    },
    onUpdate({ editor: currentEditor }) {
      onDocumentChange(currentEditor.getJSON() as EditorNode);
    },
  });

  return (
    <div className="editor-shell">
      <Toolbar editor={editor} onReset={onReset} />
      <div className="editor-frame">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}