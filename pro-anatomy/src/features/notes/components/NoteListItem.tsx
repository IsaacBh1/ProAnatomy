import { CornersOut, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import type { Note } from '../types'
import { NoteAnchorChip } from './NoteAnchorChip'

interface NoteListItemProps {
  note: Note
  nameOf?: (id: string) => string | undefined
  onOpen: () => void
  onReveal?: () => void
  onDelete: () => void
}

/** First non-empty line, clipped. Used as a title fallback for notes without one. */
const firstLine = (text: string, max = 60): string => {
  const line = text.split('\n').map((l) => l.trim()).find(Boolean) ?? ''
  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}

/** Everything after the first non-empty line. Used to avoid repeating the fallback title. */
const dropFirstLine = (text: string): string => {
  const lines = text.split('\n')
  const index = lines.findIndex((l) => l.trim().length > 0)
  return index === -1 ? '' : lines.slice(index + 1).join('\n').trim()
}

const formatUpdated = (ts: number): string => {
  const diff = Date.now() - ts
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return 'just now'
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  return new Date(ts).toLocaleDateString()
}

export function NoteListItem({ note, nameOf, onOpen, onReveal, onDelete }: NoteListItemProps) {
  const hasTitle = note.title.trim().length > 0
  const displayTitle = hasTitle ? note.title : firstLine(note.body) || 'Untitled note'
  const previewSource = hasTitle ? note.body : dropFirstLine(note.body)
  const preview = previewSource.replace(/\s+/g, ' ').trim().slice(0, 90)

  return (
    <div className="group flex w-full items-start gap-1 rounded-md p-1 transition-colors hover:bg-surface-raised">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col items-start gap-1 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-muted"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <NoteAnchorChip anchor={note.anchor} nameOf={nameOf} />
          <span className="shrink-0 text-[10px] text-muted">{formatUpdated(note.updatedAt)}</span>
        </div>
        <p className="line-clamp-1 text-xs font-medium text-content">{displayTitle}</p>
        {preview && <p className="line-clamp-2 text-[11px] text-muted">{preview}</p>}
      </button>

      <div className="flex shrink-0 flex-col opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {onReveal && (
          <Button
            icon={CornersOut}
            aria-label="Reveal in 3D"
            title="Reveal in 3D"
            onClick={onReveal}
            className="size-6"
          />
        )}
        <Button
          icon={Trash}
          aria-label="Delete note"
          title="Delete note"
          onClick={onDelete}
          className="size-6"
        />
      </div>
    </div>
  )
}
