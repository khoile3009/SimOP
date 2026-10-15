import { describe, it, expect } from 'vitest'
import type { GameState } from '@/engine/types'
import { createGame } from '@/engine/gameSetup'
import { processAction } from '@/engine/processor'
import { whoActs, legalActions } from '@/engine/legalActions'
import { MctsAgent } from '@/ai/mcts'
import { rankPrior } from '@/ai/prior'
import { makeAutoDeck } from '@/sim/selfplay'
import { mulberry32, setRandomSource, resetRandomSource } from '@/utils/rng'

function midGameState(): GameState {
  setRandomSource(mulberry32(31))
  let state = createGame(makeAutoDeck('OP01-001'), makeAutoDeck('OP01-001'))
  state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
  state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
  resetRandomSource()
  return { ...state, currentPlayer: 'player1', turnNumber: 5, phase: 'MAIN', battle: null }
}

describe('policy prior', () => {
  const state = midGameState()

  it('rank prior scores states finitely and prefers more life', () => {
    const healthy = rankPrior(state, 'player1')
    expect(Number.isFinite(healthy)).toBe(true)
    const hurt: GameState = {
      ...state,
      players: {
        ...state.players,
        player1: {
          ...state.players.player1,
          lifeCards: state.players.player1.lifeCards.slice(0, 1),
        },
      },
    }
    expect(rankPrior(hurt, 'player1')).toBeLessThan(healthy)
  })

  it('a uniform prior at full mix reproduces the incumbent exactly', () => {
    const actions = legalActions(state)
    const incumbent = new MctsAgent(mulberry32(5), { iterations: 120 })
    const neutral = new MctsAgent(mulberry32(5), {
      iterations: 120,
      prior: () => 0,
      cPuct: 1,
    })
    expect(neutral.choose(state, actions)).toEqual(incumbent.choose(state, actions))
  })
})
