import { describe, expect, it } from 'vitest'
import {
  normalizeEmail,
  validateConfirm,
  validateEmail,
  validateName,
  validatePassword,
} from './validation'

describe('validateName', () => {
  it('accepts a normal name', () => expect(validateName('Ada Lovelace')).toBeNull())
  it('rejects an empty value', () => expect(validateName('   ')).toMatch(/required|enter/i))
  it('rejects an overlong value', () => expect(validateName('a'.repeat(61))).toMatch(/60/))
})

describe('validateEmail', () => {
  it('accepts a plain address', () => expect(validateEmail('ada@example.com')).toBeNull())
  it('accepts subdomains and plus tags', () =>
    expect(validateEmail('ada+anatomy@mail.example.co.uk')).toBeNull())
  it('rejects a missing @', () => expect(validateEmail('ada.example.com')).not.toBeNull())
  it('rejects a missing TLD', () => expect(validateEmail('ada@example')).not.toBeNull())
  it('rejects whitespace', () => expect(validateEmail('ada @example.com')).not.toBeNull())
})

describe('validatePassword', () => {
  it('accepts anything long enough', () => expect(validatePassword('correct horse')).toBeNull())
  it('rejects a short password', () => expect(validatePassword('short')).toMatch(/8/))
})

describe('validateConfirm', () => {
  it('accepts a match', () => expect(validateConfirm('hunter22', 'hunter22')).toBeNull())
  it('rejects a mismatch', () =>
    expect(validateConfirm('hunter22', 'hunter23')).toMatch(/match/i))
})

describe('normalizeEmail', () => {
  it('trims and lowercases', () => expect(normalizeEmail('  Ada@Example.COM ')).toBe('ada@example.com'))
})
