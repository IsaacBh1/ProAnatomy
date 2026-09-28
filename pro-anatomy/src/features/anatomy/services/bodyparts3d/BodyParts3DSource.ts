import { BufferAttribute, BufferGeometry } from 'three'
import { fetchBuffer, fetchJson } from '@/lib/api/client'
import { gunzipIfNeeded } from '@/utils/gunzip'
import { toSystemId } from '@/utils/systems'
import type { AnatomyModelSource, AnatomyPart } from '../../types/model'
import { buildCompoundOrgans } from './parseCompoundOrgans'
import { loadPartTaxonomy } from './loadTaxonomy'

/** Only the atlas.json fields this adapter reads. */
interface AtlasChunk {
  gzip?: string
  url?: string
}

interface AtlasPart {
  id: string
  name: string
  system: string
  chunk: number
  vertexCount: number
  indexCount: number
  /** Byte offset of the Float32 xyz positions inside the chunk. */
  positions: number
  /** Byte offset of the Uint32 triangle indices inside the chunk. */
  indices: number
}

interface Atlas {
  chunks: AtlasChunk[]
  parts: AtlasPart[]
}

// Order matters: later files win name conflicts (ISA over PART-OF), like the prototype.
const ELEMENT_PARTS_FILES = [
  'bodyparts3d_partof_element_parts.json',
  'bodyparts3d_isa_element_parts.json',
]

const stripPrefix = (path: string) => path.replace(/^\/+/, '').replace(/^models\//, '')

function chunkUrl(baseUrl: string, chunk: AtlasChunk, index: number): string {
  const file = chunk.gzip ?? chunk.url
  if (!file) throw new Error(`atlas.json: chunk ${index} has neither "gzip" nor "url"`)
  return `${baseUrl}/${stripPrefix(file)}`
}

async function fetchOptionalJson(url: string, signal?: AbortSignal): Promise<unknown> {
  try {
    return await fetchJson<unknown>(url, signal)
  } catch (error) {
    if (signal?.aborted) throw error
    console.warn(`[BodyParts3D] optional file unavailable: ${url}`, error)
    return null
  }
}

function buildGeometry(buffer: ArrayBuffer, part: AtlasPart): BufferGeometry | null {
  const { vertexCount, indexCount, positions, indices } = part
  if (!vertexCount || !indexCount) return null

  const positionsEnd = positions + vertexCount * 3 * 4
  const indicesEnd = indices + indexCount * 4
  if (positionsEnd > buffer.byteLength || indicesEnd > buffer.byteLength) return null

  // slice() copies, so each geometry owns its memory and the chunk buffer can be freed.
  const positionArray = new Float32Array(buffer.slice(positions, positionsEnd))
  const indexArray = new Uint32Array(buffer.slice(indices, indicesEnd))
  if (indexArray.some((index) => index >= vertexCount)) return null // corrupt data guard

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positionArray, 3))
  geometry.setIndex(new BufferAttribute(indexArray, 1))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

async function loadParts(
  atlas: Atlas,
  baseUrl: string,
  signal?: AbortSignal,
): Promise<AnatomyPart[]> {
  const partsByChunk = new Map<number, AtlasPart[]>()
  for (const part of atlas.parts) {
    const list = partsByChunk.get(part.chunk)
    if (list) list.push(part)
    else partsByChunk.set(part.chunk, [part])
  }

  const perChunk = await Promise.all(
    atlas.chunks.map(async (chunk, index) => {
      const chunkParts = partsByChunk.get(index) ?? []
      if (chunkParts.length === 0) return []

      const raw = await fetchBuffer(chunkUrl(baseUrl, chunk, index), signal)
      const buffer = await gunzipIfNeeded(raw)

      return chunkParts.flatMap((part): AnatomyPart[] => {
        const geometry = buildGeometry(buffer, part)
        if (!geometry) {
          console.warn(`[BodyParts3D] skipped invalid part ${part.id} (${part.name})`)
          return []
        }
        return [{ id: part.id, name: part.name, system: toSystemId(part.system), geometry }]
      })
    }),
  )

  return perChunk.flat()
}

export interface BodyParts3DOptions {
  /** Folder that contains atlas.json and the body-N.bin.gz chunks. */
  baseUrl: string
}

export function createBodyParts3DSource({ baseUrl }: BodyParts3DOptions): AnatomyModelSource {
  return {
    async load({ signal } = {}) {
      // Load in parallel: the geometry chunks (heavy) and the hierarchy metadata (light).
      // The taxonomy failing must never block the model: `loadPartTaxonomy` returns an
      // empty taxonomy on any error and logs a warning, so presets degrade to the flat list.
      const [atlas, elementParts, taxonomy] = await Promise.all([
        fetchJson<Atlas>(`${baseUrl}/atlas.json`, signal),
        Promise.all(
          ELEMENT_PARTS_FILES.map((file) => fetchOptionalJson(`${baseUrl}/${file}`, signal)),
        ),
        loadPartTaxonomy(baseUrl),
      ])

      const parts = await loadParts(atlas, baseUrl, signal)
      const compounds = buildCompoundOrgans(elementParts, new Set(parts.map((part) => part.id)))

      return { parts, compounds, taxonomy }
    },
  }
}
