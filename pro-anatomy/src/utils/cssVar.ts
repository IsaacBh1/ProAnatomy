/** Reads a CSS custom property, so canvas code can reuse the design tokens. */
export function readCssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}
