import { describe, it, expect } from 'vitest'
import type { GameState, GameCard, PlayerId } from '@/engine/types'
import { createGame, createGameCard } from '@/engine/gameSetup'
import { processAction } from '@/engine/processor'
import { whoActs } from '@/engine/legalActions'
import { evalCond, getEffectiveCost, getEffectiveFieldCost } from '@/engine/effects/statics'
import { hasKeyword } from '@/engine/keywords'
import { makeAutoDeck } from '@/sim/selfplay'
import { mulberry32, setRandomSource, resetRandomSource } from '@/utils/rng'

function baseState(leader1 = 'OP01-001', leader2 = 'OP01-001'): GameState {
  setRandomSource(mulberry32(31))
  let state = createGame(makeAutoDeck(leader1), makeAutoDeck(leader2))
  state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
  state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
  resetRandomSource()
  return { ...state, currentPlayer: 'player1', turnNumber: 5, phase: 'MAIN', battle: null }
}

function withCharacter(
  state: GameState,
  pid: PlayerId,
  cardId: string,
  props: Partial<GameCard> = {},
): { state: GameState; card: GameCard } {
  const card = { ...createGameCard(cardId, pid), turnPlayed: 1, ...props }
  const p = state.players[pid]
  return {
    state: {
      ...state,
      players: { ...state.players, [pid]: { ...p, characters: [...p.characters, card] } },
    },
    card,
  }
}

function withHand(state: GameState, pid: PlayerId, cardIds: string[]): { state: GameState; cards: GameCard[] } {
  const cards = cardIds.map((id) => createGameCard(id, pid))
  const p = state.players[pid]
  return {
    state: { ...state, players: { ...state.players, [pid]: { ...p, hand: cards } } },
    cards,
  }
}

function setDon(state: GameState, pid: PlayerId, active: number, rested = 0): GameState {
  const p = state.players[pid]
  const donArea = [
    ...Array.from({ length: active }, () => createGameCard('DON', pid)),
    ...Array.from({ length: rested }, () => ({ ...createGameCard('DON', pid), isRested: true })),
  ]
  return { ...state, players: { ...state.players, [pid]: { ...p, donArea } } }
}

const choose = (state: GameState, ids: string[]): GameState =>
  processAction(state, { type: 'CHOOSE', instanceIds: ids }, state.pendingChoice!.playerId).state

describe('[End of Your Turn] effects', () => {
  it('Whitebeard leader takes the top life to hand as the turn ends', () => {
    let state = baseState('OP02-001')
    const handBefore = state.players.player1.hand.length
    const lifeBefore = state.players.player1.lifeCards.length // Whitebeard runs 6 life
    state = processAction(state, { type: 'END_TURN' }, 'player1').state
    expect(state.currentPlayer).toBe('player2')
    expect(state.players.player1.lifeCards.length).toBe(lifeBefore - 1)
    expect(state.players.player1.hand.length).toBe(handBefore + 1)
  })

  it("the noLifeToHand restriction blocks Whitebeard's end-of-turn draw", () => {
    let state = baseState('OP02-001')
    state = {
      ...state,
      players: {
        ...state.players,
        player1: { ...state.players.player1, lifeCards: state.players.player1.lifeCards.slice(0, 3) },
      },
    }
    const hand = withHand(state, 'player1', ['OP02-023'])
    state = setDon(hand.state, 'player1', 2)
    state = processAction(state, { type: 'PLAY_CARD', cardInstanceId: hand.cards[0].instanceId }, 'player1').state
    expect(state.turnFlags.player1).toContain('noLifeToHand')

    state = processAction(state, { type: 'END_TURN' }, 'player1').state
    expect(state.currentPlayer).toBe('player2')
    expect(state.players.player1.lifeCards.length).toBe(3) // no life taken
    expect(state.turnFlags.player1).toEqual([]) // restriction expired with the turn
  })

  it("Mr.3's optional end-of-turn choice pauses the turn switch", () => {
    let state = baseState()
    const mr3 = withCharacter(state, 'player1', 'OP02-065', { isRested: true })
    state = mr3.state
    const hand = withHand(state, 'player1', ['OP01-013'])
    state = hand.state

    state = processAction(state, { type: 'END_TURN' }, 'player1').state
    expect(state.pendingEndTurn).toBe(true)
    expect(state.currentPlayer).toBe('player1') // switch is on hold
    expect(state.pendingChoice?.playerId).toBe('player1')

    state = choose(state, [hand.cards[0].instanceId])
    expect(state.currentPlayer).toBe('player2') // choice resolved, turn completed
    expect(state.players.player1.characters[0].isRested).toBe(false)
    expect(state.players.player1.trash.some((c) => c.instanceId === hand.cards[0].instanceId)).toBe(true)
  })
})

