/* Scratch profiler for the TurnPlannerAgent pathology (BOT_PLAN P1).
 * Runs planner-vs-greedy on full-fidelity auto decks and reports where the
 * time goes. Not wired into package.json; run with `vite-node scripts/profile-planner.ts`.
 */
import { makeAutoDeck } from '@/sim/selfplay'
import { GreedyAgent } from '@/ai/agents'
import { TurnPlannerAgent, searchTurnLines } from '@/ai/turnSearch'
import { evaluateState } from '@/ai/evaluate'
import type { EvalFn } from '@/ai/evaluate'
import { mulberry32 } from '@/utils/rng'
import { createGame } from '@/engine/gameSetup'
import { processAction } from '@/engine/processor'
import { legalActions, whoActs } from '@/engine/legalActions'

const leader = process.argv[2] ?? 'OP17-079'

// Counting eval wrapper
let evalCalls = 0
const countedEval: EvalFn = (state, player) => {
  evalCalls++
  return evaluateState(state, player)
}

function timedGame(leaderId: string, seed: number) {
  const deck = makeAutoDeck(leaderId)
  const planner = new TurnPlannerAgent(mulberry32(seed), { evalFn: countedEval })
  const greedy = new GreedyAgent(mulberry32(seed ^ 99))

  // Drive manually so we can time each planner decision
  let state = createGame(deck, deck)
  let actionsTaken = 0
  let plannerTime = 0
  let worstCall = 0
  const t0 = performance.now()
  for (let step = 0; step < 4000 && !state.winner; step++) {
    const actor = whoActs(state)
    if (!actor) break
    const opts = legalActions(state)
    if (opts.length === 0) break
    let action
    if (actor === 'player1') {
      const c0 = performance.now()
      action = planner.choose(state, opts, 'player1')
      const dt = performance.now() - c0
      plannerTime += dt
      if (dt > worstCall) worstCall = dt
    } else {
      action = greedy.choose(state, opts, 'player2')
    }
    const result = processAction(state, action, actor)
    if (result.error) break
    state = result.state
    actionsTaken++
  }
  const total = performance.now() - t0
  return { total, plannerTime, worstCall, actionsTaken, winner: state.winner, turns: state.turnNumber }
}

console.log(`leader: ${leader}`)
for (const seed of [1, 2]) {
  evalCalls = 0
  const r = timedGame(leader, seed)
  console.log(
    `seed ${seed}: total ${(r.total / 1000).toFixed(1)}s · planner ${(r.plannerTime / 1000).toFixed(1)}s · worst call ${(r.worstCall / 1000).toFixed(2)}s · ${r.actionsTaken} actions · ${r.turns} turns · evals ${evalCalls} · winner ${r.winner}`,
  )
}

// Isolate one searchTurnLines call on a mid-game state for a cleaner split
{
  const deck = makeAutoDeck(leader)
  let state = createGame(deck, deck)
  const g = new GreedyAgent(mulberry32(7))
  for (let step = 0; step < 300 && !state.winner; step++) {
    const actor = whoActs(state)
    if (!actor) break
    const opts = legalActions(state)
    if (opts.length === 0) break
    const result = processAction(state, g.choose(state, opts, actor), actor)
    if (result.error) break
    state = result.state
  }
  if (!state.winner && whoActs(state)) {
    const me = whoActs(state)!
    evalCalls = 0
    const t = performance.now()
    searchTurnLines(state, me, { beamWidth: 16, verifyTop: 4, topK: 1, evalFn: countedEval })
    console.log(
      `one search: ${((performance.now() - t) / 1000).toFixed(2)}s · evals ${evalCalls} · turn ${state.turnNumber}`,
    )
  }
}
