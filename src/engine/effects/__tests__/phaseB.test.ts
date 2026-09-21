import { describe, it, expect } from 'vitest'
import type { GameState, GameCard, GameEvent, PlayerId } from '@/engine/types'
import { createGame, createGameCard } from '@/engine/gameSetup'
import { processAction } from '@/engine/processor'
import { whoActs } from '@/engine/legalActions'
import { koById, runStack } from '@/engine/effects/interpreter'
import { registerEffects } from '@/engine/effects/registry'
import { evalCond, getEffectiveCost } from '@/engine/effects/statics'
import { getEffectivePower } from '@/engine/powerCalc'
import { cardHasName, deckCopyLimit, getBattleAttribute } from '@/engine/rulesLayer'
import { canAddCard } from '@/stores/deckStore'
import { determinize } from '@/ai/determinize'
import { makeAutoDeck } from '@/sim/selfplay'
import { mulberry32, setRandomSource, resetRandomSource } from '@/utils/rng'

function baseState(leader1 = 'OP01-001', leader2 = 'OP01-001'): GameState {
  setRandomSource(mulberry32(11))
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

function setDon(state: GameState, pid: PlayerId, active: number): GameState {
  const p = state.players[pid]
  const donArea = Array.from({ length: active }, () => createGameCard('DON', pid))
  return { ...state, players: { ...state.players, [pid]: { ...p, donArea } } }
}

function counterBattle(state: GameState, attackerPlayer: PlayerId): GameState {
  const atk = state.players[attackerPlayer]
  const def = state.players[attackerPlayer === 'player1' ? 'player2' : 'player1']
  return {
    ...state,
    currentPlayer: attackerPlayer,
    battle: {
      attackerId: atk.leader.instanceId,
      attackerPlayer,
      originalTargetId: def.leader.instanceId,
      currentTargetId: def.leader.instanceId,
      defenderPlayer: def.leader.ownerId,
      step: 'COUNTER',
      counterCardsUsed: [],
      attackerPowerBonus: 0,
      defenderPowerBonus: 0,
    },
  }
}

const choose = (state: GameState, ids: string[]): GameState =>
  processAction(state, { type: 'CHOOSE', instanceIds: ids }, state.pendingChoice!.playerId).state

describe('event pipeline (socket 1)', () => {
  it('OP01-004 Usopp draws when the opponent plays a counter event on your turn, once per turn', () => {
    let state = baseState()
    const usopp = withCharacter(state, 'player1', 'OP01-004', { attachedDon: 1 })
    state = usopp.state
    state = { ...state, players: { ...state.players, player1: { ...state.players.player1, hand: [] } } }
    const oppHand = withHand(state, 'player2', ['OP01-119', 'OP01-119', 'OP01-013'])
    state = setDon(oppHand.state, 'player2', 8)
    state = counterBattle(state, 'player1')

    state = processAction(state, { type: 'PLAY_COUNTER_EVENT', cardInstanceId: oppHand.cards[0].instanceId }, 'player2').state
    // Thunder Bagua's own +4000 choice resolves first, then the listener draws
    expect(state.pendingChoice?.playerId).toBe('player2')
    state = choose(state, [])
    expect(state.players.player1.hand.length).toBe(1)

    state = processAction(state, { type: 'PLAY_COUNTER_EVENT', cardInstanceId: oppHand.cards[1].instanceId }, 'player2').state
    state = choose(state, [])
    expect(state.players.player1.hand.length).toBe(1) // once per turn
  })

  it("OP01-061 Kaido adds a DON when an opponent Character is K.O.'d on your turn", () => {
    let state = baseState('OP01-061')
    state = {
      ...state,
      players: {
        ...state.players,
        player1: { ...state.players.player1, leader: { ...state.players.player1.leader, attachedDon: 1 } },
      },
    }
    state = setDon(state, 'player1', 3)
    const victim1 = withCharacter(state, 'player2', 'OP01-064')
    state = victim1.state
    const victim2 = withCharacter(state, 'player2', 'OP01-064')
    state = victim2.state

    const events: GameEvent[] = []
    state = runStack(koById(state, victim1.card.instanceId, events), events)
    expect(state.players.player1.donArea.length).toBe(4)

    state = runStack(koById(state, victim2.card.instanceId, events), events)
    expect(state.players.player1.donArea.length).toBe(4) // once per turn
  })

  it('OP01-062 Crocodile leader draws when you activate an Event with 4 or fewer cards in hand', () => {
    let state = baseState('OP01-062')
    state = {
      ...state,
      players: {
        ...state.players,
        player1: { ...state.players.player1, leader: { ...state.players.player1.leader, attachedDon: 1 } },
      },
    }
    const hand = withHand(state, 'player1', ['OP01-030', 'OP01-030', 'OP01-013'])
    state = setDon(hand.state, 'player1', 6)

    const deckBefore = state.players.player1.deck.length
    state = processAction(state, { type: 'PLAY_CARD', cardInstanceId: hand.cards[0].instanceId }, 'player1').state
    expect(state.pendingChoice).toBeNull() // search whiffs in a blue/purple deck
    // played -1, drew +1: hand size unchanged, deck down by the drawn card
    expect(state.players.player1.hand.length).toBe(3)
    expect(state.players.player1.deck.length).toBe(deckBefore - 1)

    state = processAction(state, { type: 'PLAY_CARD', cardInstanceId: hand.cards[1].instanceId }, 'player1').state
    expect(state.players.player1.hand.length).toBe(2) // no second draw this turn
    expect(state.players.player1.deck.length).toBe(deckBefore - 1)
  })
})

describe('reveals and revealed-hand knowledge', () => {
  it('OP01-063 Arlong: reveal an Event, then bottom-deck a life card', () => {
    let state = baseState()
    const arlong = withCharacter(state, 'player1', 'OP01-063', { attachedDon: 1 })
    state = arlong.state
    const oppHand = withHand(state, 'player2', ['OP01-030', 'OP01-013'])
    state = oppHand.state
    const [eventCard] = oppHand.cards
    const topLife = state.players.player2.lifeCards[0]

    state = processAction(state, { type: 'ACTIVATE_EFFECT', cardInstanceId: arlong.card.instanceId, effectId: '0' }, 'player1').state
    expect(state.pendingChoice?.playerId).toBe('player1')
    state = choose(state, [eventCard.instanceId])
    // Revealed an Event: the life choice opens
    expect(state.pendingChoice).not.toBeNull()
    state = choose(state, [topLife.instanceId])

    const p2 = state.players.player2
    expect(p2.lifeCards.length).toBe(4)
    expect(p2.deck[p2.deck.length - 1].instanceId).toBe(topLife.instanceId)
    expect(p2.hand.find((c) => c.instanceId === eventCard.instanceId)?.revealed).toBe(true)
    expect(state.players.player1.characters[0].isRested).toBe(true)
  })

  it('OP01-063 Arlong: revealing a non-Event ends the effect', () => {
    let state = baseState()
    const arlong = withCharacter(state, 'player1', 'OP01-063', { attachedDon: 1 })
    state = arlong.state
    const oppHand = withHand(state, 'player2', ['OP01-030', 'OP01-013'])
    state = oppHand.state
    const charCard = oppHand.cards[1]

    state = processAction(state, { type: 'ACTIVATE_EFFECT', cardInstanceId: arlong.card.instanceId, effectId: '0' }, 'player1').state
    state = choose(state, [charCard.instanceId])
    expect(state.pendingChoice).toBeNull()
    expect(state.players.player2.lifeCards.length).toBe(5)
    expect(state.players.player2.hand.find((c) => c.instanceId === charCard.instanceId)?.revealed).toBe(true)
  })

  it('OP01-105 Bao Huang reveals chosen cards, and determinize pins them', () => {
    let state = baseState()
    const hand = withHand(state, 'player1', ['OP01-105'])
    state = setDon(hand.state, 'player1', 3)
    const oppHand = withHand(state, 'player2', ['OP01-013', 'OP01-016', 'OP01-030'])
    state = oppHand.state

    state = processAction(state, { type: 'PLAY_CARD', cardInstanceId: hand.cards[0].instanceId }, 'player1').state
    const targets = [oppHand.cards[0].instanceId, oppHand.cards[1].instanceId]
    state = choose(state, targets)

    const revealed = state.players.player2.hand.filter((c) => c.revealed).map((c) => c.instanceId)
    expect(revealed.sort()).toEqual([...targets].sort())

    const world = determinize(state, 'player1', mulberry32(7))
    const worldHandIds = world.players.player2.hand.map((c) => c.instanceId)
    for (const id of targets) expect(worldHandIds).toContain(id)
  })
})

describe('OP01-013 Sanji life-pay', () => {
  function sanjiState() {
    let state = baseState()
    const sanji = withCharacter(state, 'player1', 'OP01-013')
    state = sanji.state
    const p1 = state.players.player1
    // Force a life card WITH a trigger on top: paying it must not fire the trigger
    const triggerLife = createGameCard('OP01-030', 'player1')
    const donArea = [
      { ...createGameCard('DON', 'player1'), isRested: true },
      { ...createGameCard('DON', 'player1'), isRested: true },
      createGameCard('DON', 'player1'),
    ]
    state = {
      ...state,
      players: {
        ...state.players,
        player1: { ...p1, lifeCards: [triggerLife, ...p1.lifeCards.slice(1)], donArea },
      },
    }
    return { state, sanji: sanji.card, triggerLife }
  }

  it('takes the TOP life card to hand privately, without firing its trigger', () => {
    const { state: s0, sanji, triggerLife } = sanjiState()
    let state = processAction(s0, { type: 'ACTIVATE_EFFECT', cardInstanceId: sanji.instanceId, effectId: '0' }, 'player1').state
    expect(state.pendingChoice?.options).toEqual([triggerLife.instanceId])
    state = choose(state, [triggerLife.instanceId])

    const p1 = state.players.player1
    expect(p1.lifeCards.length).toBe(4)
    const paid = p1.hand.find((c) => c.instanceId === triggerLife.instanceId)
    expect(paid).toBeDefined()
    expect(paid!.revealed).toBeFalsy() // hidden: only [Trigger] activation reveals a life card
    expect(state.pendingTrigger).toBeNull() // effect pays never fire triggers

    const live = p1.characters.find((c) => c.instanceId === sanji.instanceId)!
    expect(getEffectivePower(state, live)).toBe(7000) // 3000 base + 2000 effect + 2×1000 DON
    expect(live.attachedDon).toBe(2) // both rested DON vacuumed up
    expect(p1.donArea.length).toBe(1) // only the active one remains
  })

  it('declining the pay ends the effect but consumes the once-per-turn', () => {
    const { state: s0, sanji } = sanjiState()
    let state = processAction(s0, { type: 'ACTIVATE_EFFECT', cardInstanceId: sanji.instanceId, effectId: '0' }, 'player1').state
    state = choose(state, [])

    const p1 = state.players.player1
    expect(p1.lifeCards.length).toBe(5)
    const live = p1.characters.find((c) => c.instanceId === sanji.instanceId)!
    expect(getEffectivePower(state, live)).toBe(3000)
    expect(live.attachedDon).toBe(0)
    const again = processAction(state, { type: 'ACTIVATE_EFFECT', cardInstanceId: sanji.instanceId, effectId: '0' }, 'player1')
    expect(again.error).toBeDefined()
  })

  it('life cards taken as battle damage also stay hidden', () => {
    let state = baseState()
    const attacker = withCharacter(state, 'player1', 'OP01-025', { attachedDon: 1 })
    state = attacker.state
    // No-trigger life card on top so damage resolves without a prompt
    const plainLife = createGameCard('OP01-013', 'player2')
    state = {
      ...state,
      players: {
        ...state.players,
        player2: {
          ...state.players.player2,
          hand: [],
          lifeCards: [plainLife, ...state.players.player2.lifeCards.slice(1)],
        },
      },
    }
    state = processAction(state, { type: 'DECLARE_ATTACK', attackerId: attacker.card.instanceId, targetId: state.players.player2.leader.instanceId }, 'player1').state
    const taken = state.players.player2.hand.find((c) => c.instanceId === plainLife.instanceId)
    expect(taken).toBeDefined()
    expect(taken!.revealed).toBeFalsy()
  })
})

describe('cost modifiers', () => {
  it('OP01-067 Crocodile makes blue Events in hand cost 1 less', () => {
    let state = baseState()
    const croc = withCharacter(state, 'player1', 'OP01-067', { attachedDon: 1 })
    state = croc.state
    const hand = withHand(state, 'player1', ['OP01-086', 'OP01-030'])
    state = hand.state
    const [blueEvent, redEvent] = hand.cards

    expect(getEffectiveCost(state, 'player1', blueEvent)).toBe(1)
    expect(getEffectiveCost(state, 'player1', redEvent)).toBe(1) // printed 1, not blue: unchanged

    // Without the DON requirement the discount is off
    const noDon = {
      ...state,
      players: {
        ...state.players,
        player1: {
          ...state.players.player1,
          characters: state.players.player1.characters.map((c) => ({ ...c, attachedDon: 0 })),
        },
      },
    }
    expect(getEffectiveCost(noDon, 'player1', blueEvent)).toBe(2)
  })

  it('the discounted cost is what validation and payment use for counter events', () => {
    let state = baseState()
    const croc = withCharacter(state, 'player1', 'OP01-067', { attachedDon: 1 })
    state = croc.state
    const hand = withHand(state, 'player1', ['OP01-086'])
    state = setDon(hand.state, 'player1', 1) // printed cost 2, discounted to 1
    state = counterBattle(state, 'player2')

    const result = processAction(state, { type: 'PLAY_COUNTER_EVENT', cardInstanceId: hand.cards[0].instanceId }, 'player1')
    expect(result.error).toBeUndefined()
    state = choose(result.state, []) // decline +4000
    if (state.pendingChoice) state = choose(state, []) // decline the bounce
    expect(state.players.player1.donArea.filter((d) => !d.isRested).length).toBe(0)
  })
})

describe('battle attributes', () => {
  it("OP01-024 Luffy with 2 DON can't be battle-K.O.'d by <Strike>, but <Slash> K.O.s him", () => {
    const run = (attackerCardId: string) => {
      let state = baseState()
      const attacker = withCharacter(state, 'player1', attackerCardId, { attachedDon: 2 })
      state = attacker.state
      const luffy = withCharacter(state, 'player2', 'OP01-024', { attachedDon: 2, isRested: true })
      state = luffy.state
      state = { ...state, players: { ...state.players, player2: { ...state.players.player2, hand: [] } } }
      state = processAction(state, { type: 'DECLARE_ATTACK', attackerId: attacker.card.instanceId, targetId: luffy.card.instanceId }, 'player1').state
      return state.players.player2.characters.some((c) => c.instanceId === luffy.card.instanceId)
    }

    expect(getBattleAttribute('OP01-024')).toBe('Strike')
    expect(getBattleAttribute('OP01-025')).toBe('Slash')
    expect(run('OP01-024')).toBe(true) // Strike attacker: KO prevented
    expect(run('OP01-025')).toBe(false) // Slash attacker: KO goes through
  })
})

describe('rules layer (socket 6)', () => {
  it('OP01-121 Yamato also carries the name Kozuki Oden', () => {
    expect(cardHasName('OP01-121', 'Kozuki Oden')).toBe(true)
    expect(cardHasName('OP01-121', 'Yamato')).toBe(true)
    expect(cardHasName('OP01-025', 'Kozuki Oden')).toBe(false)

    let state = baseState()
    state = withCharacter(state, 'player1', 'OP01-121').state
    expect(evalCond(state, 'player1', null, { hasCharacterNamed: 'Kozuki Oden' })).toBe(true)
    expect(evalCond(state, 'player1', null, { hasCharacterNamed: 'Roronoa Zoro' })).toBe(false)
  })

  it('OP01-075 Pacifista ignores the 4-copy deck limit', () => {
    expect(deckCopyLimit('OP01-075')).toBe(Infinity)
    expect(deckCopyLimit('OP01-025')).toBe(4)

    const deck = {
      id: 'd',
      name: 'test',
      leader: 'OP01-060',
      cards: [{ cardId: 'OP01-075', qty: 8 }],
      createdAt: 0,
      updatedAt: 0,
    }
    const pacifista = { id: 'OP01-075', cardType: 'Character', color: ['Blue'] }
    expect(canAddCard(deck, pacifista as never).ok).toBe(true)
  })
})

describe('K.O. replacement window (socket 2)', () => {
  it("a 'replaceKo' def runs instead of the K.O., once per turn", () => {
    registerEffects('TEST-REPLACE', [
      {
        timing: 'replaceKo',
        oncePerTurn: true,
        ops: [{ op: 'powerMod', ref: 'self', amount: 1000, duration: 'permanent' }],
      },
    ])

    let state = baseState()
    const c = withCharacter(state, 'player2', 'TEST-REPLACE')
    state = c.state
    const events: GameEvent[] = []

    state = runStack(koById(state, c.card.instanceId, events), events)
    const survivor = state.players.player2.characters.find((x) => x.instanceId === c.card.instanceId)
    expect(survivor).toBeDefined()
    expect(survivor!.modifiers).toHaveLength(1)
    expect(events.some((e) => e.type === 'KO_REPLACED')).toBe(true)

    state = runStack(koById(state, c.card.instanceId, events), events)
    expect(state.players.player2.characters.some((x) => x.instanceId === c.card.instanceId)).toBe(false)
    expect(state.players.player2.trash.some((x) => x.instanceId === c.card.instanceId)).toBe(true)
  })
})
