import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('calls onCheckedChange with the next value', async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox checked={false} onCheckedChange={onCheckedChange} aria-label="Heart" />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Heart' }))

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})
