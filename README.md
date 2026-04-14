# Tríade Painel — Backend

API REST em Node.js + TypeScript conectada a PostgreSQL via Prisma ORM.

---

## Requisitos

- Node.js 18+
- PostgreSQL (Docker já configurado)

---

## Setup

```bash
cd backend
npm install
npm run db:generate   # gera o Prisma Client
npm run db:migrate    # cria as tabelas no banco
npm run db:seed       # insere dados iniciais
npm run dev           # inicia em modo desenvolvimento
```

---

## Variáveis de ambiente (`.env`)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `PORT` | Porta do servidor (padrão: 3333) |
| `NODE_ENV` | `development` ou `production` |
| `SUPERBET_API_BASE_URL` | URL base da API do Superbet — preencher quando receber docs |
| `SUPERBET_API_KEY` | Chave de autenticação da API |
| `SUPERBET_API_SECRET` | Secret da API (se necessário) |

---

## Endpoints

Todos os endpoints usam prefixo `/api`.

Por enquanto o `userId` é passado via query string. Quando autenticação for implementada, virá do token JWT.

### Health
```
GET /api/health
```

### Dashboard
```
GET /api/dashboard?userId=1&period=30d
GET /api/dashboard?userId=1&from=2026-01-01&to=2026-04-13
```
Parâmetros `period`: `30d` | `7d` | `month`

### Rede
```
GET /api/network?userId=1&from=2026-01-01&to=2026-04-13
```

### Equipe
```
GET  /api/team?userId=1&page=1&limit=20
PATCH /api/team/:id/cpa
Body: { "cpaValue": 180 }
```

### Financeiro
```
GET   /api/financeiro?userId=1
PATCH /api/financeiro/pix?userId=1
Body: { "pixKeyType": "CNPJ", "pixKey": "12345678000100" }
```

### Links
```
GET /api/links?userId=1
```

### Aprovações
```
GET   /api/approvals?userId=1&status=PENDING&search=nome&page=1
PATCH /api/approvals/:id
Body: { "status": "APPROVED", "cpaValue": 180 }
```
Valores de `status`: `PENDING` | `APPROVED` | `REJECTED`

### Sync com Casa de Aposta
```
POST /api/sync/:houseSlug?userId=1
```
Exemplo: `POST /api/sync/superbet3c?userId=1`

> **Atenção:** retorna erro enquanto a API da casa não estiver configurada no `.env`.

---

## Como adicionar uma nova casa de aposta

1. Crie `src/services/integrations/nome-da-casa.ts`
2. Implemente a interface `BettingHouseAdapter`:

```typescript
export class NovaHouseAdapter implements BettingHouseAdapter {
  readonly name = 'Nome da Casa'
  readonly slug = 'novahouse'

  async fetchPlayerStats(options: SyncOptions): Promise<PlayerStats[]> {
    // chamar API e retornar dados
  }

  async fetchPlayerId(email: string): Promise<string | null> {
    // buscar ID do jogador por email
  }

  async ping(): Promise<boolean> {
    // verificar se API está online
  }
}
```

3. Registre em `src/services/integrations/index.ts`:

```typescript
import { NovaHouseAdapter } from './novahouse'

const adapters = {
  superbet3c: new Superbet3CAdapter(),
  novahouse: new NovaHouseAdapter(),  // ← adicionar aqui
}
```

4. Insira a casa no banco via seed ou migration.

5. Adicione as variáveis de ambiente no `.env`:
```
NOVAHOUSE_API_BASE_URL=
NOVAHOUSE_API_KEY=
```

---

## Estrutura de pastas

```
backend/
├── prisma/
│   ├── schema.prisma      ← modelo do banco de dados
│   ├── seed.ts            ← dados iniciais
│   └── migrations/        ← histórico de migrations
├── src/
│   ├── config/
│   │   └── database.ts    ← instância Prisma Client
│   ├── controllers/       ← recebem Request, chamam services
│   ├── services/
│   │   ├── *.service.ts   ← lógica de negócio e queries
│   │   └── integrations/  ← adapters das casas de aposta
│   ├── middlewares/
│   │   └── error.middleware.ts
│   ├── routes/
│   │   └── index.ts       ← mapeamento de rotas
│   └── index.ts           ← entry point
├── .env                   ← variáveis (não commitar)
├── .env.example           ← template das variáveis
└── package.json
```

---

## Próximos passos

- [ ] Implementar autenticação JWT
- [ ] Preencher adapters das casas de aposta quando receber documentação
- [ ] Conectar frontend com os endpoints (substituir dados hardcoded)
- [ ] Configurar CORS com domínio real em produção
