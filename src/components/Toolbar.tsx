import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Code2,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Trash2,
  Underline,
  Undo2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ToolbarProps {
  editor: Editor | null;
  onReset: () => void;
}

interface ToolButtonProps {
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const EMOJI_CHOICES = ['😀', '😊', '✨', '🚀', '💡', '✅', '🔥', '👏', '📌', '🎯'];

export function Toolbar({ editor, onReset }: ToolbarProps) {
  const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false);

  function run(command: () => boolean) {
    if (!editor) {
      return;
    }

    command();
  }

  function toggleLink() {
    if (!editor) {
      return;
    }

    const existingHref = editor.getAttributes('link').href as string | undefined;
    const value = window.prompt('Paste a URL for the selected text. Leave empty to remove the link.', existingHref ?? 'https://');

    if (value === null) {
      return;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }

  function insertEmoji(emoji: string) {
    if (!editor) {
      return;
    }

    editor.chain().focus().insertContent(emoji).run();
    setIsEmojiMenuOpen(false);
  }

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting toolbar">
      <div className="toolbar-row toolbar-row-main">
        <div className="toolbar-group" aria-label="History">
          <ToolButton
            label="Undo"
            shortcut="Ctrl+Z"
            icon={Undo2}
            disabled={!editor?.can().undo()}
            onClick={() => run(() => editor!.chain().focus().undo().run())}
          />
          <ToolButton
            label="Redo"
            shortcut="Ctrl+Y"
            icon={Redo2}
            disabled={!editor?.can().redo()}
            onClick={() => run(() => editor!.chain().focus().redo().run())}
          />
        </div>

        <div className="toolbar-group" aria-label="Inline styles">
          <ToolButton
            label="Bold"
            shortcut="Ctrl+B"
            icon={Bold}
            active={editor?.isActive('bold') ?? false}
            disabled={!editor}
            onClick={() => run(() => editor!.chain().focus().toggleBold().run())}
          />
          <ToolButton
            label="Italic"
            shortcut="Ctrl+I"
            icon={Italic}
            active={editor?.isActive('italic') ?? false}
            disabled={!editor}
            onClick={() => run(() => editor!.chain().focus().toggleItalic().run())}
          />
          <ToolButton
            label="Underline"
            shortcut="Ctrl+U"
            icon={Underline}
            active={editor?.isActive('underline') ?? false}
            disabled={!editor}
            onClick={() => run(() => editor!.chain().focus().toggleUnderline().run())}
          />
          <ToolButton
            label="Code"
            icon={Code2}
            active={editor?.isActive('code') ?? false}
            disabled={!editor}
            onClick={() => run(() => editor!.chain().focus().toggleCode().run())}
          />
          <ToolButton
            label="Strikethrough"
            icon={Strikethrough}
            active={editor?.isActive('strike') ?? false}
            disabled={!editor}
            onClick={() => run(() => editor!.chain().focus().toggleStrike().run())}
          />
          <ToolButton label="Link" icon={Link2} active={editor?.isActive('link') ?? false} disabled={!editor} onClick={toggleLink} />
        </div>

        <div className="toolbar-group" aria-label="Lists">
          <ToolButton
            label="Bulleted list"
            icon={List}
            active={editor?.isActive('bulletList') ?? false}
            disabled={!editor}
            onClick={() => run(() => editor!.chain().focus().toggleBulletList().run())}
          />
          <ToolButton
            label="Numbered list"
            icon={ListOrdered}
            active={editor?.isActive('orderedList') ?? false}
            disabled={!editor}
            onClick={() => run(() => editor!.chain().focus().toggleOrderedList().run())}
          />
          <ToolButton
            label="Indent list item"
            icon={IndentIncrease}
            disabled={!editor?.can().sinkListItem('listItem')}
            onClick={() => run(() => editor!.chain().focus().sinkListItem('listItem').run())}
          />
          <ToolButton
            label="Outdent list item"
            icon={IndentDecrease}
            disabled={!editor?.can().liftListItem('listItem')}
            onClick={() => run(() => editor!.chain().focus().liftListItem('listItem').run())}
          />
        </div>

        <div className="toolbar-group" aria-label="Blocks">
          <ToolButton
            label="Blockquote"
            icon={Quote}
            active={editor?.isActive('blockquote') ?? false}
            disabled={!editor}
            onClick={() => run(() => editor!.chain().focus().toggleBlockquote().run())}
          />
          <ToolButton
            label="Horizontal divider"
            icon={Minus}
            disabled={!editor?.can().setHorizontalRule()}
            onClick={() => run(() => editor!.chain().focus().setHorizontalRule().run())}
          />
        </div>

        <div className="toolbar-group toolbar-group-push" aria-label="Draft actions">
          <div className="emoji-menu">
            <button
              type="button"
              className="tool-button emoji-menu-button"
              aria-label="Insert emoji"
              aria-haspopup="menu"
              aria-expanded={isEmojiMenuOpen}
              disabled={!editor}
              title="Insert emoji"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsEmojiMenuOpen((isOpen) => !isOpen)}
            >
              😀
            </button>
            {isEmojiMenuOpen ? (
              <div className="emoji-menu-popover" role="menu" aria-label="Choose emoji">
                {EMOJI_CHOICES.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="emoji-button"
                    aria-label={`Insert ${emoji}`}
                    role="menuitem"
                    title={`Insert ${emoji}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <ToolButton label="Reset draft" icon={Trash2} disabled={!editor} onClick={onReset} />
        </div>
      </div>
    </div>
  );
}

function ToolButton({ label, shortcut, icon: Icon, active, disabled, onClick }: ToolButtonProps) {
  const title = shortcut ? `${label} (${shortcut})` : label;
  const buttonContent = <Icon aria-hidden="true" size={15} strokeWidth={2.2} />;

  if (active === true) {
    return (
      <button
        type="button"
        className="tool-button is-active"
        aria-label={title}
        aria-pressed="true"
        disabled={disabled}
        title={title}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
      >
        {buttonContent}
      </button>
    );
  }

  if (active === false) {
    return (
      <button
        type="button"
        className="tool-button"
        aria-label={title}
        aria-pressed="false"
        disabled={disabled}
        title={title}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
      >
        {buttonContent}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="tool-button"
      aria-label={title}
      disabled={disabled}
      title={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {buttonContent}
    </button>
  );
}