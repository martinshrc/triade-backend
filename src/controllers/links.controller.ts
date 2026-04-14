import { Request, Response } from 'express'
import { getLinks } from '../services/links.service'

export async function links(req: Request, res: Response) {
  const data = await getLinks(req.user.id)
  res.json(data)
}
