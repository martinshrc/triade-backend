// ============================================================
// MIDDLEWARE — Tratamento global de erros
// ============================================================

import { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[ERROR]', err.message)

  // Erros de negócio lançados explicitamente nos services
  if (err.message) {
    res.status(400).json({ error: err.message })
    return
  }

  res.status(500).json({ error: 'Erro interno no servidor.' })
}
