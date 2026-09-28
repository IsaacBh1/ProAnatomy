import { Mesh, type Object3D } from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type {
  AnatomyModel,
  AnatomyModelSource,
  AnatomyPart,
  CompoundOrgan,
} from '../../types/model'
import { deriveSystem } from './deriveSystem'
import { EMPTY_TAXONOMY } from '../bodyparts3d/taxonomy'

const asText = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined

const readRawName = (mesh: Mesh): string =>
  asText(mesh.userData.name) ?? asText(mesh.parent?.name) ?? asText(mesh.name) ?? 'Organ'

const readOntologyId = (mesh: Mesh): string | undefined =>
  asText(mesh.userData.ontologyId) ?? asText(mesh.userData.reference_organ_id)

const cleanName = (raw: string): string =>
  raw.replace(/^VH_?F_?/i, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim() || raw

function uniqueId(base: string, used: Set<string>): string {
  let id = base
  let n = 2
  while (used.has(id)) id = `${base}#${n++}`
  used.add(id)
  return id
}

/** Meshes sharing a display name form one compound, so presets work the same as for BodyParts3D. */
function groupByName(parts: readonly AnatomyPart[]): CompoundOrgan[] {
  const byName = new Map<string, string[]>()
  for (const { id, name } of parts) {
    const ids = byName.get(name)
    if (ids) ids.push(id)
    else byName.set(name, [id])
  }
  return [...byName].map(([name, partIds]) => ({ id: name, name, partIds }))
}

function toAnatomyModel(scene: Object3D): AnatomyModel {
  scene.updateMatrixWorld(true)
  const parts: AnatomyPart[] = []
  const usedIds = new Set<string>()

  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return

    const rawName = readRawName(object)
    const id = uniqueId(readOntologyId(object) ?? rawName, usedIds)
    const name = cleanName(rawName)

    const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld)
    object.geometry.dispose()
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals()
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()

    parts.push({ id, name, system: deriveSystem(name), geometry })
  })

  return { parts, compounds: groupByName(parts), taxonomy: EMPTY_TAXONOMY }
}

export interface HraGlbOptions {
  url: string
  dracoDecoderPath: string
}

export function createHraGlbSource({ url, dracoDecoderPath }: HraGlbOptions): AnatomyModelSource {
  return {
    async load({ signal } = {}) {
      const draco = new DRACOLoader().setDecoderPath(dracoDecoderPath)
      const loader = new GLTFLoader().setDRACOLoader(draco)
      try {
        const gltf = await loader.loadAsync(url)
        signal?.throwIfAborted()
        return toAnatomyModel(gltf.scene)
      } finally {
        draco.dispose()
      }
    },
  }
}
