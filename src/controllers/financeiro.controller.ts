import { Request, Response } from 'express'
import { getFinanceiro, updatePixKey } from '../services/financeiro.service'

export async function financeiro(req: Request, res: Response) {
  const data = await getFinanceiro(req.user.id)
  res.json(data)
}

const VALID_PIX_TYPES = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']

export async function patchPixKey(req: Request, res: Response) {
  const { pixKeyType, pixKey } = req.body

  if (!pixKeyType || !VALID_PIX_TYPES.includes(pixKeyType)) {
    res.status(400).json({ error: `pixKeyType inválido. Use: ${VALID_PIX_TYPES.join(', ')}.` })
    return
  }

  if (!pixKey || typeof pixKey !== 'string' || pixKey.trim().length === 0 || pixKey.length > 200) {
    res.status(400).json({ error: 'pixKey inválida.' })
    return
  }

  const updated = await updatePixKey(req.user.id, pixKeyType, pixKey.trim())
  res.json(updated)
}
