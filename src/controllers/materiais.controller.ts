import { Request, Response } from 'express'
import { getMateriais } from '../services/materiais.service'

export async function listMateriais(req: Request, res: Response) {
  const bettingHouseId = req.query.houseId ? String(req.query.houseId) : undefined
  const search = req.query.search ? String(req.query.search) : undefined
  const data = await getMateriais(bettingHouseId, search)
  res.json(data)
}
