import type { Deck, PlayerId } from '@/engine/types'
import type { Agent } from '@/ai/agents'
import { RandomAgent, GreedyAgent } from '@/ai/agents'
import { TurnPlannerAgent } from '@/ai/turnSearch'
import { MctsAgent } from '@/ai/mcts'
import { runGame, makeAutoDeck } from './selfplay'
import { mulberry32 } from '@/utils/rng'

/**
 * Bot strength benchmark: round-robin between agent tiers on a mirror deck
 * (same 50 cards both sides, so only agent skill differs), seat-swapped every
 * other game so first-player advantage cancels, seeded for reproducibility.
 */

export type AgentKind = 'random' | 'greedy' | 'planner' | 'mcts'

export const AGENT_FACTORIES: Record<AgentKind, (rand: () => number) => Agent> = {
  random: (rand) => new RandomAgent(rand),
  greedy: (rand) => new GreedyAgent(rand),
  planner: (rand) => new TurnPlannerAgent(rand),
  mcts: (rand) => new MctsAgent(rand),
}

export interface PairResult {
  a: AgentKind
  b: AgentKind
  games: number
  aWins: number
  bWins: number
  draws: number
  avgTurns: number
  msPerGame: number
}

export interface BenchmarkReport {
  gamesPerPair: number
  pairs: PairResult[]
  /** Overall win rate per agent across all its games */
  winRates: Record<string, number>
}

export interface LadderEntry {
  name: string
  factory: (rand: () => number) => Agent
}

/**
 * Head-to-head between two arbitrary agent configurations (e.g. the same
 * search with different eval weights), seat-swapped, optionally rotating
 * through non-mirror deck pairs so matchup-conditional features can show up.
 */
export function runHeadToHead(
  a: LadderEntry,
  b: LadderEntry,
  games: number,
  options: { baseSeed?: number; deckPairs?: [Deck, Deck][] } = {},
): { aWins: number; bWins: number; draws: number; avgTurns: number; msPerGame: number } {
  const { baseSeed = 6060, deckPairs = [[makeAutoDeck('OP01-001'), makeAutoDeck('OP01-001')]] } =
    options
  let aWins = 0
  let bWins = 0
  let draws = 0
  let turns = 0
  const started = Date.now()

  for (let g = 0; g < games; g++) {
    const seed = baseSeed + g * 7919
    const [deck1, deck2] = deckPairs[g % deckPairs.length]
    const aSeat: PlayerId = g % 2 === 0 ? 'player1' : 'player2'
    const record = runGame({
      deck1,
      deck2,
      agent1: (aSeat === 'player1' ? a : b).factory(mulberry32(seed ^ 0xa5a5a5)),
      agent2: (aSeat === 'player1' ? b : a).factory(mulberry32(seed ^ 0x5a5a5a)),
      seed,
    })
    turns += record.turnCount
    if (!record.winner) draws++
    else if (record.winner === aSeat) aWins++
    else bWins++
  }
  return {
    aWins,
    bWins,
    draws,
    avgTurns: turns / games,
    msPerGame: (Date.now() - started) / games,
  }
}

export function runBenchmark(
  kinds: AgentKind[],
  gamesPerPair: number,
  baseSeed = 2026,
  deck: Deck = makeAutoDeck('OP01-001'),
): BenchmarkReport {
  const pairs: PairResult[] = []
  const totals = new Map<AgentKind, { wins: number; games: number }>()
  for (const k of kinds) totals.set(k, { wins: 0, games: 0 })

  for (let i = 0; i < kinds.length; i++) {
    for (let j = i + 1; j < kinds.length; j++) {
      const a = kinds[i]
      const b = kinds[j]
      let aWins = 0
      let bWins = 0
      let draws = 0
      let turns = 0
      const started = Date.now()

      for (let g = 0; g < gamesPerPair; g++) {
        const seed = baseSeed + g * 7919
        // Seat swap every other game so going first cancels out
        const aSeat: PlayerId = g % 2 === 0 ? 'player1' : 'player2'
        const record = runGame({
          deck1: deck,
          deck2: deck,
          agent1: AGENT_FACTORIES[aSeat === 'player1' ? a : b](mulberry32(seed ^ 0xa5a5a5)),
          agent2: AGENT_FACTORIES[aSeat === 'player1' ? b : a](mulberry32(seed ^ 0x5a5a5a)),
          seed,
        })
        turns += record.turnCount
        if (!record.winner) draws++
        else if (record.winner === aSeat) aWins++
        else bWins++
      }

      pairs.push({
        a,
        b,
        games: gamesPerPair,
        aWins,
        bWins,
        draws,
        avgTurns: turns / gamesPerPair,
        msPerGame: (Date.now() - started) / gamesPerPair,
      })
      totals.get(a)!.wins += aWins
      totals.get(a)!.games += gamesPerPair
      totals.get(b)!.wins += bWins
      totals.get(b)!.games += gamesPerPair
    }
  }

  const winRates: Record<string, number> = {}
  for (const [k, t] of totals) winRates[k] = t.games > 0 ? t.wins / t.games : 0
  return { gamesPerPair, pairs, winRates }
}
