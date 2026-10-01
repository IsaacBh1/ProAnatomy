// src/store/uiStore.ts
import { create } from 'zustand'
import type { ToolId } from '@/types/anatomy'

export type ViewerMode = 'explore' | 'draw'
/** Which kind of stroke a drag in draw mode produces. */
export type DrawingSpace = 'screen' | 'surface'

const NO_IDS: ReadonlySet<string> = new Set()

interface UiState {
  sidebarOpen: boolean
  activeTool: ToolId
  viewerMode: ViewerMode
  drawingSpace: DrawingSpace
  /** True while the user holds Space in draw mode: left mouse orbits instead of drawing. */
  orbitOverride: boolean
  snapshotOpen: boolean
  autoRotate: boolean
  calloutIds: ReadonlySet<string>
  /**
   * How many native <dialog> elements are currently open. A counter rather than a
   * boolean because two modals can overlap. Shortcut handlers read this instead
   * of running `querySelector('dialog[open]')` on every keystroke.
   */
  dialogCount: number

  toggleSidebar: () => void
  /** Idempotent. Use this from the mobile backdrop, which must not toggle. */
  setSidebarOpen: (open: boolean) => void
  setActiveTool: (tool: ToolId) => void
  setViewerMode: (mode: ViewerMode) => void
  toggleViewerMode: () => void
  setDrawingSpace: (space: DrawingSpace) => void
  setOrbitOverride: (on: boolean) => void
  setSnapshotOpen: (open: boolean) => void
  setAutoRotate: (on: boolean) => void
  toggleAutoRotate: () => void
  addCallout: (id: string) => void
  removeCallout: (id: string) => void
  toggleCallout: (id: string) => void
  clearCallouts: () => void
  pushDialog: () => void
  popDialog: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: true,
  activeTool: 'orbit',
  viewerMode: 'explore',
  drawingSpace: 'screen',
  orbitOverride: false,
  snapshotOpen: false,
  autoRotate: false,
  calloutIds: NO_IDS,
  dialogCount: 0,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) =>
    set((s) => (s.sidebarOpen === sidebarOpen ? s : { sidebarOpen })),
  setActiveTool: (activeTool) => set({ activeTool }),
  setViewerMode: (viewerMode) => set({ viewerMode }),
  toggleViewerMode: () =>
    set((s) => ({ viewerMode: s.viewerMode === 'explore' ? 'draw' : 'explore' })),
  setDrawingSpace: (drawingSpace) => set({ drawingSpace }),
  setOrbitOverride: (orbitOverride) => set({ orbitOverride }),
  setSnapshotOpen: (snapshotOpen) => set({ snapshotOpen }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  toggleAutoRotate: () =>
    set((s) => {
      const autoRotate = !s.autoRotate
      if (autoRotate && s.activeTool === 'select') return { autoRotate, activeTool: 'orbit' }
      return { autoRotate }
    }),

  addCallout: (id) => {
    if (useUiStore.getState().calloutIds.has(id)) return
    set((s) => ({ calloutIds: new Set([...s.calloutIds, id]) }))
  },
  removeCallout: (id) => {
    if (!useUiStore.getState().calloutIds.has(id)) return
    set((s) => {
      const next = new Set(s.calloutIds)
      next.delete(id)
      return { calloutIds: next.size > 0 ? next : NO_IDS }
    })
  },
  toggleCallout: (id) => {
    const { calloutIds } = useUiStore.getState()
    if (calloutIds.has(id)) useUiStore.getState().removeCallout(id)
    else useUiStore.getState().addCallout(id)
  },
  clearCallouts: () => set((s) => (s.calloutIds.size === 0 ? s : { calloutIds: NO_IDS })),

  pushDialog: () => set((s) => ({ dialogCount: s.dialogCount + 1 })),
  popDialog: () => set((s) => ({ dialogCount: Math.max(0, s.dialogCount - 1) })),
}))
