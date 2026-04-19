import { Request, Response } from 'express'
import { getNetwork } from '../services/network.service'

export async function network(req: Request, res: Response) {
  const userId = req.user.id
  let startDate: Date | undefined
  let endDate: Date | undefined
  if (req.query.from) startDate = new Date(String(req.query.from))
  if (req.query.to) endDate = new Date(String(req.query.to))
  const search = req.query.q ? String(req.query.q) : undefined

  const data = await getNetwork(userId, 4, startDate, endDate, search)
  res.json(data)
}
