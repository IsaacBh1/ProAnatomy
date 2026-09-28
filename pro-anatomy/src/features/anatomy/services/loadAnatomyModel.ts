import { config } from '@/app/config'
import type { Sex } from '@/types/anatomy'
import type { AnatomyModel, AnatomyModelSource, LoadOptions } from '../types/model'
import { normalizeOrientation } from '../utils/normalizeOrientation'
import { createBodyParts3DSource } from './bodyparts3d/BodyParts3DSource'
import { createHraGlbSource } from './hra/HraGlbSource'

/** Adding a new model = one new entry here. Nothing else in the app changes. */
const MODEL_SOURCES: Record<Sex, AnatomyModelSource> = {
  male: createBodyParts3DSource({ baseUrl: `${config.modelsBaseUrl}/male` }),
  female: createHraGlbSource({
    url: `${config.modelsBaseUrl}/female/3d-vh-f-united.glb`,
    dracoDecoderPath: config.dracoDecoderPath,
  }),
}

export async function loadAnatomyModel(sex: Sex, options?: LoadOptions): Promise<AnatomyModel> {
  const model = await MODEL_SOURCES[sex].load(options)
  normalizeOrientation(model.parts)
  return model
}
