import type { GameState, GameAction, PlayerId, Deck } from '@/engine/types'
import { createGame } from '@/engine/gameSetup'
import { processAction } from '@/engine/processor'
import { legalActions, whoActs } from '@/engine/legalActions'
import { getCardById, getCardsBySet } from '@/data/cardService'
import { mulberry32, setRandomSource, resetRandomSource } from '@/utils/rng'
import { evaluateState } from '@/ai/evaluate'
import type { Agent } from '@/ai/agents'
import { DECK_SIZE, MAX_CARD_COPIES } from '@/engine/constants'

export interface EvalSnapshot {
  turnNumber: number
  player1Score: number
}

export interface GameRecord {
  seed: number
  winner: PlayerId | null // null = hit the action cap (safety guard, counts as a draw)
  turnCount: number
  actionCount: number
  history: GameAction[]
  evalTrace: EvalSnapshot[] // player1 win-probability at the start of each turn
}

export interface RunGameOptions {
  deck1: Deck
  deck2: Deck
  agent1: Agent
  agent2: Agent
  seed: number
  maxActions?: number
  /** Called after every applied action - playtest harnesses hang invariants here */
  onStep?: (state: GameState, action: GameAction, index: number) => void
}

/**
 * Build a deterministic, deck-legal list from a set's card pool matching the
 * leader's colors: characters sorted by cost, 4 copies each, until 50 cards.
 */
export function makeAutoDeck(leaderId: string): Deck {
  const leader = getCardById(leaderId)
  if (!leader || leader.cardType !== 'Leader') throw new Error(`Not a leader: ${leaderId}`)
  const colors = new Set(leader.color)
  const pool = getCardsBySet(leader.set)
    .filter(
      (c) =>
        (c.cardType === 'Character' || c.cardType === 'Event') &&
        c.color.some((col) => colors.has(col)),
    )
    .sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id))

  const cards: Deck['cards'] = []
  let total = 0
  for (const card of pool) {
    if (total >= DECK_SIZE) break
    const qty = Math.min(MAX_CARD_COPIES, DECK_SIZE - total)
    cards.push({ cardId: card.id, qty })
    total += qty
  }
  if (total < DECK_SIZE) {
    throw new Error(`Card pool too small for ${leaderId}: got ${total}/${DECK_SIZE}`)
  }
  return {
    id: `auto-${leaderId}`,
    name: `Auto ${leader.name}`,
    leader: leaderId,
    cards,
    createdAt: 0,
    updatedAt: 0,
  }
}

export function runGame(options: RunGameOptions): GameRecord {
  const { deck1, deck2, agent1, agent2, seed, maxActions = 3000, onStep } = options
  setRandomSource(mulberry32(seed))
  try {
    let state: GameState = createGame(deck1, deck2)
    const agents: Record<PlayerId, Agent> = { player1: agent1, player2: agent2 }
    const history: GameAction[] = []
    const evalTrace: EvalSnapshot[] = []
    let lastTracedTurn = 0

    while (!state.winner && history.length < maxActions) {
      const actor = whoActs(state)
      if (!actor) break
      const actions = legalActions(state)
      if (actions.length === 0) {
        throw new Error(
          `No legal actions for ${actor} (phase=${state.phase}, turn=${state.turnNumber})`,
        )
      }
      if (state.phase === 'MAIN' && state.turnNumber > lastTracedTurn) {
        lastTracedTurn = state.turnNumber
        evalTrace.push({
          turnNumber: state.turnNumber,
          player1Score: evaluateState(state, 'player1'),
        })
      }
      const action = agents[actor].choose(state, actions, actor)
      const result = processAction(state, action, actor)
      if (result.error) {
        throw new Error(`Engine rejected enumerated action ${action.type}: ${result.error}`)
      }
      state = result.state
      history.push(action)
      onStep?.(state, action, history.length - 1)
    }

    return {
      seed,
      winner: state.winner,
      turnCount: state.turnNumber,
      actionCount: history.length,
      history,
      evalTrace,
    }
  } finally {
    resetRandomSource()
  }
}

export interface MatchResult {
  games: GameRecord[]
  wins: Record<PlayerId, number>
  draws: number
}

/** Run n games with fresh agents per game; seed varies per game for variety. */
export function runMatch(
  n: number,
  makeAgent1: (rand: () => number) => Agent,
  makeAgent2: (rand: () => number) => Agent,
  deck1: Deck,
  deck2: Deck,
  baseSeed = 1,
): MatchResult {
  const games: GameRecord[] = []
  const wins: Record<PlayerId, number> = { player1: 0, player2: 0 }
  let draws = 0
  for (let i = 0; i < n; i++) {
    const seed = baseSeed + i * 7919
    const record = runGame({
      deck1,
      deck2,
      agent1: makeAgent1(mulberry32(seed ^ 0xa5a5a5)),
      agent2: makeAgent2(mulberry32(seed ^ 0x5a5a5a)),
      seed,
    })
    games.push(record)
    if (record.winner) wins[record.winner]++
    else draws++
  }
  return { games, wins, draws }
}
