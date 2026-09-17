import type { GameState, GameAction, PlayerId, GameCard } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { processAction } from '@/engine/processor'
import { legalActions, whoActs } from '@/engine/legalActions'
import { getOpponent } from '@/engine/turnManager'
import { getEffectivePower } from '@/engine/powerCalc'
import { hasKeyword } from '@/engine/keywords'
import { evaluateState } from './evaluate'
import { GreedyAgent, rolloutInterrupts } from './agents'
import type { Agent } from './agents'

/**
 * Whole-turn line search: the best single action means nothing outside its
 * sequence (attach-then-attack beats attack-then-attach), so recommendations
 * are complete action sequences from the current state to END_TURN, found by
 * beam search. Opponent battle responses inside a line are played as their
 * greedy best reply, so a line's score already prices in blocks and counters
 * against the opponent's actual hand (the analyzer is omniscient by design).
 */

export interface TurnLine {
  actions: GameAction[]
  labels: string[]
  /** Win probability under the greedy-reply defense model (optimistic bound) */
  score: number
  /** Win probability under the defender's BEST responses (adversarial minimax) */
  worstCase: number
  /** Score of simply ending the turn, for the delta display */
  baseline: number
  /** Wins outright even through the best defense with their revealed hand */
  lethal: boolean
  /** Wins outright against ANY possible hand (closed-form defense-capacity bound;
   * ignores life [Trigger] effects, which can still intervene) */
  guaranteed: boolean
  /** Defender options at the line's first real decision point, each with the
   * line's value if they choose it - the "if they X" annotations */
  branches: { label: string; value: number }[]
  /** Eval after each step, aligned with labels */
  stepScores: number[]
}

interface Node {
  state: GameState
  actions: GameAction[]
  labels: string[]
  stepScores: number[]
  done: boolean
}

export interface TurnSearchOptions {
  beamWidth?: number
  maxDepth?: number
  topK?: number
  maxExpansions?: number
  /** How many top candidates get the (costlier) adversarial verification */
  verifyTop?: number
}

export function searchTurnLines(
  root: GameState,
  player: PlayerId,
  options: TurnSearchOptions = {},
): TurnLine[] {
  const { beamWidth = 24, maxDepth = 20, topK = 3, maxExpansions = 20000, verifyTop = 8 } = options
  if (whoActs(root) !== player) return []

  const baselineState = endTurnState(root, player)
  const baseline = baselineState ? evaluateState(baselineState, player) : 0.5

  let frontier: Node[] = [{ state: root, actions: [], labels: [], stepScores: [], done: false }]
  const finished: Node[] = []
  let expansions = 0

  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    const next: Node[] = []
    const seen = new Set<string>()

    for (const node of frontier) {
      const actor = whoActs(node.state)
      if (!actor || node.state.winner) {
        finished.push({ ...node, done: true })
        continue
      }
      if (actor !== player) {
        // Opponent interrupt (block/counter/trigger): their best reply, not a branch
        const resolved = rolloutInterrupts(node.state, player)
        next.push({ ...node, state: resolved })
        continue
      }

      for (const action of legalActions(node.state)) {
        if (expansions++ > maxExpansions) break
        const result = processAction(node.state, action, player)
        if (result.error) continue
        const child: Node = {
          state: result.state,
          actions: [...node.actions, action],
          labels: [...node.labels, describeAction(node.state, action)],
          stepScores: [...node.stepScores, evaluateState(result.state, player)],
          done: action.type === 'END_TURN' || !!result.state.winner,
        }
        if (child.done) {
          finished.push(child)
          continue
        }
        const sig = signature(child.state)
        if (seen.has(sig)) continue // e.g. DON attach orderings commute
        seen.add(sig)
        next.push(child)
      }
    }

    // Keep the most promising partial lines
    next.sort((a, b) => evaluateState(b.state, player) - evaluateState(a.state, player))
    frontier = next.slice(0, beamWidth)
  }
  // Anything still open at the depth cap counts with its current score
  finished.push(...frontier.map((n) => ({ ...n, done: true })))

  const candidates = finished
    .map((n) => ({
      actions: n.actions,
      labels: n.labels,
      score: evaluateState(n.state, player),
      stepScores: n.stepScores,
    }))
    .sort((a, b) => b.score - a.score)

  // Deduplicate candidates that are the same line
  const unique: typeof candidates = []
  for (const c of candidates) {
    if (unique.length >= verifyTop) break
    if (unique.some((u) => u.labels.join() === c.labels.join())) continue
    unique.push(c)
  }

  // Adversarial verification: the greedy-reply model generated these candidates,
  // but their published value is the minimax over the defender's real options -
  // "best line" must not depend on the opponent misdefending
  const verified: TurnLine[] = unique.map((c) => {
    const v = verifyLine(root, player, c.actions)
    return {
      ...c,
      worstCase: v.value,
      branches: v.branches,
      baseline,
      lethal: v.value >= 1 - 1e-9,
      guaranteed: v.value >= 1 - 1e-9 && guaranteedLethal(root, player, c.actions),
    }
  })

  return verified.sort((a, b) => b.worstCase - a.worstCase).slice(0, topK)
}

