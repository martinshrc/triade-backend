// ============================================================
// ADAPTER — Superbet 3C
// ============================================================
// Status: STUB — aguardando documentação da API
//
// Quando receber a documentação:
//   1. Preencha API_BASE_URL, API_KEY, API_SECRET no .env
//   2. Substitua os métodos abaixo com as chamadas reais
//   3. Ajuste os tipos em PlayerStats se a API retornar
//      campos diferentes (ex: netRevenue, GGR, etc.)
// ============================================================

import axios from 'axios'
import { BettingHouseAdapter, PlayerStats, SyncOptions } from './betting-house.interface'

export class Superbet3CAdapter implements BettingHouseAdapter {
  readonly name = 'Superbet 3C'
  readonly slug = 'superbet3c'

  // Instância do axios configurada para esta casa
  // Ajustar baseURL, headers e auth conforme a documentação
  private readonly http = axios.create({
    baseURL: process.env.SUPERBET_API_BASE_URL ?? '',
    headers: {
      // Ajustar conforme a API exigir:
      // 'Authorization': `Bearer ${process.env.SUPERBET_API_KEY}`,
      // 'X-Api-Key': process.env.SUPERBET_API_KEY,
      'Content-Type': 'application/json',
    },
    timeout: 10_000, // 10 segundos
  })

  // ----------------------------------------------------------
  // fetchPlayerStats
  // Busca registros, CPAs, FTDs e depósitos do período
  // ----------------------------------------------------------
  async fetchPlayerStats(options: SyncOptions): Promise<PlayerStats[]> {
    // TODO: implementar quando receber a documentação da API
    //
    // Exemplo de como ficará (ajustar endpoint e payload):
    //
    // const response = await this.http.get('/affiliates/stats', {
    //   params: {
    //     ref: options.affiliateRefCode,
    //     from: options.startDate.toISOString(),
    //     to: options.endDate.toISOString(),
    //   },
    // })
    //
    // return response.data.players.map((p: any) => ({
    //   playerId: p.id,
    //   registrations: p.registrations,
    //   cpas: p.cpas,
    //   ftds: p.ftds,
    //   deposits: p.total_deposits,
    // }))

    throw new Error(
      `[${this.name}] API ainda não configurada. Preencha SUPERBET_API_BASE_URL e SUPERBET_API_KEY no .env`
    )
  }

  // ----------------------------------------------------------
  // fetchPlayerId
  // Busca o ID de um jogador pelo e-mail
  // ----------------------------------------------------------
  async fetchPlayerId(email: string): Promise<string | null> {
    // TODO: implementar quando receber a documentação da API
    //
    // Exemplo:
    // const response = await this.http.get(`/players/search?email=${email}`)
    // return response.data.player_id ?? null

    throw new Error(
      `[${this.name}] API ainda não configurada. Preencha SUPERBET_API_BASE_URL e SUPERBET_API_KEY no .env`
    )
  }

  // ----------------------------------------------------------
  // ping
  // Verifica se a API está acessível
  // ----------------------------------------------------------
  async ping(): Promise<boolean> {
    if (!process.env.SUPERBET_API_BASE_URL) {
      return false
    }
    try {
      // TODO: ajustar para o endpoint de health da API
      await this.http.get('/ping')
      return true
    } catch {
      return false
    }
  }
}
