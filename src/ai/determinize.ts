import type { GameState, GameCard, PlayerId } from '@/engine/types'
import { getOpponent } from '@/engine/turnManager'

/**
 * Sample a complete world consistent with what `viewer` can actually see.
 * Hidden from a player (CR zone rules): the opponent's hand, both deck
 * contents/order, and BOTH life stacks - players may not look at their own
 * life. Everything else (fields, trashes, counts) is public.
 *
 * The sampler redistributes the actual card instances of each hidden pool
 * uniformly. It deliberately ignores positional knowledge a player might have
 * retained (e.g. cards seen during a search and sent to the deck bottom) -
 * uniform-given-counts is the honest baseline until knowledge tracking exists.
 */
export function determinize(
  state: GameState,
  viewer: PlayerId,
  rand: () => number,
): GameState {
  const opp = getOpponent(viewer)

  // Viewer: hand/field/trash known; own deck + own life form one hidden pool
  const own = state.players[viewer]
  const ownPool = shuffled([...own.deck, ...own.lifeCards], rand)
  const ownLife = ownPool.slice(0, own.lifeCards.length)
  const ownDeck = ownPool.slice(own.lifeCards.length)

  // Opponent: hand joins their hidden pool as well
  const theirs = state.players[opp]
  const theirPool = shuffled([...theirs.hand, ...theirs.deck, ...theirs.lifeCards], rand)
  const theirHand = theirPool.slice(0, theirs.hand.length)
  const theirLife = theirPool.slice(theirs.hand.length, theirs.hand.length + theirs.lifeCards.length)
  const theirDeck = theirPool.slice(theirs.hand.length + theirs.lifeCards.length)

  return {
    ...state,
    players: {
      ...state.players,
      [viewer]: { ...own, deck: ownDeck, lifeCards: ownLife },
      [opp]: { ...theirs, hand: theirHand, deck: theirDeck, lifeCards: theirLife },
    },
  }
}

function shuffled(cards: GameCard[], rand: () => number): GameCard[] {
  const out = [...cards]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
