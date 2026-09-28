// src/features/anatomy/components/ModelScene.tsx
import { useEffect, useMemo, useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { MOUSE, Vector3 } from 'three'
import {
  SurfaceDrawingLayer,
  SurfaceDrawingSurface,
  useDrawingStore,
} from '@/features/drawing'
import { useUiStore } from '@/store/uiStore'
import { useResolvedTheme } from '@/hooks/useTheme'
import type { ToolId } from '@/types/anatomy'
import { useAutoRotateDriver } from '../hooks/useAutoRotateDriver'
import { useBandSelect } from '../hooks/useBandSelect'
import { useCameraApi } from '../hooks/useCameraApi'
import { useCaptureApi } from '../hooks/useCaptureApi'
import { useLabelProjector } from '../hooks/useLabelProjector'
import { usePartPicking } from '../hooks/usePartPicking'
import { useSceneSync } from '../hooks/useSceneSync'
import type { ModelObject } from '../utils/buildModelObject'
import { CameraRig } from './CameraRig'

const EXPLORE_BUTTONS: Record<ToolId, { LEFT: number; MIDDLE: number; RIGHT: number }> = {
  orbit: { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN },
  zoom: { LEFT: MOUSE.DOLLY, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN },
  pan: { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN },
  select: { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN },
}

type ButtonMap = { LEFT: number | undefined; MIDDLE: number; RIGHT: number }

const DRAW_TOOL_BUTTONS: ButtonMap = {
  LEFT: undefined,
  MIDDLE: MOUSE.DOLLY,
  RIGHT: MOUSE.PAN,
}

const DRAW_CAMERA_BUTTONS: Record<'orbit' | 'zoom' | 'pan', ButtonMap> = {
  orbit: { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN },
  zoom: { LEFT: MOUSE.DOLLY, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN },
  pan: { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN },
}

const ORBIT_OVERRIDE_BUTTONS: ButtonMap = {
  LEFT: MOUSE.ROTATE,
  MIDDLE: MOUSE.DOLLY,
  RIGHT: MOUSE.PAN,
}

const AUTO_ROTATE_SPEED = 4.5
const DAMPING_SETTLE_FRAMES = 60

interface ControlsWithEvents {
  addEventListener(type: 'start' | 'end', listener: () => void): void
  removeEventListener(type: 'start' | 'end', listener: () => void): void
}

function DampingDriver() {
  const controls = useThree((state) => state.controls) as unknown as ControlsWithEvents | null
  const invalidate = useThree((state) => state.invalidate)
  const framesLeft = useRef(0)

  useEffect(() => {
    if (!controls) return
    const onStart = () => {
      framesLeft.current = 0
    }
    const onEnd = () => {
      framesLeft.current = DAMPING_SETTLE_FRAMES
      invalidate()
    }
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controls, invalidate])

  useFrame(() => {
    if (framesLeft.current <= 0) return
    framesLeft.current -= 1
    invalidate()
  })

  return null
}

function SceneLights() {
  const theme = useResolvedTheme()
  if (theme === 'light') {
    return (
      <>
        <ambientLight intensity={1.05} />
        <directionalLight position={[0.6, 1.2, 1]} intensity={0.75} />
        <directionalLight position={[-1, 0.4, -0.8]} intensity={0.35} color="#c9cdd3" />
        <directionalLight position={[0, -0.8, -1]} intensity={0.22} color="#b8bcc2" />
      </>
    )
  }
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[0.6, 1.2, 1]} intensity={0.9} />
      <directionalLight position={[-1, 0.4, -0.8]} intensity={0.45} color="#8899cc" />
      <directionalLight position={[0, -0.8, -1]} intensity={0.3} color="#6688cc" />
    </>
  )
}

interface ModelSceneProps {
  modelObject: ModelObject
  tool: ToolId
}

export function ModelScene({ modelObject, tool }: ModelSceneProps) {
  const { root, entries, bounds } = modelObject
  const autoRotate = useUiStore((state) => state.autoRotate)
  const viewerMode = useUiStore((state) => state.viewerMode)
  const orbitOverride = useUiStore((state) => state.orbitOverride)
  const drawTool = useDrawingStore((state) => state.tool)
  const isDrawing = viewerMode === 'draw'

  const selectActive = isDrawing ? drawTool === 'select' : tool === 'select'

  usePartPicking(root)
  useSceneSync(entries)
  useCameraApi(modelObject)
  useBandSelect(entries, selectActive)
  useLabelProjector(modelObject)
  useCaptureApi()
  useAutoRotateDriver(autoRotate && !isDrawing)

  const radius = useMemo(() => bounds.getSize(new Vector3()).length() / 2, [bounds])

  const mouseButtons: ButtonMap = (() => {
    if (!isDrawing) return EXPLORE_BUTTONS[tool] as ButtonMap
    if (orbitOverride) return ORBIT_OVERRIDE_BUTTONS
    if (drawTool === 'orbit') return DRAW_CAMERA_BUTTONS.orbit
    if (drawTool === 'zoom') return DRAW_CAMERA_BUTTONS.zoom
    if (drawTool === 'pan') return DRAW_CAMERA_BUTTONS.pan
    if (drawTool === 'select') return EXPLORE_BUTTONS.select as ButtonMap
    return DRAW_TOOL_BUTTONS
  })()

  return (
    <>
      <SceneLights />
      <primitive object={root} />
      <CameraRig bounds={bounds} />
      <DampingDriver />

      <SurfaceDrawingSurface root={root} />
      <SurfaceDrawingLayer />

      <OrbitControls
        makeDefault
        enabled={!selectActive}
        enableRotate={!selectActive && (isDrawing || tool === 'orbit')}
        enablePan={!selectActive && (isDrawing || tool === 'pan')}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.85}
        zoomSpeed={1.2}
        minDistance={radius * 0.02}
        maxDistance={radius * 10}
        minPolarAngle={0.02}
        maxPolarAngle={Math.PI - 0.02}
        mouseButtons={mouseButtons as never}
        autoRotate={autoRotate && !isDrawing}
        autoRotateSpeed={AUTO_ROTATE_SPEED}
      />
    </>
  )
}
