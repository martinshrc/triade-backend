// ============================================================
// INTERFACE BASE — Integração com Casas de Aposta
// ============================================================
// Toda nova casa de aposta deve implementar esta interface.
// Isso garante que o código da aplicação funcione da mesma
// forma independente de qual API está sendo usada.
//
// Como adicionar uma nova casa:
//   1. Crie src/services/integrations/nome-da-casa.ts
//   2. Implemente a interface BettingHouseAdapter
//   3. Registre no src/services/integrations/index.ts
// ============================================================

export interface PlayerStats {
  playerId: string           // ID do jogador na casa de aposta
  registrations: number      // quantidade de cadastros
  cpas: number               // CPAs confirmados
  ftds: number               // First Time Deposits
  deposits: number           // valor total depositado (R$)
  // Adicionar outros campos conforme a API retornar dados adicionais
}

export interface SyncOptions {
  startDate: Date
  endDate: Date
  affiliateRefCode: string   // código ref do afiliado
}

export interface BettingHouseAdapter {
  /**
   * Nome legível da casa de aposta.
   * Usado em logs e mensagens de erro.
   */
  readonly name: string

  /**
   * Slug único da casa (deve bater com o campo slug no banco).
   * Usado para identificar qual adapter usar.
   */
  readonly slug: string

  /**
   * Busca estatísticas de jogadores indicados pelo afiliado
   * em um determinado período.
   *
   * Implementar quando receber a documentação da API.
   */
  fetchPlayerStats(options: SyncOptions): Promise<PlayerStats[]>

  /**
   * Busca o ID de um jogador específico na casa de aposta.
   * Útil para vincular usuários do painel com jogadores da bet.
   *
   * Implementar quando receber a documentação da API.
   */
  fetchPlayerId(email: string): Promise<string | null>

  /**
   * Verifica se a API da casa está acessível.
   * Útil para health check.
   */
  ping(): Promise<boolean>
}
