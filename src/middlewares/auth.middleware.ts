// ============================================================
// MIDDLEWARE — Autenticação JWT + controle de roles
// ============================================================

import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../services/auth.service'

declare global {
  namespace Express {
    interface Request {
      user: { id: string; role: string }
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token

  if (!token) {
    res.status(401).json({ error: 'Não autenticado.' })
    return
  }

  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub, role: payload.role ?? 'AFFILIATE' }
    next()
  } catch {
    res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      res.status(403).json({ error: 'Acesso negado.' })
      return
    }
    next()
  }
}
