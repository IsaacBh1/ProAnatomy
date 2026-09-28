import type { SearchableItem, SearchResult } from '../types'

export interface SearchIndexEntry<T extends SearchableItem> {
  item: T
  name: string
  id: string
  system: string
}

export function buildSearchIndex<T extends SearchableItem>(
  items: readonly T[],
): SearchIndexEntry<T>[] {
  return items.map((item) => ({
    item,
    name: item.name.toLowerCase(),
    id: item.id.toLowerCase(),
    system: item.system.toLowerCase(),
  }))
}

export const tokenize = (query: string): string[] =>
  query.toLowerCase().split(/\s+/).filter(Boolean)

const startsWord = (name: string, token: string) =>
  ` ${name.replace(/[_-]/g, ' ')}`.includes(` ${token}`)

/** null = not a match. Every token must appear somewhere in name, id or system. */
function scoreEntry<T extends SearchableItem>(
  entry: SearchIndexEntry<T>,
  tokens: readonly string[],
  phrase: string,
): number | null {
  const haystack = `${entry.name} ${entry.id} ${entry.system}`
  if (!tokens.every((token) => haystack.includes(token))) return null

  let score = 20 // all tokens matched, but scattered
  if (entry.name.startsWith(phrase)) score = 1000
  else if (entry.name.includes(phrase)) score = 500
  else if (entry.id.startsWith(phrase)) score = 400
  else if (entry.id.includes(phrase)) score = 250
  else if (entry.system.includes(phrase)) score = 150

  for (const token of tokens) if (startsWord(entry.name, token)) score += 60
  return score + Math.max(0, 40 - entry.name.length) // shorter names are more specific
}

export function searchIndex<T extends SearchableItem>(
  index: readonly SearchIndexEntry<T>[],
  query: string,
  limit = 50,
): SearchResult<T>[] {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []
  const phrase = tokens.join(' ')

  const results: SearchResult<T>[] = []
  for (const entry of index) {
    const score = scoreEntry(entry, tokens, phrase)
    if (score !== null) results.push({ item: entry.item, score })
  }

  return results
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, limit)
}
