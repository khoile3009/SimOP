import type { GameState, GameAction, PlayerId, GameCard } from '@/engine/types'
import { processAction } from '@/engine/processor'
import { legalActions, whoActs } from '@/engine/legalActions'
import { getOpponent } from '@/engine/turnManager'
import { evaluateState } from './evaluate'
import type { EvalFn } from './evaluate'
import type { Agent } from './agents'
import { determinize } from './determinize'

/**
 * Information-set MCTS (BOT_PLAN P3, Cowling et al. 2012): ONE tree over the
 * searcher's information sets, with a FRESH determinization threaded through
 * it on every iteration. PIMC root voting builds K independent perfect-info
 * trees that may take different actions at positions the player could not
 * tell apart (strategy fusion); here every world shares the same tree, so a
 * node's value aggregates over all worlds consistent with its history - the
 * search can finally plan "act, observe, react" lines. Per-iteration worlds
 * also subsume the chance-node machinery: draws differ across iterations by
 * construction, so no explicit chance fan-out is needed.
 *
 * Edges are keyed by the OBSERVATION the root player gets from an action, not
 * by raw instance ids: cards that were hidden at the root (opponent hand/deck/
 * life, own deck/life) get resampled into different slots per world, so their
 * ids are world-local - those are keyed by the card's printed identity (what
 * you'd actually see when it is played), while cards public at the root keep
 * their stable ids (targeting one of two same-named characters stays two
 * distinct edges). Selection is availability-adjusted UCB1 (subset-armed:
 * log of the times the child was AVAILABLE, since worlds disagree about which
 * actions exist).
 */

interface IsNode {
  children: Map<string, IsChild>
}

interface IsChild {
  node: IsNode
  visits: number
  /** Iterations where this edge was available at its parent */
  avail: number
  /** Sum of leaf values, always from player1's perspective */
  valueSum: number
}

export interface IsMctsOptions {
  /** Total iterations = fresh worlds threaded through the shared tree */
  iterations?: number
  exploration?: number
  evalFn?: EvalFn
  /** Hard cap on actions per descent (loop safety) */
  maxDepth?: number
}

export class IsMctsAgent implements Agent {
  readonly name = 'ismcts'
  private rand: () => number
  private iterations: number
  private exploration: number
  private evalFn: EvalFn
  private maxDepth: number

  constructor(rand: () => number = Math.random, options: IsMctsOptions = {}) {
    this.rand = rand
    this.iterations = options.iterations ?? 2000
    this.exploration = options.exploration ?? 0.5
    this.evalFn = options.evalFn ?? evaluateState
    this.maxDepth = options.maxDepth ?? 60
  }

