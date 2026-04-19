import prisma from '../config/database'

export async function getMateriais(bettingHouseId?: string, search?: string) {
  const where = {
    isActive: true,
    ...(bettingHouseId ? { bettingHouseId } : {}),
    ...(search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {}),
  }

  const items = await prisma.material.findMany({
    where,
    select: {
      id: true, name: true, type: true, url: true, isActive: true, createdAt: true,
      bettingHouse: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return { items, total: items.length }
}
