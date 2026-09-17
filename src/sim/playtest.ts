import type { GameState, GameAction, PlayerId } from '@/engine/types'
import { legalActions } from '@/engine/legalActions'
import { getEffectDefs } from '@/engine/effects/registry'
import { effectUsageSnapshot, resetEffectUsage } from '@/engine/effects/telemetry'
import { RandomAgent, GreedyAgent, type Agent } from '@/ai/agents'
import { runGame } from './selfplay'
import { buildCoverageDecks, coverageCardIds, annotateUnreachable } from './decks'
import type { CoverageDeck } from './decks'
import { mulberry32 } from '@/utils/rng'

/**
 * Bot-fleet playtesting: run many seeded games across agent matchups, check a
 * battery of invariants after every action, and report anomalies. Two bug
 * classes are covered: invariant violations (a state that should be impossible)
 * and usage holes (an action type or card effect that never occurs across the
 * whole campaign - the signature of an unpayable cost or dead condition).
 */

export interface Violation {
  game: number
  seed: number
  matchup: string
  actionIndex: number
  actionType: string
  message: string
  /** Replay recipe: same seed + matchup reproduces the game deterministically */
  history: GameAction[]
}

/** UX friction signals measured from what the bots were prompted with. */
export interface UxStats {
  blockSteps: number
  /** Block prompts where Decline was the only legal answer */
  trivialBlockSteps: number
  counterSteps: number
  /** Counter prompts where Pass was the only legal answer */
  trivialCounterSteps: number
  choices: number
  /** Choices offering exactly one pick */
  singleOptionChoices: number
  /** Optional choices resolved as "choose none" */
  declinedChoices: number
}

export interface PlaytestReport {
  games: number
  violations: Violation[]
  wins: Record<PlayerId, number>
  draws: number
  avgTurns: number
  avgActions: number
  actionCounts: Record<string, number>
  /** Action types that never occurred - each one deserves an explanation */
  unusedActionTypes: string[]
  /** cardId:timing defs (for cards present in the decks) that never fired */
  unusedEffects: string[]
  ux: UxStats
  /** Human-readable UX suggestions derived from the stats */
  uxNotes: string[]
  elapsedMs: number
}

/** Action types a healthy mixed campaign is expected to produce at least once. */
const EXPECTED_ACTION_TYPES = [
  'MULLIGAN',
  'PLAY_CARD',
  'ATTACH_DON',
  'DECLARE_ATTACK',
  'ACTIVATE_BLOCKER',
  'DECLINE_BLOCK',
  'USE_COUNTER',
  'PASS_COUNTER',
  'PLAY_COUNTER_EVENT',
  'ACTIVATE_TRIGGER',
  'ACTIVATE_EFFECT',
  'CHOOSE',
  'END_TURN',
]

function checkInvariants(state: GameState): string | null {
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    const cardTotal =
      p.deck.length + p.hand.length + p.trash.length + p.lifeCards.length +
      p.characters.length + (p.stage ? 1 : 0)
    if (cardTotal !== 50) return `${pid} card conservation broken: ${cardTotal} != 50`
    const donTotal =
      p.donArea.length + p.donDeck.length + p.leader.attachedDon +
      p.characters.reduce((s, c) => s + c.attachedDon, 0)
    if (donTotal !== 10) return `${pid} DON conservation broken: ${donTotal} != 10`
    if (p.characters.length > 5) return `${pid} has ${p.characters.length} characters (max 5)`
    for (const c of p.characters) {
      if (c.attachedDon < 0) return `${pid} character with negative attached DON`
    }
  }
  const pc = state.pendingChoice
  if (pc) {
    if (pc.options.length === 0) return 'pendingChoice with zero options'
    if (new Set(pc.options).size !== pc.options.length) return 'pendingChoice with duplicate options'
    if (pc.min > pc.max) return `pendingChoice min ${pc.min} > max ${pc.max}`
  }
  if (state.stack.length > 20) return `resolution stack depth ${state.stack.length}`
  return null
}

const AGENT_KINDS: Record<string, (rand: () => number) => Agent> = {
  g: (rand) => new GreedyAgent(rand),
  r: (rand) => new RandomAgent(rand),
}

export interface PlaytestOptions {
  games: number
  baseSeed?: number
  /** Matchup rotation, e.g. ['gr', 'rg', 'gg', 'rr'] */
  matchups?: string[]
  maxActions?: number
  /** Decks to rotate through; defaults to set-covering decks (every card rides) */
  decks?: CoverageDeck[]
}

