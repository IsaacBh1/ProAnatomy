import { create } from 'zustand'
import { notesRepository } from '../storage/notesRepository'
import type { Note, NoteInput } from '../types'

interface NotesState {
  notes: readonly Note[]
  /** True once the first `load()` has resolved, success or not. */
  ready: boolean
  load: () => Promise<void>
  create: (input: NoteInput) => Promise<Note>
  update: (id: string, patch: Partial<NoteInput>) => Promise<Note | null>
  remove: (id: string) => Promise<void>
  /** Clears all state. Called on sign-out so the sidebar can't leak another account's data. */
  reset: () => void
}

export const useNotesStore = create<NotesState>()((set, get) => ({
  notes: [],
  ready: false,

  load: async () => {
    try {
      const notes = await notesRepository.list()
      set({ notes, ready: true })
    } catch {
      // Signed out, offline, or the server is down. Either way: no notes, and
      // the app stays usable. The next successful `load()` reconciles.
      set({ notes: [], ready: true })
    }
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

  reset: () => set({ notes: [], ready: false }),
}))
