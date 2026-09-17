import { describe, it, expect } from 'vitest'
import type { GameState, PlayerId } from '@/engine/types'
import { createGame } from '@/engine/gameSetup'
import { processAction } from '@/engine/processor'
import { whoActs } from '@/engine/legalActions'
import { determinize } from '../determinize'
import { MctsAgent } from '../mcts'
import { RandomAgent } from '../agents'
import { mulberry32, setRandomSource, resetRandomSource } from '@/utils/rng'
import { runGame, makeAutoDeck } from '@/sim/selfplay'

function midGame(): GameState {
  setRandomSource(mulberry32(77))
  let state = createGame(makeAutoDeck('OP01-001'), makeAutoDeck('OP01-001'))
  state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
  state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
  resetRandomSource()
  return state
}

function zoneMultiset(state: GameState, pid: PlayerId): string {
  const p = state.players[pid]
  return [...p.hand, ...p.deck, ...p.lifeCards, ...p.characters, ...p.trash]
    .map((c) => c.cardId)
    .sort()
    .join(',')
}

describe('determinize', () => {
  it('preserves zone counts and per-player card multisets', () => {
    const state = midGame()
    const world = determinize(state, 'player1', mulberry32(5))
    for (const pid of ['player1', 'player2'] as PlayerId[]) {
      expect(world.players[pid].hand.length).toBe(state.players[pid].hand.length)
      expect(world.players[pid].deck.length).toBe(state.players[pid].deck.length)
      expect(world.players[pid].lifeCards.length).toBe(state.players[pid].lifeCards.length)
      expect(zoneMultiset(world, pid)).toBe(zoneMultiset(state, pid))
    }
  })

  it('keeps the viewer-known zones untouched and reshuffles hidden ones', () => {
    const state = midGame()
    const world = determinize(state, 'player1', mulberry32(5))
    // Viewer's hand is knowledge: identical instances in identical order
    expect(world.players.player1.hand.map((c) => c.instanceId)).toEqual(
      state.players.player1.hand.map((c) => c.instanceId),
    )
    // Both life stacks are hidden - even the viewer's own (CR 3-10-2)
    const ownIds = new Set([...state.players.player1.deck, ...state.players.player1.lifeCards].map((c) => c.instanceId))
    for (const card of world.players.player1.lifeCards) {
      expect(ownIds.has(card.instanceId)).toBe(true)
    }
  })
})

describe('MctsAgent', () => {
  it('plays full legal games and beats random', { timeout: 90000 }, () => {
    let wins = 0
    for (const seed of [11, 12, 13]) {
      const record = runGame({
        deck1: makeAutoDeck('OP01-001'),
        deck2: makeAutoDeck('OP01-001'),
        agent1: new MctsAgent(mulberry32(seed), { iterations: 120 }),
        agent2: new RandomAgent(mulberry32(seed + 5)),
        seed,
      })
      if (record.winner === 'player1') wins++
    }
    expect(wins).toBeGreaterThanOrEqual(2)
  })
})
