const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const config = {
  /**
   * Absolute URL of the API. Cross-origin on purpose: production will serve the
   * API from its own host too, and this keeps dev honest about CORS + cookies.
   * Must match one of the backend's CORS_ORIGINS.
   */
  apiBaseUrl: trimTrailingSlash(
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
  ),
  modelsBaseUrl: trimTrailingSlash(import.meta.env.VITE_MODELS_BASE_URL ?? '/models'),
  dracoDecoderPath: `${import.meta.env.BASE_URL}draco/`,
} as const
