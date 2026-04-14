// ============================================================
// REGISTRO DE ADAPTERS — Casas de Aposta
// ============================================================
// Para adicionar uma nova casa de aposta:
//   1. Crie o arquivo: src/services/integrations/nome-da-casa.ts
//   2. Implemente a interface BettingHouseAdapter
//   3. Importe e registre aqui no mapa abaixo
//
// O slug deve bater exatamente com o campo slug na tabela
// betting_houses do banco de dados.
// ============================================================

import { BettingHouseAdapter } from './betting-house.interface'
import { Superbet3CAdapter } from './superbet3c'

// Mapa de adapters por slug
const adapters: Record<string, BettingHouseAdapter> = {
  superbet3c: new Superbet3CAdapter(),

  // Adicionar novas casas aqui:
  // novahouse: new NovaHouseAdapter(),
}

/**
 * Retorna o adapter para uma casa de aposta pelo slug.
 * Lança erro se o adapter não estiver registrado.
 */
export function getAdapter(slug: string): BettingHouseAdapter {
  const adapter = adapters[slug]
  if (!adapter) {
    throw new Error(
      `Adapter não encontrado para a casa: "${slug}". Registre em src/services/integrations/index.ts`
    )
  }
  return adapter
}

/**
 * Lista todos os adapters registrados.
 */
export function listAdapters(): BettingHouseAdapter[] {
  return Object.values(adapters)
}
