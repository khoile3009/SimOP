/* Gate the punisher-ranked planner (M4.5 #2 commit-vs-hold dial) against the
 * incumbent worst-case-ranked planner. Seat-swapped on two base-deck pairs.
 * Run: vite-node scripts/gate-punish.ts [gamesPerSeat]
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

const mkPunish = (r: () => number): Agent =>
  new TurnPlannerAgent(r, { punish: true, rankBy: 'punished' })
const mkFlat = (r: () => number): Agent => new TurnPlannerAgent(r)

let pw = 0
let fw = 0
const t0 = Date.now()
for (const [l1, l2] of PAIRS) {
  const d1 = getBaseDeck(l1)!
  const d2 = getBaseDeck(l2)!
  const a = runMatch(games, mkPunish, mkFlat, d1, d2, 55 + l1.length)
  pw += a.wins.player1
  fw += a.wins.player2
  const b = runMatch(games, mkFlat, mkPunish, d1, d2, 99 + l1.length)
  pw += b.wins.player2
  fw += b.wins.player1
}
const secs = ((Date.now() - t0) / 1000).toFixed(0)
console.log(
  `planner: punished ${pw} - ${fw} flat (${((100 * pw) / Math.max(1, pw + fw)).toFixed(0)}%) · ${secs}s`,
)
