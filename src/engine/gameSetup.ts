import type { GameState, GameCard, PlayerState, PlayerId, Deck } from './types'
import { DON_DECK_SIZE, STARTING_HAND_SIZE } from './constants'
import { getCardById } from '@/data/cardService'
import { generateId } from '@/utils/id'
import { shuffle } from '@/utils/shuffle'
import { random } from '@/utils/rng'

export function createGameCard(cardId: string, ownerId: PlayerId): GameCard {
  return {
    instanceId: generateId(),
    cardId,
    ownerId,
    isRested: false,
    modifiers: [],
    attachedDon: 0,
    activatedThisTurn: [],
    turnPlayed: 0,
  }
}

function createDonCard(ownerId: PlayerId): GameCard {
  return {
    instanceId: generateId(),
    cardId: 'DON',
    ownerId,
    isRested: false,
    modifiers: [],
    attachedDon: 0,
    activatedThisTurn: [],
    turnPlayed: 0,
  }
}

/**
 * Deal life so the card from the top of the deck ends at the BOTTOM of the life
 * stack (CR 5-2-1-7): cards are taken one at a time, each placed on top of the
 * previous. Index 0 is the top of the life stack (taken first by damage).
 */
export function dealLife<T>(deckCards: T[], count: number): { life: T[]; deck: T[] } {
  const taken = deckCards.slice(0, count)
  return { life: taken.reverse(), deck: deckCards.slice(count) }
}

function setupPlayer(deck: Deck, playerId: PlayerId): PlayerState {
  const leaderData = getCardById(deck.leader)
  if (!leaderData) throw new Error(`Leader not found: ${deck.leader}`)

  const leader = createGameCard(deck.leader, playerId)

  // Build main deck from deck list
  const deckCards: GameCard[] = []
  for (const entry of deck.cards) {
    for (let i = 0; i < entry.qty; i++) {
      deckCards.push(createGameCard(entry.cardId, playerId))
    }
  }
  shuffle(deckCards)

  // Draw starting hand
  const hand = deckCards.splice(0, STARTING_HAND_SIZE)

  // Set life cards from top of deck
  const lifeCount = leaderData.life ?? 0
  const dealt = dealLife(deckCards, lifeCount)
  const lifeCards = dealt.life
  deckCards.length = 0
  deckCards.push(...dealt.deck)

  // Build DON deck
  const donDeck: GameCard[] = []
  for (let i = 0; i < DON_DECK_SIZE; i++) {
    donDeck.push(createDonCard(playerId))
  }

  return {
    leader,
    lifeCards,
    hand,
    characters: [],
    donDeck,
    donArea: [],
    deck: deckCards,
    trash: [],
    stage: null,
  }
}

export function createGame(deck1: Deck, deck2: Deck): GameState {
  const player1 = setupPlayer(deck1, 'player1')
  const player2 = setupPlayer(deck2, 'player2')

  // Random first player
  const firstPlayer: PlayerId = random() < 0.5 ? 'player1' : 'player2'

  return {
    id: generateId(),
    players: { player1, player2 },
    currentPlayer: firstPlayer,
    phase: 'SETUP',
    turnNumber: 1,
    battle: null,
    stack: [],
    pendingChoice: null,
    pendingTrigger: null,
    actionHistory: [],
    winner: null,
    setupComplete: false,
    mulliganState: { player1: 'pending', player2: 'pending' },
  }
}

export function performMulligan(state: GameState, playerId: PlayerId): GameState {
  const player = { ...state.players[playerId] }

  // Return hand to deck
  const newDeck = [...player.deck, ...player.hand]
  shuffle(newDeck)

  // Redraw
  const hand = newDeck.splice(0, STARTING_HAND_SIZE)

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: { ...player, hand, deck: newDeck },
    },
    mulliganState: {
      ...state.mulliganState,
      [playerId]: 'declined',
    },
  }
}

export function acceptHand(state: GameState, playerId: PlayerId): GameState {
  return {
    ...state,
    mulliganState: {
      ...state.mulliganState,
      [playerId]: 'accepted',
    },
  }
}

export function isMulliganComplete(state: GameState): boolean {
  return (
    state.mulliganState.player1 !== 'pending' &&
    state.mulliganState.player2 !== 'pending'
  )
}

export function startGame(state: GameState): GameState {
  return {
    ...state,
    phase: 'REFRESH',
    setupComplete: true,
  }
}
