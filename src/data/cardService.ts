import type { CardData } from '@/engine/types'
import { SET_MODULES } from './sets'

let cardCache: Map<string, CardData> | null = null

function ensureCache(): Map<string, CardData> {
  if (!cardCache) {
    cardCache = new Map()
    for (const set of SET_MODULES) {
      for (const card of set.cards) cardCache.set(card.id, card)
    }
  }
  return cardCache
}

/** Get all cards for a given set */
export function getCardsBySet(set: string): CardData[] {
  return Array.from(ensureCache().values()).filter((c) => c.set === set)
}

/** Get a single card by ID */
export function getCardById(id: string): CardData | undefined {
  return ensureCache().get(id)
}

/** Get all available cards */
export function getAllCards(): CardData[] {
  return Array.from(ensureCache().values())
}

/** Get all leaders for a given set */
export function getLeaders(set: string): CardData[] {
  return getCardsBySet(set).filter((c) => c.cardType === 'Leader')
}

/** Search cards by name (case-insensitive) */
export function searchCards(query: string): CardData[] {
  const lower = query.toLowerCase()
  return Array.from(ensureCache().values()).filter((c) => c.name.toLowerCase().includes(lower))
}
