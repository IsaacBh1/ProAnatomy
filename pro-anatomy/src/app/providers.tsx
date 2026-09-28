import { useEffect, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useNotesStore } from '@/features/notes/store/notesStore'
import { queryClient } from '@/lib/query/client'
import { useApplyTheme } from '@/hooks/useTheme'

function ThemeEffect() {
  useApplyTheme()
  return null
}

/** Reads notes from storage once at boot, so the sidebar has them on first paint. */
function NotesBootstrap() {
  useEffect(() => {
    void useNotesStore.getState().load()
  }, [])
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeEffect />
      <NotesBootstrap />
      {children}
    </QueryClientProvider>
  )
}
