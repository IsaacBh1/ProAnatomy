import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SearchableItem } from '../types'
import { PartSearch } from './PartSearch'

const items: SearchableItem[] = [
  { id: 'FJ1', name: 'Heart', system: 'cardiac' },
  { id: 'FJ2', name: 'Heart valve', system: 'cardiac' },
  { id: 'FJ3', name: 'Left lung', system: 'respiratory' },
]

function setup() {
  const onSelect = vi.fn()
  render(<PartSearch items={items} onSelect={onSelect} />)
  return { onSelect, user: userEvent.setup(), input: screen.getByRole('combobox') }
}

describe('PartSearch', () => {
  it('selects the top result with Enter and clears the field', async () => {
    const { onSelect, user, input } = setup()

    await user.type(input, 'heart')
    expect(await screen.findAllByRole('option')).toHaveLength(2)

    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(items[0])
    expect(input).toHaveValue('')
  })

  it('moves through results with the arrow keys', async () => {
    const { onSelect, user, input } = setup()

    await user.type(input, 'heart')
    await screen.findAllByRole('option')
    await user.keyboard('{ArrowDown}{Enter}')

    expect(onSelect).toHaveBeenCalledWith(items[1])
  })

  it('selects by clicking a result', async () => {
    const { onSelect, user, input } = setup()

    await user.type(input, 'lung')
    await user.click(await screen.findByRole('option'))

    expect(onSelect).toHaveBeenCalledWith(items[2])
  })

  it('closes the list with Escape', async () => {
    const { user, input } = setup()

    await user.type(input, 'heart')
    await screen.findByRole('listbox')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('says so when nothing matches', async () => {
    const { user, input } = setup()

    await user.type(input, 'zzz')

    expect(await screen.findByText('No matches')).toBeInTheDocument()
  })
})
