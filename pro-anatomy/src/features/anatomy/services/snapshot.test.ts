import { describe, expect, it } from 'vitest'
import { defaultSnapshotName, sanitizeFilename } from './snapshot'

describe('sanitizeFilename', () => {
  it('strips the extension and unsafe characters', () => {
    expect(sanitizeFilename('  my shot .png ', 'x')).toBe('my_shot')
    expect(sanitizeFilename('../../etc/passwd', 'x')).toBe('.._.._etc_passwd')
  })

  it('falls back when nothing usable is left', () => {
    expect(sanitizeFilename('***', 'fallback')).toBe('fallback')
    expect(sanitizeFilename('   ', 'fallback')).toBe('fallback')
  })
})

describe('defaultSnapshotName', () => {
  it('includes the model and a sortable timestamp', () => {
    expect(defaultSnapshotName('male', new Date(2026, 8, 24, 13, 5, 9))).toBe(
      'pro-anatomy-male-2026-09-24-130509',
    )
  })
})
