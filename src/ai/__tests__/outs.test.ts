import { describe, it, expect } from 'vitest'
import type { GameState } from '@/engine/types'
import { createGame, createGameCard } from '@/engine/gameSetup'
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

  it('plays to outs when every line is losing', { timeout: 60000 }, () => {
    const base = midGameState()
    const p1 = base.players.player1
    const p2 = base.players.player2
    const losing: GameState = {
      ...base,
      players: {
        ...base.players,
        player1: { ...p1, lifeCards: p1.lifeCards.slice(0, 1) },
        player2: {
          ...p2,
          characters: ['OP01-005', 'OP01-005', 'OP01-010'].map((id) => ({
            ...createGameCard(id, 'player2'),
            turnPlayed: 1,
          })),
        },
      },
    }
    const lines = searchTurnLines(losing, 'player1', {
      beamWidth: 6,
      verifyTop: 2,
      topK: 2,
      maxExpansions: 1200,
      verifyBudget: 300,
    })
    expect(lines.length).toBeGreaterThan(0)
    const top = lines[0]
    expect(top.worstCase).toBeLessThan(0.35)
    expect(top.outs).toBeDefined()
    const o = top.outs!
    expect(o.branches.length).toBeGreaterThanOrEqual(1)
    expect(o.bestDraw).toBeGreaterThanOrEqual(o.mean - 1e-9)
    expect(o.flipMass).toBeGreaterThanOrEqual(0)

    // Disabled threshold: no outs report even when losing
    const flat = searchTurnLines(losing, 'player1', {
      beamWidth: 6,
      verifyTop: 2,
      topK: 1,
      maxExpansions: 1200,
      verifyBudget: 300,
      outsThreshold: 0,
    })
    expect(flat.every((l) => l.outs === undefined)).toBe(true)
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
