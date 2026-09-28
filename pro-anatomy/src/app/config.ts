const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const config = {
  modelsBaseUrl: trimTrailingSlash(import.meta.env.VITE_MODELS_BASE_URL ?? '/models'),
  dracoDecoderPath: `${import.meta.env.BASE_URL}draco/`,
} as const