/**
 * Agent tier between greedy and (future) MCTS: plans a whole turn once with the
 * line search, follows the plan action by action, and replans when the plan
 * diverges (a defender response invalidated it). Non-main decisions (defense,
 * mulligans) fall back to greedy - the plan covers only the agent's own turn.
 */
export class TurnPlannerAgent implements Agent {
  readonly name = 'planner'
  private greedy: GreedyAgent
  private plan: GameAction[] = []
  private searchOptions: TurnSearchOptions

  constructor(rand: () => number = Math.random, searchOptions: TurnSearchOptions = {}) {
    this.greedy = new GreedyAgent(rand)
    this.searchOptions = { beamWidth: 16, verifyTop: 4, topK: 1, ...searchOptions }
  }

  choose(state: GameState, actions: GameAction[], playerId: PlayerId): GameAction {
    const myMainDecision =
      state.currentPlayer === playerId && !state.winner && whoActs(state) === playerId
    if (!myMainDecision) {
      this.plan = []
      return this.greedy.choose(state, actions, playerId)
    }

    // Follow the current plan while its next step is still legal
    const next = this.plan[0]
    if (next && actions.some((a) => JSON.stringify(a) === JSON.stringify(next))) {
      this.plan.shift()
      return next
    }

    const lines = searchTurnLines(state, playerId, this.searchOptions)
    if (lines.length === 0 || lines[0].actions.length === 0) {
      this.plan = []
      return this.greedy.choose(state, actions, playerId)
    }
    this.plan = [...lines[0].actions]
    const first = this.plan.shift()!
    if (actions.some((a) => JSON.stringify(a) === JSON.stringify(first))) return first
    this.plan = []
    return this.greedy.choose(state, actions, playerId)
  }
}

// ─── Adversarial verification ────────────────────────────────────────────────

interface VerifyOutcome {
  value: number
  branches: { label: string; value: number }[]
}

/**
 * Replay a planned line with the defender playing EVERY option at each of their
 * decision points, taking the minimum - so counter allocation across the whole
 * turn ("save the counter for the big swing") is priced in. If a defender
 * deviation invalidates the planned remainder, the tail is repaired with a
 * greedy completion.
 */
function verifyLine(root: GameState, player: PlayerId, actions: GameAction[]): VerifyOutcome {
  const budget = { nodes: 4000 }
  const branches: { label: string; value: number }[] = []
  const value = verifyRec(root, player, actions, 0, budget, branches)
  return { value, branches }
}

