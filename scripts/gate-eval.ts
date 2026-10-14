/* A/B gate for eval changes (BOT_PLAN P0/P2): the adoption decision.
 * Default: NEW = current HAND_WEIGHTS, OLD = same with defenseShortfallDiff
 * zeroed (the P0 gate). With a weights-file arg: NEW = those fitted weights,
 * OLD = the hand weights (the gen-3 gate).
 * Seat-swapped, base-deck pairs, greedy and MCTS consumers.
 * Run: vite-node scripts/gate-eval.ts [gamesGreedy] [gamesMcts] [weightsFile]
 */
import { readFileSync } from 'node:fs'
import { runMatch } from '@/sim/selfplay'
import { getBaseDeck } from '@/sim/baseDecks'
import { GreedyAgent } from '@/ai/agents'
import { MctsAgent } from '@/ai/mcts'
import { HAND_WEIGHTS, makeEval, type EvalFn, type Weights } from '@/ai/evaluate'
import { makeMlpEval, type MlpModel } from '@/ai/mlpEval'

const gamesGreedy = Number(process.argv[2] ?? 60)
const gamesMcts = Number(process.argv[3] ?? 16)
const weightsFile = process.argv[4]
const oldWeightsFile = process.argv[5]

const loadEval = (spec: string): EvalFn => {
  if (spec === 'hand') return makeEval(HAND_WEIGHTS)
  const json = JSON.parse(readFileSync(spec, 'utf8'))
  if (json.kind === 'mlp') return makeMlpEval(json as MlpModel)
  return makeEval(json.weights as Weights)
}

const NEW = weightsFile ? loadEval(weightsFile) : makeEval(HAND_WEIGHTS)
const OLD = oldWeightsFile
  ? loadEval(oldWeightsFile)
  : weightsFile
    ? makeEval(HAND_WEIGHTS)
    : makeEval({ ...HAND_WEIGHTS, defenseShortfallDiff: 0 })

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

console.log(
  weightsFile
    ? `gate: ${weightsFile} vs ${oldWeightsFile ?? 'hand weights'}`
    : `gate: defenseShortfallDiff ${HAND_WEIGHTS.defenseShortfallDiff} vs 0`,
)
leg('greedy', gamesGreedy, (ev) => (rand) => new GreedyAgent(rand, ev))
leg('mcts  ', gamesMcts, (ev) => (rand) => new MctsAgent(rand, { evalFn: ev }))
