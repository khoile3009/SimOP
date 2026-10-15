/* Gate IS-MCTS (one shared info-set tree, fresh world per iteration) against
 * the PIMC honest agent and the oracle, budget-matched (2000 iters vs 4x500).
 * Run: vite-node scripts/gate-ismcts.ts [gamesPerSeat] [oracleGamesPerSeat]
 */
import { runMatch } from '@/sim/selfplay'
import { getBaseDeck } from '@/sim/baseDecks'
import { MctsAgent } from '@/ai/mcts'
import { HonestMctsAgent } from '@/ai/honestMcts'
import { IsMctsAgent } from '@/ai/ismcts'
import type { Agent } from '@/ai/agents'

const games = Number(process.argv[2] ?? 8)
const oracleGames = Number(process.argv[3] ?? 6)

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
    const a = runMatch(n, mkNew, mkOld, d1, d2, 13 + l1.length)
    nw += a.wins.player1
    ow += a.wins.player2
    const b = runMatch(n, mkOld, mkNew, d1, d2, 14 + l1.length)
    nw += b.wins.player2
    ow += b.wins.player1
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(0)
  console.log(`${label}: ismcts ${nw} - ${ow} (${((100 * nw) / Math.max(1, nw + ow)).toFixed(0)}%) · ${secs}s`)
}

leg('vs honest (PIMC 4x500)', games, (r) => new IsMctsAgent(r), (r) => new HonestMctsAgent(r))
leg('vs oracle mcts        ', oracleGames, (r) => new IsMctsAgent(r), (r) => new MctsAgent(r))
