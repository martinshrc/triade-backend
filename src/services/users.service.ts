import { Role } from '@prisma/client'
import prisma from '../config/database'

const MAX_LIMIT = 50

export async function listUsers(page = 1, limit = 20, role?: string, status?: string) {
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (role) where.role = role
  if (status) where.status = status

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true, status: true,
        cpaValue: true, whatsapp: true, createdAt: true,
        referrer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Math.min(limit, MAX_LIMIT),
    }),
    prisma.user.count({ where }),
  ])

  return { users, total, page, totalPages: Math.ceil(total / Math.min(limit, MAX_LIMIT)) }
}

export async function updateUserRole(targetId: string, role: string) {
  const VALID_ROLES = ['SUPER_ADMIN', 'TEAM_ADMIN', 'AFFILIATE']
  if (!VALID_ROLES.includes(role)) throw new Error('Role inválido.')

  return prisma.user.update({
    where: { id: targetId },
    data: { role: role as Role },
    select: { id: true, name: true, email: true, role: true },
  })
}

export async function updateUserTeam(targetId: string, newReferrerId: string | null) {
  // Garante que o novo referrer existe e é TEAM_ADMIN ou SUPER_ADMIN
  if (newReferrerId) {
    const referrer = await prisma.user.findUnique({
      where: { id: newReferrerId },
      select: { role: true },
    })
    if (!referrer) throw new Error('Usuário de destino não encontrado.')
    if (!['TEAM_ADMIN', 'SUPER_ADMIN'].includes(referrer.role)) {
      throw new Error('O destino deve ser um Team Admin ou Super Admin.')
    }
  }

  return prisma.user.update({
    where: { id: targetId },
    data: { referrerId: newReferrerId },
    select: { id: true, name: true, referrerId: true },
  })
}
