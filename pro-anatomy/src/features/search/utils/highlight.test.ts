import { describe, expect, it } from 'vitest'
import { splitByMatch } from './highlight'

describe('splitByMatch', () => {
  it('flags the matching run', () => {
    expect(splitByMatch('Left lung', ['lu'])).toEqual([
      { text: 'Left ', match: false },
      { text: 'lu', match: true },
      { text: 'ng', match: false },
    ])
  })

  it('merges overlapping tokens into one contiguous run', () => {
    // 'hea' covers 0–2, 'ear' covers 1–3, so the union is 0–3 and stops before the final 't'.
    expect(splitByMatch('heart', ['hea', 'ear'])).toEqual([
      { text: 'hear', match: true },
      { text: 't', match: false },
    ])
  })

  it('returns one plain segment when nothing matches', () => {
    expect(splitByMatch('Liver', ['xyz'])).toEqual([{ text: 'Liver', match: false }])
  })

  it('returns nothing for empty text', () => {
    expect(splitByMatch('', ['a'])).toEqual([])
  })
})
