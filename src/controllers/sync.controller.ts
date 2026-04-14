import { Request, Response } from 'express'
import { syncBettingHouse } from '../services/sync.service'

export async function syncHouse(req: Request, res: Response) {
  const result = await syncBettingHouse(req.params.houseSlug, req.user.id)
  res.json({ message: 'Sincronização concluída.', ...result })
}
