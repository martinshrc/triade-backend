import prisma from '../config/database'

export async function getLinks(userId: string) {
  const links = await prisma.affiliateLink.findMany({
    where: { userId },
    include: { bettingHouse: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return { links, total: links.length, userId }
}

export async function createAffiliateLink(
  adminId: string,
  adminRole: string,
  userId: string,
  bettingHouseId: string,
  refCode: string,
  fullUrl: string,
  dbCode?: string,
) {
  // TEAM_ADMIN só pode inserir link para afiliados da sua própria equipe
  if (adminRole === 'TEAM_ADMIN') {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { referrerId: true },
    })
    if (!target || target.referrerId !== adminId) {
      throw new Error('Este afiliado não pertence à sua equipe.')
    }
  }

  // Se já existe link para esse par usuário+casa, atualiza; senão cria
  const existing = await prisma.affiliateLink.findFirst({
    where: { userId, bettingHouseId },
  })

  if (existing) {
    return prisma.affiliateLink.update({
      where: { id: existing.id },
      data: { refCode, fullUrl, dbCode: dbCode ?? null },
      include: { bettingHouse: { select: { id: true, name: true, slug: true } } },
    })
  }

  return prisma.affiliateLink.create({
    data: { userId, bettingHouseId, refCode, fullUrl, dbCode: dbCode ?? null },
    include: { bettingHouse: { select: { id: true, name: true, slug: true } } },
  })
}
