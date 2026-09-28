import type { SystemId } from '@/types/anatomy'
import { SYSTEM_DEFINITIONS } from '../constants/systemDefinitions'

const LABELS = new Map<SystemId, string>(
  SYSTEM_DEFINITIONS.map(({ id, label }) => [id, label]),
)

/** Human-readable label for a system id, with the raw id as a safe fallback. */
export function systemLabel(id: SystemId): string {
  return LABELS.get(id) ?? id
}
