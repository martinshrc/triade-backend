import prisma from '../config/database'
import { z } from 'zod'

export const nfeSchema = z.object({
  periodFrom:      z.string().datetime({ message: 'periodFrom inválido.' }),
  periodTo:        z.string().datetime({ message: 'periodTo inválido.' }),
  emailPlatform:   z.string().min(1).max(200),
  bankName:        z.string().max(100).optional(),
  bankAgency:      z.string().max(20).optional(),
  bankAccount:     z.string().max(30).optional(),
  bankAccountType: z.enum(['corrente', 'poupanca']).optional(),
  pixKeyType:      z.enum(['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']).optional(),
  pixKey:          z.string().max(200).optional(),
})

export type NfeInput = z.infer<typeof nfeSchema>

export async function createNfe(userId: string, input: NfeInput, pdfPath?: string) {
  return prisma.nfe.create({
    data: {
      userId,
      periodFrom:      new Date(input.periodFrom),
      periodTo:        new Date(input.periodTo),
      emailPlatform:   input.emailPlatform,
      bankName:        input.bankName,
      bankAgency:      input.bankAgency,
      bankAccount:     input.bankAccount,
      bankAccountType: input.bankAccountType,
      pixKeyType:      input.pixKeyType,
      pixKey:          input.pixKey,
      pdfPath:         pdfPath ?? null,
      status:          'PENDING',
    },
    select: {
      id: true, status: true, periodFrom: true, periodTo: true,
      emailPlatform: true, createdAt: true,
    },
  })
}

export async function listNfes(userId: string) {
  return prisma.nfe.findMany({
    where: { userId },
    select: {
      id: true, status: true, periodFrom: true, periodTo: true,
      emailPlatform: true, pdfPath: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}
