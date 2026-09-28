import { create } from 'zustand'
import { notesRepository } from '../storage/notesRepository'
import type { Note, NoteInput } from '../types'

interface NotesState {
  notes: readonly Note[]
  /** True once the first `load()` resolves. */
  ready: boolean
  load: () => Promise<void>
  create: (input: NoteInput) => Promise<Note>
  update: (id: string, patch: Partial<NoteInput>) => Promise<Note | null>
  remove: (id: string) => Promise<void>
}

/**
 * Thin cache over the repository. Reads are synchronous; writes go through and re-read.
 * No optimistic updates yet — the local repo is instant, and when the backend arrives,
 * optimistic writes become the natural next step *here and nowhere else*.
 */
export const useNotesStore = create<NotesState>()((set, get) => ({
  notes: [],
  ready: false,

  load: async () => {
    const notes = await notesRepository.list()
    set({ notes, ready: true })
  },

  create: async (input) => {
    const note = await notesRepository.create(input)
    set({ notes: [...get().notes, note] })
    return note
  },

  update: async (id, patch) => {
    const note = await notesRepository.update(id, patch)
    if (!note) return null
    set({ notes: get().notes.map((n) => (n.id === id ? note : n)) })
    return note
  },

  remove: async (id) => {
    await notesRepository.remove(id)
    set({ notes: get().notes.filter((n) => n.id !== id) })
  },
}))
