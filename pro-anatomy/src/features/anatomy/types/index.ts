import type { Icon } from '@phosphor-icons/react'
import type { ToolId, ViewerCommandId } from '@/types/anatomy'

interface ToolbarItemBase {
  label: string
  icon: Icon
}

export type ToolbarItem =
  | (ToolbarItemBase & { kind: 'tool'; id: ToolId })
  | (ToolbarItemBase & { kind: 'command'; id: ViewerCommandId })

export interface OrganPreset {
  id: string
  label: string
  /** Lower-case compound-organ names to look up in the BodyParts3D data (used in Milestone 4). */
  matchNames: readonly string[]
}

/** An organ preset that actually exists in the loaded model. */
export interface AvailablePreset {
  preset: OrganPreset
  partIds: readonly string[]
}

export type CommandState = Partial<
  Record<ViewerCommandId, { disabled?: boolean; active?: boolean }>
>