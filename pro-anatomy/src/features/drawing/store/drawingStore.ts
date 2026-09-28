// src/features/drawing/store/drawingStore.ts
import { create } from 'zustand'
import { DEFAULT_FONT_SIZE, DEFAULT_STYLE } from '../constants'
import type {
  DrawElement,
  DrawingSnapshot,
  ElementId,
  ElementStyle,
  SurfaceStroke,
  TextElement,
  ToolId,
  Vec3,
} from '../types'
import { translateElement } from '../utils/geometry'

const MAX_HISTORY = 100
const NO_IDS: ReadonlySet<string> = new Set()

interface DrawingState {
  elements: readonly DrawElement[]
  surfaceStrokes: readonly SurfaceStroke[]
  activeSurface: SurfaceStroke | null

  selectedIds: ReadonlySet<ElementId>
  tool: ToolId
  style: ElementStyle
  fontSize: number
  draft: DrawElement | null
  editingTextId: ElementId | null

  past: readonly DrawingSnapshot[]
  future: readonly DrawingSnapshot[]

  setTool: (tool: ToolId) => void
  setStyle: (patch: Partial<ElementStyle>) => void
  setFontSize: (size: number) => void

  setDraft: (draft: DrawElement | null) => void
  commitDraft: () => void

  beginTextEdit: (id: ElementId) => void
  commitTextEdit: (text: string) => void
  cancelTextEdit: () => void

  beginSurfaceStroke: (init: Omit<SurfaceStroke, 'id' | 'createdAt'>) => void
  appendSurfacePoint: (point: Vec3) => void
  commitSurfaceStroke: () => void
  cancelSurfaceStroke: () => void

  selectElement: (id: ElementId, additive?: boolean) => void
  selectAll: () => void
  clearSelection: () => void

  snapshot: () => void
  applyTransient: (updater: (elements: readonly DrawElement[]) => DrawElement[]) => void
  applySurfaceTransient: (
    updater: (strokes: readonly SurfaceStroke[]) => readonly SurfaceStroke[],
  ) => void
  /** Nudges every selected element/ stroke by (dx, dy, dz) in one shot. */
  translateSelection: (dx: number, dy: number, dz?: number) => void
  replaceElements: (elements: readonly DrawElement[]) => void

  addElement: (element: DrawElement) => void
  updateElement: (id: ElementId, patch: Partial<DrawElement>) => void
  deleteElements: (ids: readonly ElementId[]) => void
  duplicateSelected: () => void

  bringForward: (ids: readonly ElementId[]) => void
  sendBackward: (ids: readonly ElementId[]) => void
  bringToFront: (ids: readonly ElementId[]) => void
  sendToBack: (ids: readonly ElementId[]) => void

  undo: () => void
  redo: () => void
  clear: () => void
}

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

const trim = <T,>(arr: readonly T[]) => (arr.length > MAX_HISTORY ? arr.slice(-MAX_HISTORY) : arr)

export const createId = (type: DrawElement['type']) => newId(type)
export const createSurfaceId = () => newId('surface')

const snapshotOf = (s: Pick<DrawingState, 'elements' | 'surfaceStrokes'>): DrawingSnapshot => ({
  elements: s.elements,
  surfaceStrokes: s.surfaceStrokes,
})

