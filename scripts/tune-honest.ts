/* Tune the honest agent's worlds-vs-depth split against mcts and planner.
 * Run: vite-node scripts/tune-honest.ts [gamesPerLeg]
 */
import { runMatch } from '@/sim/selfplay'
import { getBaseDeck } from '@/sim/baseDecks'
import { MctsAgent } from '@/ai/mcts'
import { TurnPlannerAgent } from '@/ai/turnSearch'
import { HonestMctsAgent } from '@/ai/honestMcts'
import type { Agent } from '@/ai/agents'

const games = Number(process.argv[2] ?? 16)
const d1 = getBaseDeck('base-enel')!
const d2 = getBaseDeck('base-luffy-bg')!

const CONFIGS: [string, (r: () => number) => Agent][] = [
  ['honest 3x300', (r) => new HonestMctsAgent(r, { worlds: 3, iterations: 300 })],
  ['honest 6x300', (r) => new HonestMctsAgent(r, { worlds: 6, iterations: 300 })],
  ['honest 4x500', (r) => new HonestMctsAgent(r, { worlds: 4, iterations: 500 })],
]
const OPPONENTS: [string, (r: () => number) => Agent][] = [
  ['mcts', (r) => new MctsAgent(r)],
  ['planner', (r) => new TurnPlannerAgent(r)],
]

for (const [cname, mkC] of CONFIGS) {
  for (const [oname, mkO] of OPPONENTS) {
    let cw = 0
    let ow = 0
    const a = runMatch(games, mkC, mkO, d1, d2, 21)
    cw += a.wins.player1
    ow += a.wins.player2
    const b = runMatch(games, mkO, mkC, d1, d2, 84)
    cw += b.wins.player2
    ow += b.wins.player1
    console.log(
      `${cname} vs ${oname}: ${cw}-${ow} (${((100 * cw) / Math.max(1, cw + ow)).toFixed(0)}%)`,
    )
  }
}
