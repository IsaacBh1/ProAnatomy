// src/features/drawing/components/SurfaceDrawingSurface.tsx
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Raycaster, Vector2, type Object3D } from 'three'
import { SURFACE_TOOLS } from '../constants'
import { useDrawingStore } from '../store/drawingStore'
import { useUiStore } from '@/store/uiStore'
import type { Vec3 } from '../types'

interface Props {
  root: Object3D
}

/**
 * Raycasts against the model while the user drags on the 3D surface. Only active when
 * the drawing space is 'surface' AND the current tool is one of `SURFACE_TOOLS` (brush
 * or eraser). Other tools are handled by the screen-space layer or by OrbitControls.
 */
export function SurfaceDrawingSurface({ root }: Props) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
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
    let drawing = false

    const hitAt = (event: PointerEvent): { pos: Vec3; partId?: string } | null => {
      const rect = canvas.getBoundingClientRect()
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(root, true)[0]
      if (!hit) return null
      const p = hit.point
      return {
        pos: [p.x, p.y, p.z],
        partId: (hit.object.userData as { partId?: string }).partId,
      }
    }

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      const hit = hitAt(event)
      if (!hit) return
      drawing = true
      canvas.setPointerCapture(event.pointerId)
      const { style } = useDrawingStore.getState()
      useDrawingStore.getState().beginSurfaceStroke({
        style,
        targetPartId: hit.partId,
        points: [hit.pos],
      })
      invalidate()
    }

    const onMove = (event: PointerEvent) => {
      if (!drawing) return
      const hit = hitAt(event)
      if (!hit) return
      useDrawingStore.getState().appendSurfacePoint(hit.pos)
      invalidate()
    }

    const onUp = (event: PointerEvent) => {
      if (!drawing) return
      drawing = false
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      useDrawingStore.getState().commitSurfaceStroke()
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
  }, [active, gl, camera, root, invalidate])

  return null
}
