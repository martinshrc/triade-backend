// ============================================================
// ROTEADOR PRINCIPAL
// ============================================================

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth, requireRole } from '../middlewares/auth.middleware'

// Auth
import {
  registerHandler, loginHandler, refreshHandler, logoutHandler, meHandler,
  updateProfileHandler, changePasswordHandler, checkEmailHandler,
} from '../controllers/auth.controller'

// App
import { dashboard } from '../controllers/dashboard.controller'
import { network } from '../controllers/network.controller'
import { team, patchMemberCpa } from '../controllers/team.controller'
import { financeiro, patchPixKey } from '../controllers/financeiro.controller'
import { approvals, patchApproval } from '../controllers/approvals.controller'
import { links, createLinkHandler } from '../controllers/links.controller'
import { syncHouse } from '../controllers/sync.controller'
import { listMateriais } from '../controllers/materiais.controller'
import { createNfe, listNfes } from '../controllers/nfe.controller'

// Gestão de usuários (SUPER_ADMIN)
import { getUsersHandler, patchUserRoleHandler, patchUserTeamHandler } from '../controllers/users.controller'

// Casas de aposta (SUPER_ADMIN)
import {
  listBettingHousesHandler, createBettingHouseHandler,
  updateBettingHouseHandler, deleteBettingHouseHandler,
} from '../controllers/betting-houses.controller'

// Logs de atividade (SUPER_ADMIN)
import { listActivityLogsHandler } from '../controllers/activity-logs.controller'

// Solicitações de acesso a BETs
import {
  requestBetAccessHandler, listBetRequestsHandler,
  reviewBetRequestHandler, myBetsAccessHandler,
} from '../controllers/bet-access.controller'

const router = Router()

// ---- Rate limiters ----
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

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
router.patch('/auth/profile', requireAuth, updateProfileHandler)
router.patch('/auth/password', requireAuth, changePasswordHandler)
router.get('/auth/check-email', checkEmailHandler)

// ---- Rotas gerais (qualquer usuário autenticado) ----
router.get('/dashboard', requireAuth, dashboard)
router.get('/financeiro', requireAuth, financeiro)
router.patch('/financeiro/pix', requireAuth, patchPixKey)
router.post('/financeiro/nfe', requireAuth, createNfe)
router.get('/financeiro/nfe', requireAuth, listNfes)
router.get('/links', requireAuth, links)
router.post('/links', requireAuth, requireRole('TEAM_ADMIN', 'SUPER_ADMIN'), createLinkHandler)
router.get('/network', requireAuth, network)
router.get('/materiais', requireAuth, listMateriais)

// ---- BETs — acesso do afiliado ----
router.get('/bet-access/my', requireAuth, myBetsAccessHandler)
router.post('/bet-access', requireAuth, requestBetAccessHandler)

// ---- BETs — aprovação (TEAM_ADMIN ou SUPER_ADMIN) ----
router.get('/bet-access', requireAuth, requireRole('TEAM_ADMIN', 'SUPER_ADMIN'), listBetRequestsHandler)
router.patch('/bet-access/:id', requireAuth, requireRole('TEAM_ADMIN', 'SUPER_ADMIN'), reviewBetRequestHandler)

// ---- Equipe (TEAM_ADMIN ou SUPER_ADMIN) ----
router.get('/team', requireAuth, requireRole('TEAM_ADMIN', 'SUPER_ADMIN'), team)
router.patch('/team/:id/cpa', requireAuth, requireRole('TEAM_ADMIN', 'SUPER_ADMIN'), patchMemberCpa)

// ---- Aprovações de cadastro (TEAM_ADMIN ou SUPER_ADMIN) ----
router.get('/approvals', requireAuth, requireRole('TEAM_ADMIN', 'SUPER_ADMIN'), approvals)
router.patch('/approvals/:id', requireAuth, requireRole('TEAM_ADMIN', 'SUPER_ADMIN'), patchApproval)

// ---- Casas de aposta (SUPER_ADMIN) ----
router.get('/betting-houses', requireAuth, requireRole('SUPER_ADMIN'), listBettingHousesHandler)
router.post('/betting-houses', requireAuth, requireRole('SUPER_ADMIN'), createBettingHouseHandler)
router.patch('/betting-houses/:id', requireAuth, requireRole('SUPER_ADMIN'), updateBettingHouseHandler)
router.delete('/betting-houses/:id', requireAuth, requireRole('SUPER_ADMIN'), deleteBettingHouseHandler)

// ---- Sincronização (SUPER_ADMIN) ----
router.post('/sync/:houseSlug', requireAuth, requireRole('SUPER_ADMIN'), syncHouse)

// ---- Gestão de usuários (SUPER_ADMIN) ----
router.get('/users', requireAuth, requireRole('SUPER_ADMIN'), getUsersHandler)
router.patch('/users/:id/role', requireAuth, requireRole('SUPER_ADMIN'), patchUserRoleHandler)
router.patch('/users/:id/team', requireAuth, requireRole('SUPER_ADMIN'), patchUserTeamHandler)

// ---- Logs de atividade (SUPER_ADMIN) ----
router.get('/activity-logs', requireAuth, requireRole('SUPER_ADMIN'), listActivityLogsHandler)

export default router
