import type { GameState, PlayerId } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getEffectivePower } from '@/engine/powerCalc'
import { getOpponent } from '@/engine/turnManager'
import { hasKeyword } from '@/engine/keywords'
import fitted from './weights.fitted.json'

/**
 * Board evaluation: features -> weights -> sigmoid = win probability for the
 * given player. Deliberately the exact shape of logistic regression so the
 * hand-tuned weights and the fitted weights (npm run train) are interchangeable.
 *
 * Board presence is measured in the game's exchange currencies, not raw power:
 * power is a step function anchored on the opponent's leader (attacker wins
 * ties, so 5000 vs a 5000 leader attacks "for free"; below that each missing
 * 1000 costs a DON of recurring rent; above it each 1000 forces counter cards
 * out of the defender's hand), and small bodies are only worth what they can
 * profitably trade into - which depends on the opponent's remaining deck.
 */

export type Features = Record<string, number>
export type Weights = Record<string, number>

export const HAND_WEIGHTS: Weights = {
  lifeDiff: 0.5,
  lifeZero: 1.5,
  handCountDiff: 0.07,
  counterHandDiff: 0.05,
  donDiff: 0.05,
  activeUnitsDiff: 0.04,
  boardCountDiff: 0.08,
  // Threshold buckets vs the opponent's leader power
  freePlusDiff: 0.16, // attacks their leader for free, with counter-forcing margin
  freeParDiff: 0.1, // attacks for free but dies to a single +1000 counter
  rentedDiff: 0.05, // needs 1-2 DON of rent per attack
  smallDiff: 0.015, // no leader threat; value comes from trades/blocking
  counterPressureDiff: 0.04, // cards their hand must spend to blank my attacks
  tradeCoverageDiff: 0.05, // how much of their remaining pool my bodies out-trade
  blockersDiff: 0.07,
  // Leader-matchup one-hots (ldrMe:*/ldrOpp:*) carry no hand weight; the
  // trainer prices them, letting the fitted model shift values per matchup
}

const fittedWeights = fitted.weights as Weights
export const ACTIVE_WEIGHTS: Weights =
  Object.keys(fittedWeights).length > 0 ? fittedWeights : HAND_WEIGHTS

interface SideStats {
  life: number
  hand: number
  counterHand: number
  don: number
  activeUnits: number
  boardCount: number
  freePlus: number
  freePar: number
  rented: number
  small: number
  counterPressure: number
  tradeCoverage: number
  blockers: number
}

function sideStats(state: GameState, playerId: PlayerId): SideStats {
  const me = state.players[playerId]
  const opp = state.players[getOpponent(playerId)]
  const oppLeaderPower = getEffectivePower(state, opp.leader)

  // Their remaining threats: characters still in deck or hand
  const oppPool: number[] = []
  for (const card of [...opp.deck, ...opp.hand]) {
    const data = getCardById(card.cardId)
    if (data?.cardType === 'Character' && data.power !== null) oppPool.push(data.power)
  }

  let freePlus = 0
  let freePar = 0
  let rented = 0
  let small = 0
  let counterPressure = 0
  let tradeCoverage = 0
  let blockers = 0
  let activeUnits = me.leader.isRested ? 0 : 1

  for (const c of me.characters) {
    if (!c.isRested) activeUnits++
    if (hasKeyword(state, c, 'Blocker') && !c.isRested) blockers++
    const power = getEffectivePower(state, c)
    if (power > oppLeaderPower) {
      freePlus++
      counterPressure += (power - oppLeaderPower) / 1000 + 1
    } else if (power === oppLeaderPower) {
      freePar++
      counterPressure += 1
    } else if (power >= oppLeaderPower - 2000) {
      rented++
    } else {
      small++
    }
    if (oppPool.length > 0) {
      let covered = 0
      for (const p of oppPool) if (power >= p) covered++
      tradeCoverage += covered / oppPool.length
    }
  }

  let counterHand = 0
  for (const card of me.hand) counterHand += getCardById(card.cardId)?.counter ?? 0

  return {
    life: me.lifeCards.length,
    hand: me.hand.length,
    counterHand,
    don: me.donArea.length,
    activeUnits,
    boardCount: me.characters.length,
    freePlus,
    freePar,
    rented,
    small,
    counterPressure,
    tradeCoverage,
    blockers,
  }
}

export function featureVector(state: GameState, playerId: PlayerId): Features {
  const opp = getOpponent(playerId)
  const me = sideStats(state, playerId)
  const them = sideStats(state, opp)
  const f: Features = {
    lifeDiff: me.life - them.life,
    lifeZero: (them.life === 0 ? 1 : 0) - (me.life === 0 ? 1 : 0),
    handCountDiff: me.hand - them.hand,
    counterHandDiff: (me.counterHand - them.counterHand) / 1000,
    donDiff: me.don - them.don,
    activeUnitsDiff: me.activeUnits - them.activeUnits,
    boardCountDiff: me.boardCount - them.boardCount,
    freePlusDiff: me.freePlus - them.freePlus,
    freeParDiff: me.freePar - them.freePar,
    rentedDiff: me.rented - them.rented,
    smallDiff: me.small - them.small,
    counterPressureDiff: me.counterPressure - them.counterPressure,
    tradeCoverageDiff: me.tradeCoverage - them.tradeCoverage,
    blockersDiff: me.blockers - them.blockers,
  }
  // Matchup identity - priced only by the fitted model
  f[`ldrMe:${state.players[playerId].leader.cardId}`] = 1
  f[`ldrOpp:${state.players[opp].leader.cardId}`] = 1
  return f
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

export function scoreWith(weights: Weights, state: GameState, playerId: PlayerId): number {
  if (state.winner) return state.winner === playerId ? 1 : 0
  const f = featureVector(state, playerId)
  let sum = weights.bias ?? 0
  for (const key of Object.keys(f)) {
    const w = weights[key]
    if (w) sum += w * f[key]
  }
  return sigmoid(sum)
}

export type EvalFn = (state: GameState, playerId: PlayerId) => number

export function evaluateState(state: GameState, playerId: PlayerId): number {
  return scoreWith(ACTIVE_WEIGHTS, state, playerId)
}

export function makeEval(weights: Weights): EvalFn {
  return (state, playerId) => scoreWith(weights, state, playerId)
}

/** Per-feature contributions, for the board analyzer UI and weight debugging. */
export function explainEvaluation(
  state: GameState,
  playerId: PlayerId,
): { score: number; contributions: Record<string, number> } {
  const f = featureVector(state, playerId)
  const contributions: Record<string, number> = {}
  for (const key of Object.keys(f)) {
    const w = ACTIVE_WEIGHTS[key]
    if (w) contributions[key] = w * f[key]
  }
  return { score: evaluateState(state, playerId), contributions }
}
