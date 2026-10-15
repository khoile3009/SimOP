/* Gate the chance-node MCTS (M4.5 #3) against the clairvoyant incumbent.
 * Seat-swapped on two base-deck pairs; also times moves for the wall-clock
 * budget check (spec allows ~2-3x per move).
 * Run: vite-node scripts/gate-chance.ts [gamesPerSeat] [honestGamesPerSeat]
 */
import { runMatch } from '@/sim/selfplay'
import { getBaseDeck } from '@/sim/baseDecks'
import { MctsAgent } from '@/ai/mcts'
import { HonestMctsAgent } from '@/ai/honestMcts'
import type { Agent } from '@/ai/agents'

const games = Number(process.argv[2] ?? 10)
const honestGames = Number(process.argv[3] ?? 4)

const PAIRS: [string, string][] = [
  ['base-enel', 'base-luffy-bg'],
  ['base-teach', 'base-ace-red'],
]

function leg(
  label: string,
  n: number,
  mkNew: (r: () => number) => Agent,
  mkOld: (r: () => number) => Agent,
) {
  let nw = 0
  let ow = 0
  const t0 = Date.now()
  for (const [l1, l2] of PAIRS) {
    const d1 = getBaseDeck(l1)!
    const d2 = getBaseDeck(l2)!
    const a = runMatch(n, mkNew, mkOld, d1, d2, 33 + l1.length)
    nw += a.wins.player1
    ow += a.wins.player2
    const b = runMatch(n, mkOld, mkNew, d1, d2, 77 + l1.length)
    nw += b.wins.player2
    ow += b.wins.player1
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(0)
  console.log(
    `${label}: chance ${nw} - ${ow} flat (${((100 * nw) / Math.max(1, nw + ow)).toFixed(0)}%) · ${secs}s`,
  )
}

leg(
  'mcts  ',
  games,
  (r) => new MctsAgent(r, { chance: true }),
  (r) => new MctsAgent(r, { chance: false }),
)
leg(
  'honest',
  honestGames,
  (r) => new HonestMctsAgent(r, { chance: true }),
  (r) => new HonestMctsAgent(r, { chance: false }),
)
