import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Box3,
  EdgesGeometry,
  Group,
  MeshStandardMaterial,
  Vector3,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { MotionValue } from 'framer-motion'
import type { AnatomyModel } from '@/features/anatomy/types/model'


const BONE_COLOR = '#d4b483'
const EDGE_COLOR = '#863bff'
const EDGE_THRESHOLD = 22

interface LandingModelSceneProps {
  model: AnatomyModel
  progress: MotionValue<number>
}

function buildMergedSkeleton(model: AnatomyModel): BufferGeometry | null {
  const parts = model.parts.filter((p) => p.system === 'skeletal')
  if (parts.length === 0) return null

  const merged = mergeGeometries(
    parts.map((p) => p.geometry),
    false,
  )
  if (!merged) return null

  merged.computeBoundingBox()
  merged.computeBoundingSphere()
  return merged
}

export function LandingModelScene({ model, progress }: LandingModelSceneProps) {
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const groupRef = useRef<Group>(null)

  const { geometry, edges, material, bounds, pivot } = useMemo(() => {
    const geo = buildMergedSkeleton(model)

    if (!geo) {
      return {
        geometry: null,
        edges: null,
        material: null,
        bounds: new Box3(),
        pivot: new Vector3(),
      }
    }

    const edgesGeo = new EdgesGeometry(geo, EDGE_THRESHOLD)
    const mat = new MeshStandardMaterial({
      color: BONE_COLOR,
      roughness: 0.55,
      metalness: 0.05,
    })
    const box = geo.boundingBox!.clone()
    const center = box.getCenter(new Vector3())

    return { geometry: geo, edges: edgesGeo, material: mat, bounds: box, pivot: center }
  }, [model])

  useEffect(() => {
    if (!geometry || bounds.isEmpty()) return
    const radius = bounds.getSize(new Vector3()).length() / 2

    const persp = camera as unknown as { fov: number; aspect: number }
    const fov = (persp.fov * Math.PI) / 180
    const horizFov = 2 * Math.atan(Math.tan(fov / 2) * persp.aspect)
    const distance = (radius / Math.sin(Math.min(fov, horizFov) / 2)) * 1.18

    camera.position.set(pivot.x, pivot.y, pivot.z + distance)
    camera.lookAt(pivot)
    invalidate()
  }, [geometry, bounds, pivot, camera, invalidate])

  useEffect(() => {
    return () => {
      geometry?.dispose()
      edges?.dispose()
      material?.dispose()
    }
  }, [geometry, edges, material])

  useFrame(() => {
    if (!groupRef.current) return
    const p = progress.get()
    groupRef.current.rotation.y = p * Math.PI * 1.6
    groupRef.current.rotation.x = -0.05 + p * 0.15
  })

  useEffect(() => {
    return progress.on('change', invalidate)
  }, [progress, invalidate])

  if (!geometry || !edges || !material) return null

  return (
    <group ref={groupRef} position={[-pivot.x, -pivot.y, -pivot.z]}>
      <mesh geometry={geometry} material={material} />
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={EDGE_COLOR} transparent opacity={0.85} />
      </lineSegments>
    </group>
  )
}
