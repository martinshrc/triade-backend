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
  email: z.string().email('E-mail inválido').toLowerCase(),
  password: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve ter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve ter ao menos um número'),
  referralCode: z.string().optional(), // código de convite (externalId do upline)
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

// ---- Funções ----

export async function register(input: RegisterInput) {
  const { name, email, password, referralCode } = input

  // Verifica se e-mail já existe
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('E-mail já cadastrado.')

  // Resolve upline via referralCode (externalId do afiliado que indicou)
  let referrerId: string | undefined
  if (referralCode) {
    const referrer = await prisma.user.findFirst({
      where: { externalId: referralCode, status: 'APPROVED' },
      select: { id: true },
    })
    if (referrer) referrerId = referrer.id
  }

  // Hash da senha — bcrypt custo 12 (lento o suficiente para dificultar brute force)
  const passwordHash = await bcrypt.hash(password, 12)

  // Cria o usuário
  const user = await prisma.user.create({
    data: { name, email, passwordHash, referrerId, status: 'PENDING' },
    select: { id: true, name: true, email: true, status: true },
  })

  // Cria solicitação de aprovação automática
  await prisma.approval.create({ data: { userId: user.id } })

  return user
}

export async function login(input: LoginInput) {
  const { email, password } = input

  const user = await prisma.user.findUnique({ where: { email } })

  // Mesmo tempo de resposta para e-mail inexistente ou senha errada (evita user enumeration)
  const fakeHash = '$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  const passwordMatch = await bcrypt.compare(password, user?.passwordHash ?? fakeHash)

  if (!user || !passwordMatch) throw new Error('E-mail ou senha inválidos.')

  // Gera tokens
  const accessToken = generateAccessToken(user.id)
  const refreshToken = generateRefreshToken(user.id)

  // Salva hash do refresh token no banco (rotacionado a cada login)
  const refreshHash = await bcrypt.hash(refreshToken, 10)
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: refreshHash } })

  return {
    user: { id: user.id, name: user.name, email: user.email, status: user.status },
    accessToken,
    refreshToken,
  }
}

export async function refresh(userId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, status: true, refreshToken: true },
  })

  if (!user?.refreshToken) throw new Error('Sessão inválida.')

  const valid = await bcrypt.compare(token, user.refreshToken)
  if (!valid) throw new Error('Sessão inválida.')

  // Rotaciona o refresh token
  const newAccessToken = generateAccessToken(user.id)
  const newRefreshToken = generateRefreshToken(user.id)
  const newRefreshHash = await bcrypt.hash(newRefreshToken, 10)

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshHash } })

  return {
    user: { id: user.id, name: user.name, email: user.email, status: user.status },
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }
}

export async function logout(userId: string) {
  // Invalida o refresh token no banco
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } })
}

// ---- Helpers ----

function generateAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn'],
  })
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string): { sub: string } {
  return jwt.verify(token, jwtConfig.secret) as { sub: string }
}
