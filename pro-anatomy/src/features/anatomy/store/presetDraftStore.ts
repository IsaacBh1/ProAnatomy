import { create } from 'zustand'

/**
 * The three states of "make a preset":
 *
 *   idle          collecting=false, pendingIds=null
 *   collecting    collecting=true,  pendingIds=null   (the user is picking organs in the viewer)
 *   naming        collecting=*,     pendingIds!=null (the dialog is up; * = whether we came from collecting)
 *
 * Cancelling the dialog goes back to wherever the user came from. Confirming calls `reset`.
 */
interface PresetDraftState {
  collecting: boolean
  pendingIds: readonly string[] | null

  startCollecting: () => void
  openNaming: (ids: readonly string[]) => void
  closeNaming: () => void
  reset: () => void
}

export const usePresetDraftStore = create<PresetDraftState>()((set) => ({
  collecting: false,
  pendingIds: null,

  startCollecting: () => set({ collecting: true }),
  openNaming: (pendingIds) => set({ pendingIds }),
  closeNaming: () => set({ pendingIds: null }),
  reset: () => set({ collecting: false, pendingIds: null }),
}))
