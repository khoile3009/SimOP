import type { GameState, PlayerId } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getEffectivePower } from '@/engine/powerCalc'
import { getOpponent } from '@/engine/turnManager'

/**
 * Stage-1 evaluation: hand-tuned logistic model over symmetric feature differentials.
 * Output is a win-probability estimate in [0, 1] for `playerId`, and the structure
 * (features -> weights -> sigmoid) is deliberately the same shape as logistic
 * regression so weights can later be fitted from self-play logs without code changes.
 */

export interface FeatureVector {
  lifeDiff: number
  lifeZero: number
  boardPowerDiff: number // per 1000
  boardCountDiff: number
  handCountDiff: number
  counterHandDiff: number // per 1000
  donDiff: number
  activeUnitsDiff: number
}

export const WEIGHTS: Record<keyof FeatureVector, number> = {
  lifeDiff: 0.5,
  lifeZero: 1.5,
  boardPowerDiff: 0.1,
  boardCountDiff: 0.12,
  handCountDiff: 0.07,
  counterHandDiff: 0.05,
  donDiff: 0.05,
  activeUnitsDiff: 0.04,
}

interface SideStats {
  life: number
  boardPower: number
  boardCount: number
  hand: number
  counterHand: number
  don: number
  activeUnits: number
}

function sideStats(state: GameState, playerId: PlayerId): SideStats {
  const p = state.players[playerId]
  let boardPower = 0
  let activeUnits = p.leader.isRested ? 0 : 1
  for (const c of p.characters) {
    boardPower += getEffectivePower(state, c)
    if (!c.isRested) activeUnits++
  }
  let counterHand = 0
  for (const card of p.hand) {
    counterHand += getCardById(card.cardId)?.counter ?? 0
  }
  return {
    life: p.lifeCards.length,
    boardPower,
    boardCount: p.characters.length,
    hand: p.hand.length,
    counterHand,
    don: p.donArea.length,
    activeUnits,
  }
}

export function featureVector(state: GameState, playerId: PlayerId): FeatureVector {
  const me = sideStats(state, playerId)
  const opp = sideStats(state, getOpponent(playerId))
  return {
    lifeDiff: me.life - opp.life,
    // Being at 0 life means the next leader hit loses the game; this captures the
    // non-linearity of the last life card.
    lifeZero: (opp.life === 0 ? 1 : 0) - (me.life === 0 ? 1 : 0),
    boardPowerDiff: (me.boardPower - opp.boardPower) / 1000,
    boardCountDiff: me.boardCount - opp.boardCount,
    handCountDiff: me.hand - opp.hand,
    counterHandDiff: (me.counterHand - opp.counterHand) / 1000,
    donDiff: me.don - opp.don,
    activeUnitsDiff: me.activeUnits - opp.activeUnits,
  }
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

export function evaluateState(state: GameState, playerId: PlayerId): number {
  if (state.winner) return state.winner === playerId ? 1 : 0
  const f = featureVector(state, playerId)
  let sum = 0
  for (const key of Object.keys(WEIGHTS) as (keyof FeatureVector)[]) {
    sum += WEIGHTS[key] * f[key]
  }
  return sigmoid(sum)
}

/** Per-feature contributions, for the board analyzer UI and for weight debugging. */
export function explainEvaluation(
  state: GameState,
  playerId: PlayerId,
): { score: number; contributions: Record<keyof FeatureVector, number> } {
  const f = featureVector(state, playerId)
  const contributions = {} as Record<keyof FeatureVector, number>
  for (const key of Object.keys(WEIGHTS) as (keyof FeatureVector)[]) {
    contributions[key] = WEIGHTS[key] * f[key]
  }
  return { score: evaluateState(state, playerId), contributions }
}
