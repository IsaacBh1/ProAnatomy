import { SYSTEM_IDS, type SystemId } from '@/types/anatomy'

const KNOWN_SYSTEMS = new Set<string>(SYSTEM_IDS)

/** Maps any raw system string from a data source to our closed SystemId union. */
export function toSystemId(raw: string | undefined): SystemId {
  const value = raw?.toLowerCase()
  return value && KNOWN_SYSTEMS.has(value) ? (value as SystemId) : 'other'
}
