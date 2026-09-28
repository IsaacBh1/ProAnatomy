import { NoteBlank, Stack, Tag } from '@phosphor-icons/react'
import { Badge } from '@/components/ui'
import { systemLabel } from '@/features/body-systems/utils/systemLabels'
import type { NoteAnchor } from '../types'

interface NoteAnchorChipProps {
  anchor: NoteAnchor
  /** Resolves a part id to its display name. Undefined when the model hasn't loaded yet. */
  nameOf?: (id: string) => string | undefined
}

/** One-line summary of what a note is attached to. */
export function NoteAnchorChip({ anchor, nameOf }: NoteAnchorChipProps) {
  if (anchor.kind === 'free') {
    return (
      <Badge>
        <NoteBlank size={10} aria-hidden className="mr-1" />
        General
      </Badge>
    )
  }

  if (anchor.kind === 'system') {
    return (
      <Badge>
        <Tag size={10} aria-hidden className="mr-1" />
        {systemLabel(anchor.id)}
      </Badge>
    )
  }

  const first = nameOf?.(anchor.ids[0])
  const extra = anchor.ids.length - 1
  const label = first
    ? extra > 0
      ? `${first} + ${extra}`
      : first
    : `${anchor.ids.length} organ${anchor.ids.length === 1 ? '' : 's'}`

  return (
    <Badge>
      <Stack size={10} aria-hidden className="mr-1" />
      {label}
    </Badge>
  )
}