describe('field cost modifiers', () => {
  it('Ice Age zeroes a cost-5 character for the turn', () => {
    let state = baseState()
    const vergo = withCharacter(state, 'player2', 'OP01-065')
    state = vergo.state
    const hand = withHand(state, 'player1', ['OP02-117'])
    state = setDon(hand.state, 'player1', 2)

    state = processAction(state, { type: 'PLAY_CARD', cardInstanceId: hand.cards[0].instanceId }, 'player1').state
    state = choose(state, [vergo.card.instanceId])

    const live = state.players.player2.characters[0]
    expect(getEffectiveFieldCost(state, live)).toBe(0)
    expect(evalCond(state, 'player1', null, { anyCharacterCostAtMost: 0 })).toBe(true)

    state = processAction(state, { type: 'END_TURN' }, 'player1').state
    expect(getEffectiveFieldCost(state, state.players.player2.characters[0])).toBe(5)
  })

  it("Kuzan's aura makes Onigumo gain Banish without infinite recursion", () => {
    let state = baseState()
    state = withCharacter(state, 'player2', 'OP02-121').state // Kuzan: opp chars -5 cost on his turn
    const onigumo = withCharacter(state, 'player1', 'OP02-095')
    state = { ...onigumo.state, currentPlayer: 'player2' }

    expect(getEffectiveFieldCost(state, state.players.player1.characters[0])).toBe(0)
    expect(hasKeyword(state, state.players.player1.characters[0], 'Banish')).toBe(true)

    const myTurn = { ...state, currentPlayer: 'player1' as PlayerId }
    expect(hasKeyword(myTurn, myTurn.players.player1.characters[0], 'Banish')).toBe(false)
  })
})

describe('engine events', () => {
  it('Garp leader punishes each DON attach with a cost drop', () => {
    let state = baseState('OP02-002')
    const target = withCharacter(state, 'player2', 'OP01-065') // cost 5
    state = setDon(target.state, 'player1', 2)

    state = processAction(state, { type: 'ATTACH_DON', count: 1, targetCardId: state.players.player1.leader.instanceId }, 'player1').state
    expect(state.pendingChoice?.playerId).toBe('player1')
    state = choose(state, [target.card.instanceId])
    expect(getEffectiveFieldCost(state, state.players.player2.characters[0])).toBe(4)
  })

  it('Sanji leader readies DON when a vanilla character is played, once per turn', () => {
    let state = baseState('OP02-026')
    const hand = withHand(state, 'player1', ['OP02-003', 'OP02-003']) // Atmos, no base effect
    state = setDon(hand.state, 'player1', 8, 2)

    state = processAction(state, { type: 'PLAY_CARD', cardInstanceId: hand.cards[0].instanceId }, 'player1').state
    expect(state.pendingChoice).not.toBeNull()
    // Paying Atmos rested 4 more DON; the leader readies at most 2 of them
    const restedBefore = state.players.player1.donArea.filter((d) => d.isRested)
    state = choose(state, restedBefore.slice(0, 2).map((d) => d.instanceId))
    expect(state.players.player1.donArea.filter((d) => d.isRested).length).toBe(restedBefore.length - 2)

    state = processAction(state, { type: 'PLAY_CARD', cardInstanceId: hand.cards[1].instanceId }, 'player1').state
    expect(state.pendingChoice).toBeNull() // once per turn
  })
})

describe("Kin'emon's one-shot play discount", () => {
  it('prices the next Land of Wano character down by 1 and is consumed', () => {
    let state = baseState('OP02-025')
    const hand = withHand(state, 'player1', ['OP02-030', 'OP02-030']) // Oden, cost 8
    state = setDon(hand.state, 'player1', 7)
    state = {
      ...state,
      players: { ...state.players, player1: { ...state.players.player1, characters: [] } },
    }

    state = processAction(state, { type: 'ACTIVATE_EFFECT', cardInstanceId: state.players.player1.leader.instanceId, effectId: '0' }, 'player1').state
    expect(getEffectiveCost(state, 'player1', state.players.player1.hand[0])).toBe(7)

    const result = processAction(state, { type: 'PLAY_CARD', cardInstanceId: hand.cards[0].instanceId }, 'player1')
    expect(result.error).toBeUndefined()
    state = result.state
    expect(state.players.player1.donArea.filter((d) => !d.isRested).length).toBe(0) // paid 7
    expect(state.playDiscounts.player1).toEqual([]) // consumed
    expect(getEffectiveCost(state, 'player1', state.players.player1.hand[0])).toBe(8)
  })
})

