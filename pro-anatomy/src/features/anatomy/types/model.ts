import type { BufferGeometry } from 'three'
import type { SystemId } from '@/types/anatomy'
import type { PartTaxonomy } from '../services/bodyparts3d/taxonomy'

export interface AnatomyPart {
  id: string
  name: string
  system: SystemId
  geometry: BufferGeometry
}

export interface CompoundOrgan {
  id: string
  name: string
  partIds: readonly string[]
}

export interface AnatomyModel {
  parts: AnatomyPart[]
  compounds: CompoundOrgan[]
  /** Concept hierarchy from BodyParts3D. Empty for sources that don't ship one. */
  taxonomy: PartTaxonomy
}

/** Options passed to `AnatomyModelSource.load`. */
export interface LoadOptions {
  signal?: AbortSignal
}

export interface AnatomyModelSource {
  load(options?: LoadOptions): Promise<AnatomyModel>
}
