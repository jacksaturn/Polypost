export function HelpPanel() {
  return (
    <details className="help-panel">
      <summary>Formatting compatibility</summary>
      <ul>
        <li>Bold, italic, and underline export as Unicode text, not selectable font styling.</li>
        <li>Nested lists and blockquotes use non-breaking-space indentation because LinkedIn posts are plain text.</li>
        <li>Horizontal dividers export as a plain line without extra blank padding.</li>
        <li>Emoji stay as regular emoji; underline and strikethrough do not add combining marks to them.</li>
        <li>Hashtags stay plain so LinkedIn has the best chance to recognize them.</li>
        <li>
          Mention people as @[Name], for example @[Scott Hanselman]. The editor shows the token as plain text; the
          preview and character count show it as @Name.
        </li>
        <li>
          Posting through the extension resolves each @[Name] through LinkedIn's mention typeahead into a real,
          clickable mention. Only an exact name match is used (your closest connection wins when several people share
          the name); if nothing matches exactly, the text stays plain @Name rather than mentioning the wrong person.
          Each mention adds a moment to posting.
        </li>
        <li>
          Copy for LinkedIn flattens @[Name] to plain @Name: pasted text can never become a real mention because
          LinkedIn only creates mentions through its own typeahead. To mention after pasting, retype @Name in
          LinkedIn's composer and pick the person from the dropdown.
        </li>
        <li>Links export as readable text plus URL because custom pasted anchor text is not supported in posts.</li>
        <li>Pasted Markdown converts to formatted draft text for common inline styles, links, headings, fenced code, lists, blockquotes, and horizontal rules.</li>
        <li>The More cutoff toggle estimates LinkedIn's collapsed feed view at about three visible lines, roughly 210 desktop characters or 140 mobile characters depending on wrapping.</li>
        <li>Logged-in real feedcard previews require LinkedIn APIs this static app cannot call.</li>
        <li>Saved drafts are local to this browser only.</li>
        <li>Strikethrough is experimental and may render differently across devices.</li>
        <li>LinkedIn controls the final post font after paste; this app cannot copy CSS fonts into a post.</li>
        <li>The composer is the working view; Copy for LinkedIn transforms it into LinkedIn-ready plain text.</li>
        <li>Keyboard shortcuts include Ctrl+B, Ctrl+I, Ctrl+Z, and Ctrl+Y.</li>
      </ul>
    </details>
  );
}