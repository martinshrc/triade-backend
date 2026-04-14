import { Request, Response } from 'express'
import { ApprovalStatus } from '@prisma/client'
import { getApprovals, reviewApproval } from '../services/approvals.service'

export async function approvals(req: Request, res: Response) {
  const status = (req.query.status as ApprovalStatus) ?? ApprovalStatus.PENDING
  const search = req.query.search ? String(req.query.search) : undefined
  const page = Number(req.query.page ?? 1)
  const limit = Number(req.query.limit ?? 20)

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

  const updated = await reviewApproval(approvalId, status as ApprovalStatus, cpaValue)
  res.json(updated)
}
