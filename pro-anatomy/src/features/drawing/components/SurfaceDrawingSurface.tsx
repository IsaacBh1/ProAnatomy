// src/features/drawing/components/SurfaceDrawingSurface.tsx
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Plane, Raycaster, Vector2, Vector3, type Object3D } from 'three'
import { SURFACE_TOOLS } from '../constants'
import { useDrawingStore } from '../store/drawingStore'
import { useUiStore } from '@/store/uiStore'
import type { SurfaceStroke, Vec3 } from '../types'
import { pickSurfaceStroke } from '../utils/surfacePicking'

/** Generous enough to hit thin strokes, tight enough that the wrong one never wins. */
const PICK_THRESHOLD_PX = 10

type Action =
  | { kind: 'idle' }
  | { kind: 'stroke' }
  | { kind: 'erase' }
  | {
      kind: 'move'
      /** Camera-facing plane through the picked point. */
      plane: Plane
      /** Where on that plane the pointer first landed. */
      grabWorld: Vector3
      /** Pre-drag snapshots of everything in the selection, keyed by id. */
      originals: Map<string, SurfaceStroke>
      /** Set on the first real move, so a click that only selects leaves no history. */
      dirty: boolean
    }

interface Props {
  root: Object3D
}

/**
 * Pointer interactions for the 3D surface layer, active only when the drawing
 * space is `surface` and the current tool is one of `SURFACE_TOOLS`.
 *
 *   brush   — raycasts against the model, accumulating points into a stroke
 *   eraser  — raycasts against existing surface strokes and deletes the pick
 *   edit    — picks a stroke, selects it, then drag-translates it (and every
 *             other selected stroke) on a plane facing the camera
 *
 * Other tools are handled by the screen-space layer or by OrbitControls.
 */
export function SurfaceDrawingSurface({ root }: Props) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)

  const viewerMode = useUiStore((s) => s.viewerMode)
  const drawingSpace = useUiStore((s) => s.drawingSpace)
  const orbitOverride = useUiStore((s) => s.orbitOverride)
  const tool = useDrawingStore((s) => s.tool)

  const active =
    viewerMode === 'draw' &&
    drawingSpace === 'surface' &&
    !orbitOverride &&
    SURFACE_TOOLS.has(tool)

  useEffect(() => {
    if (!active) return
    const canvas = gl.domElement
    const raycaster = new Raycaster()
    const pointer = new Vector2()
    let action: Action = { kind: 'idle' }

    const setPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
    }

    const hitSurface = (event: PointerEvent): { pos: Vec3; partId?: string } | null => {
      setPointer(event)
      const hit = raycaster.intersectObject(root, true)[0]
      if (!hit) return null
      const p = hit.point
      return {
        pos: [p.x, p.y, p.z],
        partId: (hit.object.userData as { partId?: string }).partId,
      }
    }

    const pickStroke = (event: PointerEvent): SurfaceStroke | null => {
      setPointer(event)
      return pickSurfaceStroke(
        raycaster,
        camera,
        useDrawingStore.getState().surfaceStrokes,
        PICK_THRESHOLD_PX,
        size.height,
      )
    }

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      const store = useDrawingStore.getState()

      // ── Edit: pick a stroke, then drag-translate it (and the selection) ──
      if (tool === 'edit') {
        const picked = pickStroke(event)
        if (!picked) {
          if (!event.shiftKey) store.clearSelection()
          return
        }

        canvas.setPointerCapture(event.pointerId)

        if (event.shiftKey) {
          store.selectElement(picked.id, true)
        } else if (!store.selectedIds.has(picked.id)) {
          store.selectElement(picked.id)
        }

        // Drag on a camera-facing plane through the picked stroke's first point.
        const anchor = new Vector3().fromArray(picked.points[0])
        const cameraDir = camera.getWorldDirection(new Vector3())
        const plane = new Plane().setFromNormalAndCoplanarPoint(cameraDir, anchor)

        const grabWorld = new Vector3()
        if (!raycaster.ray.intersectPlane(plane, grabWorld)) grabWorld.copy(anchor)

        const ids = new Set(useDrawingStore.getState().selectedIds)
        const originals = new Map<string, SurfaceStroke>()
        for (const stroke of store.surfaceStrokes) {
          if (ids.has(stroke.id)) originals.set(stroke.id, stroke)
        }

        action = { kind: 'move', plane, grabWorld, originals, dirty: false }
        return
      }

      // ── Eraser: delete the picked stroke, keep deleting while dragging ────
      if (tool === 'eraser') {
        canvas.setPointerCapture(event.pointerId)
        action = { kind: 'erase' }
        const picked = pickStroke(event)
        if (picked) {
          store.deleteElements([picked.id])
          invalidate()
        }
        return
      }

      // ── Brush: raycast against the model and start accumulating points ───
      const hit = hitSurface(event)
      if (!hit) return
      canvas.setPointerCapture(event.pointerId)
      store.beginSurfaceStroke({
        style: store.style,
        targetPartId: hit.partId,
        points: [hit.pos],
      })
      action = { kind: 'stroke' }
      invalidate()
    }

    const onMove = (event: PointerEvent) => {
      if (action.kind === 'idle') return
      const store = useDrawingStore.getState()

      if (action.kind === 'stroke') {
        const hit = hitSurface(event)
        if (!hit) return
        store.appendSurfacePoint(hit.pos)
        invalidate()
        return
      }

      if (action.kind === 'erase') {
        const picked = pickStroke(event)
        if (!picked) return
        store.deleteElements([picked.id])
        invalidate()
        return
      }

      if (action.kind !== 'move') return

      setPointer(event)
      const current = new Vector3()
      if (!raycaster.ray.intersectPlane(action.plane, current)) return

      const dx = current.x - action.grabWorld.x
      const dy = current.y - action.grabWorld.y
      const dz = current.z - action.grabWorld.z
      if (dx === 0 && dy === 0 && dz === 0) return
      if (action.originals.size === 0) return

      // First real movement → push the pre-drag state once.
      if (!action.dirty) {
        store.snapshot()
        action.dirty = true
      }

      const originals = action.originals
      store.applySurfaceTransient((strokes) =>
        strokes.map((stroke) => {
          const original = originals.get(stroke.id)
          if (!original) return stroke
          return {
            ...stroke,
            points: original.points.map(([x, y, z]): Vec3 => [x + dx, y + dy, z + dz]),
          }
        }),
      )
      invalidate()
    }

    const onUp = (event: PointerEvent) => {
      if (action.kind === 'idle') return
      const store = useDrawingStore.getState()
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
      if (action.kind === 'stroke') store.commitSurfaceStroke()
      action = { kind: 'idle' }
      invalidate()
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
  }, [active, gl, camera, root, invalidate, size.height, tool])

  return null
}
