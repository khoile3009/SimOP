/**
 * League gate (BOT_PLAN 4.1): run a candidate eval against every league member
 * and record the verdict in src/ai/league/history.json.
 *
 *   vite-node scripts/league.ts <candidate> [gamesGreedy] [gamesMcts]
 *
 * <candidate> is a weights file (linear {weights} or kind:'mlp'), or 'hand'
 * for the live HAND_WEIGHTS. Members whose weights equal the candidate are
 * skipped (no self-play). Adoption requires beating a MAJORITY of members on
 * the P0/P0b signature (mcts >= 55%, greedy >= 45%) with no catastrophic loss
 * (mcts < 40%) to anyone. MCTS legs feed the data flywheel automatically.
 */
import { readFileSync, writeFileSync, existsSync, createWriteStream, mkdirSync } from 'node:fs'
import { HAND_WEIGHTS, makeEval, type Weights, type EvalFn } from '@/ai/evaluate'
import { makeMlpEval, type MlpModel } from '@/ai/mlpEval'
import { LEAGUE, beatsMember, vetoedByMember } from '@/ai/league/members'
import { runGate, legPct } from '@/sim/evalGate'

const candidateSpec = process.argv[2] ?? 'hand'
const gamesGreedy = Number(process.argv[3] ?? 40)
const gamesMcts = Number(process.argv[4] ?? 10)

function loadEval(spec: string): { ev: EvalFn; weights: Weights | null; label: string } {
  if (spec === 'hand') return { ev: makeEval(HAND_WEIGHTS), weights: HAND_WEIGHTS, label: 'hand' }
  const json = JSON.parse(readFileSync(spec, 'utf8'))
  if (json.kind === 'mlp') return { ev: makeMlpEval(json as MlpModel), weights: null, label: spec }
  return { ev: makeEval(json.weights as Weights), weights: json.weights as Weights, label: spec }
}

const sameWeights = (a: Weights | null, b: Weights) => {
  if (!a) return false
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) if ((a[k] ?? 0) !== (b[k] ?? 0)) return false
  return true
}

const candidate = loadEval(candidateSpec)
console.log(`league gate: ${candidate.label} vs ${LEAGUE.length} member(s)`)

const results: {
  member: string
  greedy: string
  mcts: string
  greedyPct: number
  mctsPct: number
  beaten: boolean
  veto: boolean
}[] = []

for (const member of LEAGUE) {
  if (sameWeights(candidate.weights, member.weights)) {
    console.log(`  ${member.id}: skipped (candidate IS this member)`)
    continue
  }
  mkdirSync('data', { recursive: true })
  const flywheel = createWriteStream('data/flywheel.jsonl', { flags: 'a' })
  const r = runGate(candidate.ev, makeEval(member.weights), {
    gamesGreedy,
    gamesMcts,
    flywheelSink: (l) => flywheel.write(l),
  })
  flywheel.end()
  const gp = legPct(r.greedy)
  const mp = legPct(r.mcts)
  const beaten = beatsMember(gp, mp)
  const veto = vetoedByMember(mp)
  results.push({
    member: member.id,
    greedy: `${r.greedy.newWins}-${r.greedy.oldWins}`,
    mcts: `${r.mcts.newWins}-${r.mcts.oldWins}`,
    greedyPct: Math.round(gp),
    mctsPct: Math.round(mp),
    beaten,
    veto,
  })
  console.log(
    `  vs ${member.id}: greedy ${r.greedy.newWins}-${r.greedy.oldWins} (${gp.toFixed(0)}%) · mcts ${r.mcts.newWins}-${r.mcts.oldWins} (${mp.toFixed(0)}%)` +
      `${beaten ? ' · BEATEN' : ''}${veto ? ' · VETO' : ''}`,
  )
}

const beatenCount = results.filter((r) => r.beaten).length
const vetoed = results.some((r) => r.veto)
const verdict =
  results.length === 0
    ? 'self'
    : vetoed
      ? 'REJECTED (veto)'
      : beatenCount > results.length / 2
        ? 'ADOPT'
        : 'REJECTED (no quorum)'
console.log(`\nverdict: ${verdict} (${beatenCount}/${results.length} members beaten)`)

const historyPath = 'src/ai/league/history.json'
const history: object[] = existsSync(historyPath)
  ? JSON.parse(readFileSync(historyPath, 'utf8'))
  : []
history.push({
  at: new Date().toISOString(),
  candidate: candidate.label,
  gamesGreedy,
  gamesMcts,
  results,
  verdict,
})
writeFileSync(historyPath, JSON.stringify(history, null, 2) + '\n')
console.log(`history appended: ${historyPath}`)
