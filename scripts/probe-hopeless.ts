/* Probe: do the bots declare HOPELESS attacks (attacker power below the target
 * at declaration, no [When Attacking] rider to fire)? Counters only help the
 * defender, so such an attack can never win - it just rests the attacker.
 * Run: vite-node scripts/probe-hopeless.ts [greedyGames] [mctsGames]
 */
import { runGame } from '@/sim/selfplay'
import { BASE_DECKS } from '@/sim/baseDecks'
import { GreedyAgent, type Agent } from '@/ai/agents'
import { MctsAgent } from '@/ai/mcts'
import { getEffectivePower } from '@/engine/powerCalc'
import { getEffectDefs } from '@/engine/effects/registry'
import { mulberry32 } from '@/utils/rng'
import type { GameState } from '@/engine/types'

const greedyGames = Number(process.argv[2] ?? 40)
const mctsGames = Number(process.argv[3] ?? 8)

function findUnit(state: GameState, id: string) {
  for (const pid of ['player1', 'player2'] as const) {
    const p = state.players[pid]
    if (p.leader.instanceId === id) return p.leader
    const c = p.characters.find((x) => x.instanceId === id)
    if (c) return c
  }
  return null
}

function probe(label: string, games: number, mk: (r: () => number) => Agent) {
  let attacks = 0
  let hopeless = 0
  let hopelessWithRider = 0
  for (let i = 0; i < games; i++) {
    const d1 = BASE_DECKS[i % BASE_DECKS.length]
    const d2 = BASE_DECKS[(i + 3) % BASE_DECKS.length]
    runGame({
      deck1: d1,
      deck2: d2,
      agent1: mk(mulberry32(1000 + i)),
      agent2: mk(mulberry32(2000 + i)),
      seed: 500 + i * 101,
      onStep: (state, action) => {
        if (action.type !== 'DECLARE_ATTACK' || !state.battle) return
        attacks++
        const atk = findUnit(state, state.battle.attackerId)
        const tgt = findUnit(state, state.battle.targetId)
        if (!atk || !tgt) return
        const ap = getEffectivePower(state, atk)
        const tp = getEffectivePower(state, tgt)
        if (ap >= tp) return
        const rider = getEffectDefs(atk.cardId, 'whenAttacking').length > 0
        if (rider) hopelessWithRider++
        else hopeless++
      },
    })
  }
  console.log(
    `${label}: ${attacks} attacks · hopeless ${hopeless} (${((100 * hopeless) / Math.max(1, attacks)).toFixed(1)}%) · hopeless-but-rider ${hopelessWithRider}`,
  )
}

probe('greedy', greedyGames, (r) => new GreedyAgent(r))
probe('mcts  ', mctsGames, (r) => new MctsAgent(r))
