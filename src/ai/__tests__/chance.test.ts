import { describe, it, expect } from 'vitest'
import { createGame } from '@/engine/gameSetup'
import { chanceTrigger, chanceOutcomeStates, resampleHidden } from '@/ai/chance'
import { makeAutoDeck } from '@/sim/selfplay'
import { mulberry32 } from '@/utils/rng'
import type { GameState } from '@/engine/types'

describe('chance-node machinery', () => {
  const base = createGame(makeAutoDeck('OP01-001'), makeAutoDeck('OP01-001'))
  const state: GameState = {
    ...base,
    currentPlayer: 'player1',
    players: {
      ...base.players,
      player2: {
        ...base.players.player2,
        deck: base.players.player2.deck.map((c, i) => (i === 2 ? { ...c, seenByOwner: true } : c)),
      },
    },
  }

  it('END_TURN is a chance trigger for the next player, unless their top is known', () => {
    expect(chanceTrigger(state, { type: 'END_TURN' })).toEqual({
      kind: 'draw',
      player: 'player2',
    })
    const pinnedTop: GameState = {
      ...state,
      players: {
        ...state.players,
        player2: {
          ...state.players.player2,
          deck: state.players.player2.deck.map((c, i) =>
            i === 0 ? { ...c, seenByOwner: true } : c,
          ),
        },
      },
    }
    expect(chanceTrigger(pinnedTop, { type: 'END_TURN' })).toBeNull()
  })

  it('resampleHidden permutes unknowns, keeps pins in place, conserves the multiset', () => {
    const rand = mulberry32(7)
    const before = state.players.player2.deck
    let movedPin = 0
    let permuted = 0
    for (let k = 0; k < 10; k++) {
      const world = resampleHidden(state, rand)
      const after = world.players.player2.deck
      expect(after.length).toBe(before.length)
      expect([...after.map((c) => c.instanceId)].sort()).toEqual(
        [...before.map((c) => c.instanceId)].sort(),
      )
      if (after[2].instanceId !== before[2].instanceId) movedPin++
      if (after.some((c, i) => c.instanceId !== before[i].instanceId)) permuted++
    }
    expect(movedPin).toBe(0)
    expect(permuted).toBeGreaterThan(5)
  })

  it('outcome states force distinct bucket representatives on top, weights sum to 1', () => {
    const rand = mulberry32(42)
    const trigger = { kind: 'draw' as const, player: 'player2' as const }
    const outcomes = chanceOutcomeStates(state, trigger, 3, rand)
    expect(outcomes.length).toBeGreaterThanOrEqual(1)
    expect(outcomes.length).toBeLessThanOrEqual(3)
    const totalWeight = outcomes.reduce((s, o) => s + o.weight, 0)
    expect(totalWeight).toBeCloseTo(1, 6)
    for (const o of outcomes) {
      const deck = o.state.players.player2.deck
      expect(deck.length).toBe(state.players.player2.deck.length)
      // The pinned card never moves off its slot
      expect(deck[2].instanceId).toBe(state.players.player2.deck[2].instanceId)
    }
  })
})
