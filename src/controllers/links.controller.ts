import { Request, Response } from 'express'
import { getLinks, createAffiliateLink } from '../services/links.service'

export async function links(req: Request, res: Response) {
  const data = await getLinks(req.user.id)
  res.json(data)
}

export async function createLinkHandler(req: Request, res: Response) {
  const { userId, bettingHouseId, refCode, fullUrl, dbCode } = req.body
  if (!userId || !bettingHouseId || !refCode || !fullUrl) {
    res.status(400).json({ error: 'userId, bettingHouseId, refCode e fullUrl são obrigatórios.' })
    return
  }

  const link = await createAffiliateLink(
    req.user.id,
    req.user.role,
    String(userId),
    String(bettingHouseId),
    String(refCode),
    String(fullUrl),
    dbCode ? String(dbCode) : undefined,
  )
  res.status(201).json(link)
}
