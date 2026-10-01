import { ApiError } from '@/lib/api/errors'
import { apiRequest } from '@/lib/api/session'
import type { Note, NoteInput, NotesRepository } from '../types'

/**
 * HTTP-backed notes repository.
 *
 * The API serialises a note as { id, title, anchor, body, createdAt, updatedAt },
 * which is exactly the frontend's existing shape — timestamps are epoch ms, and
 * the anchor union ({kind:'parts'|'system'|'free'}) is identical. So the mapping
 * is identity and only the storage location changed.
 */

async function list(): Promise<readonly Note[]> {
  const data = await apiRequest<{ notes: Note[] }>('/notes', { method: 'GET' })
  return data.notes
}

async function create(input: NoteInput): Promise<Note> {
  const data = await apiRequest<{ note: Note }>('/notes', {
    method: 'POST',
    body: { title: input.title, body: input.body, anchor: input.anchor },
  })
  return data.note
}

async function update(id: string, patch: Partial<NoteInput>): Promise<Note | null> {
  try {
    const data = await apiRequest<{ note: Note }>(`/notes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: patch,
    })
    return data.note
  } catch (error) {
    // The store treats null as "note is gone". A 404 is the API saying the
    // same thing. Anything else is a real failure and must propagate.
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

async function remove(id: string): Promise<void> {
  try {
    await apiRequest<void>(`/notes/${encodeURIComponent(id)}`, { method: 'DELETE' })
  } catch (error) {
    // Deleting an already-deleted note is success as far as the UI is concerned.
    if (!(error instanceof ApiError && error.status === 404)) throw error
  }
}

export const notesRepository: NotesRepository = { list, create, update, remove }
