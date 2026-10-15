/* Gate belief-weighted determinization (worlds must explain the opponent's
 * observed defense pattern) for both honest agents, vs uniform sampling.
 * Run: vite-node scripts/gate-belief.ts [honestGamesPerSeat] [ismctsGamesPerSeat]
 */
import { runMatch } from '@/sim/selfplay'
import { getBaseDeck } from '@/sim/baseDecks'
import { HonestMctsAgent } from '@/ai/honestMcts'
import { IsMctsAgent } from '@/ai/ismcts'
import type { Agent } from '@/ai/agents'

const honestGames = Number(process.argv[2] ?? 8)
const ismctsGames = Number(process.argv[3] ?? 5)

const PAIRS: [string, string][] = [
  ['base-enel', 'base-luffy-bg'],
  ['base-teach', 'base-ace-red'],
]

function leg(label: string, n: number, mkNew: (r: () => number) => Agent, mkOld: (r: () => number) => Agent) {
  let nw = 0
  let ow = 0
  const t0 = Date.now()
  for (const [l1, l2] of PAIRS) {
    const d1 = getBaseDeck(l1)!
    const d2 = getBaseDeck(l2)!
    const a = runMatch(n, mkNew, mkOld, d1, d2, 29 + l1.length)
    nw += a.wins.player1
    ow += a.wins.player2
    const b = runMatch(n, mkOld, mkNew, d1, d2, 58 + l1.length)
    nw += b.wins.player2
    ow += b.wins.player1
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(0)
  console.log(`${label}: belief ${nw} - ${ow} (${((100 * nw) / Math.max(1, nw + ow)).toFixed(0)}%) · ${secs}s`)
}

leg('honest', honestGames, (r) => new HonestMctsAgent(r, { belief: true }), (r) => new HonestMctsAgent(r))
leg('ismcts', ismctsGames, (r) => new IsMctsAgent(r, { belief: true }), (r) => new IsMctsAgent(r))
