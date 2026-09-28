import { CircleNotch, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import type { Sex } from '@/types/anatomy'

interface ViewportStatusProps {
  sex: Sex
  error?: Error | null
  onRetry?: () => void
}

export function ViewportStatus({ sex, error, onRetry }: ViewportStatusProps) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-0 z-[5] grid place-items-center"
    >
      <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-3 text-center text-muted">
        {error ? (
          <>
            <WarningCircle size={32} aria-hidden />
            <p className="text-sm text-content">Could not load the {sex} model</p>
            <p className="text-xs">{error.message}</p>
            {onRetry && (
              <Button onClick={onRetry} className="border border-border px-4">
                Try again
              </Button>
            )}
          </>
        ) : (
          <>
            <CircleNotch size={32} className="animate-spin" aria-hidden />
            <p className="text-sm">Loading {sex} model…</p>
          </>
        )}
      </div>
    </div>
  )
}
