import { Request, Response } from 'express'
import {
  createBetRequest, listBetRequests, reviewBetRequest, listBetsWithAccess,
} from '../services/bet-access.service'
import { logActivity, getIp } from '../lib/activity'

export async function requestBetAccessHandler(req: Request, res: Response) {
  const { bettingHouseId } = req.body
  if (!bettingHouseId) { res.status(400).json({ error: 'bettingHouseId obrigatório.' }); return }

  const result = await createBetRequest(req.user.id, String(bettingHouseId))
  res.status(201).json(result)
}

export async function listBetRequestsHandler(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page ?? 1))
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)))
  const status = req.query.status ? String(req.query.status) : undefined

  const data = await listBetRequests(req.user.id, req.user.role, status, page, limit)
  res.json(data)
}

export async function reviewBetRequestHandler(req: Request, res: Response) {
  const requestId = String(req.params.id)
  const { action, notes } = req.body

  if (!['APPROVED', 'REJECTED'].includes(action)) {
    res.status(400).json({ error: 'action deve ser APPROVED ou REJECTED.' })
    return
  }

  const result = await reviewBetRequest(requestId, req.user.id, req.user.role, action, notes)
  const r = result as { bettingHouse?: { name?: string }; user?: { name?: string } }
  const label = `${action === 'APPROVED' ? 'approve_bet' : 'reject_bet'}:${r.bettingHouse?.name ?? '?'}:${r.user?.name ?? '?'}`
  logActivity(req.user.id, label, getIp(req))
  res.json(result)
}

export async function myBetsAccessHandler(req: Request, res: Response) {
  const data = await listBetsWithAccess(req.user.id)
  res.json(data)
}