export const useDrawingStore = create<DrawingState>()((set) => ({
  elements: [],
  surfaceStrokes: [],
  activeSurface: null,

  selectedIds: NO_IDS,
  tool: 'orbit',
  style: DEFAULT_STYLE,
  fontSize: DEFAULT_FONT_SIZE,
  draft: null,
  editingTextId: null,
  past: [],
  future: [],

  // Tool switch aborts every in-flight gesture and drops the drawn selection —
  // the selection belongs to the tool that made it.
  setTool: (tool) =>
    set({
      tool,
      draft: null,
      activeSurface: null,
      editingTextId: null,
      selectedIds: NO_IDS,
    }),
  setStyle: (patch) => set((s) => ({ style: { ...s.style, ...patch } })),
  setFontSize: (fontSize) => set({ fontSize }),

  setDraft: (draft) => set({ draft }),
  commitDraft: () =>
    set((s) => {
      if (!s.draft) return s
      return {
        elements: [...s.elements, s.draft],
        draft: null,
        past: trim([...s.past, snapshotOf(s)]),
        future: [],
      }
    }),

  beginTextEdit: (id) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === id)
      if (!el || el.type !== 'text') return s
      return { editingTextId: id, draft: null, selectedIds: new Set([id]) }
    }),

  commitTextEdit: (text) =>
    set((s) => {
      const id = s.editingTextId
      if (!id) return s
      const trimmed = text.trim()
      if (trimmed.length === 0) {
        return {
          editingTextId: null,
          elements: s.elements.filter((el) => el.id !== id),
          selectedIds: NO_IDS,
          past: trim([...s.past, snapshotOf(s)]),
          future: [],
        }
      }
      return {
        editingTextId: null,
        elements: s.elements.map((el) =>
          el.id === id && el.type === 'text' ? ({ ...el, text: trimmed } as TextElement) : el,
        ),
        past: trim([...s.past, snapshotOf(s)]),
        future: [],
      }
    }),

  cancelTextEdit: () => set({ editingTextId: null }),

  beginSurfaceStroke: (init) =>
    set({ activeSurface: { ...init, id: createSurfaceId(), createdAt: Date.now() } }),
  appendSurfacePoint: (point) =>
    set((s) =>
      s.activeSurface
        ? { activeSurface: { ...s.activeSurface, points: [...s.activeSurface.points, point] } }
        : s,
    ),
  commitSurfaceStroke: () =>
    set((s) => {
      if (!s.activeSurface || s.activeSurface.points.length < 2) return { activeSurface: null }
      return {
        surfaceStrokes: [...s.surfaceStrokes, s.activeSurface],
        activeSurface: null,
        past: trim([...s.past, snapshotOf(s)]),
        future: [],
      }
    }),
  cancelSurfaceStroke: () => set({ activeSurface: null }),

  selectElement: (id, additive = false) =>
    set((s) => {
      if (!additive) return { selectedIds: new Set([id]) }
      const next = new Set(s.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedIds: next.size > 0 ? next : NO_IDS }
    }),

  selectAll: () =>
    set((s) => ({
      // Both arrays: their ids share a namespace, and both are visible in their
      // respective space. Ctrl+A is a "select everything I can edit right now"
      // gesture, and the user can only be in one space at a time.
      selectedIds: new Set([
        ...s.elements.map((el) => el.id),
        ...s.surfaceStrokes.map((st) => st.id),
      ]),
    })),
  clearSelection: () => set((s) => (s.selectedIds.size === 0 ? s : { selectedIds: NO_IDS })),

  snapshot: () => set((s) => ({ past: trim([...s.past, snapshotOf(s)]), future: [] })),
  applyTransient: (updater) => set((s) => ({ elements: updater(s.elements) })),
  applySurfaceTransient: (updater) => set((s) => ({ surfaceStrokes: updater(s.surfaceStrokes) })),

  translateSelection: (dx, dy, dz = 0) =>
    set((s) => {
      if (s.selectedIds.size === 0) return s
      return {
        elements: s.elements.map((el) =>
          s.selectedIds.has(el.id) ? translateElement(el, dx, dy) : el,
        ),
        surfaceStrokes: s.surfaceStrokes.map((st) =>
          s.selectedIds.has(st.id)
            ? {
                ...st,
                points: st.points.map(([x, y, z]): Vec3 => [x + dx, y + dy, z + dz]),
              }
            : st,
        ),
      }
    }),

  replaceElements: (elements) =>
    set((s) => ({ elements, past: trim([...s.past, snapshotOf(s)]), future: [] })),

  addElement: (element) =>
    set((s) => ({
      elements: [...s.elements, element],
      past: trim([...s.past, snapshotOf(s)]),
      future: [],
    })),

  updateElement: (id, patch) =>
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? ({ ...el, ...patch } as DrawElement) : el)),
      past: trim([...s.past, snapshotOf(s)]),
      future: [],
    })),

  deleteElements: (ids) => {
    const set_ = new Set(ids)
    if (set_.size === 0) return
    set((s) => ({
      elements: s.elements.filter((el) => !set_.has(el.id)),
      surfaceStrokes: s.surfaceStrokes.filter((st) => !set_.has(st.id)),
      selectedIds: NO_IDS,
      editingTextId: s.editingTextId && set_.has(s.editingTextId) ? null : s.editingTextId,
      past: trim([...s.past, snapshotOf(s)]),
      future: [],
    }))
  },

  duplicateSelected: () =>
    set((s) => {
      if (s.selectedIds.size === 0) return s
      const offset = 16
      const clones = s.elements
        .filter((el) => s.selectedIds.has(el.id))
        .map((el) => {
          const moved = translateElement(el, offset, offset)
          return { ...moved, id: createId(el.type), createdAt: Date.now() }
        })
      return {
        elements: [...s.elements, ...clones],
        selectedIds: new Set(clones.map((c) => c.id)),
        past: trim([...s.past, snapshotOf(s)]),
        future: [],
      }
    }),

  bringForward: (ids) =>
    set((s) => {
      const set_ = new Set(ids)
      const next = [...s.elements]
      for (let i = next.length - 2; i >= 0; i--) {
        if (set_.has(next[i].id) && !set_.has(next[i + 1].id)) {
          ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
        }
      }
      return { elements: next, past: trim([...s.past, snapshotOf(s)]), future: [] }
    }),

  sendBackward: (ids) =>
    set((s) => {
      const set_ = new Set(ids)
      const next = [...s.elements]
      for (let i = 1; i < next.length; i++) {
        if (set_.has(next[i].id) && !set_.has(next[i - 1].id)) {
          ;[next[i], next[i - 1]] = [next[i - 1], next[i]]
        }
      }
      return { elements: next, past: trim([...s.past, snapshotOf(s)]), future: [] }
    }),

  bringToFront: (ids) =>
    set((s) => {
      const set_ = new Set(ids)
      const rest = s.elements.filter((el) => !set_.has(el.id))
      const moved = s.elements.filter((el) => set_.has(el.id))
      return { elements: [...rest, ...moved], past: trim([...s.past, snapshotOf(s)]), future: [] }
    }),

  sendToBack: (ids) =>
    set((s) => {
      const set_ = new Set(ids)
      const rest = s.elements.filter((el) => !set_.has(el.id))
      const moved = s.elements.filter((el) => set_.has(el.id))
      return { elements: [...moved, ...rest], past: trim([...s.past, snapshotOf(s)]), future: [] }
    }),

  undo: () =>
    set((s) => {
      const prev = s.past.at(-1)
      if (!prev) return s
      return {
        past: s.past.slice(0, -1),
        future: trim([snapshotOf(s), ...s.future]),
        elements: prev.elements,
        surfaceStrokes: prev.surfaceStrokes,
        selectedIds: NO_IDS,
        editingTextId: null,
      }
    }),

  redo: () =>
    set((s) => {
      const next = s.future[0]
      if (!next) return s
      return {
        past: trim([...s.past, snapshotOf(s)]),
        future: s.future.slice(1),
        elements: next.elements,
        surfaceStrokes: next.surfaceStrokes,
        selectedIds: NO_IDS,
        editingTextId: null,
      }
    }),

  clear: () =>
    set((s) => ({
      elements: [],
      surfaceStrokes: [],
      selectedIds: NO_IDS,
      draft: null,
      activeSurface: null,
      editingTextId: null,
      past: trim([...s.past, snapshotOf(s)]),
      future: [],
    })),
}))
