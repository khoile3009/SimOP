/* Policy-prior sweep (BOT_PLAN: PUCT priors). Three-stage finding, Oct 2026:
 * 1. AlphaZero sqrt-form PUCT LOSES to UCB1 here even with UNIFORM priors
 *    (19-38% across cPuct 0.25-4) - deterministic eval leaves want UCB1's
 *    log exploration, so the engine uses prior-weighted UCB1 instead
 *    (tilt = 1 + cPuct·(k·P - 1); uniform prior == incumbent exactly).
 * 2. Form check: uniform prior at mix 1.0 = 46% (seed noise, as expected).
 * 3. The recycled gen-3 rank model is HARMFUL as a prior, monotonically in
 *    mix strength: 42% at 0.5, 29-33% at 1.0 - its corpus is search-over-
 *    the-hand-eval choices, so it double-counts the teacher's biases and
 *    adds no ordering information. Machinery kept (MctsOptions.prior),
 *    default OFF; a future prior needs information the eval lacks.
 * Run: vite-node scripts/tune-prior.ts [gamesPerSeat]
 */
import { runMatch } from '@/sim/selfplay'
import { getBaseDeck } from '@/sim/baseDecks'
import { MctsAgent } from '@/ai/mcts'
import type { Agent } from '@/ai/agents'

const games = Number(process.argv[2] ?? 6)
const PAIRS: [string, string][] = [
  ['base-enel', 'base-luffy-bg'],
  ['base-teach', 'base-ace-red'],
]
const uniform = () => 0

const CONFIGS: [string, (r: () => number) => Agent][] = [
  ['uniform mix 1.0 (form check)', (r) => new MctsAgent(r, { prior: uniform, cPuct: 1 })],
  ['rank mix 0.5 temp 2', (r) => new MctsAgent(r, { prior: true, cPuct: 0.5, priorTemp: 2 })],
  ['rank mix 1.0 temp 2', (r) => new MctsAgent(r, { prior: true, cPuct: 1, priorTemp: 2 })],
  ['rank mix 1.0 temp 1', (r) => new MctsAgent(r, { prior: true, cPuct: 1, priorTemp: 1 })],
]
const mkFlat = (r: () => number): Agent => new MctsAgent(r)

for (const [name, mk] of CONFIGS) {
  let cw = 0
  let fw = 0
  for (const [l1, l2] of PAIRS) {
    const d1 = getBaseDeck(l1)!
    const d2 = getBaseDeck(l2)!
    const a = runMatch(games, mk, mkFlat, d1, d2, 81 + l1.length)
    cw += a.wins.player1
    fw += a.wins.player2
    const b = runMatch(games, mkFlat, mk, d1, d2, 82 + l1.length)
    cw += b.wins.player2
    fw += b.wins.player1
  }
  console.log(`${name}: ${cw}-${fw} (${((100 * cw) / Math.max(1, cw + fw)).toFixed(0)}%)`)
}
