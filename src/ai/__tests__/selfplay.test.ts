import { describe, it, expect } from 'vitest'
import { RandomAgent, GreedyAgent } from '../agents'
import { runGame, runMatch, makeAutoDeck } from '@/sim/selfplay'
import { mulberry32 } from '@/utils/rng'

const deck = () => makeAutoDeck('OP01-001')

describe('makeAutoDeck', () => {
  it('builds a legal 50-card deck', () => {
    const d = deck()
    expect(d.cards.reduce((s, c) => s + c.qty, 0)).toBe(50)
    expect(d.cards.every((c) => c.qty <= 4)).toBe(true)
  })
})

describe('self-play', () => {
  it('random vs random games finish with a winner', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const record = runGame({
        deck1: deck(),
        deck2: deck(),
        agent1: new RandomAgent(mulberry32(seed)),
        agent2: new RandomAgent(mulberry32(seed + 1000)),
        seed,
      })
      expect(record.winner).not.toBeNull()
      expect(record.evalTrace.length).toBeGreaterThan(0)
    }
  })

  it('is deterministic for a given seed', () => {
    const play = () =>
      runGame({
        deck1: deck(),
        deck2: deck(),
        agent1: new RandomAgent(mulberry32(7)),
        agent2: new RandomAgent(mulberry32(8)),
        seed: 123,
      })
    const a = play()
    const b = play()
    expect(a.winner).toBe(b.winner)
    expect(a.actionCount).toBe(b.actionCount)
    expect(a.turnCount).toBe(b.turnCount)
    expect(a.history.map((h) => h.type)).toEqual(b.history.map((h) => h.type))
  })

  it('greedy beats random comfortably', () => {
    const n = 20
    const result = runMatch(
      n,
      (rand) => new GreedyAgent(rand),
      (rand) => new RandomAgent(rand),
      deck(),
      deck(),
      2026,
    )
    expect(result.wins.player1).toBeGreaterThan(n * 0.6)
  })
})
