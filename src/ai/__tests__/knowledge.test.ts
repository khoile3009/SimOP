import { describe, it, expect } from 'vitest'
import { createGame } from '@/engine/gameSetup'
import { determinize } from '@/ai/determinize'
import { makeAutoDeck } from '@/sim/selfplay'
import { mulberry32 } from '@/utils/rng'

describe('determinize knowledge tracking', () => {
  const base = createGame(makeAutoDeck('OP01-001'), makeAutoDeck('OP01-001'))
  // Deal life so the stacks exist (createGame leaves SETUP pre-mulligan states
  // in some flows; guard by just using whatever zones are populated)
  const state = {
    ...base,
    players: {
      ...base.players,
      player1: {
        ...base.players.player1,
        deck: base.players.player1.deck.map((c, i) =>
          i === 3 ? { ...c, seenByOwner: true } : i === 10 ? { ...c, revealed: true } : c,
        ),
        lifeCards: base.players.player1.lifeCards.map((c, i) =>
          i === 0 ? { ...c, revealed: true } : c,
        ),
      },
      player2: {
        ...base.players.player2,
        deck: base.players.player2.deck.map((c, i) =>
          i === 0 ? { ...c, revealed: true } : i === 5 ? { ...c, seenByOwner: true } : c,
        ),
        hand: base.players.player2.hand.map((c, i) => (i === 1 ? { ...c, revealed: true } : c)),
      },
    },
  }

  it('pins what the viewer has seen and resamples the rest', () => {
    const p1 = state.players.player1
    const p2 = state.players.player2
    let oppSeenMoved = 0
    for (let k = 0; k < 12; k++) {
      const world = determinize(state, 'player1', mulberry32(100 + k))
      const w1 = world.players.player1
      const w2 = world.players.player2
      // Own seen/revealed deck cards and revealed life stay put
      expect(w1.deck[3].instanceId).toBe(p1.deck[3].instanceId)
      expect(w1.deck[10].instanceId).toBe(p1.deck[10].instanceId)
      expect(w1.lifeCards[0]?.instanceId).toBe(p1.lifeCards[0]?.instanceId)
      // Opponent public knowledge stays put
      expect(w2.deck[0].instanceId).toBe(p2.deck[0].instanceId)
      expect(w2.hand[1].instanceId).toBe(p2.hand[1].instanceId)
      // The opponent's PRIVATE knowledge is not the viewer's: may move
      if (w2.deck[5].instanceId !== p2.deck[5].instanceId) oppSeenMoved++
      // Conservation: every hidden pool keeps the same card multiset
      for (const pid of ['player1', 'player2'] as const) {
        const before = [
          ...state.players[pid].deck,
          ...state.players[pid].lifeCards,
          ...state.players[pid].hand,
        ]
          .map((c) => c.instanceId)
          .sort()
        const after = [
          ...world.players[pid].deck,
          ...world.players[pid].lifeCards,
          ...world.players[pid].hand,
        ]
          .map((c) => c.instanceId)
          .sort()
        expect(after).toEqual(before)
      }
    }
    expect(oppSeenMoved).toBeGreaterThan(0)
  })
})
