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
import { RandomAgent, GreedyAgent, type Agent } from '@/ai/agents'
import { TurnPlannerAgent } from '@/ai/turnSearch'
import { featureVector } from '@/ai/evaluate'
import { mulberry32 } from '@/utils/rng'
import type { Features } from '@/ai/evaluate'

const games = Number(process.argv[2] ?? 4000)
// Planner-heavy data would be ideal but is ~20x slower; greedy-dominant with a
// planner and random sprinkle keeps labels meaningful and generation fast
const MIX: ((rand: () => number) => Agent)[][] = [
  [(r) => new GreedyAgent(r), (r) => new GreedyAgent(r)],
  [(r) => new GreedyAgent(r), (r) => new GreedyAgent(r)],
  [(r) => new GreedyAgent(r), (r) => new GreedyAgent(r)],
  [(r) => new TurnPlannerAgent(r), (r) => new GreedyAgent(r)],
  [(r) => new GreedyAgent(r), (r) => new TurnPlannerAgent(r)],
  [(r) => new GreedyAgent(r), (r) => new RandomAgent(r)],
]

const decks = buildCoverageDecks('OP01')
mkdirSync('data', { recursive: true })
const out = createWriteStream('data/train.jsonl')

let rows = 0
let finished = 0
const started = Date.now()

for (let i = 0; i < games; i++) {
  const seed = 40000 + i * 7919
  const [make1, make2] = MIX[i % MIX.length]
  const deck1 = decks[i % decks.length].deck
  const deck2 = decks[(i + 1 + Math.floor(i / decks.length)) % decks.length].deck

  const samples: { turn: number; features: Features }[] = []
  let lastTurn = 0
  const record = runGame({
    deck1,
    deck2,
    agent1: make1(mulberry32(seed ^ 0xa5a5a5)),
    agent2: make2(mulberry32(seed ^ 0x5a5a5a)),
    seed,
    onStep: (state) => {
      if (state.phase === 'MAIN' && state.turnNumber > lastTurn && !state.winner) {
        lastTurn = state.turnNumber
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
  if ((i + 1) % 500 === 0) {
    console.log(`  ${i + 1}/${games} games, ${rows} rows, ${((Date.now() - started) / 1000).toFixed(0)}s`)
  }
}

out.end(() => {
  console.log(
    `done: ${finished} finished games, ${rows} rows -> data/train.jsonl (${((Date.now() - started) / 1000).toFixed(0)}s)`,
  )
})
