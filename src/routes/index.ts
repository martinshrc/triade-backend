// ============================================================
// ROTEADOR PRINCIPAL
// ============================================================

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middlewares/auth.middleware'

// Auth
import { registerHandler, loginHandler, refreshHandler, logoutHandler, meHandler } from '../controllers/auth.controller'

// App
import { dashboard } from '../controllers/dashboard.controller'
import { network } from '../controllers/network.controller'
import { team, patchMemberCpa } from '../controllers/team.controller'
import { financeiro, patchPixKey } from '../controllers/financeiro.controller'
import { approvals, patchApproval } from '../controllers/approvals.controller'
import { links } from '../controllers/links.controller'
import { syncHouse } from '../controllers/sync.controller'

const router = Router()

// ---- Rate limiters ----

// Rotas de auth: máx 10 tentativas por 15 minutos por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// API geral: máx 100 req por minuto por IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Limite de requisições atingido.' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.use(apiLimiter)

// ---- Health check (público) ----
router.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }))

// ---- Autenticação (público) ----
router.post('/auth/register', authLimiter, registerHandler)
router.post('/auth/login', authLimiter, loginHandler)
router.post('/auth/refresh', refreshHandler)
router.post('/auth/logout', requireAuth, logoutHandler)
router.get('/auth/me', requireAuth, meHandler)

// ---- Rotas protegidas (requerem JWT) ----
router.get('/dashboard', requireAuth, dashboard)
router.get('/network', requireAuth, network)
router.get('/team', requireAuth, team)
router.patch('/team/:id/cpa', requireAuth, patchMemberCpa)
router.get('/financeiro', requireAuth, financeiro)
router.patch('/financeiro/pix', requireAuth, patchPixKey)
router.get('/links', requireAuth, links)
router.get('/approvals', requireAuth, approvals)
router.patch('/approvals/:id', requireAuth, patchApproval)
router.post('/sync/:houseSlug', requireAuth, syncHouse)

export default router
