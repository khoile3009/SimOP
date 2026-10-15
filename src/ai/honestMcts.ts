import type { GameState, GameAction, PlayerId } from '@/engine/types'
import type { Agent } from './agents'
import type { EvalFn } from './evaluate'
import { MctsAgent } from './mcts'
import { determinize } from './determinize'

/**
 * Honest hidden-information MCTS (BOT_PLAN P3): root-world voting over
 * determinizations. The omniscient MctsAgent searches the REAL state - it sees
 * the opponent's hand, both decks, and both life stacks. This agent instead
 * samples K worlds consistent with what the player can actually see
 * (determinize.ts, which pins revealed cards), runs a full search per world
 * with the SAME real root actions, and sums root visit counts across worlds.
 *
 * Voting across worlds (PIMC) still suffers strategy fusion - it can't plan
 * "find out, then react" lines - but it never acts on information the player
 * doesn't have, which makes it the fair opponent for human play and the
 * baseline for the multiple-observer variant later.
 */

export interface HonestMctsOptions {
  worlds?: number
  /** Search iterations per world (budget per move = worlds x iterations) */
  iterations?: number
  exploration?: number
  evalFn?: EvalFn
  /** Chance-node draws inside each world's search (on by default) */
  chance?: boolean
  /** Policy prior for PUCT selection (see MctsOptions.prior) */
  prior?: boolean
  cPuct?: number
}

export class HonestMctsAgent implements Agent {
  readonly name = 'honest'
  private rand: () => number
  private worlds: number
  private iterations: number
  private exploration?: number
  private evalFn?: EvalFn
  private chance?: boolean
  private prior?: boolean
  private cPuct?: number

  constructor(rand: () => number = Math.random, options: HonestMctsOptions = {}) {
    this.rand = rand
    // Tuned Oct 2026 (scripts/tune-honest.ts): per-world budget parity matters -
    // 4x500 beat planner 61% and the OMNISCIENT mcts 57% (world-averaging
    // regularizes what the cheater overfits)
    this.worlds = options.worlds ?? 4
    this.iterations = options.iterations ?? 500
    this.exploration = options.exploration
    this.evalFn = options.evalFn
    this.chance = options.chance
    this.prior = options.prior
    this.cPuct = options.cPuct
  }

  choose(state: GameState, actions: GameAction[], playerId: PlayerId): GameAction {
    if (actions.length === 1) return actions[0]

    const byKey = new Map<string, { action: GameAction; visits: number }>()
    for (const a of actions) byKey.set(JSON.stringify(a), { action: a, visits: 0 })

    for (let w = 0; w < this.worlds; w++) {
      const world = determinize(state, playerId, this.rand)
      let searched = false
      const searcher = new MctsAgent(this.rand, {
        iterations: this.iterations,
        exploration: this.exploration,
        evalFn: this.evalFn,
        chance: this.chance,
        prior: this.prior,
        cPuct: this.cPuct,
        onSearch: (info) => {
          searched = true
          for (const child of info.children) {
            const slot = byKey.get(JSON.stringify(child.action))
            if (slot) slot.visits += child.visits
          }
        },
      })
      // The ROOT actions are the real ones (identical in every world); only the
      // tree below them sees world-specific hidden cards
      const picked = searcher.choose(world, actions)
      if (!searched) {
        const slot = byKey.get(JSON.stringify(picked))
        if (slot) slot.visits += this.iterations
      }
    }

    let best: { action: GameAction; visits: number } | null = null
    for (const slot of byKey.values()) {
      if (!best || slot.visits > best.visits) best = slot
    }
    return best?.action ?? actions[0]
  }
}
