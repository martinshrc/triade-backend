import { BetAccessStatus, Prisma } from '@prisma/client'
import prisma from '../config/database'

// Afiliado solicita acesso a uma casa de aposta
export async function createBetRequest(userId: string, bettingHouseId: string) {
  const house = await prisma.bettingHouse.findUnique({ where: { id: bettingHouseId } })
  if (!house || !house.isActive) throw new Error('Casa de aposta não encontrada.')

  const existing = await prisma.betAccessRequest.findUnique({
    where: { userId_bettingHouseId: { userId, bettingHouseId } },
  })
  if (existing) {
    if (existing.status === 'APPROVED') throw new Error('Você já tem acesso a esta casa de aposta.')
    if (existing.status === 'PENDING') throw new Error('Solicitação já enviada. Aguarde a aprovação.')
    // Se REJECTED, permite reenviar
    return prisma.betAccessRequest.update({
      where: { id: existing.id },
      data: { status: 'PENDING', reviewedById: null, reviewedAt: null, notes: null },
      select: { id: true, status: true, bettingHouse: { select: { name: true } } },
    })
  }

  return prisma.betAccessRequest.create({
    data: { userId, bettingHouseId },
    select: { id: true, status: true, bettingHouse: { select: { name: true } } },
  })
}

// Team admin lista solicitações da sua equipe; super admin vê todas
export async function listBetRequests(
  requesterId: string,
  requesterRole: string,
  status?: string,
  page = 1,
  limit = 20,
) {
  const skip = (page - 1) * limit
  const take = Math.min(50, limit)

  // Monta filtro de usuários que o requester gerencia
  const teamFilter =
    requesterRole === 'SUPER_ADMIN'
      ? {}
      : { user: { referrerId: requesterId } }

  const where: Prisma.BetAccessRequestWhereInput = {
    ...teamFilter,
    ...(status ? { status: status as BetAccessStatus } : {}),
  }

  const [requests, total] = await Promise.all([
    prisma.betAccessRequest.findMany({
      where,
      select: {
        id: true, status: true, createdAt: true, reviewedAt: true, notes: true,
        user: { select: { id: true, name: true, email: true, whatsapp: true } },
        bettingHouse: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.betAccessRequest.count({ where }),
  ])

  // Busca links existentes para os pares usuário+casa retornados
  const userIds = [...new Set(requests.map((r) => r.user.id))]
  const houseIds = [...new Set(requests.map((r) => r.bettingHouse.id))]
  const existingLinks = userIds.length > 0
    ? await prisma.affiliateLink.findMany({
        where: { userId: { in: userIds }, bettingHouseId: { in: houseIds } },
        select: { id: true, userId: true, bettingHouseId: true, refCode: true, fullUrl: true },
      })
    : []

  const linkMap: Record<string, typeof existingLinks[0]> = {}
  existingLinks.forEach((l) => { linkMap[`${l.userId}_${l.bettingHouseId}`] = l })

  const requestsWithLinks = requests.map((r) => ({
    ...r,
    affiliateLink: linkMap[`${r.user.id}_${r.bettingHouse.id}`] ?? null,
  }))

  return { requests: requestsWithLinks, total, page, totalPages: Math.ceil(total / take) }
}

// Team admin aprova ou rejeita; valida que o usuário é da sua equipe
export async function reviewBetRequest(
  requestId: string,
  reviewerId: string,
  reviewerRole: string,
  action: 'APPROVED' | 'REJECTED',
  notes?: string,
) {
  const request = await prisma.betAccessRequest.findUnique({
    where: { id: requestId },
    include: { user: { select: { referrerId: true } } },
  })

  if (!request) throw new Error('Solicitação não encontrada.')
  if (request.status !== 'PENDING') throw new Error('Solicitação já foi processada.')

  // Team admin só pode aprovar afiliados da sua equipe
  if (reviewerRole === 'TEAM_ADMIN' && request.user.referrerId !== reviewerId) {
    throw new Error('Este afiliado não pertence à sua equipe.')
  }

  return prisma.betAccessRequest.update({
    where: { id: requestId },
    data: { status: action, reviewedById: reviewerId, reviewedAt: new Date(), notes: notes ?? null },
    select: { id: true, status: true, notes: true },
  })
}

// Lista todas as BETs com status de acesso do afiliado logado
export async function listBetsWithAccess(userId: string) {
  const [houses, requests] = await Promise.all([
    prisma.bettingHouse.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
    }),
    prisma.betAccessRequest.findMany({
      where: { userId },
      select: { bettingHouseId: true, status: true },
    }),
  ])

  const statusMap = Object.fromEntries(requests.map((r) => [r.bettingHouseId, r.status]))

  return houses.map((h) => ({
    ...h,
    accessStatus: statusMap[h.id] ?? null, // null = ainda não solicitou
  }))
}
