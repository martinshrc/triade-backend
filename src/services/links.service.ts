import prisma from '../config/database'

export async function getLinks(userId: string) {
  const links = await prisma.affiliateLink.findMany({
    where: { userId },
    include: { bettingHouse: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return { links, total: links.length, userId }
}
