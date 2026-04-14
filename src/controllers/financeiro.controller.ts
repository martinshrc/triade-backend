import { Request, Response } from 'express'
import { getFinanceiro, updatePixKey } from '../services/financeiro.service'

export async function financeiro(req: Request, res: Response) {
  const data = await getFinanceiro(req.user.id)
  res.json(data)
}

export async function patchPixKey(req: Request, res: Response) {
  const { pixKeyType, pixKey } = req.body
  if (!pixKeyType || !pixKey) {
    res.status(400).json({ error: 'pixKeyType e pixKey são obrigatórios.' })
    return
  }
  const updated = await updatePixKey(req.user.id, pixKeyType, pixKey)
  res.json(updated)
}
