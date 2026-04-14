import prisma from '../config/database'

export async function getTeam(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where: { referrerId: userId },
      select: {
        id: true, name: true, email: true, externalId: true,
        cpaValue: true, status: true, createdAt: true,
        affiliateLinks: {
          select: { fullUrl: true, bettingHouse: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.user.count({ where: { referrerId: userId } }),
  ])

  const upline = await prisma.user.findUnique({
    where: { id: userId },
    select: { cpaValue: true },
  })

  return {
    members,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    maxCpa: upline?.cpaValue ?? 0,
  }
}

export async function updateMemberCpa(uplineId: string, memberId: string, newCpa: number) {
  const member = await prisma.user.findFirst({
    where: { id: memberId, referrerId: uplineId },
  })
  if (!member) throw new Error('Membro não encontrado ou não é seu indicado direto.')

  const upline = await prisma.user.findUnique({
    where: { id: uplineId },
    select: { cpaValue: true },
  })
  if (upline && newCpa > Number(upline.cpaValue)) {
    throw new Error(
      `O CPA do indicado (R$ ${newCpa}) não pode ser maior que o seu CPA (R$ ${upline.cpaValue}).`
    )
  }

  return prisma.user.update({
    where: { id: memberId },
    data: { cpaValue: newCpa },
    select: { id: true, name: true, cpaValue: true },
  })
}
