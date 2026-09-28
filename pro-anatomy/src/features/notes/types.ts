import type { SystemId } from '@/types/anatomy'

/**
 * What a note is attached to.
 *
 *   parts   — one part, or a specific group of parts
 *   system  — an entire body system
 *   free    — nothing; a general note the user wrote down
 *
 * Discriminated so the editor and the sidebar can branch without type checks scattered around.
 */
export type NoteAnchor =
  | { kind: 'parts'; ids: readonly string[] }
  | { kind: 'system'; id: SystemId }
  | { kind: 'free' }

export interface Note {
  id: string
  /** Free-form title. May be empty for notes that only have a body. */
  title: string
  anchor: NoteAnchor
  body: string
  createdAt: number
  updatedAt: number
}

export type NoteInput = Pick<Note, 'title' | 'anchor' | 'body'>

/**
 * Storage abstraction. The local implementation resolves synchronously under the hood; the
 * async signature future-proofs for a backend without touching the store or the UI.
 */
export interface NotesRepository {
  list(): Promise<readonly Note[]>
  create(input: NoteInput): Promise<Note>
  update(id: string, patch: Partial<NoteInput>): Promise<Note | null>
  remove(id: string): Promise<void>
}

/** Stable string key for an anchor. Part ids are sorted, so the same set always yields the same key. */
export function anchorKey(anchor: NoteAnchor): string {
  switch (anchor.kind) {
    case 'free':
      return 'free'
    case 'system':
      return `system:${anchor.id}`
    case 'parts':
      return `parts:${[...anchor.ids].sort().join('|')}`
  }
}

/** True when both anchors point at the exact same thing. Order-independent for parts. */
export function anchorsEqual(a: NoteAnchor, b: NoteAnchor): boolean {
  return anchorKey(a) === anchorKey(b)
}

/** A note is "about" a part when that part is in its anchor. Used to filter the sidebar list. */
export function anchorContainsPart(anchor: NoteAnchor, partId: string): boolean {
  return anchor.kind === 'parts' && anchor.ids.includes(partId)
}
