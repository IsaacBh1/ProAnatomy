import { useMemo } from 'react'
import { Heartbeat, Plus, ProjectorScreen, Tag } from '@phosphor-icons/react'
import { Button, CheckboxRow, Chip, Divider } from '@/components/ui'
import { BrandLogo, Sidebar, SidebarSection } from '@/components/layout'
import { SystemList } from '@/features/body-systems/components/SystemList'
import { SYSTEM_DEFINITIONS } from '@/features/body-systems/constants/systemDefinitions'
import { NotesPanel } from '@/features/notes'
import { PartSearch } from '@/features/search'
import { useAnatomyStore } from '@/store/anatomyStore'
import { useUiStore } from '@/store/uiStore'
import { useAnatomyModel, useSystemCounts } from '../hooks/useAnatomyModel'
import { usePresets } from '../hooks/usePresets'
import { revealPart, toggleSystemVisibility } from '../services/viewCommands'
import { usePresetDraftStore } from '../store/presetDraftStore'
import type { AnatomyPart } from '../types/model'
import { PresetList } from './PresetList'

const NO_PARTS: readonly AnatomyPart[] = []

export function AnatomySidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)

  const sex = useAnatomyStore((s) => s.sex)
  const showLabels = useAnatomyStore((s) => s.showLabels)
  const toggleLabels = useAnatomyStore((s) => s.toggleLabels)
  const visibleSystems = useAnatomyStore((s) => s.visibleSystems)
  const setAllSystems = useAnatomyStore((s) => s.setAllSystems)

  const { data: model } = useAnatomyModel(sex)
  const { data: counts } = useSystemCounts(sex)
  const systems = useMemo(
    () => (counts ? SYSTEM_DEFINITIONS.filter(({ id }) => counts[id]) : []),
    [counts],
  )

  const presets = usePresets()
  const startPresetCollection = usePresetDraftStore((s) => s.startCollecting)
  const parts = model?.parts ?? NO_PARTS

  return (
    <Sidebar open={sidebarOpen}>
      <BrandLogo />

      {/* Search knows nothing about 3D: parts in, one chosen part out. */}
      <PartSearch items={parts} onSelect={(part) => revealPart(part.id, part.system)} />

      <Divider />

      <CheckboxRow
        emphasized
        label="Show organ labels"
        checked={showLabels}
        onCheckedChange={toggleLabels}
        leading={<Tag size={18} aria-hidden />}
      />

      <Divider />

      <SidebarSection
        icon={Heartbeat}
        title="Systems"
        actions={
          <>
            <Chip onClick={() => setAllSystems(true)}>All</Chip>
            <Chip onClick={() => setAllSystems(false)}>None</Chip>
          </>
        }
      >
        {/* Clicking a single system also frames the camera on it. All/None do not. */}
        <SystemList
          systems={systems}
          visibility={visibleSystems}
          counts={counts}
          onToggle={(id) => toggleSystemVisibility(id, parts)}
        />
      </SidebarSection>

      <Divider />

      <SidebarSection
        icon={ProjectorScreen}
        title="Presets"
        actions={
          <Button
            icon={Plus}
            aria-label="Create preset"
            title="Save selected organs as a preset (P)"
            onClick={startPresetCollection}
            className="size-6"
          />
        }
      >
        <PresetList
          items={presets.available}
          activeIds={presets.activeIds}
          customIds={presets.customIds}
          onToggle={presets.toggle}
          onRemove={presets.remove}
        />
      </SidebarSection>

      <Divider />

      <NotesPanel />
    </Sidebar>
  )
}
