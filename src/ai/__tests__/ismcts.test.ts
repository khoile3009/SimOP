import { describe, it, expect } from 'vitest'
import { IsMctsAgent } from '@/ai/ismcts'
import { RandomAgent } from '@/ai/agents'
import { runGame, makeAutoDeck } from '@/sim/selfplay'
import { mulberry32 } from '@/utils/rng'

describe('IsMctsAgent', () => {
  it('plays full legal games and beats random', { timeout: 120000 }, () => {
    let wins = 0
    for (const seed of [411, 412, 413]) {
      // runGame throws if any agent returns an illegal action
      const record = runGame({
        deck1: makeAutoDeck('OP01-001'),
        deck2: makeAutoDeck('OP01-001'),
        agent1: new IsMctsAgent(mulberry32(seed), { iterations: 200 }),
        agent2: new RandomAgent(mulberry32(seed + 1)),
        seed,
      })
      if (record.winner === 'player1') wins++
    }
    expect(wins).toBeGreaterThanOrEqual(2)
  })
})
