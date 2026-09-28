import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Trash, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import { useAnatomyModel } from '@/features/anatomy/hooks/useAnatomyModel'
import { useAnatomyStore } from '@/store/anatomyStore'
import { useNote } from '../hooks/useNotes'
import { deleteNote, saveNote } from '../services/noteCommands'
import { useNotesUiStore } from '../store/notesUiStore'
import { NoteAnchorChip } from './NoteAnchorChip'

const MAX_TITLE_LENGTH = 120
const MAX_BODY_LENGTH = 5000
const DRAWER_WIDTH = 320

const handleActivate = (fn: () => void) => (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    fn()
  }
}

export function NoteEditor() {
  const target = useNotesUiStore((state) => state.target)
  const close = useNotesUiStore((state) => state.close)
  const note = useNote(target?.kind === 'note' ? target.id : null)

  const sex = useAnatomyStore((state) => state.sex)
  const { data: model } = useAnatomyModel(sex)
  const nameOf = useMemo(() => {
    if (!model) return undefined
    const byId = new Map(model.parts.map((p) => [p.id, p.name]))
    return (id: string) => byId.get(id)
  }, [model])

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  /**
   * Existing notes open read-only so the user reads them; drafts open ready to type because
   * there's nothing to read. Clicking the title or body in read mode enters edit mode with
   * focus on whichever was clicked.
   */
  const [editing, setEditing] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const nextFocusRef = useRef<'title' | 'body'>('body')
  const asideRef = useRef<HTMLElement>(null)

  // Reset field values and edit mode whenever the drawer switches target.
  useEffect(() => {
    if (!target) return
    if (target.kind === 'note') {
      setTitle(note?.title ?? '')
      setBody(note?.body ?? '')
      setEditing(false)
      nextFocusRef.current = 'body'
    } else {
      setTitle('')
      setBody('')
      setEditing(true)
      nextFocusRef.current = 'title'
    }
    // `note` is intentionally omitted: it changes when we save, and re-running here would
    // clobber the user's in-progress edits with the saved version.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  // Focus the right field when entering edit mode. Runs after the reset effect above.
  useEffect(() => {
    if (!editing) return
    const frame = requestAnimationFrame(() => {
      const el = nextFocusRef.current === 'title' ? titleRef.current : bodyRef.current
      if (!el) return
      el.focus()
      if (el instanceof HTMLTextAreaElement) {
        const end = el.value.length
        el.setSelectionRange(end, end)
      } else {
        el.select()
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [editing, target])

  // Esc and Cmd/Ctrl+Enter, registered on window so they work even when focus is on the
  // header buttons. saveRef keeps the handler stable while `save` changes.
  const saveRef = useRef<() => void>(() => {})
  useEffect(() => {
    if (!target) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        saveRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [target, close])

  if (!target) return null

  const anchor = target.kind === 'note' ? note?.anchor : target.anchor
  if (!anchor) return null

  const trimmedTitle = title.trim()
  const trimmedBody = body.trim()
  const hasContent = trimmedTitle.length > 0 || trimmedBody.length > 0
  const dirty =
    target.kind === 'draft'
      ? hasContent
      : title !== (note?.title ?? '') || body !== (note?.body ?? '')

  const save = async () => {
    if (!hasContent) return
    const saved = await saveNote(target, { title, body })
    if (!saved) return
    if (target.kind === 'draft') {
      // Transition the drawer to the freshly created note; the reset effect above takes over.
      useNotesUiStore.getState().openNote(saved.id)
    } else {
      setEditing(false)
    }
  }
  saveRef.current = () => void save()

  const enterEdit = (field: 'title' | 'body') => {
    nextFocusRef.current = field
    setEditing(true)
  }

  return (
    <aside
      ref={asideRef}
      role="complementary"
      aria-label="Note editor"
      style={{ width: DRAWER_WIDTH }}
      // Focus leaving the drawer falls back to read mode, but only for an existing note with
      // no unsaved changes. Drafts stay editable and dirty notes keep their edits.
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null
        if (asideRef.current?.contains(next)) return
        if (target.kind === 'note' && !dirty) setEditing(false)
      }}
      className="pointer-events-auto absolute top-[86px] right-6 bottom-[120px] z-20 flex flex-col rounded-2xl border border-border bg-surface shadow-xl"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <NoteAnchorChip anchor={anchor} nameOf={nameOf} />
          {editing && dirty && <span className="truncate text-[11px] text-muted">Unsaved</span>}
        </div>
        <div className="flex items-center gap-1">
          {target.kind === 'note' && (
            <Button
              icon={Trash}
              aria-label="Delete note"
              title="Delete note"
              onClick={() => void deleteNote(target.id)}
            />
          )}
          <Button icon={X} aria-label="Close" title="Close (Esc)" onClick={close} />
        </div>
      </header>

      {editing ? (
        <>
          <input
            ref={titleRef}
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, MAX_TITLE_LENGTH))}
            placeholder="Title"
            aria-label="Note title"
            spellCheck={false}
            className="shrink-0 border-0 border-b border-border bg-transparent px-4 py-3 text-sm font-medium text-content outline-none placeholder:text-muted focus:border-muted"
          />
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, MAX_BODY_LENGTH))}
            placeholder="Write a note…"
            spellCheck
            className="min-h-0 flex-1 resize-none bg-transparent p-4 text-sm leading-relaxed text-content outline-none placeholder:text-muted"
          />
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          {title && (
            <div
              role="button"
              tabIndex={0}
              aria-label="Edit title"
              onClick={() => enterEdit('title')}
              onKeyDown={handleActivate(() => enterEdit('title'))}
              className="mb-3 cursor-text rounded-sm text-sm font-medium text-content focus-visible:outline-2 focus-visible:outline-muted"
            >
              {title}
            </div>
          )}
          <div
            role="button"
            tabIndex={0}
            aria-label="Edit note body"
            onClick={() => enterEdit('body')}
            onKeyDown={handleActivate(() => enterEdit('body'))}
            className="cursor-text rounded-sm text-sm leading-relaxed text-content focus-visible:outline-2 focus-visible:outline-muted"
          >
            {body ? (
              <p className="whitespace-pre-wrap break-words">{body}</p>
            ) : (
              <p className="italic text-muted">No content yet</p>
            )}
          </div>
        </div>
      )}

      <footer className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
        {editing ? (
          <>
            <span className="text-[10px] text-muted">
              {body.length} / {MAX_BODY_LENGTH}
            </span>
            <Button
              disabled={!dirty}
              onClick={() => void save()}
              className="border border-border px-4"
            >
              {target.kind === 'draft' ? 'Create' : 'Save'}
            </Button>
          </>
        ) : (
          <>
            <span className="text-[10px] text-muted">Esc to close</span>
            <Button
              onClick={() => enterEdit('body')}
              className="border border-border px-4"
            >
              Edit
            </Button>
          </>
        )}
      </footer>
    </aside>
  )
}
