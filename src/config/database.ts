// ============================================================
// CONFIGURAÇÃO DO PRISMA CLIENT
// Instância única compartilhada em toda a aplicação
// ============================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
})

export default prisma
