// ============================================================
// CONTROLLER — Casas de Aposta (SUPER_ADMIN)
// ============================================================

import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../config/database'
import { logActivity, getIp } from '../lib/activity'

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const houseSchema = z.object({
  name:    z.string().min(2, 'Nome obrigatório.'),
  slug:    z.string().optional(),
  isActive: z.boolean().optional(),

  // ── Suporte ──────────────────────────────────────────────
  supportWhatsapp: z.string().optional(),

  // ── Integração API (configurar após receber docs da BET) ──
  // Cada casa tem endpoint e autenticação próprios.
  // TODO: mapear campos específicos por casa quando as APIs estiverem documentadas.
  apiBaseUrl:  z.string().url('URL inválida.').optional().or(z.literal('')),
  apiKey:      z.string().optional(),   // chave de autenticação (bearer/header)
  apiSecret:   z.string().optional(),   // secret para HMAC ou OAuth

  // ── Dados Fiscais (usados na emissão de NFE pelo afiliado) ─
  fiscalName:    z.string().optional(), // Razão Social
  fiscalFantasy: z.string().optional(), // Nome Fantasia
  fiscalCnpj:    z.string().optional(),
  fiscalCnae:    z.string().optional(),
  fiscalNote:    z.string().optional(), // instrução adicional para o afiliado
})

export async function listBettingHousesHandler(_req: Request, res: Response) {
  const houses = await prisma.bettingHouse.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true, slug: true,
      apiBaseUrl: true, apiKey: true, apiSecret: true,
      supportWhatsapp: true,
      fiscalName: true, fiscalFantasy: true, fiscalCnpj: true, fiscalCnae: true, fiscalNote: true,
      isActive: true, createdAt: true,
    },
  })
  res.json({ houses })
}

export async function createBettingHouseHandler(req: Request, res: Response) {
  const parsed = houseSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }

  const { name, slug, ...rest } = parsed.data
  const finalSlug = (slug && slug.trim()) ? slug.trim() : toSlug(name)

  const existing = await prisma.bettingHouse.findUnique({ where: { slug: finalSlug } })
  if (existing) {
    res.status(409).json({ error: `Slug "${finalSlug}" já está em uso.` })
    return
  }

  const house = await prisma.bettingHouse.create({
    data: { name, slug: finalSlug, ...rest },
  })

  logActivity(req.user.id, `create_house:${name}`, getIp(req))
  res.status(201).json(house)
}

export async function updateBettingHouseHandler(req: Request, res: Response) {
  const id = String(req.params.id)
  const parsed = houseSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }

  const { slug, ...rest } = parsed.data

  if (slug) {
    const conflict = await prisma.bettingHouse.findUnique({ where: { slug } })
    if (conflict && conflict.id !== id) {
      res.status(409).json({ error: `Slug "${slug}" já está em uso.` })
      return
    }
  }

  const house = await prisma.bettingHouse.update({
    where: { id },
    data: { ...(slug ? { slug } : {}), ...rest },
  })

  logActivity(req.user.id, `update_house:${house.name}`, getIp(req))
  res.json(house)
}

export async function deleteBettingHouseHandler(req: Request, res: Response) {
  const id = String(req.params.id)

  const linksCount = await prisma.affiliateLink.count({ where: { bettingHouseId: id } })
  if (linksCount > 0) {
    res.status(409).json({
      error: `Esta casa possui ${linksCount} link(s) de afiliado. Remova-os antes de excluir.`,
    })
    return
  }

  const house = await prisma.bettingHouse.findUnique({ where: { id }, select: { name: true } })
  await prisma.bettingHouse.delete({ where: { id } })

  logActivity(req.user.id, `delete_house:${house?.name ?? id}`, getIp(req))
  res.json({ message: 'Casa excluída.' })
}
