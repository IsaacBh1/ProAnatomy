import type { Note, Prisma } from '@prisma/client'
import { prisma } from '../../shared/db/prisma'
import { notFound } from '../../shared/http/errors'
import type { CreateNoteInput, NoteAnchorInput, UpdateNoteInput } from './notes.schemas'
import type { NoteDto } from './notes.types'

type AnchorColumns = { anchorKind: string; anchorIds: string[] }

function anchorToColumns(anchor: NoteAnchorInput): AnchorColumns {
  switch (anchor.kind) {
    case 'parts':
      return { anchorKind: 'parts', anchorIds: [...anchor.ids] }
    case 'system':
      return { anchorKind: 'system', anchorIds: [anchor.id] }
    case 'free':
      return { anchorKind: 'free', anchorIds: [] }
  }
}

function columnsToAnchor(kind: string, ids: readonly string[]): NoteAnchorInput {
  switch (kind) {
    case 'parts':
      return { kind: 'parts', ids: [...ids] }
    case 'system':
      return ids.length === 1 ? { kind: 'system', id: ids[0]! } : { kind: 'free' }
    default:
      return { kind: 'free' }
  }
}

export const toNoteDto = (row: Note): NoteDto => ({
  id: row.id,
  title: row.title,
  anchor: columnsToAnchor(row.anchorKind, row.anchorIds),
  body: row.body,
  createdAt: row.createdAt.getTime(),
  updatedAt: row.updatedAt.getTime(),
})

const OWNED = (userId: string) => ({ userId }) satisfies Prisma.NoteWhereInput

export async function listNotes(userId: string, limit: number): Promise<NoteDto[]> {
  const rows = await prisma.note.findMany({
    where: OWNED(userId),
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })
  return rows.map(toNoteDto)
}

export async function createNote(userId: string, input: CreateNoteInput): Promise<NoteDto> {
  const row = await prisma.note.create({
    data: {
      userId,
      title: input.title,
      body: input.body,
      ...anchorToColumns(input.anchor),
    },
  })
  return toNoteDto(row)
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: UpdateNoteInput,
): Promise<NoteDto> {
  const { count } = await prisma.note.updateMany({
    where: { id: noteId, ...OWNED(userId) },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.anchor ? anchorToColumns(input.anchor) : {}),
    },
  })

  if (count === 0) throw notFound('Note not found.')

  const row = await prisma.note.findUnique({ where: { id: noteId } })
  if (!row) throw notFound('Note not found.')
  return toNoteDto(row)
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const { count } = await prisma.note.deleteMany({
    where: { id: noteId, ...OWNED(userId) },
  })
  if (count === 0) throw notFound('Note not found.')
}
