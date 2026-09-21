import { getCardById } from '@/data/cardService'
import { MAX_CARD_COPIES } from './constants'
import op01Attributes from '@/data/op01/battleAttributes.json'
import op02Attributes from '@/data/op02/battleAttributes.json'

const battleAttributes: Record<string, string> = { ...op01Attributes, ...op02Attributes }

/**
 * Rules-layer registry: per-card overrides of the game's own rules, as opposed
 * to card effects. Cards can change deck-building constraints ("any number of
 * this card"), carry extra names ("also treat this card's name as ..."), and
 * later entries can host win/loss replacements and resource config.
 */

export interface CardRules {
  /** 'any' lifts the 4-copy deck limit (OP01-075 Pacifista) */
  deckCopyLimit?: 'any'
  /** Names this card carries in addition to its printed one (OP01-121 Yamato) */
  extraNames?: string[]
}

export const CARD_RULES: Record<string, CardRules> = {
  'OP01-075': { deckCopyLimit: 'any' },
  // Both official romanizations, so cross-set name references resolve
  'OP01-121': { extraNames: ['Kozuki Oden', 'Kouzuki Oden'] },
  'OP02-042': { extraNames: ['Kouzuki Oden', 'Kozuki Oden'] },
}

export function deckCopyLimit(cardId: string): number {
  return CARD_RULES[cardId]?.deckCopyLimit === 'any' ? Infinity : MAX_CARD_COPIES
}

/** Name checks must go through here, never `data.name === x`: names are sets. */
export function cardHasName(cardId: string, name: string): boolean {
  if (getCardById(cardId)?.name === name) return true
  return CARD_RULES[cardId]?.extraNames?.includes(name) ?? false
}

/**
 * Battle attribute (<Slash>/<Strike>/<Ranged>/<Special>/<Wisdom>). Sourced
 * separately because cards.json's `attribute` field holds the TYPE list.
 */
export function getBattleAttribute(cardId: string): string | null {
  return battleAttributes[cardId] ?? null
}
