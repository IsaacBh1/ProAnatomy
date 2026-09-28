import type { CameraPose } from './camera'

/** Everything Back restores. */
export interface ViewSnapshot {
  selectedIds: readonly string[]
  isolatedIds: readonly string[] | null
  hiddenIds: readonly string[]
  activePresetIds: readonly string[]
  pose: CameraPose | null
}

/** Rubber-band rectangle in canvas pixels. */
export interface BandRect {
  x: number
  y: number
  width: number
  height: number
}
