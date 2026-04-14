import prisma from '../config/database'
import { getAdapter } from './integrations'

export async function syncBettingHouse(houseSlug: string, affiliateUserId: string) {
  const house = await prisma.bettingHouse.findUnique({ where: { slug: houseSlug } })
  if (!house) throw new Error(`Casa de aposta não encontrada: ${houseSlug}`)
  if (!house.isActive) throw new Error(`Casa de aposta inativa: ${houseSlug}`)

  const link = await prisma.affiliateLink.findFirst({
    where: { userId: affiliateUserId, bettingHouseId: house.id },
  })
  if (!link) throw new Error(`Nenhum link cadastrado para o afiliado na casa ${houseSlug}`)

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const adapter = getAdapter(houseSlug)
  const stats = await adapter.fetchPlayerStats({
    startDate, endDate, affiliateRefCode: link.refCode,
  })

  const todayKey = new Date(endDate.toISOString().split('T')[0])

  const results = await Promise.all(
    stats.map((s) =>
      prisma.playerStat.upsert({
        where: { userId_bettingHouseId_date: { userId: affiliateUserId, bettingHouseId: house.id, date: todayKey } },
        update: { registrations: s.registrations, cpas: s.cpas, ftds: s.ftds, deposits: s.deposits },
        create: {
          userId: affiliateUserId,
          bettingHouseId: house.id,
          date: todayKey,
          registrations: s.registrations,
          cpas: s.cpas,
          ftds: s.ftds,
          deposits: s.deposits,
        },
      })
    )
  )

  return { synced: results.length, houseSlug, startDate, endDate }
}
