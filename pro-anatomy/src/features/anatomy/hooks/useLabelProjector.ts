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

/**
 * Projects labels to screen space after every rendered frame and publishes them to the label store.
 *
 * Callouts take precedence: while any exist, only those are rendered, regardless of the
 * "Show organ labels" toggle. That's the "tell me what these are called" affordance.
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

  // Toggling labels, changing callouts, or swapping models needs one fresh frame.
  useEffect(() => {
    invalidate()
    return () => {
      sides.current = NO_SIDES
      useLabelStore.getState().clear()
    }
  }, [enabled, calloutIds, entries, invalidate])

  useFrame(({ camera, size }) => {
    if (!enabled && calloutIds.size === 0) {
      if (useLabelStore.getState().items.length > 0) useLabelStore.getState().clear()
      return
    }

    const anchors = collectLabelAnchors({
      entries,
      radii,
      minRadius,
      camera,
      viewport: size,
      selectedIds: useSelectionStore.getState().selectedIds,
      isolatedIds: useViewStore.getState().isolatedIds,
      calloutIds,
    })

    // Callouts override the show-labels toggle: if any exist, only they render.
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
