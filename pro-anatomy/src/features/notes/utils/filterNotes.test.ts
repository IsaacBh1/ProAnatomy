import { describe, expect, it } from 'vitest'
import type { Note } from '../types'
import { filterNotes } from './filterNotes'

const note = (over: Partial<Note>): Note => ({
  id: 'n',
  title: '',
  anchor: { kind: 'free' },
  body: '',
  createdAt: 0,
  updatedAt: 0,
  ...over,
})

describe('filterNotes', () => {
  it('returns everything for a blank query', () => {
    const notes = [note({ id: 'a' }), note({ id: 'b' })]
    expect(filterNotes(notes, '')).toEqual(notes)
    expect(filterNotes(notes, '   ')).toEqual(notes)
  })

  it('matches the title', () => {
    const notes = [
      note({ id: 'a', title: 'Blood flow' }),
      note({ id: 'b', title: 'Nerves' }),
    ]
    expect(filterNotes(notes, 'blood').map((n) => n.id)).toEqual(['a'])
  })

  it('matches the body', () => {
    const notes = [
      note({ id: 'a', body: 'the heart pumps' }),
      note({ id: 'b', body: 'lungs breathe' }),
    ]
    expect(filterNotes(notes, 'pumps').map((n) => n.id)).toEqual(['a'])
  })

  it('requires every token to match', () => {
    const notes = [note({ id: 'a', title: 'heart', body: 'beats' })]
    expect(filterNotes(notes, 'heart beats').map((n) => n.id)).toEqual(['a'])
    expect(filterNotes(notes, 'heart lungs')).toHaveLength(0)
  })

  it('matches part names in the anchor', () => {
    const notes = [note({ id: 'a', anchor: { kind: 'parts', ids: ['FJ1'] } })]
    const nameOf = (id: string) => (id === 'FJ1' ? 'Heart' : undefined)
    expect(filterNotes(notes, 'heart', nameOf).map((n) => n.id)).toEqual(['a'])
  })

  it('matches system labels', () => {
    const notes = [note({ id: 'a', anchor: { kind: 'system', id: 'cardiac' } })]
    expect(filterNotes(notes, 'cardiac').map((n) => n.id)).toEqual(['a'])
    expect(filterNotes(notes, 'Cardiac').map((n) => n.id)).toEqual(['a'])
  })

  it('matches the "general" keyword for free notes', () => {
    const notes = [note({ id: 'a', anchor: { kind: 'free' } })]
    expect(filterNotes(notes, 'general').map((n) => n.id)).toEqual(['a'])
  })

  it('is case-insensitive', () => {
    const notes = [note({ id: 'a', title: 'HEART' })]
    expect(filterNotes(notes, 'heart').map((n) => n.id)).toEqual(['a'])
  })

  it('is a no-op when the model has not loaded yet', () => {
    const notes = [note({ id: 'a', anchor: { kind: 'parts', ids: ['FJ1'] }, body: 'note' })]
    expect(filterNotes(notes, 'note', undefined).map((n) => n.id)).toEqual(['a'])
    expect(filterNotes(notes, 'heart', undefined)).toHaveLength(0)
  })
})
