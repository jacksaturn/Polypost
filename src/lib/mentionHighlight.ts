import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// @[Name] mention tokens are plain text in the editor; this decorates them with a
// class so they read as highlighted name references (styled blue in CSS).
const MENTION_TOKEN_SOURCE = String.raw`@\[[^\][\n]+\]`;

export const MentionHighlight = Extension.create({
  name: 'mentionHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mentionHighlight'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];

            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) {
                return;
              }

              const pattern = new RegExp(MENTION_TOKEN_SOURCE, 'g');
              let match: RegExpExecArray | null;

              while ((match = pattern.exec(node.text)) !== null) {
                decorations.push(
                  Decoration.inline(pos + match.index, pos + match.index + match[0].length, { class: 'mention-ref' }),
                );
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
