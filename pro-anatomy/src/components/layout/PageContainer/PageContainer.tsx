import type { ReactNode } from 'react'

export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="relative flex h-dvh w-full overflow-hidden bg-canvas">{children}</main>
}
