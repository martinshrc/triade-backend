// ============================================================
// SERVICE — Autenticação
// ============================================================

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../config/database'
import { jwtConfig } from '../config/jwt'

// ---- Schemas de validação ----

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
  email: z.string().email('E-mail inválido').toLowerCase()
    .regex(/\.(com|com\.br)$/i, 'Use e-mail com final .com ou .com.br'),
  password: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter ao menos um caractere especial'),
  instagram: z.string().max(60).optional(),
  whatsapp: z
    .string()
    .min(10, 'WhatsApp inválido. Informe DDI + DDD + número (ex: 5511999990000)')
    .max(20)
    .regex(/^\d+$/, 'WhatsApp deve conter só números'),
  market: z.string().max(100).optional(),
  ftdsEstimate: z.string().max(30).optional(),
  referralCode: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

// ---- Helpers ----

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem chars ambíguos

async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = Array.from(
      { length: 8 },
      () => INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)]
    ).join('')
    const exists = await prisma.user.findUnique({ where: { inviteCode: code }, select: { id: true } })
    if (!exists) return code
  }
  throw new Error('Não foi possível gerar código de convite único.')
}

// ---- Funções ----

export async function register(input: RegisterInput) {
  const { name, email, password, referralCode, instagram, whatsapp, market, ftdsEstimate } = input

  // Verifica se e-mail já existe
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('E-mail já cadastrado.')

  // Resolve upline via inviteCode do sistema Tríade
  let referrerId: string | undefined
  if (referralCode) {
    const referrer = await prisma.user.findFirst({
      where: { inviteCode: referralCode, status: 'APPROVED' },
      select: { id: true },
    })
    if (referrer) referrerId = referrer.id
  }

  const [passwordHash, inviteCode] = await Promise.all([
    bcrypt.hash(password, 12),
    generateUniqueInviteCode(),
  ])

  const user = await prisma.user.create({
    data: { name, email, passwordHash, referrerId, inviteCode, status: 'PENDING', instagram, whatsapp, market, ftdsEstimate },
    select: { id: true, name: true, email: true, status: true },
  })

  await prisma.approval.create({ data: { userId: user.id } })

  return user
}

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().toLowerCase()
    .regex(/\.(com|com\.br)$/i, 'Use e-mail com final .com ou .com.br').optional(),
  whatsapp: z.string().max(20).regex(/^\d*$/, 'WhatsApp deve conter só números').optional(),
})

export async function updateProfile(userId: string, input: z.infer<typeof updateProfileSchema>) {
  if (input.email) {
    const existing = await prisma.user.findFirst({ where: { email: input.email, NOT: { id: userId } } })
    if (existing) throw new Error('E-mail já está em uso.')
  }
  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: { id: true, name: true, email: true, whatsapp: true },
  })
}

export const changePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter ao menos um caractere especial'),
})

export async function changePassword(userId: string, newPassword: string) {
  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash, refreshToken: null } })
}

export async function login(input: LoginInput) {
  const { email, password } = input

  const user = await prisma.user.findUnique({ where: { email } })

  // Mesmo tempo de resposta para e-mail inexistente ou senha errada (evita user enumeration)
  const fakeHash = '$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  const passwordMatch = await bcrypt.compare(password, user?.passwordHash ?? fakeHash)

  if (!user || !passwordMatch) throw new Error('E-mail ou senha inválidos.')

  // Gera inviteCode lazy para usuários criados antes desta feature
  let inviteCode = user.inviteCode
  if (!inviteCode) {
    inviteCode = await generateUniqueInviteCode()
    await prisma.user.update({ where: { id: user.id }, data: { inviteCode } })
  }

  // Gera tokens
  const accessToken = generateAccessToken(user.id, user.role)
  const refreshToken = generateRefreshToken(user.id)

  // Salva hash do refresh token no banco (rotacionado a cada login)
  const refreshHash = await bcrypt.hash(refreshToken, 10)
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: refreshHash } })

  return {
    user: { id: user.id, name: user.name, email: user.email, status: user.status, role: user.role },
    accessToken,
    refreshToken,
  }
}

export async function refresh(userId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, status: true, role: true, refreshToken: true },
  })

  if (!user?.refreshToken) throw new Error('Sessão inválida.')

  const valid = await bcrypt.compare(token, user.refreshToken)
  if (!valid) throw new Error('Sessão inválida.')

  // Rotaciona o refresh token
  const newAccessToken = generateAccessToken(user.id, user.role)
  const newRefreshToken = generateRefreshToken(user.id)
  const newRefreshHash = await bcrypt.hash(newRefreshToken, 10)

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshHash } })

  return {
    user: { id: user.id, name: user.name, email: user.email, status: user.status, role: user.role },
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }
}

export async function logout(userId: string) {
  // Invalida o refresh token no banco
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } })
}

// ---- Helpers ----

function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn'],
  })
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string): { sub: string; role: string } {
  return jwt.verify(token, jwtConfig.secret) as { sub: string; role: string }
}
