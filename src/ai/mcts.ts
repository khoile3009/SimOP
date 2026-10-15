import type { GameState, GameAction, PlayerId } from '@/engine/types'
import { processAction } from '@/engine/processor'
import { legalActions, whoActs } from '@/engine/legalActions'
import { evaluateState } from './evaluate'
import type { EvalFn } from './evaluate'
import type { Agent } from './agents'
import { chanceTrigger, chanceOutcomeStates } from './chance'

/**
 * Perfect-information UCT with evaluation leaves: selection by UCB1 (each node
 * judged from its acting player's perspective - the tree naturally alternates
 * max/min as actors change), one expansion per iteration, and the leaf valued
 * by the logistic eval instead of a noisy random rollout. Because nodes are
 * just states and actions come from legalActions, the tree flows through
 * battle responses, effect choices, and INTO the opponent's next turn - a
 * lookahead horizon the turn-planner doesn't have.
 *
 * Chance nodes (M4.5 #3): a transition that consumes a hidden card (the
 * turn-boundary draw, a life card revealed by a leader hit) expands into a
 * CHANCE node whose children are outcome states built by resampling the
 * unknown deck/life orderings, one per outcome bucket, weighted by bucket
 * mass. Descent through a chance node picks a child by weight, not UCB, so
 * its value converges to the weighted average over outcomes - the tree can
 * no longer peek at its own (or the opponent's) topdecks. Width is damped
 * with chance depth so the root's own turn stays wide.
 */

interface Node {
  state: GameState
  actor: PlayerId | null
  action: GameAction | null // action that led here
  parent: Node | null
  children: Node[]
  untried: GameAction[] | null // lazily filled
  visits: number
  /** Sum of leaf values, always from player1's perspective */
  valueSum: number
  /** Chance node: children are draw-outcome states, picked by weight */
  isChance?: boolean
  /** On a chance node's child: this outcome's probability mass */
  weight?: number
  /** Chance nodes crossed from the root (dampens chance width) */
  chanceDepth: number
}

export interface MctsOptions {
  iterations?: number
  exploration?: number
  evalFn?: EvalFn
  /** Chance-node draws (on by default): branch on hidden-card consumption
   * instead of trusting the determinized deck order */
  chance?: boolean
  /** Gen-3 data hook: receives the root's explored children after each search */
  onSearch?: (info: MctsSearchInfo) => void
}

export interface MctsSearchInfo {
  state: GameState
  actor: PlayerId
  /** The chosen child first; all values from the ACTOR's perspective */
  children: { action: GameAction; state: GameState; visits: number; value: number }[]
}

export class MctsAgent implements Agent {
  readonly name = 'mcts'
  private rand: () => number
  private iterations: number
  private exploration: number
  private evalFn: EvalFn
  private chance: boolean
  private onSearch?: (info: MctsSearchInfo) => void

  constructor(rand: () => number = Math.random, options: MctsOptions = {}) {
    this.rand = rand
    this.iterations = options.iterations ?? 300
    this.exploration = options.exploration ?? 0.5
    this.evalFn = options.evalFn ?? evaluateState
    this.chance = options.chance ?? true
    this.onSearch = options.onSearch
  }

  choose(state: GameState, actions: GameAction[]): GameAction {
    if (actions.length === 1) return actions[0]

    const root: Node = {
      state,
      actor: whoActs(state),
      action: null,
      parent: null,
      children: [],
      untried: [...actions],
      visits: 0,
      valueSum: 0,
      chanceDepth: 0,
    }

    for (let i = 0; i < this.iterations; i++) {
      // Selection
      let node = root
      while ((node.untried === null || node.untried.length === 0) && node.children.length > 0) {
        node = node.isChance ? this.selectOutcome(node) : this.selectChild(node)
      }
      // Expansion
      if (node.untried === null) node.untried = node.state.winner ? [] : legalActions(node.state)
      if (node.untried.length > 0 && node.actor) {
        const idx = Math.floor(this.rand() * node.untried.length)
        const action = node.untried.splice(idx, 1)[0]
        const expanded = this.expand(node, action)
        if (expanded) node = expanded
      }
      // Evaluation (leaf value, player1 perspective)
      const value = node.state.winner
        ? node.state.winner === 'player1'
          ? 1
          : 0
        : this.evalFn(node.state, 'player1')
      // Backpropagation
      for (let n: Node | null = node; n; n = n.parent) {
        n.visits++
        n.valueSum += value
      }
    }

    // Robust child: most visits, value as tiebreak
    let best: Node | null = null
    for (const child of root.children) {
      if (
        !best ||
        child.visits > best.visits ||
        (child.visits === best.visits &&
          this.perspective(root.actor, child) > this.perspective(root.actor, best))
      ) {
        best = child
      }
    }
    if (this.onSearch && root.actor && best) {
      const children = [best, ...root.children.filter((c) => c !== best)].map((c) => ({
        action: c.action!,
        state: this.representativeState(c),
        visits: c.visits,
        value: this.perspective(root.actor, c),
      }))
      this.onSearch({ state, actor: root.actor, children })
    }
    return best?.action ?? actions[0]
  }

