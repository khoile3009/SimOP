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
 * Run: vite-node scripts/gendata3.ts <games> <shard>
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

  const onSearch = (info: MctsSearchInfo) => {
    const [chosen, ...rest] = info.children
    if (!chosen || chosen.visits < 8) return
    const c = featureVector(chosen.state, info.actor)
    out.write(JSON.stringify({ k: 'b', g, f: c, v: chosen.value }) + '\n')
    boots++
    const rejected = rest.filter((x) => x.visits >= 8).slice(0, 3)
    for (const r of rejected) {
      out.write(
        JSON.stringify({ k: 'p', g, c, r: featureVector(r.state, info.actor) }) + '\n',
      )
      pairs++
    }
  }

  runGame({
    deck1,
    deck2,
    agent1: new MctsAgent(mulberry32(seed ^ 0xa5a5a5), { onSearch }),
    agent2: new MctsAgent(mulberry32(seed ^ 0x5a5a5a), { onSearch }),
    seed,
  })
  if ((k + 1) % 10 === 0) {
    const dt = (Date.now() - started) / 1000
    console.log(`shard ${shard}: ${k + 1}/${games} games · ${pairs} pairs · ${boots} boots · ${dt.toFixed(0)}s`)
  }
}

out.end()
console.log(`done: shard ${shard} · ${pairs} pairs · ${boots} boots`)
