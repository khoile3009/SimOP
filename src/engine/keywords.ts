import type { CardData, GameCard, GameState } from './types'
import { getCardById } from '@/data/cardService'
import { auraGrants } from './effects/statics'

export type Keyword = 'Rush' | 'Blocker' | 'Double Attack' | 'Banish'

const KEYWORDS: Keyword[] = ['Rush', 'Blocker', 'Double Attack', 'Banish']

/**
 * A card POSSESSES a keyword only when the bracketed token opens an ability clause:
 * at the start of the text, after a sentence end, or after reminder-text parens.
 * Tokens preceded by words ("gains [Rush]", "cannot activate a [Blocker]") are
 * references to the keyword, not possession - e.g. OP01-120 mentions [Blocker]
 * in a restriction and OP01-097 gains [Rush] from its own effect; neither has the
 * keyword printed. Naive substring matching gets both wrong.
 */
function possessionPattern(keyword: Keyword): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|\\.\\s+|\\)\\s+)\\[${escaped}\\]`)
}

const printedCache = new Map<string, Set<Keyword>>()

export function getPrintedKeywords(cardId: string): Set<Keyword> {
  let cached = printedCache.get(cardId)
  if (!cached) {
    cached = new Set()
    const text = getCardById(cardId)?.effectText ?? ''
    for (const keyword of KEYWORDS) {
      if (possessionPattern(keyword).test(text)) cached.add(keyword)
    }
    printedCache.set(cardId, cached)
  }
  return cached
}

/** Printed keywords plus any granted by modifiers or active auras. */
export function hasKeyword(state: GameState, card: GameCard, keyword: Keyword): boolean {
  if (getPrintedKeywords(card.cardId).has(keyword)) return true
  if (card.modifiers.some((m) => m.kind === 'keyword' && m.keyword === keyword)) return true
  return auraGrants(state, card).keywords.includes(keyword)
}

/** [Counter] as an Event timing tag (an ability opener, same position rule). */
export function isCounterEvent(card: CardData): boolean {
  return card.cardType === 'Event' && /(?:^|\.\s+|\)\s+)\[Counter\]/.test(card.effectText ?? '')
}
