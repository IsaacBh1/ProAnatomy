import { describe, expect, it } from 'vitest'
import { deriveSystem } from './deriveSystem'

describe('deriveSystem', () => {
  it.each([
    ['Skin', 'integumentary'],
    ['Brain', 'nervous'],
    ['Heart', 'cardiac'],
    ['Left Lung', 'respiratory'],
    ['Left Kidney', 'urinary'],
    ['Pancreas', 'digestive'],
    ['Femur', 'skeletal'],
    ['Unknown blob', 'other'],
  ])('%s -> %s', (name, expected) => {
    expect(deriveSystem(name)).toBe(expected)
  })
})
