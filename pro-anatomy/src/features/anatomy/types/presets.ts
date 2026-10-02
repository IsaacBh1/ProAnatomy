export interface CustomPreset {
  id: string
  name: string
  partIds: readonly string[]
  /** Epoch ms. Keeps the list stable and newest-last across reloads. */
  createdAt: number
  /**
   * How many parts this preset referenced when it was created. Compared against
   * the live `partIds` on load to detect drift: an id scheme change silently
   * shrinks the preset, and this is how we tell the user it happened.
   * Optional so v1 presets keep loading.
   */
  createdPartCount?: number
}