function verifyRec(
  state: GameState,
  player: PlayerId,
  actions: GameAction[],
  index: number,
  budget: { nodes: number },
  topBranches: { label: string; value: number }[] | null,
): number {
  let s = state
  let i = index
  for (let guard = 0; guard < 80; guard++) {
    if (s.winner) return s.winner === player ? 1 : 0
    const actor = whoActs(s)
    if (!actor) return evaluateState(s, player)

    if (actor === player) {
      if (i >= actions.length) return evaluateState(s, player)
      const action = actions[i]
      const result = processAction(s, action, player)
      if (result.error) {
        // The defender's deviation made the plan illegal: repair greedily
        return evaluateState(greedyComplete(s, player), player)
      }
      s = result.state
      i++
      if (action.type === 'END_TURN') return evaluateState(s, player)
      continue
    }

    // Defender decision point
    const options = legalActions(s)
    if (options.length === 0) return evaluateState(s, player)
    if (options.length === 1 || budget.nodes <= 0) {
      const only = options.length === 1 ? options[0] : null
      if (only) {
        const result = processAction(s, only, actor)
        if (result.error) return evaluateState(s, player)
        s = result.state
        continue
      }
      s = rolloutInterrupts(s, player) // budget exhausted: fall back to greedy reply
      continue
    }

    let worst = Infinity
    const localBranches: { label: string; value: number }[] = []
    for (const option of options) {
      budget.nodes--
      const result = processAction(s, option, actor)
      if (result.error) continue
      const value = verifyRec(result.state, player, actions, i, budget, null)
      localBranches.push({ label: describeAction(s, option), value })
      if (value < worst) worst = value
    }
    if (topBranches && topBranches.length === 0) topBranches.push(...localBranches)
    return worst === Infinity ? evaluateState(s, player) : worst
  }
  return evaluateState(s, player)
}

/** Finish the turn with one-ply greedy play (used to repair diverged lines). */
function greedyComplete(state: GameState, player: PlayerId): GameState {
  const agent = new GreedyAgent(() => 0.5)
  let s = state
  for (let guard = 0; guard < 40; guard++) {
    if (s.winner) return s
    const actor = whoActs(s)
    if (!actor) return s
    if (actor !== player) {
      const resolved = rolloutInterrupts(s, player)
      if (resolved === s) return s
      s = resolved
      continue
    }
    const options = legalActions(s)
    if (options.length === 0) return s
    const action = agent.choose(s, options, player)
    const result = processAction(s, action, player)
    if (result.error) return s
    s = result.state
    if (action.type === 'END_TURN') return s
  }
  return s
}

// ─── Lethal certificate ──────────────────────────────────────────────────────

/**
 * Hand-independent lethal proof: replay the line's leader attacks, then check
 * whether ANY hand of the opponent's size could prevent enough damage, granting
 * them the strongest defense per card printed in the game (4000), a blocker
 * absorb per active blocker, and optimal allocation. Ignores life [Trigger]
 * effects, which can still intervene - the badge is "guaranteed before triggers".
 */
function guaranteedLethal(root: GameState, player: PlayerId, actions: GameAction[]): boolean {
  const opp = getOpponent(player)
  const oppState = root.players[opp]
  const threats = collectLeaderThreats(root, player, actions)
  if (threats.length === 0) return false

  const leaderPower = getEffectivePower(root, oppState.leader)
  const life = oppState.lifeCards.length
  const blockers = oppState.characters.filter(
    (c) => !c.isRested && hasKeyword(root, c, 'Blocker'),
  ).length
  const BEST_DEFENSE_PER_CARD = 4000
  const pool = oppState.hand.length * BEST_DEFENSE_PER_CARD

  // Cost to stop each threat (attacker wins ties: they need strictly more power)
  const stops = threats
    .map((t) => ({ cost: Math.max(0, t.power - leaderPower + 1000), damage: t.damage }))
    .sort((a, b) => b.damage - a.damage || b.cost - a.cost)
  // Blockers absorb whole attacks for free - defender spends them on the worst
  const remaining = stops.slice(Math.min(blockers, stops.length))

  // Blocked attacks contribute nothing; the pool contends with the rest
  const totalDamage = remaining.reduce((s, t) => s + t.damage, 0)
  let maxStopped = 0
  const n = remaining.length
  for (let mask = 0; mask < 1 << n && n <= 12; mask++) {
    let cost = 0
    let damage = 0
    for (let b = 0; b < n; b++) {
      if (mask & (1 << b)) {
        cost += remaining[b].cost
        damage += remaining[b].damage
      }
    }
    if (cost <= pool && damage > maxStopped) maxStopped = damage
  }

  // Winning needs life+1 successful hits worth of damage through the defense
  return totalDamage - maxStopped >= life + 1
}

