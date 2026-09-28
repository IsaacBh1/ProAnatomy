// src/features/anatomy/components/AnatomyViewer.tsx
import { useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useDrawingStore } from '@/features/drawing/store/drawingStore'
import type { ToolId as DrawToolId } from '@/features/drawing/types'
import { useAnatomyStore } from '@/store/anatomyStore'
import { useSelectionStore } from '@/store/selectionStore'
import { useUiStore } from '@/store/uiStore'
import type { ToolId } from '@/types/anatomy'
import { cn } from '@/utils/cn'
import { useAnatomyModel } from '../hooks/useAnatomyModel'
import { usePresetDraftStore } from '../store/presetDraftStore'
import { useViewStore } from '../store/viewStore'
import { buildModelObject, disposeModelObject } from '../utils/buildModelObject'
import { BandOverlay } from './BandOverlay'
import { CalloutBadge } from './CalloutBadge'
import { HiddenBadge } from './HiddenBadge'
import { LabelLayer } from './LabelLayer'
import { ModelScene } from './ModelScene'
import { PartTooltip } from './PartTooltip'
import { SavePresetDialog } from './SavePresetDialog'
import { SelectionBar } from './SelectionBar'
import { SnapshotDialog } from './SnapshotDialog'
import { ViewerContextMenu } from './ViewerContextMenu'
import { ViewportStatus } from './ViewportStatus'

const CAMERA = { fov: 45, near: 0.01, far: 1000 }
const GL = {
  antialias: true,
  powerPreference: 'high-performance',
  logarithmicDepthBuffer: true,
} as const

const EXPLORE_CURSOR: Record<ToolId, string> = {
  orbit: 'cursor-default',
  zoom: 'cursor-zoom-in',
  select: 'cursor-crosshair',
  pan: 'cursor-grab active:cursor-grabbing',
}

const DRAW_CURSOR: Record<DrawToolId, string> = {
  orbit: 'cursor-default',
  zoom: 'cursor-zoom-in',
  pan: 'cursor-grab active:cursor-grabbing',
  select: 'cursor-crosshair',
  brush: 'cursor-crosshair',
  eraser: 'cursor-cell',
  line: 'cursor-crosshair',
  arrow: 'cursor-crosshair',
  rect: 'cursor-crosshair',
  ellipse: 'cursor-crosshair',
  text: 'cursor-text',
}

export function AnatomyViewer() {
  const sex = useAnatomyStore((state) => state.sex)
  const activeTool = useUiStore((state) => state.activeTool)
  const viewerMode = useUiStore((state) => state.viewerMode)
  const drawTool = useDrawingStore((state) => state.tool)
  const hoveredId = useSelectionStore((state) => state.hoveredId)
  const { data: model, error, isError, isPending, refetch } = useAnatomyModel(sex)

  const modelObject = useMemo(() => (model ? buildModelObject(model) : null), [model])

  useEffect(() => {
    useSelectionStore.getState().reset()
    useViewStore.getState().reset()
    useUiStore.getState().clearCallouts()
    usePresetDraftStore.getState().reset()
    if (!modelObject) return
    return () => disposeModelObject(modelObject)
  }, [modelObject])

  const hoveredPart = hoveredId ? modelObject?.entries.get(hoveredId)?.part : undefined

  const cursor = viewerMode === 'draw' ? DRAW_CURSOR[drawTool] : EXPLORE_CURSOR[activeTool]

  return (
    <div className={cn('absolute inset-0', cursor)}>
      <Canvas frameloop="demand" dpr={[1, 2]} camera={CAMERA} gl={GL}>
        {modelObject && <ModelScene modelObject={modelObject} tool={activeTool} />}
      </Canvas>

      <LabelLayer />
      <BandOverlay />
      <HiddenBadge />
      <CalloutBadge entries={modelObject?.entries} />
      <SelectionBar entries={modelObject?.entries} />
      <PartTooltip part={hoveredPart} />
      <ViewerContextMenu />
      <SnapshotDialog />
      <SavePresetDialog />

      {isPending && <ViewportStatus sex={sex} />}
      {isError && <ViewportStatus sex={sex} error={error} onRetry={() => void refetch()} />}
    </div>
  )
}