  /** Apply `action` from `node`; a transition that consumes a hidden card
   * fans into a chance node over bucketed outcomes. Returns the new leaf. */
  private expand(node: Node, action: GameAction): Node | null {
    const actor = node.actor!
    const trigger = this.chance ? chanceTrigger(node.state, action) : null
    if (!trigger) {
      const result = processAction(node.state, action, actor)
      if (result.error) return null
      const child: Node = {
        state: result.state,
        actor: whoActs(result.state),
        action,
        parent: node,
        children: [],
        untried: null,
        visits: 0,
        valueSum: 0,
        chanceDepth: node.chanceDepth,
      }
      node.children.push(child)
      return child
    }

    const width = Math.max(1, 3 - node.chanceDepth)
    const outcomes = chanceOutcomeStates(node.state, trigger, width, this.rand)
    const chanceNode: Node = {
      state: node.state, // pre-action; real afterstates live on the outcomes
      actor,
      action,
      parent: node,
      children: [],
      untried: [],
      visits: 0,
      valueSum: 0,
      isChance: true,
      chanceDepth: node.chanceDepth,
    }
    for (const o of outcomes) {
      const result = processAction(o.state, action, actor)
      if (result.error) continue
      chanceNode.children.push({
        state: result.state,
        actor: whoActs(result.state),
        action: null,
        parent: chanceNode,
        children: [],
        untried: null,
        visits: 0,
        valueSum: 0,
        weight: o.weight,
        chanceDepth: node.chanceDepth + 1,
      })
    }
    if (chanceNode.children.length === 0) return null
    if (chanceNode.children.length === 1) {
      // One bucket: no fan-out needed, but keep the resampled (honest) child
      const only = chanceNode.children[0]
      const child: Node = { ...only, action, parent: node, weight: undefined }
      node.children.push(child)
      return child
    }
    node.children.push(chanceNode)
    return this.selectOutcome(chanceNode)
  }

  /** Weighted-random outcome pick: visit frequency tracks outcome probability,
   * so a chance node's value converges to the weighted mean over draws */
  private selectOutcome(node: Node): Node {
    let r = this.rand()
    for (const child of node.children) {
      r -= child.weight ?? 1 / node.children.length
      if (r <= 0) return child
    }
    return node.children[node.children.length - 1]
  }

  /** A chance node's reportable afterstate: its most likely outcome */
  private representativeState(node: Node): GameState {
    if (!node.isChance || node.children.length === 0) return node.state
    let top = node.children[0]
    for (const c of node.children) {
      if ((c.weight ?? 0) > (top.weight ?? 0)) top = c
    }
    return top.state
  }

  private perspective(actor: PlayerId | null, node: Node): number {
    const q = node.visits > 0 ? node.valueSum / node.visits : 0.5
    return actor === 'player2' ? 1 - q : q
  }

  private selectChild(node: Node): Node {
    const logN = Math.log(Math.max(1, node.visits))
    let best = node.children[0]
    let bestScore = -Infinity
    for (const child of node.children) {
      const exploit = this.perspective(node.actor, child)
      const explore = this.exploration * Math.sqrt(logN / Math.max(1, child.visits))
      const score = exploit + explore
      if (score > bestScore) {
        bestScore = score
        best = child
      }
    }
    return best
  }
}
