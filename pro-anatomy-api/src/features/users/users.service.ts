import type { Prisma } from '@prisma/client'
import { prisma } from '../../shared/db/prisma'
import { notFound } from '../../shared/http/errors'
import type { UpdateProfileInput } from './users.schemas'

const USER_PUBLIC_FIELDS = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export type UserRow = Prisma.UserGetPayload<{ select: typeof USER_PUBLIC_FIELDS }>

export interface UserDto {
  id: string
  name: string
  email: string
  createdAt: number
}

export const toUserDto = (row: UserRow): UserDto => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.createdAt.getTime(),
})

export async function findUserById(id: string): Promise<UserRow | null> {
  return prisma.user.findUnique({ where: { id }, select: USER_PUBLIC_FIELDS })
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<UserRow> {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: input,
      select: USER_PUBLIC_FIELDS,
    })
  } catch {
    throw notFound('Account not found.')
  }
}