  choose(state: GameState, actions: GameAction[], playerId: PlayerId): GameAction {
    if (actions.length === 1) return actions[0]

    // Ids the root player can SEE at the root stay stable across worlds;
    // everything else is world-local and keys by printed card identity
    const hiddenIds = collectHiddenIds(state, playerId)
    const root: IsNode = { children: new Map() }

    for (let i = 0; i < this.iterations; i++) {
      let s = determinize(state, playerId, this.rand)
      let node = root
      const path: IsChild[] = []
      let value: number | null = null

      for (let depth = 0; depth < this.maxDepth; depth++) {
        if (s.winner) {
          value = s.winner === 'player1' ? 1 : 0
          break
        }
        const actor = whoActs(s)
        if (!actor) break
        const options = depth === 0 && node === root ? actions : legalActions(s)
        if (options.length === 0) break

        // One edge per OBSERVATION: two copies of the same hidden card are the
        // same information-set action, so they share a single key
        const seen = new Set<string>()
        const keyed: { action: GameAction; key: string }[] = []
        for (const a of options) {
          const key = actionKey(s, a, hiddenIds)
          if (seen.has(key)) continue
          seen.add(key)
          keyed.push({ action: a, key })
        }
        // Availability bookkeeping for every existing child offered this world
        for (const { key } of keyed) {
          const child = node.children.get(key)
          if (child) child.avail++
        }

        const unexpanded = keyed.filter(({ key }) => !node.children.has(key))
        let pick: { action: GameAction; key: string }
        let expanded = false
        if (unexpanded.length > 0) {
          pick = unexpanded[Math.floor(this.rand() * unexpanded.length)]
          const child: IsChild = { node: { children: new Map() }, visits: 0, avail: 1, valueSum: 0 }
          node.children.set(pick.key, child)
          expanded = true
        } else {
          pick = this.selectIsUct(node, keyed, actor)
        }

        const result = processAction(s, pick.action, actor)
        if (result.error) {
          // A world where the tree's edge is illegal despite matching keys:
          // score this world as-is rather than corrupting the edge stats
          break
        }
        s = result.state
        const child = node.children.get(pick.key)!
        path.push(child)
        node = child.node
        if (expanded) break
      }

      if (value === null)
        value = s.winner ? (s.winner === 'player1' ? 1 : 0) : this.evalFn(s, 'player1')
      for (const child of path) {
        child.visits++
        child.valueSum += value
      }
    }

    // Robust choice: most-visited root edge among the real actions
    let best: GameAction = actions[0]
    let bestVisits = -1
    let bestValue = -Infinity
    const rootActor = whoActs(state)
    for (const action of actions) {
      const child = root.children.get(actionKey(state, action, hiddenIds))
      if (!child) continue
      const value = this.perspective(rootActor, child)
      if (child.visits > bestVisits || (child.visits === bestVisits && value > bestValue)) {
        best = action
        bestVisits = child.visits
        bestValue = value
      }
    }
    return best
  }

  private perspective(actor: PlayerId | null, child: IsChild): number {
    const q = child.visits > 0 ? child.valueSum / child.visits : 0.5
    return actor === 'player2' ? 1 - q : q
  }

  /** Availability-adjusted UCB1 over the actions this world actually offers */
  private selectIsUct(
    node: IsNode,
    keyed: { action: GameAction; key: string }[],
    actor: PlayerId,
  ): { action: GameAction; key: string } {
    let best = keyed[0]
    let bestScore = -Infinity
    for (const entry of keyed) {
      const child = node.children.get(entry.key)!
      const exploit = this.perspective(actor, child)
      const explore =
        this.exploration * Math.sqrt(Math.log(Math.max(1, child.avail)) / Math.max(1, child.visits))
      const score = exploit + explore
      if (score > bestScore) {
        bestScore = score
        best = entry
      }
    }
    return best
  }
}

/** Instance ids the viewer can NOT see at the root: these are resampled into
 * world-local slots, so edges referencing them key by card identity instead. */
function collectHiddenIds(state: GameState, viewer: PlayerId): Set<string> {
  const opp = getOpponent(viewer)
  const own = state.players[viewer]
  const theirs = state.players[opp]
  const ids = new Set<string>()
  const add = (c: GameCard) => ids.add(c.instanceId)
  own.deck.filter((c) => !(c.seenByOwner === true || c.revealed === true)).forEach(add)
  own.lifeCards.filter((c) => c.revealed !== true).forEach(add)
  theirs.hand.filter((c) => c.revealed !== true).forEach(add)
  theirs.deck.filter((c) => c.revealed !== true).forEach(add)
  theirs.lifeCards.filter((c) => c.revealed !== true).forEach(add)
  return ids
}

/** Key an action by its root-player observation: hidden-at-root ids become
 * the card's printed identity in the CURRENT world, public ids stay as-is. */
function actionKey(state: GameState, action: GameAction, hiddenIds: Set<string>): string {
  return JSON.stringify(action, (field, value) =>
    typeof value === 'string' && hiddenIds.has(value) && field !== 'type'
      ? `~${cardIdOf(state, value)}`
      : value,
  )
}

function cardIdOf(state: GameState, instanceId: string): string {
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    for (const zone of [p.hand, p.deck, p.lifeCards, p.characters, p.trash, [p.leader]]) {
      for (const c of zone) {
        if (c.instanceId === instanceId) return c.cardId
      }
    }
  }
  return instanceId
}
