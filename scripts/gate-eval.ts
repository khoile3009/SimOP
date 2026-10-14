/* A/B gate for hand-weight eval changes (BOT_PLAN P0).
 * NEW = current HAND_WEIGHTS; OLD = same weights with the feature under test
 * zeroed. Seat-swapped, cross-deck, greedy and MCTS consumers.
 * Run: vite-node scripts/gate-eval.ts [gamesGreedy] [gamesMcts]
 */
import { runMatch } from '@/sim/selfplay'
import { getBaseDeck } from '@/sim/baseDecks'
import { GreedyAgent } from '@/ai/agents'
import { MctsAgent } from '@/ai/mcts'
import { HAND_WEIGHTS, makeEval, type EvalFn } from '@/ai/evaluate'

const gamesGreedy = Number(process.argv[2] ?? 60)
const gamesMcts = Number(process.argv[3] ?? 16)

const NEW = makeEval(HAND_WEIGHTS)
const OLD = makeEval({ ...HAND_WEIGHTS, defenseShortfallDiff: 0 })

const DECK_PAIRS: [string, string][] = [
  ['base-enel', 'base-luffy-bg'],
  ['base-teach', 'base-ace-red'],
  ['base-kalgara', 'base-lucy'],
]

function leg(
  label: string,
  games: number,
  mk: (ev: EvalFn) => (rand: () => number) => ReturnType<typeof Object>,
) {
  let newWins = 0
  let oldWins = 0
  for (const [l1, l2] of DECK_PAIRS) {
    const d1 = getBaseDeck(l1)!
    const d2 = getBaseDeck(l2)!
    // NEW as player1
    const a = runMatch(games, mk(NEW) as never, mk(OLD) as never, d1, d2, 11)
    newWins += a.wins.player1
    oldWins += a.wins.player2
    // seats swapped
    const b = runMatch(games, mk(OLD) as never, mk(NEW) as never, d1, d2, 77)
    newWins += b.wins.player2
    oldWins += b.wins.player1
  }
  const total = newWins + oldWins
  console.log(
    `${label}: NEW ${newWins} - OLD ${oldWins}  (${((100 * newWins) / Math.max(1, total)).toFixed(0)}% for NEW, ${total} decisive)`,
  )
}

console.log(`gate: defenseShortfallDiff ${HAND_WEIGHTS.defenseShortfallDiff} vs 0`)
leg('greedy', gamesGreedy, (ev) => (rand) => new GreedyAgent(rand, ev))
leg('mcts  ', gamesMcts, (ev) => (rand) => new MctsAgent(rand, { evalFn: ev }))
