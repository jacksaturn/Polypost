import type { EditorNode } from './exportText';
import type { PlatformId } from './platforms/types';

// The full editor state: one master document, optional per-platform overrides
// (a key present means that platform is "forked"/customized), and the set of
// platforms currently shown in the preview rail.
export interface Workspace {
  master: EditorNode;
  overrides: Partial<Record<PlatformId, EditorNode>>;
  enabledPlatforms: PlatformId[];
}

export function applyMasterEdit(workspace: Workspace, master: EditorNode): Workspace {
  return { ...workspace, master };
}

// Editing inside a platform pane forks it: the first edit creates the override,
// later edits update it. Non-forked platforms keep mirroring the master.
export function applyPaneEdit(workspace: Workspace, id: PlatformId, doc: EditorNode): Workspace {
  return { ...workspace, overrides: { ...workspace.overrides, [id]: doc } };
}

// Re-sync a platform to the master, discarding its customization.
export function resyncPlatform(workspace: Workspace, id: PlatformId): Workspace {
  if (workspace.overrides[id] === undefined) {
    return workspace;
  }

  const overrides = { ...workspace.overrides };
  delete overrides[id];
  return { ...workspace, overrides };
}

// Show/hide a platform. Disabling keeps any override dormant so re-enabling
// restores the customization.
export function togglePlatform(workspace: Workspace, id: PlatformId): Workspace {
  const isEnabled = workspace.enabledPlatforms.includes(id);
  const enabledPlatforms = isEnabled
    ? workspace.enabledPlatforms.filter((platform) => platform !== id)
    : [...workspace.enabledPlatforms, id];

  return { ...workspace, enabledPlatforms };
}

export function isForked(workspace: Workspace, id: PlatformId): boolean {
  return workspace.overrides[id] !== undefined;
}

// The document a platform renders from: its override when forked, else the master.
export function documentFor(workspace: Workspace, id: PlatformId): EditorNode {
  return workspace.overrides[id] ?? workspace.master;
}

// Platforms that are hidden but still hold a customization (chip shows a dot).
export function dormantPlatforms(workspace: Workspace): PlatformId[] {
  return (Object.keys(workspace.overrides) as PlatformId[]).filter(
    (id) => !workspace.enabledPlatforms.includes(id),
  );
}
