import type { DefenseObservation, GameState, PlayerId } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { hasKeyword, isCounterEvent } from '@/engine/keywords'
import { getEffectiveCounter } from '@/engine/effects/statics'

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
      const data = getCardById(card.cardId)
      const value = data ? getEffectiveCounter(state, defender, card) : 0
      if (value >= 1000 || (data && isCounterEvent(data))) counterish++
    }
    const density = pool.length > 0 ? counterish / pool.length : 0
    ability = 1 - Math.pow(1 - density, d.hand.length)
  }

  const p = willingness * ability
  return { p, willingness, ability, faced, defended }
}
