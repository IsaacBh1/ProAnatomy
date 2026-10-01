// src/features/auth/components/AuthField.tsx
import { useId, type ComponentPropsWithRef } from 'react'
import { cn } from '@/utils/cn'

interface AuthFieldProps extends ComponentPropsWithRef<'input'> {
  label: string
  error?: string | null
  hint?: string
}

/**
 * A labeled input with inline error messaging. Owns the layout — label, input,
 * optional hint, optional error — so the pages stay declarative.
 *
 * The error is rendered into an `aria-describedby` target and marked with
 * `role="alert"`, so screen readers announce it the moment it appears.
 */
export function AuthField({ label, error, hint, id, className, ...rest }: AuthFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const errorId = `${fieldId}-error`
  const hintId = `${fieldId}-hint`

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-xs font-medium text-content">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          'h-11 w-full rounded-xl border bg-surface-raised px-3.5 text-sm text-content transition-colors',
          'outline-none placeholder:text-muted/60',
          error
            ? 'border-red-400/60 focus:border-red-400'
            : 'border-border focus:border-content/40',
          className,
        )}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-[11px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
