import type { GameState, GameAction, PlayerId } from '@/engine/types'
import { processAction } from '@/engine/processor'
import { legalActions, whoActs } from '@/engine/legalActions'
import { evaluateState } from './evaluate'
import type { EvalFn } from './evaluate'
import type { Agent } from './agents'

/**
 * Perfect-information UCT with evaluation leaves: selection by UCB1 (each node
 * judged from its acting player's perspective - the tree naturally alternates
 * max/min as actors change), one expansion per iteration, and the leaf valued
 * by the logistic eval instead of a noisy random rollout. Because nodes are
 * just states and actions come from legalActions, the tree flows through
 * battle responses, effect choices, and INTO the opponent's next turn - a
 * lookahead horizon the turn-planner doesn't have.
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
}

export interface MctsOptions {
  iterations?: number
  exploration?: number
  evalFn?: EvalFn
}

export class MctsAgent implements Agent {
  readonly name = 'mcts'
  private rand: () => number
  private iterations: number
  private exploration: number
  private evalFn: EvalFn

  constructor(rand: () => number = Math.random, options: MctsOptions = {}) {
    this.rand = rand
    this.iterations = options.iterations ?? 300
    this.exploration = options.exploration ?? 0.5
    this.evalFn = options.evalFn ?? evaluateState
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
    }

    for (let i = 0; i < this.iterations; i++) {
      // Selection
      let node = root
      while ((node.untried === null || node.untried.length === 0) && node.children.length > 0) {
        node = this.selectChild(node)
      }
      // Expansion
      if (node.untried === null) node.untried = node.state.winner ? [] : legalActions(node.state)
      if (node.untried.length > 0 && node.actor) {
        const idx = Math.floor(this.rand() * node.untried.length)
        const action = node.untried.splice(idx, 1)[0]
        const result = processAction(node.state, action, node.actor)
        if (!result.error) {
          const child: Node = {
            state: result.state,
            actor: whoActs(result.state),
            action,
            parent: node,
            children: [],
            untried: null,
            visits: 0,
            valueSum: 0,
          }
          node.children.push(child)
          node = child
        }
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
    return best?.action ?? actions[0]
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
