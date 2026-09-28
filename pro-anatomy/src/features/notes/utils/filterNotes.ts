import { systemLabel } from '@/features/body-systems/utils/systemLabels'
import type { Note } from '../types'

/**
 * Token-based filter, AND across tokens, substring match. Same semantics as the organ search,
 * so typing "heart beats" requires both words to appear somewhere in the note.
 *
 * Searches: title, body, and the anchor's display name (part names or system label).
 * `nameOf` is optional because the model may not be loaded yet; notes still match on
 * their own text in that case.
 */
export function filterNotes(
  notes: readonly Note[],
  query: string,
  nameOf?: (id: string) => string | undefined,
): Note[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return [...notes]

  return notes.filter((note) => {
    const haystack = buildHaystack(note, nameOf)
    return tokens.every((token) => haystack.includes(token))
  })
}

function buildHaystack(note: Note, nameOf?: (id: string) => string | undefined): string {
  const parts: string[] = [note.title, note.body]

  switch (note.anchor.kind) {
    case 'free':
      parts.push('general')
      break
    case 'system':
      parts.push(note.anchor.id, systemLabel(note.anchor.id))
      break
    case 'parts':
      for (const id of note.anchor.ids) parts.push(nameOf?.(id) ?? '')
      break
  }

  return parts.join(' ').toLowerCase()
}
