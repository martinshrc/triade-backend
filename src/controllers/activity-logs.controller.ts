// ============================================================
// CONTROLLER — Logs de Atividade (SUPER_ADMIN)
// ============================================================

import { Request, Response } from 'express'
import prisma from '../config/database'

export async function listActivityLogsHandler(req: Request, res: Response) {
  const page  = Math.max(1, Number(req.query.page ?? 1))
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)))
  const userId = req.query.userId ? String(req.query.userId) : undefined
  const search = req.query.search ? String(req.query.search).slice(0, 100) : undefined

  const where = {
    ...(userId ? { userId } : {}),
    ...(search ? { action: { contains: search, mode: 'insensitive' as const } } : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        action: true,
        ip: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ])

  res.json({ logs, total, page, totalPages: Math.ceil(total / limit) })
}
