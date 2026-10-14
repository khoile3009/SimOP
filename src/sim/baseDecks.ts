import type { Deck } from '@/engine/types'
import baseDecksJson from '@/data/baseDecks.json'

/**
 * The frozen base deck pool: real archetype lists built from the OP16-era meta
 * (see scripts/build-base-decks.ts). These serve two roles: good ready-made
 * decks in the Play/Watch pickers, and the FIXED benchmark pool for agent
 * ladders and eval gates (BOT_PLAN 4.5) - auto decks drift as sets land, these
 * move only on a deliberate regeneration.
 */
export interface BaseDeck extends Deck {
  archetype: string
}

export const BASE_DECKS: BaseDeck[] = baseDecksJson.map((d) => ({
  id: d.id,
  name: d.name,
  archetype: d.archetype,
  leader: d.leader,
  cards: d.cards,
  createdAt: 0,
  updatedAt: 0,
}))

export function getBaseDeck(id: string): BaseDeck | null {
  return BASE_DECKS.find((d) => d.id === id) ?? null
}
