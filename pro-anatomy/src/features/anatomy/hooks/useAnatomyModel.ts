import { queryOptions, useQuery } from '@tanstack/react-query'
import type { Sex, SystemId } from '@/types/anatomy'
import { loadAnatomyModel } from '../services/loadAnatomyModel'
import type { AnatomyModel } from '../types/model'

export const anatomyModelQuery = (sex: Sex) =>
  queryOptions({
    queryKey: ['anatomy-model', sex] as const,
    queryFn: ({ signal }) => loadAnatomyModel(sex, { signal }),
    staleTime: Infinity, // model files never change during a session
  })

export const useAnatomyModel = (sex: Sex) => useQuery(anatomyModelQuery(sex))

type SystemCounts = Partial<Record<SystemId, number>>

function countPartsBySystem(model: AnatomyModel): SystemCounts {
  const counts: SystemCounts = {}
  for (const { system } of model.parts) counts[system] = (counts[system] ?? 0) + 1
  return counts
}

/** Shares the same cached query, so the sidebar never triggers a second download. */
export const useSystemCounts = (sex: Sex) =>
  useQuery({ ...anatomyModelQuery(sex), select: countPartsBySystem })
