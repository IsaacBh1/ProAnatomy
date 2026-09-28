import type { OrganPreset } from '../types'

export const ORGAN_PRESETS: readonly OrganPreset[] = [
  { id: 'heart', label: 'Heart', matchNames: ['heart'] },
  { id: 'brain', label: 'Brain', matchNames: ['brain'] },
  { id: 'left-lung', label: 'Left lung', matchNames: ['left lung'] },
  { id: 'right-lung', label: 'Right lung', matchNames: ['right lung'] },
  { id: 'liver', label: 'Liver', matchNames: ['liver'] },
  { id: 'stomach', label: 'Stomach', matchNames: ['stomach'] },
  { id: 'pancreas', label: 'Pancreas', matchNames: ['pancreas'] },
  { id: 'spleen', label: 'Spleen', matchNames: ['spleen'] },
  { id: 'left-kidney', label: 'Left kidney', matchNames: ['left kidney'] },
  { id: 'right-kidney', label: 'Right kidney', matchNames: ['right kidney'] },
  { id: 'bladder', label: 'Bladder', matchNames: ['urinary bladder', 'bladder'] },
  { id: 'esophagus', label: 'Esophagus', matchNames: ['esophagus'] },
  { id: 'trachea', label: 'Trachea', matchNames: ['trachea'] },
  { id: 'larynx', label: 'Larynx', matchNames: ['larynx'] },
  { id: 'thyroid', label: 'Thyroid', matchNames: ['thyroid'] },
  { id: 'spinal-cord', label: 'Spinal cord', matchNames: ['spinal cord'] },
]