export function runPlaytest(options: PlaytestOptions): PlaytestReport {
  const {
    games,
    baseSeed = 1,
    matchups = ['gr', 'rg', 'gg', 'rr'],
    maxActions = 3000,
    decks = buildCoverageDecks('OP01'),
  } = options
  const started = Date.now()
  resetEffectUsage()

  const violations: Violation[] = []
  const wins: Record<PlayerId, number> = { player1: 0, player2: 0 }
  const actionCounts: Record<string, number> = {}
  const ux: UxStats = {
    blockSteps: 0,
    trivialBlockSteps: 0,
    counterSteps: 0,
    trivialCounterSteps: 0,
    choices: 0,
    singleOptionChoices: 0,
    declinedChoices: 0,
  }
  let draws = 0
  let totalTurns = 0
  let totalActions = 0

  for (let i = 0; i < games; i++) {
    const matchup = matchups[i % matchups.length]
    const seed = baseSeed + i * 7919
    // Rotate deck pairings so every deck plays many games against varied foes
    const deck1 = decks[i % decks.length].deck
    const deck2 = decks[(i + 1 + Math.floor(i / decks.length)) % decks.length].deck
    let firstViolation: { index: number; type: string; message: string } | null = null

    try {
      const record = runGame({
        deck1,
        deck2,
        agent1: AGENT_KINDS[matchup[0]](mulberry32(seed ^ 0xa5a5a5)),
        agent2: AGENT_KINDS[matchup[1]](mulberry32(seed ^ 0x5a5a5a)),
        seed,
        maxActions,
        onStep: (state, action, index) => {
          actionCounts[action.type] = (actionCounts[action.type] ?? 0) + 1
          if (!firstViolation) {
            const problem = checkInvariants(state)
            if (problem) firstViolation = { index, type: action.type, message: problem }
          }
          // UX friction: what is the NEXT decision the bots face, and is it real?
          if (action.type === 'CHOOSE') {
            ux.choices++
            if (action.instanceIds.length === 0) ux.declinedChoices++
          }
          if (state.pendingChoice) {
            if (state.pendingChoice.options.length === 1) ux.singleOptionChoices++
          } else if (state.battle?.step === 'BLOCK') {
            ux.blockSteps++
            if (legalActions(state).length === 1) ux.trivialBlockSteps++
          } else if (state.battle?.step === 'COUNTER' && action.type !== 'USE_COUNTER') {
            ux.counterSteps++
            if (legalActions(state).length === 1) ux.trivialCounterSteps++
          }
        },
      })
      if (record.winner) wins[record.winner]++
      else draws++
      totalTurns += record.turnCount
      totalActions += record.actionCount
      if (firstViolation) {
        const fv = firstViolation as { index: number; type: string; message: string }
        violations.push({
          game: i,
          seed,
          matchup,
          actionIndex: fv.index,
          actionType: fv.type,
          message: fv.message,
          history: record.history,
        })
      }
    } catch (err) {
      violations.push({
        game: i,
        seed,
        matchup,
        actionIndex: -1,
        actionType: 'EXCEPTION',
        message: err instanceof Error ? err.message : String(err),
        history: [],
      })
    }
  }

  // Usage holes: expected action types and registered effects that never occurred
  // anywhere in the coverage decks. Effects gated on a leader no deck can supply
  // are annotated rather than flagged as suspicious.
  const unusedActionTypes = EXPECTED_ACTION_TYPES.filter((t) => !(t in actionCounts))
  const usage = effectUsageSnapshot()
  const unusedEffects: string[] = []
  for (const cardId of coverageCardIds(decks)) {
    for (const def of getEffectDefs(cardId)) {
      const key = `${cardId}:${def.timing}`
      if (!(key in usage) && !unusedEffects.some((u) => u.startsWith(key))) {
        unusedEffects.push(key + annotateUnreachable(key, decks))
      }
    }
  }

  const uxNotes: string[] = []
  const pct = (a: number, b: number) => (b > 0 ? Math.round((100 * a) / b) : 0)
  if (pct(ux.trivialBlockSteps, ux.blockSteps) >= 50) {
    uxNotes.push(
      `${pct(ux.trivialBlockSteps, ux.blockSteps)}% of block prompts had Decline as the only answer - auto-skip the block step when the defender has no legal blocker.`,
    )
  }
  if (pct(ux.trivialCounterSteps, ux.counterSteps) >= 30) {
    uxNotes.push(
      `${pct(ux.trivialCounterSteps, ux.counterSteps)}% of counter prompts had Pass as the only answer - auto-pass the counter step when the defender has no counters or affordable events.`,
    )
  }
  if (pct(ux.singleOptionChoices, ux.choices) >= 25) {
    uxNotes.push(
      `${pct(ux.singleOptionChoices, ux.choices)}% of effect choices offered exactly one option - consider a one-tap confirm (or auto-pick for mandatory single-target effects).`,
    )
  }
  if (pct(ux.declinedChoices, ux.choices) >= 50) {
    uxNotes.push(
      `${pct(ux.declinedChoices, ux.choices)}% of effect choices were resolved as "choose none" - a quick-decline affordance (Esc / dedicated button) would cut clicks.`,
    )
  }

  return {
    games,
    violations,
    wins,
    draws,
    avgTurns: totalTurns / Math.max(1, games - violations.length),
    avgActions: totalActions / Math.max(1, games - violations.length),
    actionCounts,
    unusedActionTypes,
    unusedEffects: unusedEffects.sort(),
    ux,
    uxNotes,
    elapsedMs: Date.now() - started,
  }
}
