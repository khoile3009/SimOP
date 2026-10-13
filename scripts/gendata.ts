/**
 * Training data generator:
 *   npm run gendata -- 4000
 * Plays seeded games across the coverage decks with a greedy/planner agent mix
 * and writes one JSONL row per turn: { game, features, label } where label is
 * whether player1 (the featurized perspective) won that game. Rows carry the
 * game id so the trainer can split train/test BY GAME (rows within a game are
 * correlated - splitting by row would leak).
 */
import { mkdirSync, createWriteStream } from 'node:fs'
import { runGame } from '@/sim/selfplay'
import { buildCoverageDecks } from '@/sim/decks'
import { SET_MODULES } from '@/data/sets'
import { GreedyAgent, type Agent } from '@/ai/agents'
import { TurnPlannerAgent } from '@/ai/turnSearch'
import { featureVector } from '@/ai/evaluate'
import { mulberry32 } from '@/utils/rng'
import type { Features } from '@/ai/evaluate'

const games = Number(process.argv[2] ?? 4000)
// Shard support: `gendata -- 1000 2` plays games [2000, 3000) into train-2.jsonl
const shard = process.argv[3] !== undefined ? Number(process.argv[3]) : null
const offset = shard !== null ? shard * games : 0
// Planner-heavy data would be ideal but is ~20x slower; greedy-dominant with a
// planner and random sprinkle keeps labels meaningful and generation fast
// Gen-2: no random games - random-agent labels polluted gen-1's targets
const MIX: ((rand: () => number) => Agent)[][] = [
  [(r) => new GreedyAgent(r), (r) => new GreedyAgent(r)],
  [(r) => new GreedyAgent(r), (r) => new GreedyAgent(r)],
  [(r) => new GreedyAgent(r), (r) => new GreedyAgent(r)],
  [(r) => new GreedyAgent(r), (r) => new GreedyAgent(r)],
  [(r) => new TurnPlannerAgent(r), (r) => new GreedyAgent(r)],
  [(r) => new GreedyAgent(r), (r) => new TurnPlannerAgent(r)],
]

// Gen-2: the full card pool, not just OP01
const decks = SET_MODULES.flatMap((s) => buildCoverageDecks(s.code))
mkdirSync('data', { recursive: true })
const out = createWriteStream(shard !== null ? `data/train-${shard}.jsonl` : 'data/train.jsonl')

let rows = 0
let finished = 0
const started = Date.now()

for (let k = 0; k < games; k++) {
  const i = offset + k
  const seed = 40000 + i * 7919
  const [make1, make2] = MIX[i % MIX.length]
  const deck1 = decks[i % decks.length].deck
  const deck2 = decks[(i + 1 + Math.floor(i / decks.length)) % decks.length].deck

  const samples: { turn: number; features: Features }[] = []
  let lastTurn = 0
  // Gen-2: also sample MID-TURN afterstates - decisions compare states after
  // actions resolve, and gen-1's turn-start-only rows left those out of
  // distribution (the diagnosed cause of prediction-good/decisions-bad)
  const sampleRng = mulberry32(seed ^ 0x777777)
  let midSamplesThisTurn = 0
  const record = runGame({
    deck1,
    deck2,
    agent1: make1(mulberry32(seed ^ 0xa5a5a5)),
    agent2: make2(mulberry32(seed ^ 0x5a5a5a)),
    seed,
    onStep: (state) => {
      if (state.phase !== 'MAIN' || state.winner) return
      if (state.turnNumber > lastTurn) {
        lastTurn = state.turnNumber
        midSamplesThisTurn = 0
        samples.push({ turn: state.turnNumber, features: featureVector(state, 'player1') })
        return
      }
      const quiet = !state.pendingChoice && !state.battle && state.stack.length === 0
      if (quiet && midSamplesThisTurn < 2 && sampleRng() < 0.2) {
        midSamplesThisTurn++
        samples.push({ turn: state.turnNumber, features: featureVector(state, 'player1') })
      }
    },
  })
  if (!record.winner) continue
  finished++
  const label = record.winner === 'player1' ? 1 : 0
  for (const s of samples) {
    out.write(JSON.stringify({ game: i, turn: s.turn, label, features: s.features }) + '\n')
    rows++
  }
  if ((k + 1) % 100 === 0) {
    console.log(`  ${k + 1}/${games} games, ${rows} rows, ${((Date.now() - started) / 1000).toFixed(0)}s`)
  }
}

out.end(() => {
  console.log(
    `done: ${finished} finished games, ${rows} rows -> data/train.jsonl (${((Date.now() - started) / 1000).toFixed(0)}s)`,
  )
})
