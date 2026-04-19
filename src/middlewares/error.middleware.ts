// ============================================================
// MIDDLEWARE — Tratamento global de erros
// ============================================================

import { Request, Response, NextFunction } from 'express'

// Erros de negócio que podem ser expostos ao cliente
const BUSINESS_ERRORS = new Set([
  'E-mail já cadastrado.',
  'E-mail ou senha inválidos.',
  'Sessão expirada. Faça login novamente.',
  'Sessão inválida.',
  'Token inválido.',
  'Não autenticado.',
  'Acesso negado.',
  'Usuário não encontrado.',
  'Membro não encontrado.',
  'Aprovação não encontrada.',
  'CPA não pode ser maior que o seu próprio CPA.',
  'Muitas tentativas. Aguarde 15 minutos.',
])

export class BusinessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BusinessError'
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Erros de negócio explícitos (BusinessError) → 400 com mensagem real
  if (err.name === 'BusinessError' || BUSINESS_ERRORS.has(err.message)) {
    res.status(400).json({ error: err.message })
    return
  }

  // Erros de validação Zod (lançados manualmente como Error nos controllers)
  if (err.message?.startsWith('Dados inválidos')) {
    res.status(400).json({ error: err.message })
    return
  }

  // Qualquer outro erro (Prisma, rede, bugs) → loga internamente, não expõe detalhes
  console.error('[INTERNAL ERROR]', err.name, err.message, err.stack)
  res.status(500).json({ error: 'Erro interno no servidor.' })
}
