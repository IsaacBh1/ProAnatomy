import { Color, SRGBColorSpace } from 'three'
import { SYSTEM_DEFINITIONS } from '@/features/body-systems/constants/systemDefinitions'
import type { SystemId } from '@/types/anatomy'

const SYSTEM_COLOR = Object.fromEntries(
  SYSTEM_DEFINITIONS.map(({ id, color }) => [id, color]),
) as Record<SystemId, string>

const BUCKETS = 8

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
export function partColorBucket(id: string, system: SystemId): number {
  return hashString(`${system}:${id}`) % BUCKETS
}

export function partColor(id: string, system: SystemId): Color {
  const hsl = { h: 0, s: 0, l: 0 }
  new Color(SYSTEM_COLOR[system]).getHSL(hsl, SRGBColorSpace)

  const t = partColorBucket(id, system) / (BUCKETS - 1) - 0.5

  return new Color().setHSL(
    (hsl.h + t * 0.08 + 1) % 1,
    clamp(hsl.s + t * 0.15, 0.1, 0.95),
    clamp(hsl.l + t * 0.18, 0.2, 0.85),
    SRGBColorSpace,
  )
}
