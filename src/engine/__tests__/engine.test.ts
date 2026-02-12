import { describe, it, expect, beforeEach } from 'vitest'
import type { GameState, Deck, PlayerId } from '../types'
import { createGame } from '../gameSetup'
import { processAction } from '../processor'
import { getEffectivePower } from '../powerCalc'
import { getCardById } from '@/data/cardService'
import { DECK_SIZE, STARTING_HAND_SIZE, DON_DECK_SIZE, DON_FIRST_TURN, DON_PER_TURN } from '../constants'

// A valid OP01 Red deck using Roronoa Zoro as leader
function makeTestDeck(): Deck {
  return {
    id: 'test-deck',
    name: 'Test Red Deck',
    leader: 'OP01-001', // Roronoa Zoro (Red Leader, life 5, power 5000)
    cards: [
      { cardId: 'OP01-004', qty: 4 }, // Usopp (2 cost, 3000 power, counter 2000)
      { cardId: 'OP01-006', qty: 4 }, // Otama (1 cost, 0 power, counter 2000)
      { cardId: 'OP01-009', qty: 4 }, // Carrot (2 cost, 3000 power, counter 1000, Trigger)
      { cardId: 'OP01-010', qty: 4 }, // Komachiyo (1 cost, 3000 power, counter 1000)
      { cardId: 'OP01-012', qty: 4 }, // Sai (2 cost, 4000 power, counter 1000)
      { cardId: 'OP01-017', qty: 4 }, // Nico Robin (3 cost, 4000 power, counter 1000)
      { cardId: 'OP01-018', qty: 4 }, // Hajrudin (4 cost, 6000 power, counter 1000)
      { cardId: 'OP01-022', qty: 4 }, // Brook (4 cost, 5000 power, counter 1000)
      { cardId: 'OP01-023', qty: 4 }, // Marco (3 cost, 5000 power, counter 1000)
      { cardId: 'OP01-025', qty: 4 }, // Roronoa Zoro (3 cost, 5000 power, Rush)
      { cardId: 'OP01-028', qty: 4 }, // Green Star Rafflesia (1 cost event, Trigger)
      { cardId: 'OP01-029', qty: 4 }, // Radical Beam (1 cost event, counter, Trigger)
      { cardId: 'OP01-013', qty: 2 }, // Sanji (2 cost, 3000 power, counter 2000)
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function totalDeckCards(deck: Deck): number {
  return deck.cards.reduce((sum, c) => sum + c.qty, 0)
}

describe('Game Setup', () => {
  it('creates a valid initial game state', () => {
    const deck = makeTestDeck()
    expect(totalDeckCards(deck)).toBe(DECK_SIZE)

    const state = createGame(deck, deck)

    expect(state.phase).toBe('SETUP')
    expect(state.winner).toBe(null)
    expect(state.turnNumber).toBe(1)
    expect(state.setupComplete).toBe(false)

    for (const pid of ['player1', 'player2'] as PlayerId[]) {
      const player = state.players[pid]
      expect(player.hand.length).toBe(STARTING_HAND_SIZE)
      expect(player.lifeCards.length).toBe(5) // Zoro has life 5
      expect(player.donDeck.length).toBe(DON_DECK_SIZE)
      expect(player.donArea.length).toBe(0)
      expect(player.characters.length).toBe(0)
      expect(player.trash.length).toBe(0)
      expect(player.stage).toBe(null)
      // Main deck = 50 - 5 (hand) - 5 (life) = 40
      expect(player.deck.length).toBe(DECK_SIZE - STARTING_HAND_SIZE - 5)
      expect(player.leader.cardId).toBe('OP01-001')
    }
  })

  it('mulligan reshuffles hand', () => {
    const deck = makeTestDeck()
    const state = createGame(deck, deck)
    const afterMulligan = processAction(state, { type: 'MULLIGAN', accept: false }, 'player1')
    expect(afterMulligan.error).toBeUndefined()

    const newHand = afterMulligan.state.players.player1.hand
    expect(newHand.length).toBe(STARTING_HAND_SIZE)
    // Hand should (almost certainly) be different after mulligan
    // Deck + hand should still total correctly
    const p1 = afterMulligan.state.players.player1
    expect(p1.hand.length + p1.deck.length + p1.lifeCards.length).toBe(DECK_SIZE)
  })

  it('both mulligans accepted starts the game', () => {
    const deck = makeTestDeck()
    let state = createGame(deck, deck)

    const r1 = processAction(state, { type: 'MULLIGAN', accept: true }, 'player1')
    expect(r1.error).toBeUndefined()
    state = r1.state

    const r2 = processAction(state, { type: 'MULLIGAN', accept: true }, 'player2')
    expect(r2.error).toBeUndefined()
    state = r2.state

    // Game should have started and auto-advanced to MAIN phase
    expect(state.setupComplete).toBe(true)
    expect(state.phase).toBe('MAIN')
  })
})

describe('Turn Structure', () => {
  let state: GameState

  beforeEach(() => {
    const deck = makeTestDeck()
    state = createGame(deck, deck)

    // Complete mulligan
    let r = processAction(state, { type: 'MULLIGAN', accept: true }, 'player1')
    state = r.state
    r = processAction(state, { type: 'MULLIGAN', accept: true }, 'player2')
    state = r.state
  })

  it('first player gets 1 DON on turn 1', () => {
    const currentPlayer = state.currentPlayer
    const player = state.players[currentPlayer]
    // After auto-advance: Refresh (skip T1) -> Draw (skip T1) -> DON (1 DON)
    expect(player.donArea.length).toBe(DON_FIRST_TURN)
    expect(player.donDeck.length).toBe(DON_DECK_SIZE - DON_FIRST_TURN)
  })

  it('first player cannot attack on turn 1', () => {
    const currentPlayer = state.currentPlayer
    const player = state.players[currentPlayer]

    const result = processAction(
      state,
      {
        type: 'DECLARE_ATTACK',
        attackerId: player.leader.instanceId,
        targetId: state.players[currentPlayer === 'player1' ? 'player2' : 'player1'].leader.instanceId,
      },
      currentPlayer,
    )
    expect(result.error).toBeDefined()
    expect(result.error).toContain('Cannot attack on first turn')
  })

  it('ending turn switches to opponent', () => {
    const firstPlayer = state.currentPlayer
    const r = processAction(state, { type: 'END_TURN' }, firstPlayer)
    expect(r.error).toBeUndefined()

    const newState = r.state
    expect(newState.currentPlayer).not.toBe(firstPlayer)
    expect(newState.turnNumber).toBe(2)
    expect(newState.phase).toBe('MAIN')
  })

  it('second turn gives 2 DON', () => {
    const firstPlayer = state.currentPlayer
    const secondPlayer = firstPlayer === 'player1' ? 'player2' : 'player1'

    const r = processAction(state, { type: 'END_TURN' }, firstPlayer)
    const newState = r.state

    expect(newState.currentPlayer).toBe(secondPlayer)
    const player = newState.players[secondPlayer]
    expect(player.donArea.length).toBe(DON_PER_TURN)
  })

  it('draw phase draws a card on turn 2+', () => {
    const firstPlayer = state.currentPlayer
    const handBefore = state.players[firstPlayer === 'player1' ? 'player2' : 'player1'].hand.length

    const r = processAction(state, { type: 'END_TURN' }, firstPlayer)
    const handAfter = r.state.players[r.state.currentPlayer].hand.length

    // Second player draws 1 card
    expect(handAfter).toBe(handBefore + 1)
  })

  it('refresh phase un-rests all cards', () => {
    const currentPlayer = state.currentPlayer
    // End turn 1, then end turn 2 — now back to first player on turn 3
    let r = processAction(state, { type: 'END_TURN' }, currentPlayer)
    const secondPlayer = r.state.currentPlayer
    r = processAction(r.state, { type: 'END_TURN' }, secondPlayer)
    const newState = r.state

    // All DON should be active (un-rested) after refresh
    const player = newState.players[newState.currentPlayer]
    expect(player.donArea.every((d) => !d.isRested)).toBe(true)
  })
})

describe('Playing Cards', () => {
  let state: GameState

  beforeEach(() => {
    const deck = makeTestDeck()
    state = createGame(deck, deck)

    // Complete mulligan
    let r = processAction(state, { type: 'MULLIGAN', accept: true }, 'player1')
    state = r.state
    r = processAction(state, { type: 'MULLIGAN', accept: true }, 'player2')
    state = r.state
  })

  it('can play a card with enough DON', () => {
    // First, get to a turn with enough DON (need at least 1)
    const currentPlayer = state.currentPlayer
    const player = state.players[currentPlayer]

    // Find a 1-cost card in hand
    const oneCostCard = player.hand.find((c) => {
      const data = getCardById(c.cardId)
      return data && data.cost === 1 && data.cardType === 'Character'
    })

    if (oneCostCard) {
      const r = processAction(
        state,
        { type: 'PLAY_CARD', cardInstanceId: oneCostCard.instanceId },
        currentPlayer,
      )
      expect(r.error).toBeUndefined()
      expect(r.state.players[currentPlayer].characters.length).toBe(1)
      expect(r.state.players[currentPlayer].hand.length).toBe(player.hand.length - 1)
    }
  })

  it('cannot play card without enough DON', () => {
    const currentPlayer = state.currentPlayer
    const player = state.players[currentPlayer]

    // Find a 4-cost card in hand (turn 1 has only 1 DON)
    const expensiveCard = player.hand.find((c) => {
      const data = getCardById(c.cardId)
      return data && data.cost >= 4
    })

    if (expensiveCard) {
      const r = processAction(
        state,
        { type: 'PLAY_CARD', cardInstanceId: expensiveCard.instanceId },
        currentPlayer,
      )
      expect(r.error).toBeDefined()
      expect(r.error).toContain('DON')
    }
  })

  it('cannot play cards during wrong phase', () => {
    // Force state to SETUP
    const setupState = { ...state, phase: 'SETUP' as const }
    const card = setupState.players[setupState.currentPlayer].hand[0]

    const r = processAction(
      setupState,
      { type: 'PLAY_CARD', cardInstanceId: card.instanceId },
      setupState.currentPlayer,
    )
    expect(r.error).toBeDefined()
  })
})

describe('DON Attachment', () => {
  let state: GameState

  beforeEach(() => {
    const deck = makeTestDeck()
    state = createGame(deck, deck)

    let r = processAction(state, { type: 'MULLIGAN', accept: true }, 'player1')
    state = r.state
    r = processAction(state, { type: 'MULLIGAN', accept: true }, 'player2')
    state = r.state
  })

  it('can attach DON to leader', () => {
    const currentPlayer = state.currentPlayer
    const player = state.players[currentPlayer]

    const r = processAction(
      state,
      { type: 'ATTACH_DON', count: 1, targetCardId: player.leader.instanceId },
      currentPlayer,
    )
    expect(r.error).toBeUndefined()
    expect(r.state.players[currentPlayer].leader.attachedDon).toBe(1)
  })

  it('cannot attach more DON than available', () => {
    const currentPlayer = state.currentPlayer
    const player = state.players[currentPlayer]

    const r = processAction(
      state,
      { type: 'ATTACH_DON', count: 5, targetCardId: player.leader.instanceId },
      currentPlayer,
    )
    expect(r.error).toBeDefined()
    expect(r.error).toContain('Not enough active DON')
  })

  it('attached DON increases effective power', () => {
    const currentPlayer = state.currentPlayer
    const player = state.players[currentPlayer]

    const basePower = getEffectivePower(player.leader)

    const r = processAction(
      state,
      { type: 'ATTACH_DON', count: 1, targetCardId: player.leader.instanceId },
      currentPlayer,
    )

    const newPower = getEffectivePower(r.state.players[currentPlayer].leader)
    expect(newPower).toBe(basePower + 1000) // DON_POWER_BONUS = 1000
  })
})

describe('Battle', () => {
  let state: GameState

  beforeEach(() => {
    const deck = makeTestDeck()
    state = createGame(deck, deck)

    // Complete mulligan
    let r = processAction(state, { type: 'MULLIGAN', accept: true }, 'player1')
    state = r.state
    r = processAction(state, { type: 'MULLIGAN', accept: true }, 'player2')
    state = r.state

    // Advance to turn 3 (both players can attack)
    const p1 = state.currentPlayer
    r = processAction(state, { type: 'END_TURN' }, p1)
    state = r.state

    const p2 = state.currentPlayer
    r = processAction(state, { type: 'END_TURN' }, p2)
    state = r.state
    // Now turn 3, first player's turn again, with 1+2=3 DON
  })

  it('can declare attack on turn 3+', () => {
    const currentPlayer = state.currentPlayer
    const opponent = currentPlayer === 'player1' ? 'player2' : 'player1'
    const player = state.players[currentPlayer]

    const r = processAction(
      state,
      {
        type: 'DECLARE_ATTACK',
        attackerId: player.leader.instanceId,
        targetId: state.players[opponent].leader.instanceId,
      },
      currentPlayer,
    )
    expect(r.error).toBeUndefined()
    expect(r.state.battle).not.toBeNull()
    expect(r.state.battle!.step).toBe('BLOCK')
    // Attacker should be rested
    expect(r.state.players[currentPlayer].leader.isRested).toBe(true)
  })

  it('full battle sequence: attack -> decline block -> pass counter -> damage', () => {
    const currentPlayer = state.currentPlayer
    const opponent = currentPlayer === 'player1' ? 'player2' : 'player1'
    const player = state.players[currentPlayer]
    const opponentState = state.players[opponent]

    const lifeBefore = opponentState.lifeCards.length
    const handBefore = opponentState.hand.length

    // Declare attack on opponent leader
    let r = processAction(
      state,
      {
        type: 'DECLARE_ATTACK',
        attackerId: player.leader.instanceId,
        targetId: opponentState.leader.instanceId,
      },
      currentPlayer,
    )
    expect(r.state.battle!.step).toBe('BLOCK')

    // Decline block
    r = processAction(r.state, { type: 'DECLINE_BLOCK' }, opponent)
    expect(r.state.battle!.step).toBe('COUNTER')

    // Pass counter
    r = processAction(r.state, { type: 'PASS_COUNTER' }, opponent)

    // Battle should be resolved
    expect(r.state.battle).toBeNull()

    // Both leaders have 5000 power — attack succeeds (>=)
    // Opponent should lose 1 life, gain 1 hand card
    expect(r.state.players[opponent].lifeCards.length).toBe(lifeBefore - 1)
    // Hand gains the life card (might also have trigger pending)
    if (!r.state.pendingTrigger) {
      expect(r.state.players[opponent].hand.length).toBe(handBefore + 1)
    }
  })

  it('counter cards can prevent damage', () => {
    const currentPlayer = state.currentPlayer
    const opponent = currentPlayer === 'player1' ? 'player2' : 'player1'
    const player = state.players[currentPlayer]
    const opponentState = state.players[opponent]
    const lifeBefore = opponentState.lifeCards.length

    // Attack opponent leader (5000 vs 5000)
    let r = processAction(
      state,
      {
        type: 'DECLARE_ATTACK',
        attackerId: player.leader.instanceId,
        targetId: opponentState.leader.instanceId,
      },
      currentPlayer,
    )

    // Decline block
    r = processAction(r.state, { type: 'DECLINE_BLOCK' }, opponent)

    // Find a counter card in opponent's hand
    const counterCard = r.state.players[opponent].hand.find((c) => {
      const data = getCardById(c.cardId)
      return data && data.counter && data.counter > 0
    })

    if (counterCard) {
      // Use counter (adds power to defender)
      r = processAction(r.state, { type: 'USE_COUNTER', cardInstanceIds: [counterCard.instanceId] }, opponent)

      // With counter, defender power > attacker power, so no damage
      expect(r.state.battle).toBeNull()
      expect(r.state.players[opponent].lifeCards.length).toBe(lifeBefore)
    }
  })
})

describe('Win Conditions', () => {
  it('player wins when opponent has 0 life and takes another hit', () => {
    const deck = makeTestDeck()
    let state = createGame(deck, deck)

    // Complete mulligan
    let r = processAction(state, { type: 'MULLIGAN', accept: true }, 'player1')
    state = r.state
    r = processAction(state, { type: 'MULLIGAN', accept: true }, 'player2')
    state = r.state

    // Manually set opponent's life to 0 to test win condition
    const currentPlayer = state.currentPlayer
    const opponent = currentPlayer === 'player1' ? 'player2' : 'player1'

    // Advance to turn 3 so attacks are allowed
    r = processAction(state, { type: 'END_TURN' }, currentPlayer)
    state = r.state
    r = processAction(state, { type: 'END_TURN' }, state.currentPlayer)
    state = r.state

    // Drain opponent life
    state = {
      ...state,
      players: {
        ...state.players,
        [opponent]: { ...state.players[opponent], lifeCards: [] },
      },
    }

    const player = state.players[state.currentPlayer]

    // Attack the leader with 0 life
    r = processAction(
      state,
      {
        type: 'DECLARE_ATTACK',
        attackerId: player.leader.instanceId,
        targetId: state.players[opponent].leader.instanceId,
      },
      state.currentPlayer,
    )

    // Decline block
    r = processAction(r.state, { type: 'DECLINE_BLOCK' }, opponent)

    // Pass counter
    r = processAction(r.state, { type: 'PASS_COUNTER' }, opponent)

    // Game should be won
    expect(r.state.winner).toBe(state.currentPlayer)
  })
})
