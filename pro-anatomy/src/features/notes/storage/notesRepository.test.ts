import { beforeEach, describe, expect, it } from 'vitest'
import { createLocalNotesRepository } from './notesRepository'

beforeEach(() => {
  localStorage.clear()
})

describe('createLocalNotesRepository', () => {
  it('starts empty', async () => {
    const repo = createLocalNotesRepository()
    expect(await repo.list()).toEqual([])
  })

  it('creates a note with a title, body, unique id, and timestamps', async () => {
    const repo = createLocalNotesRepository()
    const before = Date.now()
    const note = await repo.create({
      title: 'Heart basics',
      anchor: { kind: 'free' },
      body: 'the heart pumps blood',
    })

    expect(note.id).toMatch(/^note-/)
    expect(note.title).toBe('Heart basics')
    expect(note.body).toBe('the heart pumps blood')
    expect(note.createdAt).toBeGreaterThanOrEqual(before)
    expect(note.updatedAt).toBe(note.createdAt)
    expect(await repo.list()).toEqual([note])
  })

  it('updates and bumps updatedAt, preserving createdAt', async () => {
    const repo = createLocalNotesRepository()
    const created = await repo.create({
      title: 'a',
      anchor: { kind: 'free' },
      body: 'x',
    })
    await new Promise((r) => setTimeout(r, 2))
    const updated = await repo.update(created.id, { title: 'b' })

    expect(updated?.title).toBe('b')
    expect(updated!.updatedAt).toBeGreaterThan(created.updatedAt)
    expect(updated!.createdAt).toBe(created.createdAt)
  })

  it('returns null when updating a missing note', async () => {
    const repo = createLocalNotesRepository()
    expect(await repo.update('nope', { body: 'x' })).toBeNull()
  })

  it('removes a note', async () => {
    const repo = createLocalNotesRepository()
    const note = await repo.create({ title: '', anchor: { kind: 'free' }, body: 'x' })
    await repo.remove(note.id)
    expect(await repo.list()).toEqual([])
  })

  it('persists across repository instances', async () => {
    const a = createLocalNotesRepository()
    await a.create({ title: 'kept', anchor: { kind: 'free' }, body: 'y' })

    const b = createLocalNotesRepository()
    const notes = await b.list()
    expect(notes).toHaveLength(1)
    expect(notes[0].title).toBe('kept')
  })

  it('ignores corrupt storage', async () => {
    localStorage.setItem('pro-anatomy:notes', '{not json')
    const repo = createLocalNotesRepository()
    expect(await repo.list()).toEqual([])
  })

  it('ignores a payload from a different version', async () => {
    localStorage.setItem(
      'pro-anatomy:notes',
      JSON.stringify({ version: 99, notes: [{ id: 'x' }] }),
    )
    const repo = createLocalNotesRepository()
    expect(await repo.list()).toEqual([])
  })

  it('filters out malformed notes within an otherwise valid payload', async () => {
    localStorage.setItem(
      'pro-anatomy:notes',
      JSON.stringify({
        version: 2,
        notes: [
          {
            id: 'a',
            title: 'ok',
            anchor: { kind: 'free' },
            body: 'ok',
            createdAt: 1,
            updatedAt: 1,
          },
          { id: 'b' },
          null,
        ],
      }),
    )
    const repo = createLocalNotesRepository()
    const notes = await repo.list()
    expect(notes).toHaveLength(1)
    expect(notes[0].id).toBe('a')
  })

  it('migrates v1 notes to v2 by adding an empty title', async () => {
    localStorage.setItem(
      'pro-anatomy:notes',
      JSON.stringify({
        version: 1,
        notes: [
          {
            id: 'legacy',
            anchor: { kind: 'free' },
            body: 'written before titles existed',
            createdAt: 1,
            updatedAt: 2,
          },
        ],
      }),
    )
    const repo = createLocalNotesRepository()
    const notes = await repo.list()
    expect(notes).toHaveLength(1)
    expect(notes[0].id).toBe('legacy')
    expect(notes[0].title).toBe('')
    expect(notes[0].body).toBe('written before titles existed')
  })

  it('persists migrated notes at v2 on the next write', async () => {
    localStorage.setItem(
      'pro-anatomy:notes',
      JSON.stringify({
        version: 1,
        notes: [
          { id: 'legacy', anchor: { kind: 'free' }, body: 'old', createdAt: 1, updatedAt: 2 },
        ],
      }),
    )
    const repo = createLocalNotesRepository()
    await repo.create({ title: 'new', anchor: { kind: 'free' }, body: 'fresh' })

    const stored = JSON.parse(localStorage.getItem('pro-anatomy:notes') ?? '{}') as {
      version?: number
    }
    expect(stored.version).toBe(2)
  })
})
