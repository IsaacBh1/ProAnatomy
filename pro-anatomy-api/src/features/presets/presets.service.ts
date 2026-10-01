import type { Preset } from '@prisma/client'
import { prisma } from '../../shared/db/prisma'
import { notFound } from '../../shared/http/errors'
import type { CreatePresetInput } from './presets.schemas'

export interface PresetDto {
  id: string
  name: string
  partIds: readonly string[]
  createdPartCount: number
  createdAt: number
}

export const toPresetDto = (row: Preset): PresetDto => ({
  id: row.id,
  name: row.name,
  partIds: row.partIds,
  createdPartCount: row.createdPartCount,
  createdAt: row.createdAt.getTime(),
})

export async function listPresets(userId: string): Promise<PresetDto[]> {
  const rows = await prisma.preset.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(toPresetDto)
}

export async function createPreset(
  userId: string,
  input: CreatePresetInput,
): Promise<PresetDto> {
  const row = await prisma.preset.create({
    data: {
      userId,
      name: input.name,
      partIds: input.partIds,
      createdPartCount: input.partIds.length,
    },
  })
  return toPresetDto(row)
}

export async function deletePreset(userId: string, presetId: string): Promise<void> {
  const { count } = await prisma.preset.deleteMany({
    where: { id: presetId, userId },
  })
  if (count === 0) throw notFound('Preset not found.')
}
