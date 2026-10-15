import { describe, it, expect } from 'vitest'
import type { DefenseObservation, GameState } from '@/engine/types'
import { createGame } from '@/engine/gameSetup'
import { forecastDefense } from '@/ai/belief'
import { makeAutoDeck } from '@/sim/selfplay'
import { mulberry32, setRandomSource, resetRandomSource } from '@/utils/rng'

function baseState(): GameState {
  setRandomSource(mulberry32(91))
  const state = createGame(makeAutoDeck('OP01-001'), makeAutoDeck('OP01-001'))
  resetRandomSource()
  return state
}

const passOnLeader = (turn: number): DefenseObservation => ({
  turn,
  defender: 'player2',
  attackerPower: 6000,
  defenderPower: 5000,
  counterPower: 0,
  blocked: false,
  targetLeader: true,
  defenderLife: 5,
  defenderHand: 5,
})

describe('response forecasting', () => {
  const state = baseState()

  it('is a probability built from willingness and ability', () => {
    const f = forecastDefense(state, 'player2')
    expect(f.p).toBeGreaterThanOrEqual(0)
    expect(f.p).toBeLessThanOrEqual(1)
    expect(f.p).toBeCloseTo(f.willingness * f.ability, 9)
    expect(f.faced).toBe(0)
  })

  it('observed passivity drags willingness down; counters drag it up', () => {
    const base = forecastDefense(state, 'player2').willingness
    const passive: GameState = {
      ...state,
      defenseLog: [passOnLeader(3), passOnLeader(5), passOnLeader(5), passOnLeader(7)],
    }
    const fp = forecastDefense(passive, 'player2')
    expect(fp.faced).toBe(4)
    expect(fp.defended).toBe(0)
    expect(fp.willingness).toBeLessThan(base)

    const active: GameState = {
      ...state,
      defenseLog: [
        { ...passOnLeader(3), counterPower: 2000 },
        { ...passOnLeader(5), blocked: true },
      ],
    }
    expect(forecastDefense(active, 'player2').willingness).toBeGreaterThan(base)
  })

  it('an empty hand kills ability regardless of willingness', () => {
    const broke: GameState = {
      ...state,
      players: {
        ...state.players,
        player2: {
          ...state.players.player2,
          hand: [],
          characters: [], // no blockers either
        },
      },
    }
    expect(forecastDefense(broke, 'player2').ability).toBe(0)
  })

  it('character-target and already-losing swings are not evidence', () => {
    const noisy: GameState = {
      ...state,
      defenseLog: [
        { ...passOnLeader(3), targetLeader: false },
        { ...passOnLeader(5), attackerPower: 3000 }, // was never connecting
      ],
    }
    const f = forecastDefense(noisy, 'player2')
    expect(f.faced).toBe(0)
  })
})
