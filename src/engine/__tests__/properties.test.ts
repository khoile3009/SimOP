import { describe, it, expect } from 'vitest'
import type { GameState } from '@/engine/types'
import { processAction } from '@/engine/processor'
import { legalActions, whoActs } from '@/engine/legalActions'
import { createGame } from '@/engine/gameSetup'
import { runGame, makeAutoDeck } from '@/sim/selfplay'
import { GreedyAgent, RandomAgent } from '@/ai/agents'
import { buildCoverageDecks } from '@/sim/decks'
import { mulberry32, setRandomSource, resetRandomSource } from '@/utils/rng'

/**
 * Command-pattern properties the invariant fleet cannot see:
 * - determinism: the same seed and inputs replay to the identical game
 *   (replays, network sync and the fleet's repro recipes all depend on it)
 * - immutability: processAction never mutates its input state (aliasing bugs
 *   corrupt past states silently; freezing makes any write throw)
 */

const DECKS = buildCoverageDecks('OP13')

describe('engine properties', () => {
  it('same seed replays to the identical game', () => {
    for (let g = 0; g < 6; g++) {
      const run = () =>
        runGame({
          deck1: DECKS[g % DECKS.length].deck,
          deck2: DECKS[(g + 3) % DECKS.length].deck,
          agent1: new GreedyAgent(mulberry32(500 + g)),
          agent2: new RandomAgent(mulberry32(900 + g)),
          seed: 7000 + g,
        })
      const a = run()
      const b = run()
      // instanceIds are nanoid (process-unique by design), so compare the
      // structure of the game, not the raw ids
      expect(b.winner).toBe(a.winner)
      expect(b.actionCount).toBe(a.actionCount)
      expect(b.turnCount).toBe(a.turnCount)
      expect(b.history.map((h) => h.type).join(',')).toBe(a.history.map((h) => h.type).join(','))
    }
  })

  it('processAction never mutates its input state', () => {
    const deepFreeze = (o: unknown): unknown => {
      if (o && typeof o === 'object' && !Object.isFrozen(o)) {
        Object.freeze(o)
        for (const v of Object.values(o as Record<string, unknown>)) deepFreeze(v)
      }
      return o
    }
    for (let g = 0; g < 3; g++) {
      setRandomSource(mulberry32(42 + g))
      let state: GameState = createGame(
        makeAutoDeck(DECKS[g].deck.leader),
        makeAutoDeck(DECKS[(g + 5) % DECKS.length].deck.leader),
      )
      const rand = mulberry32(77 + g)
      for (let step = 0; step < 400 && !state.winner; step++) {
        const actor = whoActs(state)
        if (!actor) break
        const actions = legalActions(state)
        if (actions.length === 0) break
        const action = actions[Math.floor(rand() * actions.length)]
        deepFreeze(state)
        // a mutation of the frozen state throws in strict mode - that IS the test
        state = processAction(state, action, actor).state
      }
      resetRandomSource()
    }
  })
})
