// ============================================================
// CONTROLLER — Autenticação
// ============================================================

import { Request, Response } from 'express'
import {
  register, login, logout, refresh,
  registerSchema, loginSchema,
  updateProfile, updateProfileSchema,
  changePassword, changePasswordSchema,
} from '../services/auth.service'
import { jwtConfig } from '../config/jwt'

export async function registerHandler(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }

  const user = await register(parsed.data)
  res.status(201).json({
    message: 'Conta criada. Aguarde a aprovação do administrador.',
    user,
  })
}

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos.' })
    return
  }

  const result = await login(parsed.data)

  // Define cookies httpOnly — nunca acessíveis via document.cookie no browser
  res.cookie('access_token', result.accessToken, jwtConfig.cookieOptions)
  res.cookie('refresh_token', result.refreshToken, jwtConfig.refreshCookieOptions)

  res.json({ user: result.user })
}

export async function refreshHandler(req: Request, res: Response) {
  const token = req.cookies?.refresh_token
  if (!token) {
    res.status(401).json({ error: 'Sessão inválida.' })
    return
  }

  // Verifica assinatura e extrai userId — rejeita tokens forjados ou expirados
  const { default: jwt } = await import('jsonwebtoken')
  const { jwtConfig: cfg } = await import('../config/jwt')
  let userId: string
  try {
    const payload = jwt.verify(token, cfg.secret) as { sub?: string; type?: string }
    if (!payload?.sub || payload.type !== 'refresh') throw new Error()
    userId = payload.sub
  } catch {
    res.status(401).json({ error: 'Token inválido.' })
    return
  }

  const result = await refresh(userId, token)

  res.cookie('access_token', result.accessToken, jwtConfig.cookieOptions)
  res.cookie('refresh_token', result.refreshToken, jwtConfig.refreshCookieOptions)

  res.json({ user: result.user })
}

export async function logoutHandler(req: Request, res: Response) {
  if (req.user?.id) await logout(req.user.id)

  res.clearCookie('access_token')
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' })
  res.json({ message: 'Logout realizado.' })
}

export async function updateProfileHandler(req: Request, res: Response) {
  const parsed = updateProfileSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return }
  const updated = await updateProfile(req.user.id, parsed.data)
  res.json(updated)
}

export async function changePasswordHandler(req: Request, res: Response) {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return }
  await changePassword(req.user.id, parsed.data.password)
  // Invalida cookies para forçar novo login
  res.clearCookie('access_token')
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' })
  res.json({ message: 'Senha atualizada. Faça login novamente.' })
}

export async function checkEmailHandler(req: Request, res: Response) {
  const email = String(req.query.email ?? '').trim().toLowerCase()
  if (!email) { res.status(400).json({ error: 'email obrigatório.' }); return }
  const { default: prisma } = await import('../config/database')
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  res.json({ ok: true, exists: !!exists })
}

export async function meHandler(req: Request, res: Response) {
  const { default: prisma } = await import('../config/database')
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, status: true, role: true, cpaValue: true, externalId: true },
  })
  if (!user) { res.status(404).json({ error: 'Usuário não encontrado.' }); return }
  res.json(user)
}
