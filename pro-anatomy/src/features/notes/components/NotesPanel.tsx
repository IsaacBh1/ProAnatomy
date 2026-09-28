import { useEffect, useMemo, useRef, useState } from 'react'
import { MagnifyingGlass, NotePencil, Plus, X } from '@phosphor-icons/react'
import { Button, SearchInput } from '@/components/ui'
import { SidebarSection } from '@/components/layout'
import { useAnatomyModel } from '@/features/anatomy/hooks/useAnatomyModel'
import { revealParts } from '@/features/anatomy/services/viewCommands'
import { useAnatomyStore } from '@/store/anatomyStore'
import { useAllNotes } from '../hooks/useNotes'
import { addFreeNote, deleteNote, editNote } from '../services/noteCommands'
import { filterNotes } from '../utils/filterNotes'
import { NoteListItem } from './NoteListItem'

const KBD = 'rounded border border-border bg-surface-raised px-1 font-mono text-[10px]'

export function NotesPanel() {
  const sex = useAnatomyStore((state) => state.sex)
  const { data: model } = useAnatomyModel(sex)
  const notes = useAllNotes()

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const hasNotes = notes.length > 0

  // Close search if the last note is deleted, so the toggle state never lies about
  // what's on screen.
  useEffect(() => {
    if (!hasNotes) setSearchOpen(false)
  }, [hasNotes])

  // Focus the field the moment it appears; clear the query when it disappears.
  useEffect(() => {
    if (!searchOpen) {
      setQuery('')
      return
    }
    const frame = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [searchOpen])

  const nameOf = useMemo(() => {
    if (!model) return undefined
    const byId = new Map(model.parts.map((p) => [p.id, p.name]))
    return (id: string) => byId.get(id)
  }, [model])

  const visible = useMemo(() => filterNotes(notes, query, nameOf), [notes, query, nameOf])
  const hasQuery = query.trim().length > 0

  return (
    <SidebarSection
      icon={NotePencil}
      title="Notes"
      actions={
        <>
          <Button
            icon={Plus}
            aria-label="New note"
            title="New general note"
            onClick={addFreeNote}
            className="size-6"
          />
          {hasNotes && (
            <Button
              icon={searchOpen ? X : MagnifyingGlass}
              active={searchOpen}
              aria-label={searchOpen ? 'Close note search' : 'Search notes'}
              aria-pressed={searchOpen}
              title={searchOpen ? 'Close search' : 'Search notes'}
              onClick={() => setSearchOpen((open) => !open)}
              className="size-6"
            />
          )}
        </>
      }
    >
      {!hasNotes ? (
        <p className="px-1 py-2 text-xs leading-relaxed text-muted">
          Select an organ and press <kbd className={KBD}>N</kbd>, or press{' '}
          <kbd className={KBD}>+</kbd> for a general note.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {searchOpen && (
            <SearchInput
              ref={searchRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Search notes"
              aria-label="Search notes"
              className="h-9 text-xs"
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  event.stopPropagation()
                  setSearchOpen(false)
                }
              }}
            />
          )}

          {visible.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted">
              {hasQuery ? `No notes match "${query.trim()}"` : 'No notes yet'}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {visible.map((note) => {
                const { anchor } = note
                return (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    nameOf={nameOf}
                    onOpen={() => editNote(note.id)}
                    onReveal={
                      anchor.kind === 'parts' ? () => revealParts(new Set(anchor.ids)) : undefined
                    }
                    onDelete={() => void deleteNote(note.id)}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </SidebarSection>
  )
}
