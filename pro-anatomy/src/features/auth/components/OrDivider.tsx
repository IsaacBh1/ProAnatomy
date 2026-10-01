// src/features/auth/components/OrDivider.tsx

/** A hairline rule with a centered label. Separates the OAuth button from the form. */
export function OrDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="my-1 flex items-center gap-3" role="separator" aria-label={label}>
      <span aria-hidden className="h-px flex-1 bg-border" />
      <span className="text-[11px] tracking-wider text-muted uppercase">{label}</span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  )
}
