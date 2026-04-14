import prisma from '../config/database'
import { ApprovalStatus } from '@prisma/client'

export async function getApprovals(
  reviewerId: string,
  status: ApprovalStatus,
  search?: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit

  const where = {
    status,
    user: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
          referrerId: reviewerId,
        }
      : { referrerId: reviewerId },
  }

  const [approvals, total] = await Promise.all([
    prisma.approval.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, externalId: true, cpaValue: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.approval.count({ where }),
  ])

  return { approvals, total, page, totalPages: Math.ceil(total / limit) }
}

export async function reviewApproval(
  approvalId: string,
  status: ApprovalStatus,
  cpaValue?: number
) {
  const approval = await prisma.approval.findUnique({ where: { id: approvalId } })
  if (!approval) throw new Error('Aprovação não encontrada.')

  const updated = await prisma.approval.update({
    where: { id: approvalId },
    data: { status, cpaValue: cpaValue ?? approval.cpaValue, reviewedAt: new Date() },
  })

  if (status === ApprovalStatus.APPROVED) {
    await prisma.user.update({
      where: { id: approval.userId },
      data: { status: 'APPROVED', ...(cpaValue != null && { cpaValue }) },
    })
  }

  if (status === ApprovalStatus.REJECTED) {
    await prisma.user.update({ where: { id: approval.userId }, data: { status: 'REJECTED' } })
  }

  return updated
}
