import prisma from '../config/database'

export interface NetworkNode {
  id: string
  name: string
  email: string
  externalId: string | null
  cpaValue: string
  createdAt: Date
  level: number
  registrations: number
  cpas: number
  children: NetworkNode[]
}

export async function getNetwork(
  userId: string,
  maxLevels = 4,
  startDate?: Date,
  endDate?: Date,
  search?: string,
) {
  const tree = await buildTree(userId, 1, maxLevels, startDate, endDate, search)

  const flat = flattenTree(tree)
  const totalInNetwork = flat.length
  const directCount = tree.length
  const indirectCount = totalInNetwork - directCount
  const totalRegistrations = flat.reduce((s, n) => s + n.registrations, 0)
  const totalCpas = flat.reduce((s, n) => s + n.cpas, 0)

  return { totalInNetwork, directCount, indirectCount, totalRegistrations, totalCpas, tree }
}

async function buildTree(
  parentId: string,
  level: number,
  maxLevels: number,
  startDate?: Date,
  endDate?: Date,
  search?: string,
): Promise<NetworkNode[]> {
  if (level > maxLevels) return []

  const where = {
    referrerId: parentId,
    status: 'APPROVED' as const,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, externalId: true, cpaValue: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return Promise.all(
    users.map(async (u) => {
      const stats =
        startDate && endDate
          ? await prisma.playerStat.aggregate({
              where: { userId: u.id, date: { gte: startDate, lte: endDate } },
              _sum: { registrations: true, cpas: true },
            })
          : null

      const children = await buildTree(u.id, level + 1, maxLevels, startDate, endDate)

      return {
        ...u,
        cpaValue: String(u.cpaValue),
        level,
        registrations: stats?._sum.registrations ?? 0,
        cpas: stats?._sum.cpas ?? 0,
        children,
      }
    }),
  )
}

function flattenTree(nodes: NetworkNode[]): NetworkNode[] {
  return nodes.flatMap((n) => [n, ...flattenTree(n.children)])
}
