import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'
import { Button } from '../Button/Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

/** Built on the native <dialog>: focus trap, Esc to close and the backdrop come for free. */
export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  // Tell the rest of the app a dialog is up so global shortcut handlers stand down.
  // The counter handles overlapping dialogs correctly, and StrictMode's double
  // mount/unmount cycle nets out to a single increment.
  useEffect(() => {
    if (!open) return
    const { pushDialog, popDialog } = useUiStore.getState()
    pushDialog()
    return () => popDialog()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose() // click on the backdrop
      }}
      className={cn(
        'm-auto w-[min(440px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-content',
        'backdrop:bg-black/60',
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold">
              {title}
            </h2>
            {description && <p className="text-xs text-muted">{description}</p>}
          </div>
          <Button icon={X} aria-label="Close" onClick={onClose} />
        </header>
        {children}
      </div>
    </dialog>
  )
}
