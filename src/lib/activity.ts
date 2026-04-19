// ============================================================
// UTIL — Log de atividade
// Registra ações de usuários de forma leve e não-bloqueante.
// Falhas silenciosas — o log nunca deve quebrar uma requisição.
// ============================================================

import prisma from '../config/database'
import { Request } from 'express'

export function getIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) return String(forwarded).split(',')[0].trim()
  return req.socket?.remoteAddress
}

export async function logActivity(userId: string, action: string, ip?: string) {
  try {
    await prisma.activityLog.create({ data: { userId, action, ip } })
  } catch {
    // Silencioso — log não deve quebrar a requisição principal
  }
}
