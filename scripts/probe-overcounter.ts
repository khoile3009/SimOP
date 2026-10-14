/* Probe: do the bots OVER-COUNTER - spend counter cards defending leader hits
 * at high life, where good play takes the damage (life becomes a hand card)?
 * Reports, per defender-life bucket, how often a leader attack that COULD be
 * countered was defended (counter/counter-event) vs taken (pass).
 * Run: vite-node scripts/probe-overcounter.ts [games] [mcts?]
 */
import { runGame } from '@/sim/selfplay'
import { BASE_DECKS } from '@/sim/baseDecks'
import { GreedyAgent, type Agent } from '@/ai/agents'
import { MctsAgent } from '@/ai/mcts'
import { mulberry32 } from '@/utils/rng'
import { getOpponent } from '@/engine/turnManager'
import type { GameState, GameAction, PlayerId } from '@/engine/types'

const games = Number(process.argv[2] ?? 30)
const useMcts = process.argv[3] === 'mcts'

type Bucket = '4-5' | '2-3' | '0-1'
const bucketOf = (life: number): Bucket => (life >= 4 ? '4-5' : life >= 2 ? '2-3' : '0-1')

const stats: Record<Bucket, { defended: number; taken: number }> = {
  '4-5': { defended: 0, taken: 0 },
  '2-3': { defended: 0, taken: 0 },
  '0-1': { defended: 0, taken: 0 },
}

// Track per-battle: was any counter spent before damage resolution on a leader hit?
let current: { defender: PlayerId; bucket: Bucket; spent: boolean; isLeader: boolean } | null = null

function onStep(state: GameState, action: GameAction) {
  if (action.type === 'DECLARE_ATTACK') {
    const battle = state.battle
    if (!battle) return
    const defender = battle.defenderPlayer
    const isLeader =
      state.players[defender].leader.instanceId === battle.currentTargetId
    current = {
      defender,
      bucket: bucketOf(state.players[defender].lifeCards.length),
      spent: false,
      isLeader,
    }
    return
  }
  if (!current) return
  if (action.type === 'USE_COUNTER' || action.type === 'PLAY_COUNTER_EVENT') {
    current.spent = true
  }
  if (state.battle === null) {
    // battle resolved
    if (current.isLeader) {
      const s = stats[current.bucket]
      if (current.spent) s.defended++
      else s.taken++
    }
    current = null
  }
}

const mk: (r: () => number) => Agent = useMcts
  ? (r) => new MctsAgent(r)
  : (r) => new GreedyAgent(r)

for (let i = 0; i < games; i++) {
  runGame({
    deck1: BASE_DECKS[i % BASE_DECKS.length],
    deck2: BASE_DECKS[(i + 3) % BASE_DECKS.length],
    agent1: mk(mulberry32(3000 + i)),
    agent2: mk(mulberry32(4000 + i)),
    seed: 900 + i * 131,
    onStep,
  })
}

console.log(`${useMcts ? 'mcts' : 'greedy'} · ${games} games · leader-attack defense rate by defender life:`)
for (const b of ['4-5', '2-3', '0-1'] as Bucket[]) {
  const s = stats[b]
  const total = s.defended + s.taken
  console.log(
    `  life ${b}: defended ${s.defended}/${total} (${total ? ((100 * s.defended) / total).toFixed(0) : 0}%)`,
  )
}
