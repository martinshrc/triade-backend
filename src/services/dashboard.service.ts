import prisma from '../config/database'

interface DashboardOptions {
  userId: string
  startDate: Date
  endDate: Date
}

export async function getDashboardStats({ userId, startDate, endDate }: DashboardOptions) {
  const myStats = await prisma.playerStat.aggregate({
    where: { userId, date: { gte: startDate, lte: endDate } },
    _sum: { registrations: true, cpas: true, ftds: true, deposits: true },
  })

  const directIds = await prisma.user
    .findMany({ where: { referrerId: userId }, select: { id: true } })
    .then((u) => u.map((x) => x.id))

  const teamStats = await prisma.playerStat.aggregate({
    where: { userId: { in: directIds }, date: { gte: startDate, lte: endDate } },
    _sum: { registrations: true, cpas: true, ftds: true, deposits: true },
  })

  const pendingCommissions = await prisma.commission.aggregate({
    where: { userId, status: 'PENDING' },
    _sum: { amount: true },
  })

  const totalPaid = await prisma.payment.aggregate({
    where: { userId, status: 'PAID' },
    _sum: { amount: true },
  })

  const dailyStats = await prisma.playerStat.groupBy({
    by: ['date'],
    where: { userId, date: { gte: startDate, lte: endDate } },
    _sum: { registrations: true, cpas: true },
    orderBy: { date: 'asc' },
  })

  const dailyTeamStats = await prisma.playerStat.groupBy({
    by: ['date'],
    where: { userId: { in: directIds }, date: { gte: startDate, lte: endDate } },
    _sum: { registrations: true, cpas: true },
    orderBy: { date: 'asc' },
  })

  return {
    balance: pendingCommissions._sum.amount ?? 0,
    totalPaid: totalPaid._sum.amount ?? 0,
    myPerformance: {
      registrations: myStats._sum.registrations ?? 0,
      cpas: myStats._sum.cpas ?? 0,
      ftds: myStats._sum.ftds ?? 0,
      deposits: myStats._sum.deposits ?? 0,
    },
    teamPerformance: {
      registrations: teamStats._sum.registrations ?? 0,
      cpas: teamStats._sum.cpas ?? 0,
      ftds: teamStats._sum.ftds ?? 0,
      deposits: teamStats._sum.deposits ?? 0,
    },
    chartData: mergeChartData(dailyStats, dailyTeamStats),
  }
}

function mergeChartData(
  myDaily: { date: Date; _sum: { registrations: number | null; cpas: number | null } }[],
  teamDaily: { date: Date; _sum: { registrations: number | null; cpas: number | null } }[]
) {
  const map = new Map<string, { date: string; voceReg: number; voceCPA: number; equipeReg: number; equipeCPA: number }>()

  for (const d of myDaily) {
    const key = d.date.toISOString().split('T')[0]
    map.set(key, { date: key, voceReg: d._sum.registrations ?? 0, voceCPA: d._sum.cpas ?? 0, equipeReg: 0, equipeCPA: 0 })
  }

  for (const d of teamDaily) {
    const key = d.date.toISOString().split('T')[0]
    const e = map.get(key)
    if (e) { e.equipeReg = d._sum.registrations ?? 0; e.equipeCPA = d._sum.cpas ?? 0 }
    else map.set(key, { date: key, voceReg: 0, voceCPA: 0, equipeReg: d._sum.registrations ?? 0, equipeCPA: d._sum.cpas ?? 0 })
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
}
