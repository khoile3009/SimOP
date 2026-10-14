import type { Weights } from '@/ai/evaluate'
import v0 from './v0.json'
import v1 from './v1.json'

/**
 * The agent league (BOT_PLAN 4.1): every adopted eval is frozen here as an
 * immutable snapshot. A candidate is adopted only when it beats a QUORUM of
 * the league (scripts/league.ts), not just the latest champion - this blocks
 * cycling (A>B, B>C, C>A) and silent regressions against older styles.
 * History of runs: src/ai/league/history.json (committed - the strength
 * record over time).
 */
export interface LeagueMember {
  id: string
  frozen: string
  notes: string
  weights: Weights
}

export const LEAGUE: LeagueMember[] = [v0 as LeagueMember, v1 as LeagueMember]

/** The adoption signature from the P0/P0b precedents: the deep-search consumer
 * must clearly improve while greedy stays within noise. */
export function beatsMember(greedyPct: number, mctsPct: number): boolean {
  return mctsPct >= 55 && greedyPct >= 45
}

/** A catastrophic loss to ANY member vetoes adoption outright. */
export function vetoedByMember(mctsPct: number): boolean {
  return mctsPct < 40
}
