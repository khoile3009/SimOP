import type { Deck } from '@/engine/types'
import { makeAutoDeck } from '@/sim/selfplay'
import { BASE_DECKS, getBaseDeck } from '@/sim/baseDecks'

/**
 * A deck choice that both match-setup screens share: a curated base deck, a
 * saved deck from the deck builder, an auto-built deck for any leader in the
 * pool, or a mirror of the other seat's deck.
 */
export type DeckChoice =
  | { kind: 'mirror' }
  | { kind: 'base'; id: string }
  | { kind: 'saved'; id: string }
  | { kind: 'auto'; leaderId: string }

export const DEFAULT_CHOICE: DeckChoice = { kind: 'base', id: BASE_DECKS[0].id }

export function encodeChoice(c: DeckChoice): string {
  if (c.kind === 'mirror') return 'mirror'
  if (c.kind === 'base') return `base:${c.id}`
  return c.kind === 'saved' ? `saved:${c.id}` : `auto:${c.leaderId}`
}

export function decodeChoice(v: string): DeckChoice {
  if (v === 'mirror') return { kind: 'mirror' }
  const [kind, rest] = [v.slice(0, v.indexOf(':')), v.slice(v.indexOf(':') + 1)]
  if (kind === 'base') return { kind: 'base', id: rest }
  return kind === 'saved' ? { kind: 'saved', id: rest } : { kind: 'auto', leaderId: rest }
}

/** Resolve a choice to a playable deck; `mirrorOf` feeds the 'mirror' choice. */
export function resolveDeckChoice(
  choice: DeckChoice,
  savedDecks: Deck[],
  mirrorOf?: Deck | null,
): Deck | null {
  if (choice.kind === 'mirror') return mirrorOf ?? null
  if (choice.kind === 'base') return getBaseDeck(choice.id)
  if (choice.kind === 'saved') return savedDecks.find((d) => d.id === choice.id) ?? null
  try {
    return makeAutoDeck(choice.leaderId)
  } catch {
    return null
  }
}
