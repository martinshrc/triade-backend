import { Request, Response } from 'express'
import { ApprovalStatus } from '@prisma/client'
import { getApprovals, reviewApproval } from '../services/approvals.service'
import { logActivity, getIp } from '../lib/activity'

const MAX_LIMIT = 50

export async function approvals(req: Request, res: Response) {
  const status = (req.query.status as ApprovalStatus) ?? ApprovalStatus.PENDING
  const search = req.query.search ? String(req.query.search).slice(0, 100) : undefined
  const page = Math.max(1, Number(req.query.page ?? 1))
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit ?? 20)))

  if (!Object.values(ApprovalStatus).includes(status)) {
    res.status(400).json({ error: 'Status inválido. Use: PENDING, APPROVED ou REJECTED.' })
    return
  }

  const data = await getApprovals(req.user.id, status, search, page, limit)
  res.json(data)
}

export async function patchApproval(req: Request, res: Response) {
  const approvalId = String(req.params.id)
  const { status, cpaValue } = req.body

  if (!Object.values(ApprovalStatus).includes(status)) {
    res.status(400).json({ error: 'Status inválido. Use: PENDING, APPROVED ou REJECTED.' })
    return
  }

  if (cpaValue !== undefined && (typeof cpaValue !== 'number' || cpaValue < 0 || cpaValue > 100000)) {
    res.status(400).json({ error: 'cpaValue inválido.' })
    return
  }

  const updated = await reviewApproval(req.user.id, approvalId, status as ApprovalStatus, cpaValue)
  const userName = (updated as { user?: { name?: string } }).user?.name ?? approvalId
  const verb = status === 'APPROVED' ? 'approve_user' : status === 'REJECTED' ? 'reject_user' : 'review_user'
  logActivity(req.user.id, `${verb}:${userName}`, getIp(req))
  res.json(updated)
}
