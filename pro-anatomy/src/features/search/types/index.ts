/** The minimum a thing needs to be searchable. Anything with these three fields works. */
export interface SearchableItem {
  id: string
  name: string
  system: string
}

export interface SearchResult<T extends SearchableItem = SearchableItem> {
  item: T
  score: number
}
