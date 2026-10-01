import { useSelectionStore } from '@/store/selectionStore'
import type { SystemId } from '@/types/anatomy'
import { useNotesStore } from '../store/notesStore'
import { useNotesUiStore } from '../store/notesUiStore'
import type { Note, NoteAnchor } from '../types'
import { anchorKey } from '../types'

/** Notes attached to this exact anchor, newest first. */
export function notesForAnchor(anchor: NoteAnchor): Note[] {
  const key = anchorKey(anchor)
  return useNotesStore
    .getState()
    .notes.filter((note) => anchorKey(note.anchor) === key)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function addNoteForSelection(): void {
  const ids = [...useSelectionStore.getState().selectedIds]
  const anchor: NoteAnchor = ids.length > 0 ? { kind: 'parts', ids } : { kind: 'free' }

  const existing = notesForAnchor(anchor)[0]
  if (existing) useNotesUiStore.getState().openNote(existing.id)
  else useNotesUiStore.getState().openDraft(anchor)
}

export function addNoteForSystem(id: SystemId): void {
  const anchor: NoteAnchor = { kind: 'system', id }
  const existing = notesForAnchor(anchor)[0]
  if (existing) useNotesUiStore.getState().openNote(existing.id)
  else useNotesUiStore.getState().openDraft(anchor)
}

export function addFreeNote(): void {
  useNotesUiStore.getState().openDraft({ kind: 'free' })
}

export function editNote(id: string): void {
  useNotesUiStore.getState().openNote(id)
}

export async function deleteNote(id: string): Promise<void> {
  const { target } = useNotesUiStore.getState()
  if (target?.kind === 'note' && target.id === id) useNotesUiStore.getState().close()
  try {
    await useNotesStore.getState().remove(id)
  } catch (error) {
    // Network or server failure. The drawer is already closed; the note stays
    // in the store so a retry is possible and the UI stays consistent.
    console.warn('[notes] delete failed', error)
  }
}

export async function saveNote(
  target: { kind: 'note'; id: string } | { kind: 'draft'; anchor: NoteAnchor },
  draft: { title: string; body: string },
): Promise<Note | null> {
  const title = draft.title.trim()
  const body = draft.body.trim()
  if (!title && !body) return null

  try {
    if (target.kind === 'note') {
      return await useNotesStore.getState().update(target.id, { title, body })
    }
    return await useNotesStore.getState().create({ title, anchor: target.anchor, body })
  } catch (error) {
    console.warn('[notes] save failed', error)
    return null
  }
}
