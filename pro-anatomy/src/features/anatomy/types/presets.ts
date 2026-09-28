/** A user-defined preset: a name plus the parts it isolates. */
export interface CustomPreset {
  id: string
  name: string
  partIds: readonly string[]
  /** Epoch ms. Keeps the list stable and newest-last across reloads. */
  createdAt: number
}
