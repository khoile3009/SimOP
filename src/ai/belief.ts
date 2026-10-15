import type { DefenseObservation, GameCard, GameState, PlayerId } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getOpponent } from '@/engine/turnManager'
import { hasKeyword, isCounterEvent } from '@/engine/keywords'
import { determinize } from './determinize'

/**
 * Response forecasting from the viewer's honest information: how likely is
 * the opponent to defend a flippable leader swing? Three ingredients:
 *  - a WILLINGNESS prior by life bucket (from the P0b fleet measurements of
 *    defend rates, smoothed toward the middle),
 *  - this game's OBSERVED counter pattern (state.defenseLog) folded in as
 *    Beta-style pseudo-counts - every swing they let through is evidence,
 *  - an ABILITY estimate from visible blockers plus the counter density of
 *    their hidden pool (decklists are open information in this sim; positions
 *    are not), so an empty-handed opponent forecasts near zero regardless of
 *    willingness.
 */

export interface ResponseForecast {
  /** P(defends a flippable leader swing) = willingness x ability */
  p: number
  /** Blended willingness (prior by life bucket + observed pattern) */
  willingness: number
  /** P(they can meaningfully defend at all) */
  ability: number
  /** This game's evidence: flippable leader swings faced / defended */
  faced: number
  defended: number
}

/** Fleet-measured defend rates by defender life (P0b probe), smoothed. */
function lifePrior(life: number): number {
  if (life >= 4) return 0.15
  if (life >= 2) return 0.65
  return 0.8
}

const PRIOR_STRENGTH = 4 // pseudo-observations behind the life prior

/** A logged counter step counts as evidence when the swing was live: the
 * original target was the leader and the attack was winning before defense. */
function relevant(o: DefenseObservation): boolean {
  return o.targetLeader && o.attackerPower >= o.defenderPower - o.counterPower
}

export function forecastDefense(state: GameState, defender: PlayerId): ResponseForecast {
  const d = state.players[defender]

  // Observed pattern this game
  let faced = 0
  let defended = 0
  for (const o of state.defenseLog ?? []) {
    if (o.defender !== defender || !relevant(o)) continue
    faced++
    if (o.counterPower > 0 || o.blocked) defended++
  }
  const prior = lifePrior(d.lifeCards.length)
  const willingness = (prior * PRIOR_STRENGTH + defended) / (PRIOR_STRENGTH + faced)

  // Ability: a ready blocker always suffices; otherwise counters must exist
  // in a hand sampled from their hidden pool
  const hasBlocker = d.characters.some((c) => !c.isRested && hasKeyword(state, c, 'Blocker'))
  let ability: number
  if (hasBlocker) {
    ability = 1
  } else {
    const pool = [...d.hand, ...d.deck, ...d.lifeCards]
    let counterish = 0
    for (const card of pool) {
      if (counterCapable(state, defender, card)) counterish++
    }
    const density = pool.length > 0 ? counterish / pool.length : 0
    ability = 1 - Math.pow(1 - density, d.hand.length)
  }

  const p = willingness * ability
  return { p, willingness, ability, faced, defended }
}

/** Printed-data counter capability, memoized per card id: the belief path
 * runs per sampled world per iteration, so no statics walk here (counterSet
 * hand auras are ignored - a rare, small distortion). */
const COUNTER_CAPABLE = new Map<string, boolean>()
function counterCapable(_state: GameState, _owner: PlayerId, card: GameCard): boolean {
  const hit = COUNTER_CAPABLE.get(card.cardId)
  if (hit !== undefined) return hit
  const data = getCardById(card.cardId)
  const capable = !!data && ((data.counter ?? 0) >= 1000 || isCounterEvent(data))
  COUNTER_CAPABLE.set(card.cardId, capable)
  return capable
}

/**
 * Likelihood of the opponent's observed defense pattern under a sampled
 * world's CURRENT hand (sticky-hand approximation: hand composition drifts
 * slowly, so recent evidence still binds). Model: each counter card they hold
 * answers a flippable leader swing independently with probability equal to
 * the life-bucket willingness at the time, so
 *   P(pass | c counters) = (1 - s)^c.
 * Worlds that deal them a fistful of counters they visibly never used score
 * low; worlds that starve them after observed defends score low too.
 */
export function defenseLikelihood(world: GameState, viewer: PlayerId): number {
  const opp = getOpponent(viewer)
  let counters = 0
  for (const card of world.players[opp].hand) {
    if (counterCapable(world, opp, card)) counters++
  }
  let likelihood = 1
  for (const o of world.defenseLog ?? []) {
    if (o.defender !== opp || !relevant(o)) continue
    const s = lifePrior(o.defenderLife)
    const pPass = Math.pow(1 - s, counters)
    likelihood *= (o.counterPower > 0 || o.blocked ? 1 - pPass : pPass) + 1e-3
  }
  return likelihood
}

/**
 * Belief-weighted determinization (lazy particle filter): sample `candidates`
 * worlds, weight each by how well it explains the opponent's observed defense
 * pattern, and pick proportionally. With no relevant evidence it costs one
 * plain determinize.
 */
export function beliefDeterminize(
  state: GameState,
  viewer: PlayerId,
  rand: () => number,
  candidates = 5,
): GameState {
  const opp = getOpponent(viewer)
  const hasEvidence = (state.defenseLog ?? []).some((o) => o.defender === opp && relevant(o))
  if (!hasEvidence) return determinize(state, viewer, rand)

  const worlds: { world: GameState; weight: number }[] = []
  let total = 0
  for (let i = 0; i < candidates; i++) {
    const world = determinize(state, viewer, rand)
    const weight = defenseLikelihood(world, viewer)
    worlds.push({ world, weight })
    total += weight
  }
  if (total <= 0) return worlds[0].world
  let r = rand() * total
  for (const { world, weight } of worlds) {
    r -= weight
    if (r <= 0) return world
  }
  return worlds[worlds.length - 1].world
}
