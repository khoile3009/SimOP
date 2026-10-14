import type { GameCard, GameState } from './types'
import { DON_POWER_BONUS } from './constants'
import { getCardById } from '@/data/cardService'
import { auraGrants } from './effects/statics'

/** Effective power: base + DON bonus + modifiers + active auras. */
export function getEffectivePower(state: GameState, card: GameCard): number {
  const cardData = getCardById(card.cardId)
  const grants = auraGrants(state, card)
  // "becomes the same as your Leader's base power" replaces the printed base
  const basePower =
    grants.basePowerSet !== undefined
      ? grants.basePowerSet
      : grants.powerBecomesLeaderBase
        ? (getCardById(state.players[card.ownerId].leader.cardId)?.power ?? 0)
        : (cardData?.power ?? 0)
  // Given DON grants +1000 only during the owner's turn (CR 6-5-5-2); a
  // defender's attached DON contributes nothing
  const donBonus = state.currentPlayer === card.ownerId ? card.attachedDon * DON_POWER_BONUS : 0
  let modifierTotal = 0
  for (const m of card.modifiers) {
    if (m.kind === 'power') modifierTotal += m.value
  }
  return basePower + donBonus + modifierTotal + grants.power
}

/** Effective power during battle (includes counter bonuses). */
export function getBattlePower(state: GameState, card: GameCard, bonus: number): number {
  return getEffectivePower(state, card) + bonus
}
