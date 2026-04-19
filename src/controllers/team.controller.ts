import { Request, Response } from 'express'
import { getTeam, updateMemberCpa } from '../services/team.service'

const MAX_LIMIT = 50

export async function team(req: Request, res: Response) {
  const userId = req.user.id
  const page = Math.max(1, Number(req.query.page ?? 1))
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit ?? 20)))

  const data = await getTeam(userId, page, limit)
  res.json(data)
}

export async function patchMemberCpa(req: Request, res: Response) {
  const uplineId = req.user.id
  const memberId = String(req.params.id)
  const { cpaValue } = req.body

  if (typeof cpaValue !== 'number' || cpaValue < 0) {
    res.status(400).json({ error: 'cpaValue inválido.' })
    return
  }

  const updated = await updateMemberCpa(uplineId, memberId, cpaValue)
  res.json(updated)
}
