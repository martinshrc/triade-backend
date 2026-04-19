import { Request, Response } from 'express'
import { listUsers, updateUserRole, updateUserTeam } from '../services/users.service'

export async function getUsersHandler(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page ?? 1))
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)))
  const role = req.query.role ? String(req.query.role) : undefined
  const status = req.query.status ? String(req.query.status) : undefined

  const data = await listUsers(page, limit, role, status)
  res.json(data)
}

export async function patchUserRoleHandler(req: Request, res: Response) {
  const targetId = String(req.params.id)
  const { role } = req.body

  if (!role) { res.status(400).json({ error: 'role obrigatório.' }); return }

  // Super admin não pode rebaixar a si mesmo
  if (targetId === req.user.id && role !== 'SUPER_ADMIN') {
    res.status(400).json({ error: 'Você não pode alterar o próprio role.' })
    return
  }

  const updated = await updateUserRole(targetId, role)
  res.json(updated)
}

export async function patchUserTeamHandler(req: Request, res: Response) {
  const targetId = String(req.params.id)
  const { referrerId } = req.body

  const updated = await updateUserTeam(targetId, referrerId ?? null)
  res.json(updated)
}
