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

  // Opponent: the unrevealed part of their hand joins their hidden pool.
  // Revealed hand cards (effect reveals, bounced characters) are public
  // knowledge and stay fixed. Life cards taken to hand are NOT revealed:
  // per the official rules they stay hidden unless a [Trigger] is activated.
  const theirs = state.players[opp]
  const known = theirs.hand.filter((c) => c.revealed)
  const unknown = theirs.hand.filter((c) => !c.revealed)
  const theirPool = shuffled([...unknown, ...theirs.deck, ...theirs.lifeCards], rand)
  const theirHand = [...known, ...theirPool.slice(0, unknown.length)]
  const theirLife = theirPool.slice(unknown.length, unknown.length + theirs.lifeCards.length)
  const theirDeck = theirPool.slice(unknown.length + theirs.lifeCards.length)

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
