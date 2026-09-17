import { describe, it, expect } from 'vitest'
import type { GameState, GameCard, PlayerId, Modifier } from '../types'
import { createGame, createGameCard, dealLife } from '../gameSetup'
import { processAction } from '../processor'
import { legalActions, whoActs } from '../legalActions'
import { getEffectivePower } from '../powerCalc'
import { getPrintedKeywords, hasKeyword, isCounterEvent } from '../keywords'
import { getCardById } from '@/data/cardService'
import { mulberry32, setRandomSource, resetRandomSource } from '@/utils/rng'
import { makeAutoDeck } from '@/sim/selfplay'

// ─── Surgical state builder ─────────────────────────────────────────────────

function baseState(): GameState {
  setRandomSource(mulberry32(11))
  let state = createGame(makeAutoDeck('OP01-001'), makeAutoDeck('OP01-001'))
  state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
  state = processAction(state, { type: 'MULLIGAN', accept: true }, whoActs(state)!).state
  resetRandomSource()
  return { ...state, currentPlayer: 'player1', turnNumber: 5, phase: 'MAIN', battle: null }
}

function withHand(state: GameState, pid: PlayerId, cardIds: string[]): GameState {
  const hand = cardIds.map((id) => createGameCard(id, pid))
  return { ...state, players: { ...state.players, [pid]: { ...state.players[pid], hand } } }
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

function withActiveDon(state: GameState, pid: PlayerId, count: number): GameState {
  const donArea = Array.from({ length: count }, () => createGameCard('DON', pid))
  return { ...state, players: { ...state.players, [pid]: { ...state.players[pid], donArea } } }
}

function act(state: GameState, action: Parameters<typeof processAction>[1]): GameState {
  const result = processAction(state, action, whoActs(state)!)
  expect(result.error).toBeUndefined()
  return result.state
}

// ─── Finding 1: keyword possession vs mention ───────────────────────────────

describe('keyword parsing', () => {
  it('possesses keywords that open ability clauses', () => {
    expect(getPrintedKeywords('OP01-025').has('Rush')).toBe(true) // "[Rush] (..."
    expect(getPrintedKeywords('OP01-075').has('Blocker')).toBe(true) // after "...deck. [Blocker]"
    expect(getPrintedKeywords('OP01-121').has('Double Attack')).toBe(true)
    expect(getPrintedKeywords('OP01-121').has('Banish')).toBe(true) // after reminder parens
    expect(getPrintedKeywords('OP01-120').has('Rush')).toBe(true)
  })

  it('does not treat mentions or self-grants as possession', () => {
    // OP01-120 Shanks: "Your opponent cannot activate a [Blocker]..." is a restriction
    expect(getPrintedKeywords('OP01-120').has('Blocker')).toBe(false)
    // "gains [Rush]" / "gains [Double Attack]" are effects, not printed keywords
    expect(getPrintedKeywords('OP01-097').has('Rush')).toBe(false)
    expect(getPrintedKeywords('OP01-008').has('Rush')).toBe(false)
    expect(getPrintedKeywords('OP01-068').has('Double Attack')).toBe(false)
  })

  it('sees keywords granted by modifiers', () => {
    const state = baseState()
    const card = createGameCard('OP01-004', 'player1')
    expect(hasKeyword(state, card, 'Rush')).toBe(false)
    const granted: Modifier = {
      kind: 'keyword',
      value: 0,
      keyword: 'Rush',
      duration: 'turn',
      sourceCardId: 'TEST',
    }
    expect(hasKeyword(state, { ...card, modifiers: [granted] }, 'Rush')).toBe(true)
  })

  it('recognizes [Counter] events by timing tag position', () => {
    expect(isCounterEvent(getCardById('OP01-029')!)).toBe(true)
    expect(isCounterEvent(getCardById('OP01-030')!)).toBe(false) // [Main] event
  })
})

// ─── Finding 2: life stack order ────────────────────────────────────────────

describe('dealLife', () => {
  it('puts the top of the deck at the bottom of the life stack (CR 5-2-1-7)', () => {
    const { life, deck } = dealLife(['A', 'B', 'C', 'D', 'E', 'F', 'G'], 5)
    expect(life).toEqual(['E', 'D', 'C', 'B', 'A']) // index 0 = top of life
    expect(deck).toEqual(['F', 'G'])
  })
})

// ─── Phase A: interpreter + decision stack ──────────────────────────────────

describe('OP01-006 Otama: [On Play] select + power debuff', () => {
  it('pauses on a choice, applies -2000 for the turn, expires at end of turn', () => {
    let state = baseState()
    state = withHand(state, 'player1', ['OP01-006'])
    state = withActiveDon(state, 'player1', 3)
    const target = withCharacter(state, 'player2', 'OP01-010') // 3000 power
    state = target.state

    state = act(state, { type: 'PLAY_CARD', cardInstanceId: state.players.player1.hand[0].instanceId })
    expect(state.pendingChoice).not.toBeNull()
    expect(whoActs(state)).toBe('player1')

    const options = legalActions(state)
    expect(options).toContainEqual({ type: 'CHOOSE', instanceIds: [] })
    expect(options).toContainEqual({ type: 'CHOOSE', instanceIds: [target.card.instanceId] })

    state = act(state, { type: 'CHOOSE', instanceIds: [target.card.instanceId] })
    expect(state.pendingChoice).toBeNull()
    const debuffed = state.players.player2.characters[0]
    expect(getEffectivePower(state, debuffed)).toBe(1000)

    state = act(state, { type: 'END_TURN' })
    expect(getEffectivePower(state, state.players.player2.characters[0])).toBe(3000)
  })

  it('skips the choice entirely when there are no legal targets', () => {
    let state = baseState()
    state = withHand(state, 'player1', ['OP01-006'])
    state = withActiveDon(state, 'player1', 3)

    state = act(state, { type: 'PLAY_CARD', cardInstanceId: state.players.player1.hand[0].instanceId })
    expect(state.pendingChoice).toBeNull()
    expect(state.stack).toHaveLength(0)
  })
})

describe('OP01-011 Chopper: optional cost via abortIfEmpty', () => {
  function playChopper(): GameState {
    let state = baseState()
    state = withHand(state, 'player1', ['OP01-011', 'OP01-004', 'OP01-010'])
    state = withActiveDon(state, 'player1', 3)
    return act(state, { type: 'PLAY_CARD', cardInstanceId: state.players.player1.hand[0].instanceId })
  }

  it('declining the cost skips the draw', () => {
    let state = playChopper()
    expect(state.pendingChoice).not.toBeNull()
    const handBefore = state.players.player1.hand.length
    const deckBefore = state.players.player1.deck.length
    state = act(state, { type: 'CHOOSE', instanceIds: [] })
    expect(state.players.player1.hand.length).toBe(handBefore)
    expect(state.players.player1.deck.length).toBe(deckBefore)
  })

  it('paying the cost bottom-decks the card and draws', () => {
    let state = playChopper()
    const costCard = state.pendingChoice!.options[0]
    const deckBefore = state.players.player1.deck.length
    state = act(state, { type: 'CHOOSE', instanceIds: [costCard] })
    const deck = state.players.player1.deck
    expect(deck.length).toBe(deckBefore) // -1 draw +1 bottom-decked
    expect(deck[deck.length - 1].instanceId).toBe(costCard)
    expect(state.players.player1.hand.length).toBe(2) // paid one, drew one
  })
})

describe('OP01-017 Nico Robin: [DON!! x1] [When Attacking] K.O.', () => {
  function setup(don: number) {
    let state = baseState()
    const robin = withCharacter(state, 'player1', 'OP01-017', { attachedDon: don })
    state = robin.state
    const victim = withCharacter(state, 'player2', 'OP01-010', { isRested: true })
    state = victim.state
    return { state, robin: robin.card, victim: victim.card }
  }

  it('with DON: KOs the target and the battle ends by exit clause', () => {
    const fixture = setup(1)
    const { robin, victim } = fixture
    let state = fixture.state
    state = act(state, { type: 'DECLARE_ATTACK', attackerId: robin.instanceId, targetId: victim.instanceId })
    expect(state.pendingChoice).not.toBeNull()

    state = act(state, { type: 'CHOOSE', instanceIds: [victim.instanceId] })
    expect(state.players.player2.characters).toHaveLength(0)
    expect(state.players.player2.trash.some((c) => c.instanceId === victim.instanceId)).toBe(true)
    // CR 7-1-1-4: the target left, so the battle ended without a damage step
    expect(state.battle).toBeNull()
  })

  it('without DON the condition fails and battle proceeds to block', () => {
    const fixture = setup(0)
    const { robin, victim } = fixture
    let state = fixture.state
    state = act(state, { type: 'DECLARE_ATTACK', attackerId: robin.instanceId, targetId: victim.instanceId })
    expect(state.pendingChoice).toBeNull()
    expect(state.battle?.step).toBe('BLOCK')
  })
})

describe('OP01-009 Carrot: [Trigger] Play this card', () => {
  it('plays the trigger card from life to the field', () => {
    let state = baseState()
    state = { ...state, currentPlayer: 'player2' }
    // 4000 power + 1 DON = 5000, ties the 5000 leader and attacker wins ties
    const attacker = withCharacter(state, 'player2', 'OP01-012', { attachedDon: 1 })
    state = attacker.state
    const carrot = createGameCard('OP01-009', 'player1')
    state = {
      ...state,
      players: {
        ...state.players,
        player1: { ...state.players.player1, lifeCards: [carrot], hand: [] },
      },
    }

    state = act(state, {
      type: 'DECLARE_ATTACK',
      attackerId: attacker.card.instanceId,
      targetId: state.players.player1.leader.instanceId,
    })
    state = act(state, { type: 'DECLINE_BLOCK' })
    state = act(state, { type: 'PASS_COUNTER' })

    expect(state.pendingTrigger?.playerId).toBe('player1')
    expect(whoActs(state)).toBe('player1')

    state = act(state, { type: 'ACTIVATE_TRIGGER', accept: true })
    const p1 = state.players.player1
    expect(p1.characters.some((c) => c.cardId === 'OP01-009')).toBe(true)
    expect(p1.hand.some((c) => c.cardId === 'OP01-009')).toBe(false)
    expect(p1.trash.some((c) => c.cardId === 'OP01-009')).toBe(false)
  })
})

describe('OP01-001 Zoro leader aura ([DON!! x1] [Your Turn] all your Characters +1000)', () => {
  function withLeaderDon(state: GameState, pid: PlayerId, don: number): GameState {
    const p = state.players[pid]
    return {
      ...state,
      players: { ...state.players, [pid]: { ...p, leader: { ...p.leader, attachedDon: don } } },
    }
  }

  it('buffs your characters, not the leader itself and not opponent characters', () => {
    let state = baseState() // both players lead with OP01-001; currentPlayer = player1
    state = withLeaderDon(state, 'player1', 1)
    const mine = withCharacter(state, 'player1', 'OP01-010') // 3000 base
    state = mine.state
    const theirs = withCharacter(state, 'player2', 'OP01-010')
    state = theirs.state

    expect(getEffectivePower(state, mine.card)).toBe(4000)
    // Leader gets only its own DON bonus (5000 + 1000); the aura targets characters
    expect(getEffectivePower(state, state.players.player1.leader)).toBe(6000)
    // Opponent's character is untouched (their Zoro has no DON attached)
    expect(getEffectivePower(state, theirs.card)).toBe(3000)
  })

  it('requires the attached DON', () => {
    let state = baseState()
    const mine = withCharacter(state, 'player1', 'OP01-010')
    state = mine.state
    expect(getEffectivePower(state, mine.card)).toBe(3000)
  })

  it('is inactive on the opponent turn', () => {
    let state = baseState()
    state = withLeaderDon(state, 'player1', 1)
    const mine = withCharacter(state, 'player1', 'OP01-010')
    state = { ...mine.state, currentPlayer: 'player2' }
    expect(getEffectivePower(state, mine.card)).toBe(3000)
  })

  it('stacks with the character own attached DON', () => {
    let state = baseState()
    state = withLeaderDon(state, 'player1', 1)
    const mine = withCharacter(state, 'player1', 'OP01-010', { attachedDon: 1 })
    state = mine.state
    // 3000 base + 1000 own DON + 1000 leader aura
    expect(getEffectivePower(state, mine.card)).toBe(5000)
  })
})

describe('OP01-029 Radical Beam: counter event', () => {
  it('pays its cost, buffs for the battle, and saves the leader', () => {
    let state = baseState()
    state = { ...state, currentPlayer: 'player2' }
    state = withActiveDon(state, 'player1', 1)
    state = withHand(state, 'player1', ['OP01-029'])
    const attacker = withCharacter(state, 'player2', 'OP01-012', { attachedDon: 1 }) // 5000
    state = attacker.state

    state = act(state, {
      type: 'DECLARE_ATTACK',
      attackerId: attacker.card.instanceId,
      targetId: state.players.player1.leader.instanceId,
    })
    state = act(state, { type: 'DECLINE_BLOCK' })

    const options = legalActions(state)
    const eventCard = state.players.player1.hand[0]
    expect(options).toContainEqual({ type: 'PLAY_COUNTER_EVENT', cardInstanceId: eventCard.instanceId })

    state = act(state, { type: 'PLAY_COUNTER_EVENT', cardInstanceId: eventCard.instanceId })
    // Effect asks which of your leader/characters gets +2000
    expect(state.pendingChoice?.playerId).toBe('player1')
    state = act(state, { type: 'CHOOSE', instanceIds: [state.players.player1.leader.instanceId] })
    // At 5 life the "if you have 2 or less Life" rider must NOT fire
    expect(getEffectivePower(state, state.players.player1.leader)).toBe(7000)
    expect(state.players.player1.donArea.every((d) => d.isRested)).toBe(true) // cost paid
    expect(state.players.player1.trash.some((c) => c.cardId === 'OP01-029')).toBe(true)

    const lifeBefore = state.players.player1.lifeCards.length
    state = act(state, { type: 'PASS_COUNTER' })
    expect(state.battle).toBeNull()
    expect(state.players.player1.lifeCards.length).toBe(lifeBefore) // 5000 vs 7000: no damage
    expect(getEffectivePower(state, state.players.player1.leader)).toBe(5000) // battle mod expired
  })
})

describe('OP01-024 Luffy: [Activate: Main] [Once Per Turn]', () => {
  it('gives rested DON and locks out for the turn', () => {
    let state = baseState()
    const luffy = withCharacter(state, 'player1', 'OP01-024')
    state = luffy.state
    // Two rested DON in the cost area to give
    const p = state.players.player1
    state = {
      ...state,
      players: {
        ...state.players,
        player1: {
          ...p,
          donArea: [0, 1].map(() => ({ ...createGameCard('DON', 'player1'), isRested: true })),
        },
      },
    }

    const activate = legalActions(state).find(
      (a) => a.type === 'ACTIVATE_EFFECT' && a.cardInstanceId === luffy.card.instanceId,
    )
    expect(activate).toBeDefined()

    state = act(state, activate!)
    const after = state.players.player1.characters.find((c) => c.instanceId === luffy.card.instanceId)!
    expect(after.attachedDon).toBe(2)
    expect(state.players.player1.donArea).toHaveLength(0)

    // Once per turn: no longer offered
    expect(
      legalActions(state).some(
        (a) => a.type === 'ACTIVATE_EFFECT' && a.cardInstanceId === luffy.card.instanceId,
      ),
    ).toBe(false)
  })
})

describe('OP01-051 Kid: taunt aura', () => {
  it('forces attacks onto the rested Kid on the opponent turn', () => {
    let state = baseState() // player1's turn
    const kid = withCharacter(state, 'player2', 'OP01-051', { isRested: true, attachedDon: 1 })
    state = kid.state
    const bystander = withCharacter(state, 'player2', 'OP01-010', { isRested: true })
    state = bystander.state

    const attacks = legalActions(state).filter((a) => a.type === 'DECLARE_ATTACK')
    expect(attacks.length).toBeGreaterThan(0)
    expect(attacks.every((a) => a.type === 'DECLARE_ATTACK' && a.targetId === kid.card.instanceId)).toBe(true)

    // Without the DON requirement met, the taunt is off
    let free = baseState()
    const kid2 = withCharacter(free, 'player2', 'OP01-051', { isRested: true, attachedDon: 0 })
    free = kid2.state
    const attacks2 = legalActions(free).filter((a) => a.type === 'DECLARE_ATTACK')
    expect(attacks2.some((a) => a.type === 'DECLARE_ATTACK' && a.targetId !== kid2.card.instanceId)).toBe(true)
  })
})

describe('OP01-114 X.Drake: DON!!-1 cost and opponent-chosen discard', () => {
  it('returns the paid DON and hands the discard choice to the opponent', () => {
    let state = baseState()
    state = withHand(state, 'player1', ['OP01-114'])
    state = withActiveDon(state, 'player1', 6)
    const p2 = state.players.player2
    state = {
      ...state,
      players: {
        ...state.players,
        player2: { ...p2, hand: [createGameCard('OP01-010', 'player2'), createGameCard('OP01-012', 'player2')] },
      },
    }
    const donDeckBefore = state.players.player1.donDeck.length

    state = act(state, { type: 'PLAY_CARD', cardInstanceId: state.players.player1.hand[0].instanceId })
    // First choice: the controller may pay DON!!-1 (all-or-nothing)
    expect(state.pendingChoice?.playerId).toBe('player1')
    expect(state.pendingChoice?.exact).toBe(true)
    state = act(state, { type: 'CHOOSE', instanceIds: [state.pendingChoice!.options[0]] })
    expect(state.players.player1.donDeck.length).toBe(donDeckBefore + 1)

    // Second choice: the OPPONENT picks their own discard
    expect(state.pendingChoice?.playerId).toBe('player2')
    expect(whoActs(state)).toBe('player2')
    const discarded = state.pendingChoice!.options[0]
    state = act(state, { type: 'CHOOSE', instanceIds: [discarded] })
    expect(state.players.player2.hand).toHaveLength(1)
    expect(state.players.player2.trash.some((c) => c.instanceId === discarded)).toBe(true)
  })
})

describe('battle-duration modifiers', () => {
  it('expire when the battle ends', () => {
    let state = baseState()
    const attacker = withCharacter(state, 'player1', 'OP01-012')
    state = attacker.state
    const battleMod: Modifier = {
      kind: 'power',
      value: 1000,
      duration: 'battle',
      sourceCardId: 'TEST',
    }
    state = {
      ...state,
      players: {
        ...state.players,
        player2: {
          ...state.players.player2,
          leader: { ...state.players.player2.leader, modifiers: [battleMod] },
        },
      },
    }

    state = act(state, {
      type: 'DECLARE_ATTACK',
      attackerId: attacker.card.instanceId,
      targetId: state.players.player2.leader.instanceId,
    })
    state = act(state, { type: 'DECLINE_BLOCK' })
    state = act(state, { type: 'PASS_COUNTER' })

    expect(state.battle).toBeNull()
    expect(state.players.player2.leader.modifiers).toHaveLength(0)
  })
})
