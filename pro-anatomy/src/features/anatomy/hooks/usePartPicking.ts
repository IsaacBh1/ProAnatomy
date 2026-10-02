import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Raycaster, Vector2, type Object3D } from 'three'
import { useSelectionStore } from '@/store/selectionStore'
import { useUiStore } from '@/store/uiStore'
import { useDrawingStore } from '@/features/drawing/store/drawingStore'
import { DRAG_THRESHOLD_PX } from '../constants/viewer'
import { clearSelection, isolatePart, selectPart } from '../services/viewCommands'
import { useContextMenuStore } from '../store/contextMenuStore'

/**
 * Pointer picking against `root`: hover, click, Ctrl/Cmd+click (toggle),
 * double-click (isolate) and right-click (open the context menu).
 *
 * Active in:
 *   • Explore mode — always.
 *   • Draw mode — only when `Select` is active. Matches explore mode exactly, and
 *     never touches drawn elements: the `Edit` tool owns those.
 */
export function usePartPicking(root: Object3D): void {
  const camera = useThree((state) => state.camera)
  const canvas = useThree((state) => state.gl.domElement)

  useEffect(() => {
    const target = canvas.parentElement ?? canvas
    const { setHovered } = useSelectionStore.getState()
    const raycaster = new Raycaster()
    const pointer = new Vector2()

    let pendingMove: PointerEvent | null = null
    let frame = 0
    let pressed: { x: number; y: number } | null = null

    const shouldIgnore = (): boolean => {
      const mode = useUiStore.getState().viewerMode
      if (mode === 'explore') return false
      return useDrawingStore.getState().tool !== 'select'
    }

    const pick = (event: MouseEvent): string | null => {
      const rect = canvas.getBoundingClientRect()
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      const partId: unknown = raycaster.intersectObject(root, true)[0]?.object.userData.partId
      return typeof partId === 'string' ? partId : null
    }

    const onPointerDown = (event: PointerEvent) => {
      if (shouldIgnore()) return
      if (event.button !== 0) return
      pressed = { x: event.clientX, y: event.clientY }
      setHovered(null)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (shouldIgnore()) return
      if (event.buttons !== 0) return
      pendingMove = event
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (pendingMove) setHovered(pick(pendingMove))
        pendingMove = null
      })
    }

    const onPointerLeave = () => {
      pendingMove = null
      setHovered(null)
    }

    const onClick = (event: MouseEvent) => {
      if (shouldIgnore()) return
      const moved = pressed ? Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) : 0
      if (moved > DRAG_THRESHOLD_PX) return

      const additive = event.ctrlKey || event.metaKey
      const id = pick(event)

      if (!id) {
        if (!additive) clearSelection()
      } else if (additive) {
        selectPart(id, true)
      } else if (event.detail >= 2) {
        isolatePart(id)
      } else {
        selectPart(id, false)
      }
    }

    const onContextMenu = (event: MouseEvent) => {
      if (shouldIgnore()) return
      event.preventDefault()
      const id = pick(event)
      if (!id) return

      const rect = canvas.getBoundingClientRect()
      useContextMenuStore.getState().open({
        partId: id,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    }

    target.addEventListener('pointerdown', onPointerDown)
    target.addEventListener('pointermove', onPointerMove)
    target.addEventListener('pointerleave', onPointerLeave)
    target.addEventListener('click', onClick)
    target.addEventListener('contextmenu', onContextMenu)

    return () => {
      cancelAnimationFrame(frame)
      target.removeEventListener('pointerdown', onPointerDown)
      target.removeEventListener('pointermove', onPointerMove)
      target.removeEventListener('pointerleave', onPointerLeave)
      target.removeEventListener('click', onClick)
      target.removeEventListener('contextmenu', onContextMenu)
    }
  }, [camera, canvas, root])
}
