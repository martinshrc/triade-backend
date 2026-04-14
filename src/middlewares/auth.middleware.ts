// ============================================================
// MIDDLEWARE — Autenticação JWT
// ============================================================
// Lê o token do cookie httpOnly (mais seguro que Authorization header
// para SPAs, pois é inacessível via JS).
// ============================================================

import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../services/auth.service'

// Extende o tipo Request para carregar o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user: { id: string }
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
    req.user = { id: payload.sub }
    next()
  } catch {
    res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' })
  }
}
