import type { GameState, PlayerId } from '@/engine/types'
import { determinize } from './determinize'
import { searchTurnLines } from './turnSearch'
import { mulberry32 } from '@/utils/rng'

/**
 * Hidden-information-honest recommendations: instead of reading the opponent's
 * actual hand, sample N worlds consistent with public information, run the
 * verified line search in each, and aggregate. A line is only as good as the
 * number of worlds it holds up in.
 */

export interface HonestLine {
  labels: string[]
  /** How many sampled worlds ranked this exact line best */
  worlds: number
  avgWorstCase: number
  /** Fraction of its worlds where the line was lethal */
  lethalRate: number
}

export interface HonestReport {
  worlds: number
  lines: HonestLine[]
  /** Fraction of worlds where SOME lethal line existed */
  lethalAvailable: number
}

export function honestLines(
  state: GameState,
  player: PlayerId,
  options: { worlds?: number; seed?: number } = {},
): HonestReport {
  const { worlds = 10, seed = 7 } = options
  const rand = mulberry32(seed)
  const byLine = new Map<string, { labels: string[]; scores: number[]; lethals: number }>()
  let lethalWorlds = 0

  for (let w = 0; w < worlds; w++) {
    const world = determinize(state, player, rand)
    const lines = searchTurnLines(world, player, { beamWidth: 16, verifyTop: 4, topK: 1 })
    if (lines.length === 0) continue
    const top = lines[0]
    if (top.lethal) lethalWorlds++
    const key = top.labels.join('→')
    const entry = byLine.get(key) ?? { labels: top.labels, scores: [], lethals: 0 }
    entry.scores.push(top.worstCase)
    if (top.lethal) entry.lethals++
    byLine.set(key, entry)
  }

  const lines: HonestLine[] = [...byLine.values()]
    .map((e) => ({
      labels: e.labels,
      worlds: e.scores.length,
      avgWorstCase: e.scores.reduce((a, b) => a + b, 0) / e.scores.length,
      lethalRate: e.lethals / e.scores.length,
    }))
    .sort((a, b) => b.worlds - a.worlds || b.avgWorstCase - a.avgWorstCase)
    .slice(0, 3)

  return { worlds, lines, lethalAvailable: lethalWorlds / worlds }
}
