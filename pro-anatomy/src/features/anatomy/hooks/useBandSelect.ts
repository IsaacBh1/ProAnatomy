import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { BAND_MIN_SIZE_PX } from '../constants/viewer'
import { selectMany } from '../services/viewCommands'
import { useBandStore } from '../store/bandStore'
import type { BandRect } from '../types/view'
import type { ModelObject } from '../utils/buildModelObject'
import { collectPartsInRect } from '../utils/collectPartsInRect'

interface Point {
  x: number
  y: number
}

const toRect = (a: Point, b: Point): BandRect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(a.x - b.x),
  height: Math.abs(a.y - b.y),
})

/** Rubber-band selection, active only while the Select tool is on. Ctrl/Cmd adds to the selection. */
export function useBandSelect(entries: ModelObject['entries'], enabled: boolean): void {
  const camera = useThree((state) => state.camera)
  const canvas = useThree((state) => state.gl.domElement)

  useEffect(() => {
    if (!enabled) return

    const host = canvas.parentElement ?? canvas
    const { setRect } = useBandStore.getState()
    let origin: Point | null = null
    let additive = false

    const localPoint = (event: PointerEvent): Point => {
      const bounds = canvas.getBoundingClientRect()
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
    }

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      origin = localPoint(event)
      additive = event.ctrlKey || event.metaKey
      event.preventDefault() // no text selection while dragging
    }

    const onMove = (event: PointerEvent) => {
      if (origin) setRect(toRect(origin, localPoint(event)))
    }

    const onUp = (event: PointerEvent) => {
      if (!origin) return
      const rect = toRect(origin, localPoint(event))
      origin = null
      setRect(null)
      if (rect.width < BAND_MIN_SIZE_PX || rect.height < BAND_MIN_SIZE_PX) return

      const { width, height } = canvas.getBoundingClientRect()
      selectMany(collectPartsInRect(entries, camera, rect, { width, height }), additive)
    }

    host.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      host.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setRect(null)
    }
  }, [camera, canvas, enabled, entries])
}
