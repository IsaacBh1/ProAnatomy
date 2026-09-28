import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import { createPresetId, useCustomPresetsStore } from '../store/customPresetsStore'
import { usePresetDraftStore } from '../store/presetDraftStore'

interface FormProps {
  partIds: readonly string[]
  onCancel: () => void
  onSave: (name: string) => void
}

function SavePresetForm({ partIds, onCancel, onSave }: FormProps) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // After the parent Modal's showModal(): the browser's own "dialog focusing steps" would
    // otherwise land on the header's close button before we get a chance.
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [])

  const trimmed = name.trim()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (trimmed) onSave(trimmed)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span>Name</span>
        <Input
          ref={inputRef}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Heart and lungs"
          spellCheck={false}
          maxLength={60}
        />
      </label>

      <p className="text-xs text-muted">
        {partIds.length} organ{partIds.length === 1 ? '' : 's'} will be saved to this preset.
      </p>

      <div className="flex justify-end gap-2">
        <Button className="border border-border px-4" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!trimmed}
          className="bg-content text-canvas hover:bg-content/85"
        >
          Save preset
        </Button>
      </div>
    </form>
  )
}

/**
 * The naming step. Opened either from the draft bar (after picking in the viewer) or directly
 * from a right-click on a selection / the P shortcut. Closing it just clears `pendingIds`;
 * whether that returns the user to collecting or to idle is decided by the draft store.
 */
export function SavePresetDialog() {
  const pendingIds = usePresetDraftStore((state) => state.pendingIds)
  const closeNaming = usePresetDraftStore((state) => state.closeNaming)
  const reset = usePresetDraftStore((state) => state.reset)

  const open = pendingIds !== null && pendingIds.length > 0

  const save = (name: string) => {
    if (!pendingIds) return
    useCustomPresetsStore.getState().add({
      id: createPresetId(),
      name,
      partIds: pendingIds,
      createdAt: Date.now(),
    })
    reset()
  }

  return (
    <Modal
      open={open}
      onClose={closeNaming}
      title="Save preset"
      description="Name this collection so you can recall it later."
    >
      {/* Mounted only while open: every opening starts with an empty field and fresh focus. */}
      {open && pendingIds && (
        <SavePresetForm partIds={pendingIds} onCancel={closeNaming} onSave={save} />
      )}
    </Modal>
  )
}
