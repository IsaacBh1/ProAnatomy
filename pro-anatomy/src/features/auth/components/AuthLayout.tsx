import type { ReactNode } from 'react'
import { BrandLogo } from '@/components/layout'

/**
 * Two-column shell for the login and signup pages.
 *
 * On large screens the brand column takes the left, showing the wordmark and a
 * short pitch. On mobile it collapses and a small wordmark appears above the
 * form so the page never feels like a bare form floating in space.
 *
 * The soft radial glow is the only place the brand's purple (`#863bff`, from
 * the favicon) appears in the app. Restrained on purpose — the tool itself is
 * monochrome and a full-brand palette here would feel pasted on.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-canvas lg:grid-cols-[1.15fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full bg-[#863bff]/10 blur-[120px]"
        />
        <div className="relative">
          <BrandLogo className="w-[200px] xl:w-[220px]" />
        </div>
        <div className="relative flex flex-col gap-5">
          <h2 className="font-display text-display-lg max-w-[18ch] font-medium tracking-tight text-content">
            Interactive anatomy, layer by layer.
          </h2>
          <p className="text-display-body max-w-md text-muted">
            Explore systems, isolate organs, annotate what matters, and keep your study sets
            between sessions.
          </p>
        </div>
        <p className="relative text-xs text-muted">
          © {new Date().getFullYear()} ProAnatomy
        </p>
      </aside>

      <main className="relative flex items-center justify-center p-6 lg:p-12">
        <div className="absolute top-6 left-6 lg:hidden">
          <BrandLogo className="w-[150px]" />
        </div>
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  )
}
