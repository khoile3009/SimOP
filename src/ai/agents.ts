import type { GameState, GameAction, PlayerId } from '@/engine/types'
import { processAction } from '@/engine/processor'
import { legalActions, whoActs } from '@/engine/legalActions'
import { evaluateState } from './evaluate'
import type { EvalFn } from './evaluate'

export interface Agent {
  readonly name: string
  choose(state: GameState, actions: GameAction[], playerId: PlayerId): GameAction
}

export class RandomAgent implements Agent {
  readonly name = 'random'
  private rand: () => number

  constructor(rand: () => number = Math.random) {
    this.rand = rand
  }

  choose(_state: GameState, actions: GameAction[]): GameAction {
    return actions[Math.floor(this.rand() * actions.length)]
  }
}

/**
 * One-ply greedy: applies each action, lets the opponent make their best interrupt
 * responses (block/counter/trigger), and picks the action whose settled state
 * evaluates best. Without the interrupt rollout an attack would be judged at the
 * block step - attacker rested, no damage dealt yet - and greedy would never attack.
 */
export class GreedyAgent implements Agent {
  readonly name = 'greedy'
  private rand: () => number
  private evalFn: EvalFn

  constructor(rand: () => number = Math.random, evalFn: EvalFn = evaluateState) {
    this.rand = rand
    this.evalFn = evalFn
  }

  choose(state: GameState, actions: GameAction[], playerId: PlayerId): GameAction {
    let best: GameAction[] = []
    let bestValue = -Infinity
    for (const action of actions) {
      const result = processAction(state, action, playerId)
      if (result.error) continue
      const settled = rolloutInterrupts(result.state, playerId, this.evalFn)
      const value = this.evalFn(settled, playerId)
      if (value > bestValue + 1e-9) {
        bestValue = value
        best = [action]
      } else if (value > bestValue - 1e-9) {
        best.push(action)
      }
    }
    if (best.length === 0) return actions[0]
    return best[Math.floor(this.rand() * best.length)]
  }
}

/**
 * Play out decisions that interrupt the acting player's own flow (battle responses,
 * trigger prompts, the opponent's mulligan) using each responder's own greedy best
 * reply. Stops as soon as control returns to `me` or the opponent's normal turn
 * begins - this never simulates the opponent's next main phase.
 */
export function rolloutInterrupts(
  state: GameState,
  me: PlayerId,
  evalFn: EvalFn = evaluateState,
): GameState {
  let s = state
  for (let guard = 0; guard < 50; guard++) {
    if (s.winner) return s
    const actor = whoActs(s)
    if (actor === null || actor === me) return s
    const isInterrupt =
      s.battle !== null || s.pendingTrigger !== null || s.pendingChoice !== null || s.phase === 'SETUP'
    if (!isInterrupt) return s

    const options = legalActions(s)
    if (options.length === 0) return s
    let best = options[0]
    let bestValue = -Infinity
    for (const option of options) {
      const result = processAction(s, option, actor)
      if (result.error) continue
      const value = evalFn(result.state, actor)
      if (value > bestValue) {
        bestValue = value
        best = option
      }
    }
    const applied = processAction(s, best, actor)
    if (applied.error) return s
    s = applied.state
  }
  return s
}
