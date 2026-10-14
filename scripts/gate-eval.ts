/* A/B gate for eval changes (BOT_PLAN P0/P2): the adoption decision.
 * Default: NEW = current HAND_WEIGHTS, OLD = same with defenseShortfallDiff
 * zeroed (the P0 gate). With a weights-file arg: NEW = those fitted weights,
 * OLD = the hand weights (the gen-3 gate).
 * Seat-swapped, base-deck pairs, greedy and MCTS consumers.
 * Run: vite-node scripts/gate-eval.ts [gamesGreedy] [gamesMcts] [weightsFile]
 */
import { readFileSync } from 'node:fs'
import { HAND_WEIGHTS, makeEval, type EvalFn, type Weights } from '@/ai/evaluate'
import { makeMlpEval, type MlpModel } from '@/ai/mlpEval'
import { createWriteStream, mkdirSync } from 'node:fs'
import { runGate, legPct } from '@/sim/evalGate'

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

console.log(
  weightsFile
    ? `gate: ${weightsFile} vs ${oldWeightsFile ?? 'hand weights'}`
    : `gate: defenseShortfallDiff ${HAND_WEIGHTS.defenseShortfallDiff} vs 0`,
)
mkdirSync('data', { recursive: true })
const flywheel = createWriteStream('data/flywheel.jsonl', { flags: 'a' })
const r = runGate(NEW, OLD, { gamesGreedy, gamesMcts, flywheelSink: (l) => flywheel.write(l) })
flywheel.end()
for (const [label, leg] of [
  ['greedy', r.greedy],
  ['mcts  ', r.mcts],
] as const) {
  const total = leg.newWins + leg.oldWins
  console.log(
    `${label}: NEW ${leg.newWins} - OLD ${leg.oldWins}  (${legPct(leg).toFixed(0)}% for NEW, ${total} decisive)`,
  )
}
