// src/features/anatomy/constants/layers.ts
import {
  Barbell,
  Bone,
  Drop,
  Heart,
  Lightning,
  Person,
  type Icon,
} from '@phosphor-icons/react'
import type { SystemId } from '@/types/anatomy'

export interface LayerShell {
  id: string
  label: string
  icon: Icon
  /** Systems that belong to this shell. */
  systems: readonly SystemId[]
}

/**
 * Anatomical shells, ordered outermost → innermost. The depth slider peels them
 * one at a time: at depth `k`, shells with index < k are hidden and shells with
 * index >= k are shown (subject to the sidebar's per-system toggles).
 *
 * Adding a shell is a single entry here. Both the visibility check and the
 * slider read this list, so they can't drift.
 */
export const LAYER_STACK: readonly LayerShell[] = [
  { id: 'skin', label: 'Skin', icon: Person, systems: ['integumentary'] },
  { id: 'muscular', label: 'Muscles', icon: Barbell, systems: ['muscular', 'connective'] },
  { id: 'skeletal', label: 'Skeleton', icon: Bone, systems: ['skeletal'] },
  { id: 'vessels', label: 'Vessels', icon: Drop, systems: ['arterial', 'venous', 'lymphatic'] },
  { id: 'nervous', label: 'Nerves', icon: Lightning, systems: ['nervous'] },
  {
    id: 'organs',
    label: 'Organs',
    icon: Heart,
    systems: [
      'cardiac',
      'respiratory',
      'digestive',
      'urinary',
      'endocrine',
      'reproductive',
      'sensory',
      'other',
    ],
  },
]

/** Highest valid depth value. Depth `MAX_LAYER_DEPTH` would hide every shell. */
export const MAX_LAYER_DEPTH = LAYER_STACK.length - 1

/** SystemId → its shell index. Built once at module load. */
function buildShellIndex(): ReadonlyMap<SystemId, number> {
  const index = new Map<SystemId, number>()
  LAYER_STACK.forEach((shell, i) => {
    for (const system of shell.systems) index.set(system, i)
  })
  return index
}

export const SYSTEM_SHELL_INDEX: ReadonlyMap<SystemId, number> = buildShellIndex()
