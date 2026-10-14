/**
 * Gen-3 training data (BOT_PLAN P2): MCTS-vs-MCTS self-play on the base deck
 * pool, logging per searched decision:
 *   { k:'p', g, c, r }  - pairwise row: CHOSEN afterstate features vs one
 *                         REJECTED sibling afterstate (actor's perspective);
 *                         rejected = next-most-visited children (<=3, min 8
 *                         visits so the search actually judged them)
 *   { k:'b', g, f, v }  - bootstrap row: chosen afterstate features with the
 *                         search's value for it (Veness-style target)
 * Both losses train on what the search actually compared - the property the
 * outcome-label generations lacked.
 *
 * Run: vite-node scripts/gendata3.ts <games> <shard> [iterations]
 * Gen-3.1: deeper label searches (iterations 1000) make the bootstrap target
 * genuinely exceed the leaf eval; rows carry the game outcome from the actor's
 * perspective (w) so training can blend search values with outcome anchoring.
 * Writes data/gen3-<shard>.jsonl (buffered; appears at process end).
 */
import { mkdirSync, createWriteStream } from 'node:fs'
import { runGame } from '@/sim/selfplay'
import { BASE_DECKS } from '@/sim/baseDecks'
import { MctsAgent, type MctsSearchInfo } from '@/ai/mcts'
import { featureVector } from '@/ai/evaluate'
import { mulberry32 } from '@/utils/rng'

const games = Number(process.argv[2] ?? 50)
const shard = Number(process.argv[3] ?? 0)
const iterations = Number(process.argv[4] ?? 300)
const offset = shard * games

mkdirSync('data', { recursive: true })
const out = createWriteStream(`data/gen3-${shard}.jsonl`)

let pairs = 0
let boots = 0
const started = Date.now()

for (let k = 0; k < games; k++) {
  const i = offset + k
  const seed = 90000 + i * 7919
  const deck1 = BASE_DECKS[i % BASE_DECKS.length]
  const deck2 = BASE_DECKS[(i + 1 + Math.floor(i / BASE_DECKS.length)) % BASE_DECKS.length]
  const g = i

  // Buffer the game's rows so each can carry the final outcome (actor's view)
  const rows: ({ k: 'b'; f: object; v: number; actor: string } | { k: 'p'; c: object; r: object; actor: string })[] = []
  const onSearch = (info: MctsSearchInfo) => {
    const [chosen, ...rest] = info.children
    if (!chosen || chosen.visits < 8) return
    const c = featureVector(chosen.state, info.actor)
    rows.push({ k: 'b', f: c, v: chosen.value, actor: info.actor })
    boots++
    const rejected = rest.filter((x) => x.visits >= 8).slice(0, 3)
    for (const r of rejected) {
      rows.push({ k: 'p', c, r: featureVector(r.state, info.actor), actor: info.actor })
      pairs++
    }
  }

  const record = runGame({
    deck1,
    deck2,
    agent1: new MctsAgent(mulberry32(seed ^ 0xa5a5a5), { onSearch, iterations }),
    agent2: new MctsAgent(mulberry32(seed ^ 0x5a5a5a), { onSearch, iterations }),
    seed,
  })
  for (const row of rows) {
    const w = record.winner === null ? 0.5 : record.winner === row.actor ? 1 : 0
    const { actor, ...rest } = row
    void actor
    out.write(JSON.stringify({ ...rest, g, w }) + '\n')
  }
  if ((k + 1) % 10 === 0) {
    const dt = (Date.now() - started) / 1000
    console.log(`shard ${shard}: ${k + 1}/${games} games · ${pairs} pairs · ${boots} boots · ${dt.toFixed(0)}s`)
  }
}

out.end()
console.log(`done: shard ${shard} · ${pairs} pairs · ${boots} boots`)
