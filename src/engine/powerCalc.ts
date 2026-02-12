import type { GameCard } from './types'
import { DON_POWER_BONUS } from './constants'
import { getCardById } from '@/data/cardService'

/** Get the effective power of a card including DON bonus and modifiers */
export function getEffectivePower(card: GameCard): number {
  const cardData = getCardById(card.cardId)
  const basePower = cardData?.power ?? 0
  const donBonus = card.attachedDon * DON_POWER_BONUS
  return basePower + donBonus + card.powerModifier
}

/** Get the effective power of a card during battle (includes battle bonuses) */
export function getBattlePower(
  card: GameCard,
  bonus: number,
): number {
  return getEffectivePower(card) + bonus
}
