import { GoogleLogo } from '@phosphor-icons/react'

interface GoogleButtonProps {
  /**
   * "Continue with Google" is what Google's own branding guidelines recommend
   * for a button that serves both sign-in and sign-up. Pages pass a no-op for
   * now — the handler is the integration point for OAuth later.
   */
  onClick?: () => void
  disabled?: boolean
}

export function GoogleButton({ onClick, disabled }: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface-raised px-4 text-sm font-medium text-content transition-colors hover:bg-border focus-visible:outline-2 focus-visible:outline-muted disabled:pointer-events-none disabled:opacity-40"
    >
      <GoogleLogo size={18} weight="bold" aria-hidden />
      Continue with Google
    </button>
  )
}
