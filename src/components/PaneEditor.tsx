import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';

import { editorExtensions, handleEditorPaste } from '../lib/editorConfig';
import type { EditorNode } from '../lib/exportText';

interface PaneEditorProps {
  initialContent: EditorNode;
  ariaLabel: string;
  // Fires only on real edits (TipTap onUpdate), never on mount — so opening a
  // pane editor doesn't fork the platform; the first edit does.
  onChange: (document: EditorNode) => void;
}

export function PaneEditor({ initialContent, ariaLabel, onChange }: PaneEditorProps) {
  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent as JSONContent,
    editorProps: {
      attributes: {
        'aria-label': ariaLabel,
        class: 'rich-editor-content pane-editor-content',
      },
    },
    immediatelyRender: false,
    onCreate({ editor: currentEditor }) {
      currentEditor.view.dom.addEventListener('paste', (event) => handleEditorPaste(currentEditor, event), true);
    },
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getJSON() as EditorNode);
    },
  });

  return <EditorContent editor={editor} />;
}