describe('DON!!-X activation costs', () => {
  it('Byrnndi World returns 8 DON up front and cannot fire without them', () => {
    let state = baseState()
    const world = withCharacter(state, 'player1', 'OP02-082')
    state = setDon(world.state, 'player1', 5, 3)
    const donDeckBefore = state.players.player1.donDeck.length

    state = processAction(state, { type: 'ACTIVATE_EFFECT', cardInstanceId: world.card.instanceId, effectId: '0' }, 'player1').state
    expect(state.players.player1.donArea.length).toBe(0)
    expect(state.players.player1.donDeck.length).toBe(donDeckBefore + 8)
    const live = state.players.player1.characters.find((c) => c.instanceId === world.card.instanceId)!
    expect(live.modifiers.some((m) => m.value === 792000)).toBe(true)

    const poor = setDon(baseState(), 'player1', 3)
    const world2 = withCharacter(poor, 'player1', 'OP02-082')
    const refused = processAction(world2.state, { type: 'ACTIVATE_EFFECT', cardInstanceId: world2.card.instanceId, effectId: '0' }, 'player1')
    expect(refused.error).toBeDefined()
  })
})

describe('battle add-ons', () => {
  it("Isuka stands back up after a battle K.O., once per turn", () => {
    let state = baseState()
    const isuka = withCharacter(state, 'player1', 'OP02-094', { attachedDon: 1 })
    state = isuka.state
    const victim = withCharacter(state, 'player2', 'OP01-016', { isRested: true }) // Nami 2000
    state = victim.state
    state = { ...state, players: { ...state.players, player2: { ...state.players.player2, hand: [] } } }

    state = processAction(state, { type: 'DECLARE_ATTACK', attackerId: isuka.card.instanceId, targetId: victim.card.instanceId }, 'player1').state
    expect(state.players.player2.characters.length).toBe(0)
    const live = state.players.player1.characters.find((c) => c.instanceId === isuka.card.instanceId)!
    expect(live.isRested).toBe(false) // attacked, K.O.'d, stood back up
  })

  it('Mr.2 bottom-decks himself when his attack ends', () => {
    let state = baseState()
    const mr2 = withCharacter(state, 'player1', 'OP02-064', { attachedDon: 1 })
    state = mr2.state
    const hand = withHand(state, 'player1', ['OP01-013'])
    state = hand.state
    const target = withCharacter(state, 'player2', 'OP01-016') // cost 1, active
    state = { ...target.state, players: { ...target.state.players, player2: { ...target.state.players.player2, hand: [] } } }

    state = processAction(state, { type: 'DECLARE_ATTACK', attackerId: mr2.card.instanceId, targetId: state.players.player2.leader.instanceId }, 'player1').state
    state = choose(state, [hand.cards[0].instanceId]) // pay the trash
    state = choose(state, [target.card.instanceId]) // bottom-deck the cost-2-or-less

    const p1 = state.players.player1
    expect(p1.characters.some((c) => c.instanceId === mr2.card.instanceId)).toBe(false)
    expect(p1.deck[p1.deck.length - 1].instanceId).toBe(mr2.card.instanceId)
    expect(state.players.player2.characters.length).toBe(0) // target went under too
  })
})

describe('forced DON returns', () => {
  it("Magellan's arrival sends an opponent DON home, rested first", () => {
    let state = baseState()
    const hand = withHand(state, 'player1', ['OP02-085'])
    state = setDon(hand.state, 'player1', 6)
    state = setDon(state, 'player2', 2, 2)
    const oppDeckBefore = state.players.player2.donDeck.length

    state = processAction(state, { type: 'PLAY_CARD', cardInstanceId: hand.cards[0].instanceId }, 'player1').state
    // Pay the optional DON!!-1
    state = choose(state, [state.players.player1.donArea.find((d) => !d.isRested)!.instanceId])

    const opp = state.players.player2
    expect(opp.donArea.length).toBe(3)
    expect(opp.donDeck.length).toBe(oppDeckBefore + 1)
    expect(opp.donArea.filter((d) => d.isRested).length).toBe(1) // rested returned first
  })
})

describe('stages as effect sources', () => {
  it('Land of Wano trashes a card to ready a DON', () => {
    let state = baseState()
    const stage = createGameCard('OP02-048', 'player1')
    const hand = withHand(state, 'player1', ['OP02-030']) // Land of Wano type
    state = setDon(hand.state, 'player1', 0, 1)
    state = {
      ...state,
      players: { ...state.players, player1: { ...state.players.player1, stage } },
    }

    state = processAction(state, { type: 'ACTIVATE_EFFECT', cardInstanceId: stage.instanceId, effectId: '0' }, 'player1').state
    expect(state.players.player1.stage?.isRested).toBe(true) // cost paid
    state = choose(state, [hand.cards[0].instanceId]) // trash the Land of Wano card
    state = choose(state, [state.players.player1.donArea[0].instanceId]) // ready 1 DON

    expect(state.players.player1.trash.some((c) => c.instanceId === hand.cards[0].instanceId)).toBe(true)
    expect(state.players.player1.donArea[0].isRested).toBe(false)
  })
})
