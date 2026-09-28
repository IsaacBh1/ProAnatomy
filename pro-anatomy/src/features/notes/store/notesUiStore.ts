import { create } from 'zustand'
import type { NoteAnchor } from '../types'

/**
 * What the drawer is showing:
 *
 *   { kind: 'note'; id }       — editing an existing note
 *   { kind: 'draft'; anchor }  — composing a new one for this anchor
 *   null                        — drawer is closed
 */
export type NotesDrawerTarget =
  | { kind: 'note'; id: string }
  | { kind: 'draft'; anchor: NoteAnchor }

interface NotesUiState {
  target: NotesDrawerTarget | null
  openNote: (id: string) => void
  openDraft: (anchor: NoteAnchor) => void
  close: () => void
}

export const useNotesUiStore = create<NotesUiState>()((set) => ({
  target: null,
  openNote: (id) => set({ target: { kind: 'note', id } }),
  openDraft: (anchor) => set({ target: { kind: 'draft', anchor } }),
  close: () => set({ target: null }),
}))
