import type { Note, NoteInput, NotesRepository } from '../types'

const STORAGE_KEY = 'pro-anatomy:notes'

/**
 * Bumped when the shape of a stored note changes.
 *
 *   v1  {id, anchor, body, createdAt, updatedAt}
 *   v2  adds `title`. v1 notes are migrated on read with an empty title.
 */
const VERSION = 2

interface StoredPayload {
  version: number
  notes: Note[]
}

/** v1 note, before titles existed. */
interface LegacyNote {
  id: string
  anchor: Note['anchor']
  body: string
  createdAt: number
  updatedAt: number
}

/** Local-only ids. Same approach as custom presets: no security implication. */
function newNoteId(): string {
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Fields every stored note has, across versions. */
function hasBaseShape(n: Record<string, unknown>): boolean {
  return (
    typeof n.id === 'string' &&
    typeof n.body === 'string' &&
    typeof n.createdAt === 'number' &&
    typeof n.updatedAt === 'number' &&
    !!n.anchor &&
    typeof n.anchor === 'object' &&
    typeof (n.anchor as { kind?: unknown }).kind === 'string'
  )
}

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') return false
  const n = value as Record<string, unknown>
  return hasBaseShape(n) && typeof n.title === 'string'
}

function isLegacyNote(value: unknown): value is LegacyNote {
  if (!value || typeof value !== 'object') return false
  return hasBaseShape(value as Record<string, unknown>)
}

function migrateLegacy(note: LegacyNote): Note {
  return { ...note, title: '' }
}

function readStored(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<StoredPayload> | null
    if (!parsed || !Array.isArray(parsed.notes)) return []

    if (parsed.version === VERSION) return parsed.notes.filter(isNote)
    if (parsed.version === 1) return parsed.notes.filter(isLegacyNote).map(migrateLegacy)
    return []
  } catch {
    // Private mode, corrupt JSON, quota — treat as empty rather than crashing the app.
    return []
  }
}

function writeStored(notes: readonly Note[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, notes }))
  } catch {
    // Best-effort: a failed write loses the note on reload but never breaks the UI.
  }
}

/**
 * localStorage-backed notes. An in-memory cache means `list()` is instant after the first
 * read, and writes go straight through. When a backend arrives, swap this for an HTTP
 * implementation — the store consumes the interface, not the storage.
 */
export function createLocalNotesRepository(): NotesRepository {
  let cache: Note[] = readStored()

  return {
    async list() {
      return cache
    },

    async create(input) {
      const now = Date.now()
      const note: Note = { id: newNoteId(), ...input, createdAt: now, updatedAt: now }
      cache = [...cache, note]
      writeStored(cache)
      return note
    },

    async update(id, patch) {
      const index = cache.findIndex((note) => note.id === id)
      if (index === -1) return null
      const next: Note = { ...cache[index], ...patch, updatedAt: Date.now() }
      cache = [...cache.slice(0, index), next, ...cache.slice(index + 1)]
      writeStored(cache)
      return next
    },

    async remove(id) {
      cache = cache.filter((note) => note.id !== id)
      writeStored(cache)
    },
  }
}

/** The single repository the app uses. Replace this line when a backend is ready. */
export const notesRepository = createLocalNotesRepository()