interface Threat {
  power: number
  damage: number
}

/** Leader attacks in the line, with attacker power measured at declaration. */
function collectLeaderThreats(
  root: GameState,
  player: PlayerId,
  actions: GameAction[],
): Threat[] {
  const opp = getOpponent(player)
  const threats: Threat[] = []
  let s = root
  for (const action of actions) {
    while (!s.winner && whoActs(s) !== player) {
      const resolved = rolloutInterrupts(s, player)
      if (resolved === s) break
      s = resolved
    }
    if (s.winner || whoActs(s) !== player) break
    const result = processAction(s, action, player)
    if (result.error) break
    s = result.state
    if (action.type === 'DECLARE_ATTACK' && action.targetId === root.players[opp].leader.instanceId) {
      const mine = s.players[player]
      const attacker =
        mine.leader.instanceId === action.attackerId
          ? mine.leader
          : mine.characters.find((c) => c.instanceId === action.attackerId)
      if (attacker) {
        threats.push({
          power: getEffectivePower(s, attacker),
          damage: hasKeyword(s, attacker, 'Double Attack') ? 2 : 1,
        })
      }
    }
  }
  return threats
}

function endTurnState(root: GameState, player: PlayerId): GameState | null {
  const result = processAction(root, { type: 'END_TURN' }, player)
  return result.error ? null : result.state
}

/** Cheap structural signature for deduping commuting action orders. */
function signature(state: GameState): string {
  const parts: string[] = [state.phase, state.battle?.step ?? '-', state.pendingChoice?.prompt ?? '-']
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    const chars = p.characters
      .map((c) => `${c.cardId}:${c.isRested ? 'r' : 'a'}:${c.attachedDon}:${c.modifiers.length}`)
      .sort()
      .join(',')
    parts.push(
      `${chars}|L${p.leader.isRested ? 'r' : 'a'}${p.leader.attachedDon}|h${p.hand.length}|d${p.deck.length}|t${p.trash.length}|l${p.lifeCards.length}|don${p.donArea.filter((d) => !d.isRested).length}/${p.donArea.length}`,
    )
  }
  return parts.join('#')
}

export function describeAction(state: GameState, action: GameAction): string {
  const name = (instanceId: string): string => {
    const card = findAnywhere(state, instanceId)
    if (!card) return 'card'
    if (card.cardId === 'DON') return 'DON!!'
    return getCardById(card.cardId)?.name ?? card.cardId
  }
  switch (action.type) {
    case 'PLAY_CARD':
      return `Play ${name(action.cardInstanceId)}`
    case 'ATTACH_DON':
      return `Attach ◆ to ${name(action.targetCardId)}`
    case 'DECLARE_ATTACK':
      return `${name(action.attackerId)} attacks ${name(action.targetId)}`
    case 'ACTIVATE_EFFECT':
      return `Activate ${name(action.cardInstanceId)}`
    case 'PLAY_COUNTER_EVENT':
      return `Counter event ${name(action.cardInstanceId)}`
    case 'USE_COUNTER':
      return `Counter with ${action.cardInstanceIds.map(name).join(' + ')}`
    case 'CHOOSE':
      return action.instanceIds.length === 0
        ? 'Choose none'
        : `Choose ${action.instanceIds.map(name).join(', ')}`
    case 'ACTIVATE_BLOCKER':
      return `Block with ${name(action.blockerId)}`
    case 'ACTIVATE_TRIGGER':
      return action.accept ? 'Activate trigger' : 'Trigger to hand'
    case 'END_TURN':
      return 'End turn'
    default:
      return action.type.toLowerCase().replaceAll('_', ' ')
  }
}

function findAnywhere(state: GameState, instanceId: string): GameCard | null {
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    for (const zone of [[p.leader], p.characters, p.hand, p.trash, p.donArea, p.lifeCards, p.deck]) {
      const card = zone.find((c) => c.instanceId === instanceId)
      if (card) return card
    }
  }
  return null
}
