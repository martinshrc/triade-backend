import prisma from '../config/database'

export async function getFinanceiro(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cpaValue: true, pixKeyType: true, pixKey: true },
  })

  const [pending, totalGross, totalPaid, myCpas] = await Promise.all([
    prisma.commission.aggregate({ where: { userId, status: 'PENDING' }, _sum: { amount: true } }),
    prisma.commission.aggregate({ where: { userId }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { userId, status: 'PAID' }, _sum: { amount: true } }),
    prisma.playerStat.aggregate({ where: { userId }, _sum: { cpas: true } }),
  ])

  const directIds = await prisma.user
    .findMany({ where: { referrerId: userId }, select: { id: true } })
    .then((u) => u.map((x) => x.id))

  const networkCpas = await prisma.playerStat.aggregate({
    where: { userId: { in: [...directIds, userId] } },
    _sum: { cpas: true },
  })

  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return {
    balance: pending._sum.amount ?? 0,
    totalGross: totalGross._sum.amount ?? 0,
    totalPaid: totalPaid._sum.amount ?? 0,
    myCpa: user?.cpaValue ?? 0,
    myCpas: myCpas._sum.cpas ?? 0,
    networkCpas: networkCpas._sum.cpas ?? 0,
    pixKeyType: user?.pixKeyType ?? null,
    pixKey: user?.pixKey ?? null,
    payments,
  }
}

export async function updatePixKey(userId: string, pixKeyType: string, pixKey: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { pixKeyType, pixKey },
    select: { id: true, pixKeyType: true, pixKey: true },
  })
}
