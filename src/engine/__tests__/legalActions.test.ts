import { describe, it, expect } from 'vitest'
import { createGame } from '../gameSetup'
import { processAction } from '../processor'
import { validateAction } from '../rules'
import { legalActions, whoActs } from '../legalActions'
import { mulberry32, setRandomSource, resetRandomSource } from '@/utils/rng'
import { makeAutoDeck } from '@/sim/selfplay'

function freshGame(seed: number) {
  setRandomSource(mulberry32(seed))
  const state = createGame(makeAutoDeck('OP01-001'), makeAutoDeck('OP01-001'))
  resetRandomSource()
  return state
}

describe('whoActs', () => {
  it('starts with the turn player deciding mulligan', () => {
    const state = freshGame(1)
    expect(whoActs(state)).toBe(state.currentPlayer)
  })
})

describe('legalActions', () => {
  it('offers exactly keep/mulligan during setup', () => {
    const state = freshGame(2)
    const actions = legalActions(state)
    expect(actions).toHaveLength(2)
    expect(actions.every((a) => a.type === 'MULLIGAN')).toBe(true)
  })

  it('never offers attacks on either player first turn', () => {
    let state = freshGame(3)
    state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
    state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
    expect(state.phase).toBe('MAIN')
    expect(state.turnNumber).toBe(1)
    expect(legalActions(state).some((a) => a.type === 'DECLARE_ATTACK')).toBe(false)

    state = processAction(state, { type: 'END_TURN' }, whoActs(state)!).state
    expect(state.turnNumber).toBe(2)
    expect(legalActions(state).some((a) => a.type === 'DECLARE_ATTACK')).toBe(false)

    state = processAction(state, { type: 'END_TURN' }, whoActs(state)!).state
    expect(state.turnNumber).toBe(3)
    expect(legalActions(state).some((a) => a.type === 'DECLARE_ATTACK')).toBe(true)
  })

  it('every enumerated action passes rules validation across a random game', () => {
    setRandomSource(mulberry32(42))
    try {
      let state = createGame(makeAutoDeck('OP01-001'), makeAutoDeck('OP01-001'))
      const rand = mulberry32(99)
      for (let step = 0; step < 400 && !state.winner; step++) {
        const actor = whoActs(state)
        if (!actor) break
        const actions = legalActions(state)
        expect(actions.length).toBeGreaterThan(0)
        for (const action of actions) {
          expect(validateAction(state, action, actor).valid).toBe(true)
        }
        const action = actions[Math.floor(rand() * actions.length)]
        const result = processAction(state, action, actor)
        expect(result.error).toBeUndefined()
        state = result.state

        // DON conservation: cost area + attached + DON deck is always exactly 10
        for (const pid of ['player1', 'player2'] as const) {
          const p = state.players[pid]
          const attachedTotal =
            p.leader.attachedDon + p.characters.reduce((s, c) => s + c.attachedDon, 0)
          expect(p.donArea.length + attachedTotal + p.donDeck.length).toBe(10)
        }
      }
    } finally {
      resetRandomSource()
    }
  })
})
