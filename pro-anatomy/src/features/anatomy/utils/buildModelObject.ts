import {
  Box3,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  type BufferGeometry,
} from 'three'
import { SKIN_OPACITY } from '../constants/viewer'
import type { AnatomyModel, AnatomyPart } from '../types/model'
import { partColor, partColorBucket } from './partColor'

export type PartMesh = Mesh<BufferGeometry, MeshStandardMaterial>

export interface PartEntry {
  part: AnatomyPart
  mesh: PartMesh
  box: Box3
  center: Vector3
  baseMaterial: MeshStandardMaterial
  highlightMaterial: MeshStandardMaterial | null
}

export interface ModelObject {
  root: Group
  entries: ReadonlyMap<string, PartEntry>
  bounds: Box3
  materials: ReadonlySet<MeshStandardMaterial>
}

const NOT_PICKABLE: Mesh['raycast'] = () => {}

function boundsOf(geometry: BufferGeometry): Box3 {
  if (!geometry.boundingBox) geometry.computeBoundingBox()
  return geometry.boundingBox?.clone() ?? new Box3()
}

export function buildModelObject(model: AnatomyModel): ModelObject {
  const root = new Group()
  const entries = new Map<string, PartEntry>()
  const bounds = new Box3()

  const shared = new Map<string, MeshStandardMaterial>()
  const skinMaterial = new MeshStandardMaterial({
    color: '#e8c2a0',
    roughness: 0.42,
    metalness: 0.03,
    side: DoubleSide,
    transparent: true,
    opacity: SKIN_OPACITY,
    depthWrite: false,
  })

  for (const part of model.parts) {
    const isSkin = part.system === 'integumentary'

    let material: MeshStandardMaterial
    if (isSkin) {
      material = skinMaterial
    } else {
      const key = `${part.system}:${partColorBucket(part.id, part.system)}`
      let cached = shared.get(key)
      if (!cached) {
        cached = new MeshStandardMaterial({
          color: partColor(part.id, part.system),
          roughness: 0.6,
          metalness: 0.03,
          side: DoubleSide,
        })
        shared.set(key, cached)
      }
      material = cached
    }

    const mesh: PartMesh = new Mesh(part.geometry, material)
    mesh.userData.partId = part.id
    mesh.renderOrder = isSkin ? 10 : 0
    if (isSkin) mesh.raycast = NOT_PICKABLE

    const box = boundsOf(part.geometry)
    root.add(mesh)
    entries.set(part.id, {
      part,
      mesh,
      box,
      center: box.getCenter(new Vector3()),
      baseMaterial: material,
      highlightMaterial: null,
    })
    bounds.union(box)
  }

  const materials = new Set<MeshStandardMaterial>([skinMaterial, ...shared.values()])
  return { root, entries, bounds, materials }
}

export function disposeModelObject({ entries, materials }: ModelObject): void {
  for (const { mesh, highlightMaterial } of entries.values()) {
    mesh.geometry.dispose()
    highlightMaterial?.dispose()
  }
  for (const material of materials) material.dispose()
}
