/* Gate the playing-to-outs planner (M4.5 #4) against the same planner with
 * the desperation switch disabled. The mode only fires in losing positions,
 * so the signal is "flipped losses", not a broad rate shift.
 * Run: vite-node scripts/gate-outs.ts [gamesPerSeat]
 */
import { runMatch } from '@/sim/selfplay'
import { getBaseDeck } from '@/sim/baseDecks'
import { TurnPlannerAgent } from '@/ai/turnSearch'
import type { Agent } from '@/ai/agents'

const games = Number(process.argv[2] ?? 12)

const PAIRS: [string, string][] = [
  ['base-enel', 'base-luffy-bg'],
  ['base-teach', 'base-ace-red'],
]

const mkOuts = (r: () => number): Agent => new TurnPlannerAgent(r)
const mkFlat = (r: () => number): Agent => new TurnPlannerAgent(r, { outsThreshold: 0 })

let ow = 0
let fw = 0
const t0 = Date.now()
for (const [l1, l2] of PAIRS) {
  const d1 = getBaseDeck(l1)!
  const d2 = getBaseDeck(l2)!
  const a = runMatch(games, mkOuts, mkFlat, d1, d2, 47 + l1.length)
  ow += a.wins.player1
  fw += a.wins.player2
  const b = runMatch(games, mkFlat, mkOuts, d1, d2, 88 + l1.length)
  ow += b.wins.player2
  fw += b.wins.player1
}
const secs = ((Date.now() - t0) / 1000).toFixed(0)
console.log(
  `planner: outs ${ow} - ${fw} flat (${((100 * ow) / Math.max(1, ow + fw)).toFixed(0)}%) · ${secs}s`,
)
