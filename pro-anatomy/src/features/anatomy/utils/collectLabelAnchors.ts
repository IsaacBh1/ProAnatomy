import { Vector3, type Camera } from 'three'
import type { LabelAnchor, ViewportSize } from '../types/labels'
import type { ModelObject } from './buildModelObject'
import { truncateName } from './labelLayout'

type Entries = ModelObject['entries']

/** Bounding-sphere radius of every part. Computed once per model, not per frame. */
export function computePartRadii(entries: Entries): Map<string, number> {
  const size = new Vector3()
  const radii = new Map<string, number>()
  for (const [id, { box }] of entries) radii.set(id, box.getSize(size).length() / 2)
  return radii
}

interface AnchorContext {
  entries: Entries
  radii: ReadonlyMap<string, number>
  /** Parts with a smaller radius are skipped, unless selected, isolated or called out. */
  minRadius: number
  camera: Camera
  viewport: ViewportSize
  selectedIds: ReadonlySet<string>
  isolatedIds: ReadonlySet<string> | null
  /** Parts whose labels are pinned as callouts. Always included if visible. */
  calloutIds: ReadonlySet<string>
}

const PRIORITY = { normal: 0, isolated: 1, selected: 2, callout: 3 } as const

/** Which parts deserve a label right now, and where they are on screen. */
export function collectLabelAnchors(context: AnchorContext): LabelAnchor[] {
  const {
    entries,
    radii,
    minRadius,
    camera,
    viewport,
    selectedIds,
    isolatedIds,
    calloutIds,
  } = context
  camera.updateMatrixWorld() // refresh matrixWorldInverse: this runs before the renderer does it

  const world = new Vector3()
  const view = new Vector3()
  const anchors: LabelAnchor[] = []

  for (const [id, { part, mesh, center }] of entries) {
    if (!mesh.visible) continue

    const selected = selectedIds.has(id)
    const isolated = isolatedIds?.has(id) ?? false
    const isCallout = calloutIds.has(id)

    if (part.system === 'integumentary' && !isolated && !isCallout) continue
    if (!selected && !isolated && !isCallout && (radii.get(id) ?? 0) < minRadius) continue

    world.copy(center).add(mesh.position)
    view.copy(world).applyMatrix4(camera.matrixWorldInverse)
    if (view.z >= 0) continue // behind the camera

    world.project(camera)
    const x = (world.x * 0.5 + 0.5) * viewport.width
    const y = (-world.y * 0.5 + 0.5) * viewport.height
    if (x < 0 || x > viewport.width || y < 0 || y > viewport.height) continue

    anchors.push({
      id,
      name: truncateName(part.name),
      x,
      y,
      priority: isCallout
        ? PRIORITY.callout
        : selected
          ? PRIORITY.selected
          : isolated
            ? PRIORITY.isolated
            : PRIORITY.normal,
      distance: -view.z,
    })
  }
  return anchors
}
