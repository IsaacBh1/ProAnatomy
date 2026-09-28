export type Sex = 'male' | 'female'

export const SYSTEM_IDS = [
  'skeletal',
  'muscular',
  'nervous',
  'cardiac',
  'arterial',
  'venous',
  'respiratory',
  'digestive',
  'urinary',
  'reproductive',
  'lymphatic',
  'endocrine',
  'sensory',
  'connective',
  'integumentary',
  'other',
] as const

export type SystemId = (typeof SYSTEM_IDS)[number]

export type ToolId = 'select' | 'pan' | 'orbit' | 'zoom'
export type ViewerCommandId = 'back' | 'isolate' | 'hide' | 'restore' | 'snapshot'
