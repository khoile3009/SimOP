import type { GameState, GameCard, PlayerState, PlayerId, Deck } from './types'
import { DON_DECK_SIZE, STARTING_HAND_SIZE } from './constants'
import { getCardById } from '@/data/cardService'
import { generateId } from '@/utils/id'
import { shuffle } from '@/utils/shuffle'

function createGameCard(cardId: string, ownerId: PlayerId): GameCard {
  return {
    instanceId: generateId(),
    cardId,
    ownerId,
    isRested: false,
    powerModifier: 0,
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
    powerModifier: 0,
    attachedDon: 0,
    activatedThisTurn: [],
    turnPlayed: 0,
  }
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
  const lifeCards = deckCards.splice(0, lifeCount)

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
  const firstPlayer: PlayerId = Math.random() < 0.5 ? 'player1' : 'player2'

  return {
    id: generateId(),
    players: { player1, player2 },
    currentPlayer: firstPlayer,
    phase: 'SETUP',
    turnNumber: 1,
    battle: null,
    effectQueue: [],
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
