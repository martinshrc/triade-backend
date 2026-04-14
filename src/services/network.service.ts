import prisma from '../config/database'

export async function getNetwork(userId: string, maxLevels = 4, startDate?: Date, endDate?: Date) {
  const totalInNetwork = await countNetworkRecursive(userId, maxLevels)

  const directReferrals = await prisma.user.findMany({
    where: { referrerId: userId, status: 'APPROVED' },
    select: { id: true, name: true, email: true, externalId: true, cpaValue: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const members = await Promise.all(
    directReferrals.map(async (member) => {
      const stats = startDate && endDate
        ? await prisma.playerStat.aggregate({
            where: { userId: member.id, date: { gte: startDate, lte: endDate } },
            _sum: { registrations: true, cpas: true },
          })
        : null

      const subCount = await countNetworkRecursive(member.id, maxLevels - 1)

      return {
        ...member,
        registrations: stats?._sum.registrations ?? 0,
        cpas: stats?._sum.cpas ?? 0,
        subLevelCount: subCount,
      }
    })
  )

  return {
    totalInNetwork,
    directCount: directReferrals.length,
    indirectCount: totalInNetwork - directReferrals.length,
    members,
  }
}

async function countNetworkRecursive(userId: string, maxLevels: number): Promise<number> {
  if (maxLevels <= 0) return 0

  const directs = await prisma.user.findMany({
    where: { referrerId: userId },
    select: { id: true },
  })

  if (directs.length === 0) return 0

  let count = directs.length
  for (const d of directs) count += await countNetworkRecursive(d.id, maxLevels - 1)
  return count
}
