import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { SearchInput } from '@/components/ui'
import { cn } from '@/utils/cn'
import { usePartSearch } from '../hooks/usePartSearch'
import type { SearchableItem } from '../types'
import { splitByMatch } from '../utils/highlight'

const optionId = (listId: string, index: number) => `${listId}-option-${index}`

function Highlight({ text, tokens }: { text: string; tokens: readonly string[] }) {
  return (
    <>
      {splitByMatch(text, tokens).map((segment, i) =>
        segment.match ? (
          <mark key={i} className="bg-transparent font-semibold text-content">
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </>
  )
}

interface PartSearchProps<T extends SearchableItem> {
  items: readonly T[]
  onSelect: (item: T) => void
  placeholder?: string
}

/** Accessible combobox (ARIA 1.2 pattern). Knows nothing about 3D: items in, one item out. */
export function PartSearch<T extends SearchableItem>({
  items,
  onSelect,
  placeholder = 'search organ',
}: PartSearchProps<T>) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery, results, tokens, isSettled } = usePartSearch(items)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const hasQuery = query.trim().length > 0
  const showEmpty = results.length === 0 && isSettled
  const expanded = open && hasQuery && (results.length > 0 || showEmpty)
  const active = results.length > 0 ? Math.min(activeIndex, results.length - 1) : -1

  useEffect(() => {
    if (expanded && active >= 0) {
      document.getElementById(optionId(listId, active))?.scrollIntoView?.({ block: 'nearest' })
    }
  }, [expanded, active, listId])

  // Ctrl/Cmd+K focuses the search from anywhere.
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const select = (item: T) => {
    onSelect(item)
    setQuery('')
    setOpen(false)
    setActiveIndex(0)
    inputRef.current?.blur() // hand the keyboard back to the viewer shortcuts
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!hasQuery) return
        event.preventDefault()
        if (!expanded) return setOpen(true)
        if (results.length === 0) return
        const step = event.key === 'ArrowDown' ? 1 : -1
        setActiveIndex((results.length + active + step) % results.length)
        return
      }
      case 'Enter': {
        const result = results[active]
        if (expanded && result) {
          event.preventDefault()
          select(result.item)
        }
        return
      }
      case 'Escape': {
        if (expanded) {
          event.preventDefault()
          setOpen(false)
        } else if (hasQuery) {
          setQuery('')
        }
        return
      }
    }
  }

  return (
    <div className="relative w-full">
      <SearchInput
        ref={inputRef}
        value={query}
        onValueChange={(value) => {
          setQuery(value)
          setOpen(true)
          setActiveIndex(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Search organ"
        aria-keyshortcuts="Control+K Meta+K"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? optionId(listId, active) : undefined}
        autoComplete="off"
        spellCheck={false}
      />

      {expanded && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search results"
          // Keeps focus in the input, so blur (which closes the list) doesn't fire before the click.
          onMouseDown={(event) => event.preventDefault()}
          className="absolute inset-x-0 top-[calc(100%+4px)] z-20 max-h-80 overflow-y-auto rounded-2xl border border-border bg-surface p-1 shadow-xl"
        >
          {showEmpty ? (
            <li role="presentation" className="px-3 py-4 text-center text-xs text-muted">
              No matches
            </li>
          ) : (
            results.map(({ item }, index) => (
              <li
                key={item.id}
                id={optionId(listId, index)}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(item)}
                className={cn(
                  'flex cursor-pointer flex-col rounded-xl px-3 py-2',
                  index === active && 'bg-surface-raised',
                )}
              >
                <span className="truncate text-sm text-content/75">
                  <Highlight text={item.name} tokens={tokens} />
                </span>
                <span className="text-[11px] text-muted capitalize">{item.system}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
