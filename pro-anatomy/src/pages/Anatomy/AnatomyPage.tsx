// src/pages/Anatomy/AnatomyPage.tsx
import { List, Stack } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, Pill, Tooltip } from '@/components/ui'
import { PageContainer, ThemeToggle } from '@/components/layout'
import { AnatomySidebar } from '@/features/anatomy/components/AnatomySidebar'
import { AnatomyViewer } from '@/features/anatomy/components/AnatomyViewer'
import { ExplodeControl } from '@/features/anatomy/components/ExplodeControl'
import { PresetDraftBar } from '@/features/anatomy/components/PresetDraftBar'
import { SexToggle } from '@/features/anatomy/components/SexToggle'
import { ViewBar } from '@/features/anatomy/components/ViewBar'
import { ViewerToolbar } from '@/features/anatomy/components/ViewerToolbar'
import { useViewerCommands } from '@/features/anatomy/hooks/useViewerCommands'
import { useViewerShortcuts } from '@/features/anatomy/hooks/useViewerShortcuts'
import {
  DrawingCanvas,
  DrawingToolbar,
  LayersPanel,
  StylePanel,
  ViewerModeToggle,
  useDrawingShortcuts,
  useDrawingStore,
} from '@/features/drawing'
import { STYLE_TOOLS } from '@/features/drawing/constants'
import { NoteEditor } from '@/features/notes'
import { useNotesUiStore } from '@/features/notes/store/notesUiStore'
import { useAnatomyStore } from '@/store/anatomyStore'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

export default function AnatomyPage() {
  const sex = useAnatomyStore((s) => s.sex)
  const setSex = useAnatomyStore((s) => s.setSex)
  const explode = useAnatomyStore((s) => s.explode)
  const setExplode = useAnatomyStore((s) => s.setExplode)

  const activeTool = useUiStore((s) => s.activeTool)
  const setActiveTool = useUiStore((s) => s.setActiveTool)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const viewerMode = useUiStore((s) => s.viewerMode)

  const drawTool = useDrawingStore((s) => s.tool)
  const isDrawing = viewerMode === 'draw'
  const showStylePanel = isDrawing && STYLE_TOOLS.has(drawTool)

  const notesOpen = useNotesUiStore((s) => s.target !== null)
  const [layersOpen, setLayersOpen] = useState(false)

  const { run, commandState } = useViewerCommands()
  useViewerShortcuts()
  useDrawingShortcuts()

  return (
    <PageContainer>
      <AnatomySidebar />

      <div className="relative flex-1">
        <AnatomyViewer />
        <DrawingCanvas />

        <header className="pointer-events-none absolute inset-x-0 top-[30px] z-30 grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6">
          <div className="justify-self-start">
            <Pill>
              <Button icon={List} aria-label="Toggle sidebar" onClick={toggleSidebar} />
            </Pill>
          </div>

          {isDrawing ? (
            <div className="flex items-center gap-2">
              <DrawingToolbar />
              <Tooltip label="Layers" side="bottom">
                <Pill>
                  <Button
                    icon={Stack}
                    aria-label="Toggle layers panel"
                    aria-pressed={layersOpen}
                    active={layersOpen}
                    onClick={() => setLayersOpen((o) => !o)}
                  />
                </Pill>
              </Tooltip>
            </div>
          ) : (
            <ViewerToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onCommand={run}
              commandState={commandState}
            />
          )}

          <div className="flex items-center gap-3 justify-self-end">
            <ViewerModeToggle />
            <SexToggle value={sex} onChange={setSex} />
            <Pill>
              <ThemeToggle />
            </Pill>
          </div>
        </header>

        {showStylePanel && (
          <div className="pointer-events-none absolute inset-x-0 top-[86px] z-10 flex justify-center">
            <StylePanel />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-[86px] z-10 flex justify-center">
          <PresetDraftBar />
        </div>

        {isDrawing && layersOpen && (
          <div className="absolute top-[150px] right-6 z-20">
            <LayersPanel />
          </div>
        )}

        <div
          className={cn(
            'absolute top-1/2 z-10 -translate-y-1/2 transition-[right] duration-200',
            notesOpen ? 'right-[360px]' : 'right-6',
          )}
        >
          <ViewBar />
        </div>

        <NoteEditor />

        <footer className="pointer-events-none absolute inset-x-0 bottom-[30px] z-10 flex justify-center">
          <ExplodeControl value={explode} onChange={setExplode} />
        </footer>
      </div>
    </PageContainer>
  )
}
