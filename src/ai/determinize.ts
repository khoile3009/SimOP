import type { GameState, GameCard, PlayerId } from '@/engine/types'
import { getOpponent } from '@/engine/turnManager'

/**
 * Sample a complete world consistent with what `viewer` can actually see.
 * Hidden from a player (CR zone rules): the opponent's hand, both deck
 * contents/order, and BOTH life stacks - players may not look at their own
 * life. Everything else (fields, trashes, counts) is public.
 *
 * Knowledge tracking: cards the viewer has legitimately seen stay PINNED at
 * their true positions instead of being resampled -
 *   - own deck cards marked seenByOwner (searched/scried cards sent to the
 *     bottom or top, hand cards placed back) or revealed (public deck reveals),
 *   - revealed (face-up) life cards on either side,
 *   - the opponent's revealed deck cards (peeks) and revealed hand cards.
 * The opponent's OWN seenByOwner knowledge is not the viewer's: those cards
 * resample like any hidden card. Shuffles clear the flags engine-side.
 */
export function determinize(state: GameState, viewer: PlayerId, rand: () => number): GameState {
  const opp = getOpponent(viewer)

  // Viewer: hand/field/trash known; the UNSEEN part of own deck + own life
  // forms one hidden pool, while seen/revealed cards keep their slots
  const own = state.players[viewer]
  const ownDeckKnown = (c: GameCard) => c.seenByOwner === true || c.revealed === true
  const ownLifeKnown = (c: GameCard) => c.revealed === true
  const ownPool = shuffled(
    [...own.deck.filter((c) => !ownDeckKnown(c)), ...own.lifeCards.filter((c) => !ownLifeKnown(c))],
    rand,
  )
  const ownLife = fillUnknowns(own.lifeCards, ownLifeKnown, ownPool)
  const ownDeck = fillUnknowns(own.deck, ownDeckKnown, ownPool)

  // Opponent: the unrevealed part of their hand joins their hidden pool.
  // Revealed hand cards (effect reveals, bounced characters) are public
  // knowledge and stay fixed, as do revealed deck cards (peeks) and face-up
  // life. Life cards taken to hand are NOT revealed: per the official rules
  // they stay hidden unless a [Trigger] is activated.
  const theirs = state.players[opp]
  const publicKnown = (c: GameCard) => c.revealed === true
  const unknownHand = theirs.hand.filter((c) => !publicKnown(c))
  const theirPool = shuffled(
    [
      ...unknownHand,
      ...theirs.deck.filter((c) => !publicKnown(c)),
      ...theirs.lifeCards.filter((c) => !publicKnown(c)),
    ],
    rand,
  )
  const theirHand = fillUnknowns(theirs.hand, publicKnown, theirPool)
  const theirLife = fillUnknowns(theirs.lifeCards, publicKnown, theirPool)
  const theirDeck = fillUnknowns(theirs.deck, publicKnown, theirPool)

  return {
    ...state,
    players: {
      ...state.players,
      [viewer]: { ...own, deck: ownDeck, lifeCards: ownLife },
      [opp]: { ...theirs, hand: theirHand, deck: theirDeck, lifeCards: theirLife },
    },
  }
}

/** Rebuild a zone: known cards keep their slots, unknown slots draw from the pool. */
function fillUnknowns(
  zone: GameCard[],
  known: (c: GameCard) => boolean,
  pool: GameCard[],
): GameCard[] {
  return zone.map((c) => (known(c) ? c : pool.pop()!))
}

function shuffled(cards: GameCard[], rand: () => number): GameCard[] {
  const out = [...cards]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
