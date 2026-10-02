import { List, Stack } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, Pill, Tooltip } from '@/components/ui'
import { PageContainer, ThemeToggle } from '@/components/layout'
import { useIsDesktop } from '@/hooks/useMediaQuery'
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
  useDrawingStore,
} from '@/features/drawing'
import { STYLE_TOOLS } from '@/features/drawing/constants'
import { NoteEditor } from '@/features/notes'
import { useNotesUiStore } from '@/features/notes/store/notesUiStore'
import { useAnatomyStore } from '@/store/anatomyStore'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

export default function AnatomyPage() {
  const isDesktop = useIsDesktop()

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
  useViewerShortcuts() // single unified hook; covers explore *and* draw

  return (
    <PageContainer>
      <AnatomySidebar />

      <div className="relative flex-1 overflow-hidden">
        <AnatomyViewer />
        <DrawingCanvas />

        {/*
          Header. Three columns on desktop (left cluster · toolbar · right cluster).
          Two rows on mobile: (sidebar toggle + right cluster) then (scrollable toolbar).
          The toolbar strip gets `overflow-x-auto` because 9–20 buttons will never
          fit a phone; a swipeable strip is how mobile 3D apps solve this.
        */}
        <header
          className={cn(
            'pointer-events-none absolute inset-x-0 top-[30px] z-30 px-4 md:px-6',
            'flex flex-col gap-3',
            'md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-6',
          )}
        >
          {/* Left cluster (row 1 on mobile, col 1 on desktop) */}
          <div className="flex items-center justify-between gap-2 md:justify-self-start">
            <Pill>
              <Button icon={List} aria-label="Toggle sidebar" onClick={toggleSidebar} />
            </Pill>

            {/* Right cluster sits inline on mobile; a dedicated third column on desktop. */}
            <div className="flex items-center gap-2 md:hidden">
              <ViewerModeToggle />
              <SexToggle value={sex} onChange={setSex} />
              <Pill>
                <ThemeToggle />
              </Pill>
            </div>
          </div>

          {/* Toolbar (row 2 on mobile, col 2 on desktop) */}
          <div className="pointer-events-auto flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-hidden md:justify-self-center">
            {isDrawing ? (
              <>
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
              </>
            ) : (
              <ViewerToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onCommand={run}
                commandState={commandState}
              />
            )}
          </div>

          {/* Desktop-only right cluster (col 3) */}
          <div className="hidden items-center gap-3 md:flex md:justify-self-end">
            <ViewerModeToggle />
            <SexToggle value={sex} onChange={setSex} />
            <Pill>
              <ThemeToggle />
            </Pill>
          </div>
        </header>

        {showStylePanel && (
          <div className="pointer-events-none absolute inset-x-0 top-[130px] z-10 flex justify-center md:top-[86px]">
            <StylePanel />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-[130px] z-10 flex justify-center md:top-[86px]">
          <PresetDraftBar />
        </div>

        {isDrawing && layersOpen && (
          <div className="absolute top-[150px] right-4 z-20 md:right-6">
            <LayersPanel />
          </div>
        )}

        {/*
          ViewBar is a tall vertical strip — it eats the canvas on a phone and
          overlaps the notes sheet. Mobile gets the same controls inside the
          sidebar; desktop keeps the floating strip.
        */}
        {isDesktop && (
          <div
            className={cn(
              'absolute top-1/2 z-10 -translate-y-1/2 transition-[right] duration-200',
              notesOpen ? 'right-[360px]' : 'right-6',
            )}
          >
            <ViewBar />
          </div>
        )}

        <NoteEditor />

        <footer className="pointer-events-none absolute inset-x-0 bottom-[30px] z-10 flex justify-center px-4">
          <ExplodeControl value={explode} onChange={setExplode} />
        </footer>
      </div>
    </PageContainer>
  )
}
