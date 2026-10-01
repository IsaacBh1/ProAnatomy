// src/features/drawing/hooks/useDrawingShortcuts.ts
/**
 * @deprecated Superseded by the unified shortcut registry in
 * `@/features/anatomy/hooks/useViewerShortcuts`. That hook owns *every* viewer
 * shortcut, in both explore and draw modes; this one intentionally does nothing
 * so we never end up with two competing global listeners racing on propagation.
 *
 * Delete this file when you're ready — nothing imports it.
 */
export function useDrawingShortcuts(): void {}
