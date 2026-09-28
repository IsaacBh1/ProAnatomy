import { useMemo } from 'react'
import { useNotesStore } from '../store/notesStore'
import type { Note } from '../types'

/** All notes, newest first. */
export function useAllNotes(): readonly Note[] {
  const notes = useNotesStore((state) => state.notes)
  return useMemo(() => [...notes].sort((a, b) => b.updatedAt - a.updatedAt), [notes])
}

/** One note by id, or undefined. Zustand returns the same reference until the note changes. */
export function useNote(id: string | null): Note | undefined {
  return useNotesStore((state) => (id ? state.notes.find((n) => n.id === id) : undefined))
}
