// src/features/landing/components/LandingModelScene.tsx
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

/**
 * Landing-page hero model — a genuinely light one.
 *
 * Strategy: take every skeletal part, merge their geometries into a *single*
 * BufferGeometry, and render that one mesh. Draw calls go from ~200 (one per
 * bone, plus one per Edges helper) to exactly two: the merged mesh and its
 * line-segment edges.
 *
 * Why this matters: the male model's skeletal system alone is roughly 200
 * parts. Each part as its own mesh means 200 matrix updates per frame, 200
 * frustum culls, 200 material binds. On integrated graphics that's visible
 * heat and visible stutter. Merging collapses all of it into one transform.
 *
 * This is NOT what the anatomy viewer does, and it shouldn't — the viewer
 * needs per-part identity for picking, selection, isolation, and per-system
 * coloring. The hero doesn't: it just needs to look like a skeleton and spin.
 */
const BONE_COLOR = '#d4b483'
const EDGE_COLOR = '#863bff'
/** Hard-edge threshold. Below this, two adjacent faces are treated as smooth. */
const EDGE_THRESHOLD = 22

interface LandingModelSceneProps {
  model: AnatomyModel
  /** 0 → 1 progress of the hero's scroll. Drives the rotation. */
  progress: MotionValue<number>
}

/**
 * Merges every skeletal part into one geometry. Returns null if the model
 * has no skeleton (defensive: the female GLB has one, but its system tagging
 * is heuristic).
 *
 * `mergeGeometries` requires uniform attributes across inputs. Every part
 * built by BodyParts3DSource has position + index + computed normals, so the
 * inputs already match. If a source ever produces a mixed set, we return null
 * and the caller falls back to the rings.
 */
function buildMergedSkeleton(model: AnatomyModel): BufferGeometry | null {
  const parts = model.parts.filter((p) => p.system === 'skeletal')
  if (parts.length === 0) return null

  const merged = mergeGeometries(
    parts.map((p) => p.geometry),
    false, // don't merge into groups; we want one flat geometry
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

    // Fallback: nothing to merge. Return a bundle with nulls; the effect below
    // guards on it and the JSX renders nothing.
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

  // Fit camera once. Distance from the bounding sphere and the camera's FOV —
  // same formula as fitCameraToBox, inlined because this scene has no controls
  // to hand it to.
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

  // Dispose GPU-side resources when the model unmounts. Merged geometry and
  // its edges geometry are new allocations — Three won't reclaim them.
  useEffect(() => {
    return () => {
      geometry?.dispose()
      edges?.dispose()
      material?.dispose()
    }
  }, [geometry, edges, material])

  // Scroll → rotation. The group is offset so the pivot sits at the origin,
  // otherwise the body orbits around an off-centre point and drifts off-screen.
  useFrame(() => {
    if (!groupRef.current) return
    const p = progress.get()
    groupRef.current.rotation.y = p * Math.PI * 1.6
    groupRef.current.rotation.x = -0.05 + p * 0.15
  })

  // Wake the demand-driven loop on every progress change.
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
