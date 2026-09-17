import { describe, it, expect } from 'vitest'
import type { GameState, PlayerId, GameCard } from '@/engine/types'
import { createGame, createGameCard } from '@/engine/gameSetup'
import { processAction } from '@/engine/processor'
import { whoActs } from '@/engine/legalActions'
import { searchTurnLines } from '../turnSearch'
import { mulberry32, setRandomSource, resetRandomSource } from '@/utils/rng'
import { makeAutoDeck } from '@/sim/selfplay'

function baseState(): GameState {
  setRandomSource(mulberry32(21))
  let state = createGame(makeAutoDeck('OP01-001'), makeAutoDeck('OP01-001'))
  state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
  state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
  resetRandomSource()
  return { ...state, currentPlayer: 'player1', turnNumber: 5, phase: 'MAIN', battle: null }
}

function withCharacter(
  state: GameState,
  pid: PlayerId,
  cardId: string,
  props: Partial<GameCard> = {},
): { state: GameState; card: GameCard } {
  const card = { ...createGameCard(cardId, pid), turnPlayed: 1, ...props }
  const p = state.players[pid]
  return {
    state: {
      ...state,
      players: { ...state.players, [pid]: { ...p, characters: [...p.characters, card] } },
    },
    card,
  }
}

describe('TurnPlannerAgent', () => {
  it('plays full legal games and beats random', { timeout: 60000 }, async () => {
    const { TurnPlannerAgent } = await import('../turnSearch')
    const { RandomAgent } = await import('../agents')
    const { runGame, makeAutoDeck } = await import('@/sim/selfplay')
    let plannerWins = 0
    for (const seed of [301, 302, 303]) {
      // runGame throws if any agent returns an illegal action
      const record = runGame({
        deck1: makeAutoDeck('OP01-001'),
        deck2: makeAutoDeck('OP01-001'),
        agent1: new TurnPlannerAgent(mulberry32(seed)),
        agent2: new RandomAgent(mulberry32(seed + 99)),
        seed,
      })
      if (record.winner === 'player1') plannerWins++
    }
    expect(plannerWins).toBeGreaterThanOrEqual(2)
  })
})

describe('searchTurnLines', () => {
  it('finds a two-attack lethal through an empty defense', () => {
    let state = baseState()
    const c1 = withCharacter(state, 'player1', 'OP01-023') // Marco 5000
    state = c1.state
    const c2 = withCharacter(state, 'player1', 'OP01-023')
    state = c2.state
    state = {
      ...state,
      players: {
        ...state.players,
        player1: { ...state.players.player1, hand: [], donArea: [] },
        player2: {
          ...state.players.player2,
          hand: [], // no counters
          characters: [],
          lifeCards: [createGameCard('OP01-010', 'player2')], // 1 life
        },
      },
    }

    const lines = searchTurnLines(state, 'player1')
    expect(lines.length).toBeGreaterThan(0)
    expect(lines[0].lethal).toBe(true)
    expect(lines[0].score).toBe(1)
    // Two leader attacks: one for the last life card, one for the win
    const attacks = lines[0].labels.filter((l) => l.includes('attacks')).length
    expect(attacks).toBeGreaterThanOrEqual(2)
  })

  it('orders the sequence correctly: attach DON before attacking', () => {
    let state = baseState()
    // Opponent has a rested 7000 wall; my lone leader is 5000 - only
    // attach-both-then-attack reaches it (attacker wins ties at 7000)
    const wall = withCharacter(state, 'player2', 'OP01-065', { isRested: true }) // Vergo 7000
    state = wall.state
    state = {
      ...state,
      players: {
        ...state.players,
        player1: {
          ...state.players.player1,
          hand: [],
          donArea: [createGameCard('DON', 'player1'), createGameCard('DON', 'player1')],
        },
        player2: { ...state.players.player2, hand: [] },
      },
    }

    const lines = searchTurnLines(state, 'player1')
    const top = lines[0]
    const attackIdx = top.labels.findIndex((l) => l.includes('attacks Vergo'))
    expect(attackIdx).toBeGreaterThan(0)
    const attaches = top.labels.slice(0, attackIdx).filter((l) => l.startsWith('Attach')).length
    expect(attaches).toBe(2) // both DON attached before swinging
    // And the wall died in the top line
    expect(top.score).toBeGreaterThan(top.baseline)
  })

  it('always includes the pass line as a floor', () => {
    const state = baseState()
    const lines = searchTurnLines(state, 'player1')
    expect(lines.length).toBeGreaterThan(0)
    // The top line can never be worse than just passing, even under best defense
    expect(lines[0].worstCase).toBeGreaterThanOrEqual(lines[0].baseline - 1e-9)
    for (const line of lines) {
      expect(line.worstCase).toBeLessThanOrEqual(line.score + 1e-9)
      expect(line.labels[line.labels.length - 1] === 'End turn' || line.lethal).toBe(true)
    }
  })

  it('distinguishes guaranteed lethal from lethal-vs-revealed-hand', () => {
    // Two 5000 attackers into a 5000 leader with 1 life
    function scenario(oppHand: string[]): ReturnType<typeof searchTurnLines> {
      let state = baseState()
      state = withCharacter(state, 'player1', 'OP01-023').state
      state = withCharacter(state, 'player1', 'OP01-023').state
      state = {
        ...state,
        players: {
          ...state.players,
          player1: { ...state.players.player1, hand: [], donArea: [] },
          player2: {
            ...state.players.player2,
            hand: oppHand.map((id) => createGameCard(id, 'player2')),
            characters: [],
            lifeCards: [createGameCard('OP01-010', 'player2')],
          },
        },
      }
      return searchTurnLines(state, 'player1')
    }

    // Empty hand: no possible defense - guaranteed
    const certain = scenario([])
    expect(certain[0].lethal).toBe(true)
    expect(certain[0].guaranteed).toBe(true)

    // Two cards that happen to be useless ([Main] events, no counter value):
    // still lethal against the revealed hand, but a hypothetical hand of real
    // counters could have stopped it - not guaranteed
    const revealed = scenario(['OP01-030', 'OP01-030'])
    expect(revealed[0].lethal).toBe(true)
    expect(revealed[0].guaranteed).toBe(false)
  })
})
