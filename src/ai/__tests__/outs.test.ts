import { describe, it, expect } from 'vitest'
import type { GameState } from '@/engine/types'
import { createGame } from '@/engine/gameSetup'
import { processAction } from '@/engine/processor'
import { whoActs } from '@/engine/legalActions'
import { sampleOutClasses } from '@/ai/outs'
import { searchTurnLines } from '@/ai/turnSearch'
import { mulberry32, setRandomSource, resetRandomSource } from '@/utils/rng'
import { makeAutoDeck } from '@/sim/selfplay'

function midGameState(): GameState {
  setRandomSource(mulberry32(17))
  let state = createGame(makeAutoDeck('OP01-001'), makeAutoDeck('OP01-001'))
  state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
  state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
  resetRandomSource()
  return { ...state, currentPlayer: 'player1', turnNumber: 5, phase: 'MAIN', battle: null }
}

describe('out-class sampling', () => {
  const state = midGameState()

  it('covers the pool with weighted class representatives', () => {
    const pool = state.players.player2.deck
    const reps = sampleOutClasses(pool)
    expect(reps.length).toBeGreaterThanOrEqual(2)
    expect(reps.length).toBeLessThanOrEqual(5)
    const distinct = new Set(reps.map((r) => r.card.instanceId))
    expect(distinct.size).toBe(reps.length)
    for (const r of reps) {
      expect(r.mass).toBeGreaterThan(0)
      expect(r.mass).toBeLessThanOrEqual(1)
      expect(pool.some((c) => c.instanceId === r.card.instanceId)).toBe(true)
    }
    // An auto deck always holds counters and an ordinary median card
    const classes = reps.map((r) => r.cls)
    expect(classes).toContain('counter')
    expect(classes).toContain('ordinary')
  })

  it('empty pool yields no representatives', () => {
    expect(sampleOutClasses([])).toEqual([])
  })
})

describe('opponent-outs punisher pass', () => {
  it('publishes afterReply on verified non-lethal lines', { timeout: 60000 }, () => {
    const state = midGameState()
    const lines = searchTurnLines(state, 'player1', {
      beamWidth: 8,
      verifyTop: 2,
      topK: 2,
      maxExpansions: 2000,
      verifyBudget: 400,
    })
    expect(lines.length).toBeGreaterThan(0)
    const withReply = lines.filter((l) => l.afterReply)
    expect(withReply.length).toBeGreaterThan(0)
    for (const line of withReply) {
      const r = line.afterReply!
      expect(r.branches.length).toBeGreaterThanOrEqual(1)
      expect(r.expected).toBeGreaterThanOrEqual(0)
      expect(r.expected).toBeLessThanOrEqual(1)
      expect(r.worstDraw).toBeLessThanOrEqual(r.expected + 1e-9)
      for (const b of r.branches) {
        expect(b.cardName.length).toBeGreaterThan(0)
      }
    }
  })

  it('punish: false skips the pass entirely', () => {
    const state = midGameState()
    const lines = searchTurnLines(state, 'player1', {
      beamWidth: 8,
      verifyTop: 2,
      topK: 1,
      maxExpansions: 1500,
      verifyBudget: 300,
      punish: false,
    })
    expect(lines.every((l) => l.afterReply === undefined)).toBe(true)
  })
})
