import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useAnatomyStore } from '@/store/anatomyStore'
import { useSelectionStore } from '@/store/selectionStore'
import { useUiStore } from '@/store/uiStore'
import { LABELS } from '../constants/labels'
import { useLabelStore } from '../store/labelStore'
import { useViewStore } from '../store/viewStore'
import type { LabelSide } from '../types/labels'
import type { ModelObject } from '../utils/buildModelObject'
import { collectLabelAnchors, computePartRadii } from '../utils/collectLabelAnchors'
import { layoutLabels } from '../utils/labelLayout'

const NO_SIDES: ReadonlyMap<string, LabelSide> = new Map()
const EMPTY: readonly never[] = []

/** Cheap-ish fingerprint of everything the label layer's output depends on. */
function frameKey(args: {
  cameraMatrix: readonly number[]
  width: number
  height: number
  enabled: boolean
  callouts: ReadonlySet<string>
  selection: ReadonlySet<string>
  isolation: ReadonlySet<string> | null
}): string {
  const { cameraMatrix, width, height, enabled, callouts, selection, isolation } = args
  return [
    // camera.matrixWorld.elements is 16 floats; join is fine for this size.
    cameraMatrix.join(','),
    width,
    height,
    enabled ? 1 : 0,
    // Sorted is unnecessary: these sets are only ever compared to themselves.
    [...callouts].join(','),
    [...selection].join(','),
    isolation ? [...isolation].join(',') : 'null',
  ].join('|')
}

/**
 * Projects labels to screen space after every rendered frame and publishes them
 * to the label store.
 *
 * Callouts take precedence: while any exist, only those are rendered, regardless
 * of the "Show organ labels" toggle.
 *
 * Frames are skipped when nothing that affects the *output* has changed. The
 * camera matrix alone would be enough when auto-rotating, but selection and
 * callouts can change without the camera moving — so we hash everything the
 * anchors depend on and bail if the hash matches the last run's.
 */
export function useLabelProjector({ entries, bounds }: ModelObject): void {
  const invalidate = useThree((state) => state.invalidate)
  const enabled = useAnatomyStore((state) => state.showLabels)
  const calloutIds = useUiStore((state) => state.calloutIds)

  const radii = useMemo(() => computePartRadii(entries), [entries])
  const minRadius = useMemo(() => {
    const size = bounds.getSize(new Vector3())
    return Math.max(size.x, size.y, size.z) * LABELS.minSizeFraction
  }, [bounds])
  const sides = useRef<ReadonlyMap<string, LabelSide>>(NO_SIDES)
  const lastKey = useRef('')

  // Toggling labels, changing callouts, or swapping models needs one fresh frame.
  useEffect(() => {
    invalidate()
    return () => {
      sides.current = NO_SIDES
      lastKey.current = ''
      useLabelStore.getState().clear()
    }
  }, [enabled, calloutIds, entries, invalidate])

  useFrame(({ camera, size }) => {
    if (!enabled && calloutIds.size === 0) {
      if (useLabelStore.getState().items.length > 0) useLabelStore.getState().clear()
      lastKey.current = ''
      return
    }

    const selectedIds = useSelectionStore.getState().selectedIds
    const isolatedIds = useViewStore.getState().isolatedIds

    const key = frameKey({
      cameraMatrix: camera.matrixWorld.elements,
      width: size.width,
      height: size.height,
      enabled,
      callouts: calloutIds,
      selection: selectedIds,
      isolation: isolatedIds,
    })
    if (key === lastKey.current) return
    lastKey.current = key

    const anchors = collectLabelAnchors({
      entries,
      radii,
      minRadius,
      camera,
      viewport: size,
      selectedIds,
      isolatedIds,
      calloutIds,
    })

    const visible =
      calloutIds.size > 0 ? anchors.filter((anchor) => calloutIds.has(anchor.id)) : anchors

    const items = layoutLabels(visible.length === 0 && !enabled ? EMPTY : visible, {
      viewport: size,
      previousSides: sides.current,
      pinnedIds: calloutIds.size > 0 ? calloutIds : undefined,
    })

    sides.current = new Map(items.map((item) => [item.id, item.side]))
    useLabelStore.getState().setItems(items)
  })
}
