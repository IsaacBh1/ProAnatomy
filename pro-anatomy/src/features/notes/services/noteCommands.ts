import { useSelectionStore } from '@/store/selectionStore'
import type { SystemId } from '@/types/anatomy'
import { useNotesStore } from '../store/notesStore'
import { useNotesUiStore } from '../store/notesUiStore'
import type { Note, NoteAnchor } from '../types'
import { anchorKey } from '../types'

/**
 * Every action a component can take on a note, as a command. Same shape as
 * anatomy/services/viewCommands.ts: components stay declarative, and there's exactly one
 * place to look when behaviour needs to change.
 */

/** Notes attached to this exact anchor, newest first. */
export function notesForAnchor(anchor: NoteAnchor): Note[] {
  const key = anchorKey(anchor)
  return useNotesStore
    .getState()
    .notes.filter((note) => anchorKey(note.anchor) === key)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Context-aware "add note":
 *   - selection non-empty → note for that exact group
 *   - selection empty     → free note
 * If a note already exists for the resulting anchor, edit it instead of creating a duplicate.
 */
export function addNoteForSelection(): void {
  const ids = [...useSelectionStore.getState().selectedIds]
  const anchor: NoteAnchor = ids.length > 0 ? { kind: 'parts', ids } : { kind: 'free' }

  const existing = notesForAnchor(anchor)[0]
  if (existing) useNotesUiStore.getState().openNote(existing.id)
  else useNotesUiStore.getState().openDraft(anchor)
}

/** Opens (or drafts) the note attached to a body system. */
export function addNoteForSystem(id: SystemId): void {
  const anchor: NoteAnchor = { kind: 'system', id }
  const existing = notesForAnchor(anchor)[0]
  if (existing) useNotesUiStore.getState().openNote(existing.id)
  else useNotesUiStore.getState().openDraft(anchor)
}

/** A note not attached to anything. Reachable from the sidebar "+" and by pressing N with nothing selected. */
export function addFreeNote(): void {
  useNotesUiStore.getState().openDraft({ kind: 'free' })
}

export function editNote(id: string): void {
  useNotesUiStore.getState().openNote(id)
}

/** Removes the note, and closes the drawer if it happens to be showing it. */
export async function deleteNote(id: string): Promise<void> {
  const { target } = useNotesUiStore.getState()
  if (target?.kind === 'note' && target.id === id) useNotesUiStore.getState().close()
  await useNotesStore.getState().remove(id)
}

/**
 * Saves a draft or an edit. Both fields are trimmed.
 *
 * A note with neither a title nor a body is a no-op (returns null), so an accidental
 * Ctrl+Enter on an untouched draft never creates a blank note. A note with only a title, or
 * only a body, is valid — titles and bodies are both optional on their own.
 */
export async function saveNote(
  target: { kind: 'note'; id: string } | { kind: 'draft'; anchor: NoteAnchor },
  draft: { title: string; body: string },
): Promise<Note | null> {
  const title = draft.title.trim()
  const body = draft.body.trim()
  if (!title && !body) return null

  if (target.kind === 'note') {
    return useNotesStore.getState().update(target.id, { title, body })
  }
  return useNotesStore.getState().create({ title, anchor: target.anchor, body })
}
