import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  const superbet = await prisma.bettingHouse.upsert({
    where: { slug: 'superbet3c' },
    update: {},
    create: { name: 'Superbet 3C', slug: 'superbet3c', isActive: true },
  })
  console.log('✅ Casa de aposta:', superbet.name)

  const passwordHash = await bcrypt.hash('Admin@1234', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@triade.com' },
    update: {},
    create: {
      name: 'Admin Tríade',
      email: 'admin@triade.com',
      passwordHash,
      externalId: '3214',
      cpaValue: 280,
      status: 'APPROVED',
    },
  })
  console.log('✅ Admin criado:', admin.email)
  console.log('   Senha inicial: Admin@1234  ← troque após o primeiro login')

  await prisma.affiliateLink.upsert({
    where: { id: (await prisma.affiliateLink.findFirst({ where: { userId: admin.id } }))?.id ?? 'noop' },
    update: {},
    create: {
      userId: admin.id,
      bettingHouseId: superbet.id,
      refCode: '3214',
      dbCode: 'superbet3c',
      fullUrl: 'https://affiliaup.com.br/registro.php?ref=3214&db=superbet3c',
    },
  })
  console.log('✅ Link de afiliado criado')
  console.log('🎉 Seed concluído!')
}

main()
  .catch((e) => { console.error('❌ Erro no seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
