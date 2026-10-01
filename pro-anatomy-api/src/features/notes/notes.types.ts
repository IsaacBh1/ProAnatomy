import type { NoteAnchorInput } from './notes.schemas'

export interface NoteDto {
  id: string
  title: string
  anchor: NoteAnchorInput
  body: string
  createdAt: number
  updatedAt: number
}
