import type { GameState, PlayerId } from './types'
import { DON_PER_TURN, DON_FIRST_TURN } from './constants'

function isFirstPlayerFirstTurn(state: GameState): boolean {
  return state.turnNumber === 1
}

/** Execute Refresh Phase: set all rested cards to active */
export function executeRefresh(state: GameState): GameState {
  const playerId = state.currentPlayer
  const player = state.players[playerId]

  // Skip refresh on very first turn of the game (turn 1)
  if (state.turnNumber === 1) {
    return { ...state, phase: 'DRAW' }
  }

  const refreshedCharacters = player.characters.map((c) => ({ ...c, isRested: false }))
  const refreshedDon = player.donArea.map((d) => ({ ...d, isRested: false }))
  const refreshedLeader = { ...player.leader, isRested: false }
  const refreshedStage = player.stage ? { ...player.stage, isRested: false } : null

  return {
    ...state,
    phase: 'DRAW',
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        leader: refreshedLeader,
        characters: refreshedCharacters,
        donArea: refreshedDon,
        stage: refreshedStage,
      },
    },
  }
}

/** Execute Draw Phase: draw 1 card */
export function executeDraw(state: GameState): GameState {
  const playerId = state.currentPlayer
  const player = state.players[playerId]

  // First player skips draw on turn 1
  if (isFirstPlayerFirstTurn(state)) {
    return { ...state, phase: 'DON' }
  }

  // Deck-out: if no cards to draw, player loses
  if (player.deck.length === 0) {
    const opponent: PlayerId = playerId === 'player1' ? 'player2' : 'player1'
    return { ...state, winner: opponent }
  }

  const newDeck = [...player.deck]
  const drawn = newDeck.shift()!
  const newHand = [...player.hand, drawn]

  return {
    ...state,
    phase: 'DON',
    players: {
      ...state.players,
      [playerId]: { ...player, deck: newDeck, hand: newHand },
    },
  }
}

/** Execute DON Phase: move DON from DON deck to cost area */
export function executeDon(state: GameState): GameState {
  const playerId = state.currentPlayer
  const player = state.players[playerId]

  const donCount = isFirstPlayerFirstTurn(state) ? DON_FIRST_TURN : DON_PER_TURN
  const available = Math.min(donCount, player.donDeck.length)

  const newDonDeck = [...player.donDeck]
  const moved = newDonDeck.splice(0, available)
  const newDonArea = [...player.donArea, ...moved]

  return {
    ...state,
    phase: 'MAIN',
    players: {
      ...state.players,
      [playerId]: { ...player, donDeck: newDonDeck, donArea: newDonArea },
    },
  }
}

/** Execute End Phase: return attached DON to cost area, clear turn-based modifiers */
export function executeEndPhase(state: GameState): GameState {
  const playerId = state.currentPlayer
  const player = state.players[playerId]

  // Return attached DON from all characters and leader to cost area (rested)
  let returnedDon: typeof player.donArea = []

  const newLeader = { ...player.leader }
  if (newLeader.attachedDon > 0) {
    for (let i = 0; i < newLeader.attachedDon; i++) {
      returnedDon.push({
        instanceId: `don-return-${Date.now()}-${i}`,
        cardId: 'DON',
        ownerId: playerId,
        isRested: true,
        powerModifier: 0,
        attachedDon: 0,
        activatedThisTurn: [],
        turnPlayed: 0,
      })
    }
    newLeader.attachedDon = 0
  }

  const newCharacters = player.characters.map((c) => {
    if (c.attachedDon > 0) {
      for (let i = 0; i < c.attachedDon; i++) {
        returnedDon.push({
          instanceId: `don-return-${Date.now()}-${c.instanceId}-${i}`,
          cardId: 'DON',
          ownerId: playerId,
          isRested: true,
          powerModifier: 0,
          attachedDon: 0,
          activatedThisTurn: [],
          turnPlayed: 0,
        })
      }
      return { ...c, attachedDon: 0, powerModifier: 0, activatedThisTurn: [] }
    }
    return { ...c, powerModifier: 0, activatedThisTurn: [] }
  })

  // Reset leader modifiers
  newLeader.powerModifier = 0
  newLeader.activatedThisTurn = []

  const newDonArea = [...player.donArea.map((d) => ({ ...d, isRested: true })), ...returnedDon]

  // Switch to opponent
  const nextPlayer: PlayerId = playerId === 'player1' ? 'player2' : 'player1'

  // Also clear opponent's turn-based modifiers
  const opponent = state.players[nextPlayer]
  const cleanedOpponentLeader = { ...opponent.leader, powerModifier: 0 }
  const cleanedOpponentCharacters = opponent.characters.map((c) => ({
    ...c,
    powerModifier: 0,
  }))

  return {
    ...state,
    phase: 'REFRESH',
    currentPlayer: nextPlayer,
    turnNumber: state.turnNumber + 1,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        leader: newLeader,
        characters: newCharacters,
        donArea: newDonArea,
      },
      [nextPlayer]: {
        ...opponent,
        leader: cleanedOpponentLeader,
        characters: cleanedOpponentCharacters,
      },
    },
  }
}

/** Auto-advance through non-interactive phases (Refresh → Draw → DON → MAIN) */
export function autoAdvancePhases(state: GameState): GameState {
  let current = state
  while (current.phase !== 'MAIN' && current.phase !== 'SETUP' && !current.winner) {
    switch (current.phase) {
      case 'REFRESH':
        current = executeRefresh(current)
        break
      case 'DRAW':
        current = executeDraw(current)
        break
      case 'DON':
        current = executeDon(current)
        break
      case 'END':
        current = executeEndPhase(current)
        break
      default:
        return current
    }
  }
  return current
}

export function getOpponent(playerId: PlayerId): PlayerId {
  return playerId === 'player1' ? 'player2' : 'player1'
}
