import { useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import type { SearchableItem } from '../types'
import { buildSearchIndex, searchIndex, tokenize } from '../utils/searchItems'

const MAX_RESULTS = 50

export function usePartSearch<T extends SearchableItem>(items: readonly T[], debounceMs = 120) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, debounceMs)

  const index = useMemo(() => buildSearchIndex(items), [items])
  const results = useMemo(
    () => searchIndex(index, debouncedQuery, MAX_RESULTS),
    [index, debouncedQuery],
  )
  const tokens = useMemo(() => tokenize(debouncedQuery), [debouncedQuery])

  return { query, setQuery, results, tokens, isSettled: query === debouncedQuery }
}
