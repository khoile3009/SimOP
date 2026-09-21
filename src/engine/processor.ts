import type { GameState, GameAction, GameResult, GameEvent, PlayerId, BattleState } from './types'
import { getCardById } from '@/data/cardService'
import { validateAction } from './rules'
import { getOpponent, executeEndPhase, autoAdvancePhases } from './turnManager'
import { performMulligan, acceptHand, isMulliganComplete, startGame } from './gameSetup'
import { resolveDamage, dealLifeDamage, endOfBattleCleanup } from './battleManager'
import {
  queueEffects,
  runStack,
  applyChoice,
  pushFrame,
  emitEngineEvent,
  queueEndOfTurnEffects,
  removeFromField,
} from './effects/interpreter'
import { getEffectDefs } from './effects/registry'
import { getEffectiveCost, discountMatches, hasFlag } from './effects/statics'
import { legalActions } from './legalActions'
import { MAX_CHARACTERS } from './constants'

export function processAction(
  state: GameState,
  action: GameAction,
  actingPlayer: PlayerId,
): GameResult {
  const validation = validateAction(state, action, actingPlayer)
  if (!validation.valid) {
    return { state, events: [], error: validation.reason }
  }

  const events: GameEvent[] = []
  let newState: GameState

  switch (action.type) {
    case 'MULLIGAN':
      newState = processMulligan(state, actingPlayer, action.accept, events)
      break
    case 'PLAY_CARD':
      newState = processPlayCard(state, actingPlayer, action.cardInstanceId, events)
      break
    case 'ATTACH_DON':
      newState = processAttachDon(state, actingPlayer, action.count, action.targetCardId, events)
      break
    case 'DECLARE_ATTACK':
      newState = processDeclareAttack(state, actingPlayer, action.attackerId, action.targetId, events)
      break
    case 'ACTIVATE_BLOCKER':
      newState = processActivateBlocker(state, actingPlayer, action.blockerId, events)
      break
    case 'DECLINE_BLOCK':
      newState = processDeclineBlock(state, events)
      break
    case 'USE_COUNTER':
      newState = processUseCounter(state, actingPlayer, action.cardInstanceIds, events)
      break
    case 'PASS_COUNTER':
      newState = processPassCounter(state, events)
      break
    case 'ACTIVATE_TRIGGER':
      newState = processActivateTrigger(state, actingPlayer, action.accept, events)
      break
    case 'ADVANCE_PHASE':
    case 'END_TURN':
      newState = processEndTurn(state, events)
      break
    case 'CHOOSE':
      newState = maybeFinishEndTurn(
        settleDamage(
          autoAdvanceBattle(
            checkBattleExit(runStack(applyChoice(state, action.instanceIds), events), events),
            events,
          ),
          events,
        ),
      )
      break
    case 'ACTIVATE_EFFECT':
      newState = processActivateEffect(state, actingPlayer, action.cardInstanceId, action.effectId, events)
      break
    case 'PLAY_COUNTER_EVENT':
      newState = processPlayCounterEvent(state, actingPlayer, action.cardInstanceId, events)
      break
    default:
      return { state, events: [], error: 'Unhandled action type' }
  }

  // Record action in history
  newState = {
    ...newState,
    actionHistory: [...newState.actionHistory, action],
  }

  return { state: newState, events }
}

function processMulligan(
  state: GameState,
  playerId: PlayerId,
  accept: boolean,
  events: GameEvent[],
): GameState {
  let newState: GameState
  if (accept) {
    newState = acceptHand(state, playerId)
    events.push({ type: 'MULLIGAN', playerId, description: `${playerId} kept their hand` })
  } else {
    newState = performMulligan(state, playerId)
    events.push({ type: 'MULLIGAN', playerId, description: `${playerId} mulliganed` })
  }

  // If both players have decided, start the game
  if (isMulliganComplete(newState)) {
    newState = startGame(newState)
    newState = autoAdvancePhases(newState)
    events.push({ type: 'GAME_START', playerId: newState.currentPlayer, description: 'Game started' })
  }

  return newState
}

function processPlayCard(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: string,
  events: GameEvent[],
): GameState {
  const player = state.players[playerId]
  const cardIndex = player.hand.findIndex((c) => c.instanceId === cardInstanceId)
  const card = player.hand[cardIndex]
  const cardData = getCardById(card.cardId)!

  // Pay DON cost: rest active DON
  const newDonArea = [...player.donArea]
  let costRemaining = getEffectiveCost(state, playerId, card)
  for (let i = 0; i < newDonArea.length && costRemaining > 0; i++) {
    if (!newDonArea[i].isRested) {
      newDonArea[i] = { ...newDonArea[i], isRested: true }
      costRemaining--
    }
  }
  // One-shot play discounts that priced this card are used up
  const remainingDiscounts = (state.playDiscounts[playerId] ?? []).filter(
    (d) => !discountMatches(card, d),
  )
  const playDiscounts = { ...state.playDiscounts, [playerId]: remainingDiscounts }

  // Playing a 6th character: an existing one is trashed first (rule processing,
  // CR 3-7-6-1), then the staged card is played - handled by the '$boardFull'
  // pseudo-def so the trash choice flows through the normal decision machinery
  if (cardData.cardType === 'Character' && player.characters.length >= MAX_CHARACTERS) {
    events.push({
      type: 'BOARD_FULL',
      playerId,
      description: `${playerId} must trash a Character to play ${cardData.name}`,
    })
    let staged: GameState = {
      ...state,
      playDiscounts,
      players: { ...state.players, [playerId]: { ...player, donArea: newDonArea } },
    }
    staged = pushFrame(staged, card, playerId, 'main', 0, '$boardFull')
    return runStack(staged, events)
  }

  // Remove card from hand
  const newHand = [...player.hand]
  newHand.splice(cardIndex, 1)

  // Place card on field
  const playedCard = { ...card, turnPlayed: state.turnNumber }
  let newCharacters = player.characters
  let newStage = player.stage
  let newTrash = player.trash

  if (cardData.cardType === 'Character') {
    newCharacters = [...player.characters, playedCard]
  } else if (cardData.cardType === 'Stage') {
    // Replace existing stage (send old one to trash)
    if (player.stage) {
      newTrash = [...player.trash, player.stage]
    }
    newStage = playedCard
  } else if (cardData.cardType === 'Event') {
    // Events go to trash after resolving
    newTrash = [...player.trash, playedCard]
  }

  events.push({
    type: 'PLAY_CARD',
    playerId,
    description: `${playerId} played ${cardData.name}`,
  })

  let newState: GameState = {
    ...state,
    playDiscounts,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        hand: newHand,
        characters: newCharacters,
        donArea: newDonArea,
        stage: newStage,
        trash: newTrash,
      },
    },
  }

  if (cardData.cardType === 'Character') {
    newState = emitEngineEvent(newState, {
      kind: 'characterPlayed',
      player: playerId,
      cardId: playedCard.cardId,
      fromHand: true,
    })
  }
  if (cardData.cardType === 'Event') {
    // Listeners queue first so the event's own frames land on top and resolve first
    newState = emitEngineEvent(newState, { kind: 'eventActivated', player: playerId })
    newState = queueEffects(newState, playedCard, 'main', playerId)
  } else {
    newState = queueEffects(newState, playedCard, 'onPlay', playerId)
  }
  return runStack(newState, events)
}

function processAttachDon(
  state: GameState,
  playerId: PlayerId,
  count: number,
  targetCardId: string,
  events: GameEvent[],
): GameState {
  const player = state.players[playerId]

  // Giving DON moves the card out of the cost area to sit under the target
  // (tracked as a count); the End Phase returns that many to the cost area.
  // Resting them in place instead would duplicate DON on return.
  const newDonArea = [...player.donArea]
  let attached = 0
  for (let i = newDonArea.length - 1; i >= 0 && attached < count; i--) {
    if (!newDonArea[i].isRested) {
      newDonArea.splice(i, 1)
      attached++
    }
  }

  // Add to target's attachedDon count
  let newLeader = player.leader
  let newCharacters = player.characters

  if (player.leader.instanceId === targetCardId) {
    newLeader = { ...player.leader, attachedDon: player.leader.attachedDon + count }
  } else {
    newCharacters = player.characters.map((c) =>
      c.instanceId === targetCardId ? { ...c, attachedDon: c.attachedDon + count } : c,
    )
  }

  events.push({
    type: 'ATTACH_DON',
    playerId,
    description: `${playerId} attached ${count} DON`,
  })

  const afterAttach: GameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        donArea: newDonArea,
        leader: newLeader,
        characters: newCharacters,
      },
    },
  }
  return runStack(emitEngineEvent(afterAttach, { kind: 'donAttached', player: playerId }), events)
}

function processDeclareAttack(
  state: GameState,
  playerId: PlayerId,
  attackerId: string,
  targetId: string,
  events: GameEvent[],
): GameState {
  const player = state.players[playerId]
  const opponentId = getOpponent(playerId)

  // Rest the attacker
  let newLeader = player.leader
  let newCharacters = player.characters

  if (player.leader.instanceId === attackerId) {
    newLeader = { ...player.leader, isRested: true }
  } else {
    newCharacters = player.characters.map((c) =>
      c.instanceId === attackerId ? { ...c, isRested: true } : c,
    )
  }

  const battle: BattleState = {
    attackerId,
    attackerPlayer: playerId,
    originalTargetId: targetId,
    currentTargetId: targetId,
    defenderPlayer: opponentId,
    step: 'BLOCK',
    counterCardsUsed: [],
    attackerPowerBonus: 0,
    defenderPowerBonus: 0,
  }

  events.push({
    type: 'DECLARE_ATTACK',
    playerId,
    description: `${playerId} declared attack`,
  })

  let newState: GameState = {
    ...state,
    battle,
    players: {
      ...state.players,
      [playerId]: { ...player, leader: newLeader, characters: newCharacters },
    },
  }

  // "When attacked" listeners on the target queue first, so the attacker's
  // [When Attacking] effects (queued after, stack top) resolve first
  newState = emitEngineEvent(newState, {
    kind: 'attacked',
    player: opponentId,
    sourceInstanceId: targetId,
  })
  // [When Attacking] effects fire in the attack step, before blocks (CR 7-1-1-3)
  const attacker =
    newLeader.instanceId === attackerId
      ? newLeader
      : newCharacters.find((c) => c.instanceId === attackerId)
  if (attacker) {
    newState = queueEffects(newState, attacker, 'whenAttacking', playerId)
  }
  newState = runStack(newState, events)
  return autoAdvanceBattle(checkBattleExit(newState, events), events)
}

/**
 * Exit clause (CR 7-1-1-4): if an attack-step effect removed the target, skip
 * straight to end of battle. Deferred while a choice is pending; re-checked when
 * the stack resumes.
 */
/**
 * Skip battle steps where the defender has literally nothing to decide - a
 * block step with no legal blocker, a counter step with no counters or
 * affordable events. The fleet measured 91% / 68% of these prompts as empty;
 * auto-advancing them removes dead clicks for humans and dead nodes for bots.
 */
function autoAdvanceBattle(state: GameState, events: GameEvent[]): GameState {
  let s = state
  let guard = 10
  while (guard-- > 0 && s.battle && !s.pendingChoice && !s.pendingTrigger && !s.winner) {
    const options = legalActions(s)
    if (s.battle.step === 'BLOCK' && options.length === 1 && options[0].type === 'DECLINE_BLOCK') {
      s = { ...s, battle: { ...s.battle, step: 'COUNTER' } }
      continue
    }
    if (s.battle.step === 'COUNTER' && options.length === 1 && options[0].type === 'PASS_COUNTER') {
      const result = resolveDamage({ ...s, battle: { ...s.battle, step: 'DAMAGE' } })
      events.push(...result.events)
      s = settleDamage(runStack(result.state, events), events)
      continue
    }
    break
  }
  return s
}

function checkBattleExit(state: GameState, events: GameEvent[]): GameState {
  const battle = state.battle
  if (!battle || state.pendingChoice) return state
  const defender = state.players[battle.defenderPlayer]
  const targetPresent =
    defender.leader.instanceId === battle.currentTargetId ||
    defender.characters.some((c) => c.instanceId === battle.currentTargetId)
  const attackerSide = state.players[battle.attackerPlayer]
  const attackerPresent =
    attackerSide.leader.instanceId === battle.attackerId ||
    attackerSide.characters.some((c) => c.instanceId === battle.attackerId)
  if (targetPresent && attackerPresent) return state
  events.push({
    type: 'BATTLE_ENDED',
    playerId: battle.attackerPlayer,
    description: 'Battle ended: attacker or target left the field',
  })
  return endOfBattleCleanup(state, battle.attackerId, events)
}

function processActivateBlocker(
  state: GameState,
  playerId: PlayerId,
  blockerId: string,
  events: GameEvent[],
): GameState {
  const battle = state.battle!
  const player = state.players[playerId]

  // Rest the blocker
  const newCharacters = player.characters.map((c) =>
    c.instanceId === blockerId ? { ...c, isRested: true } : c,
  )

  events.push({
    type: 'ACTIVATE_BLOCKER',
    playerId,
    description: `${playerId} activated blocker`,
  })

  let newState: GameState = {
    ...state,
    battle: { ...battle, currentTargetId: blockerId, step: 'COUNTER' },
    players: {
      ...state.players,
      [playerId]: { ...player, characters: newCharacters },
    },
  }

  // [On Block] effects fire when the blocker is activated (CR 7-1-2-2)
  const blocker = newState.players[playerId].characters.find((c) => c.instanceId === blockerId)
  if (blocker) {
    newState = runStack(queueEffects(newState, blocker, 'onBlock', playerId), events)
  }
  return autoAdvanceBattle(checkBattleExit(newState, events), events)
}

function processDeclineBlock(state: GameState, events: GameEvent[]): GameState {
  events.push({
    type: 'DECLINE_BLOCK',
    playerId: state.battle!.defenderPlayer,
    description: 'Block declined',
  })

  return {
    ...state,
    battle: { ...state.battle!, step: 'COUNTER' },
  }
}

function processUseCounter(
  state: GameState,
  playerId: PlayerId,
  cardInstanceIds: string[],
  events: GameEvent[],
): GameState {
  const player = state.players[playerId]
  const battle = state.battle!

  let totalCounterPower = 0
  const newHand = [...player.hand]
  const newTrash = [...player.trash]

  for (const id of cardInstanceIds) {
    const idx = newHand.findIndex((c) => c.instanceId === id)
    if (idx >= 0) {
      const card = newHand[idx]
      const cardData = getCardById(card.cardId)
      totalCounterPower += cardData?.counter ?? 0
      newTrash.push(newHand[idx])
      newHand.splice(idx, 1)
    }
  }

  events.push({
    type: 'USE_COUNTER',
    playerId,
    description: `${playerId} used counter (+${totalCounterPower})`,
  })

  // The defender stays in the counter step and may keep countering; only
  // PASS_COUNTER proceeds to damage (CR 7-1-3-2: any number of times). If
  // nothing more can be played, damage resolves automatically.
  return autoAdvanceBattle(
    {
      ...state,
      battle: {
        ...battle,
        defenderPowerBonus: battle.defenderPowerBonus + totalCounterPower,
        counterCardsUsed: [...battle.counterCardsUsed, ...cardInstanceIds],
      },
      players: {
        ...state.players,
        [playerId]: { ...player, hand: newHand, trash: newTrash },
      },
    },
    events,
  )
}

function processActivateEffect(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: string,
  effectId: string,
  events: GameEvent[],
): GameState {
  const player = state.players[playerId]
  const isLeader = player.leader.instanceId === cardInstanceId
  const isStage = player.stage?.instanceId === cardInstanceId
  const defIndex = Number(effectId)
  let card = isLeader
    ? player.leader
    : isStage
      ? player.stage!
      : player.characters.find((c) => c.instanceId === cardInstanceId)!
  const def = getEffectDefs(card.cardId)[defIndex]

  // Pay costs: rest DON in the cost area, return DON!!-X to the DON deck
  // (rested first), rest the card itself, mark once-per-turn
  let costRemaining = def.cost?.restDon ?? 0
  let donArea = player.donArea.map((d) => {
    if (costRemaining > 0 && !d.isRested) {
      costRemaining--
      return { ...d, isRested: true }
    }
    return d
  })
  let donDeck = player.donDeck
  const returnCost = def.cost?.returnDon ?? 0
  if (returnCost > 0) {
    const sorted = [...donArea].sort((a, b) => Number(b.isRested) - Number(a.isRested))
    const returned = new Set(sorted.slice(0, returnCost).map((d) => d.instanceId))
    donDeck = [...donDeck, ...donArea.filter((d) => returned.has(d.instanceId)).map((d) => ({ ...d, isRested: false }))]
    donArea = donArea.filter((d) => !returned.has(d.instanceId))
  }
  card = {
    ...card,
    isRested: def.cost?.restSelf ? true : card.isRested,
    activatedThisTurn: def.oncePerTurn
      ? [...card.activatedThisTurn, `am${defIndex}`]
      : card.activatedThisTurn,
  }

  let newState: GameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        donArea,
        donDeck,
        leader: isLeader ? card : player.leader,
        stage: isStage ? card : player.stage,
        characters:
          isLeader || isStage
            ? player.characters
            : player.characters.map((c) => (c.instanceId === cardInstanceId ? card : c)),
      },
    },
  }
  if (returnCost > 0) {
    newState = emitEngineEvent(newState, { kind: 'donReturned', player: playerId })
  }

  events.push({
    type: 'ACTIVATE_EFFECT',
    playerId,
    description: `${playerId} activated ${getCardById(card.cardId)?.name ?? 'a card'}'s ability`,
  })
  return runStack(pushFrame(newState, card, playerId, 'activateMain', defIndex), events)
}

function processPlayCounterEvent(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: string,
  events: GameEvent[],
): GameState {
  const player = state.players[playerId]
  const idx = player.hand.findIndex((c) => c.instanceId === cardInstanceId)
  const card = player.hand[idx]
  const data = getCardById(card.cardId)!

  let costRemaining = getEffectiveCost(state, playerId, card)
  const donArea = player.donArea.map((d) => {
    if (costRemaining > 0 && !d.isRested) {
      costRemaining--
      return { ...d, isRested: true }
    }
    return d
  })
  const hand = [...player.hand]
  hand.splice(idx, 1)

  let newState: GameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: { ...player, hand, donArea, trash: [...player.trash, card] },
    },
  }
  events.push({
    type: 'PLAY_COUNTER_EVENT',
    playerId,
    description: `${playerId} played ${data.name}`,
  })
  newState = emitEngineEvent(newState, { kind: 'eventActivated', player: playerId })
  const counterDefs = getEffectDefs(card.cardId)
  for (let i = counterDefs.length - 1; i >= 0; i--) {
    if (counterDefs[i].timing === 'counter') {
      newState = pushFrame(newState, card, playerId, 'counter', i)
    }
  }
  return autoAdvanceBattle(checkBattleExit(runStack(newState, events), events), events)
}

function processPassCounter(state: GameState, events: GameEvent[]): GameState {
  events.push({
    type: 'PASS_COUNTER',
    playerId: state.battle!.defenderPlayer,
    description: 'Counter passed',
  })

  const afterPass: GameState = {
    ...state,
    battle: { ...state.battle!, step: 'DAMAGE' },
  }

  const result = resolveDamage(afterPass)
  events.push(...result.events)
  return runStack(result.state, events)
}

function processActivateTrigger(
  state: GameState,
  playerId: PlayerId,
  accept: boolean,
  events: GameEvent[],
): GameState {
  const trigger = state.pendingTrigger!
  events.push({
    type: 'ACTIVATE_TRIGGER',
    playerId,
    description: accept ? 'Trigger activated' : 'Trigger declined',
  })

  let newState: GameState = { ...state, pendingTrigger: null }

  if (accept) {
    const player = newState.players[playerId]
    const card = player.hand.find((c) => c.instanceId === trigger.cardInstanceId)
    if (card && getEffectDefs(card.cardId, 'trigger').length === 0) {
      // Legacy stay-in-hand trigger: activating revealed it to both players
      newState = {
        ...newState,
        players: {
          ...newState.players,
          [playerId]: {
            ...player,
            hand: player.hand.map((c) =>
              c.instanceId === card.instanceId ? { ...c, revealed: true } : c,
            ),
          },
        },
      }
    }
    if (card && getEffectDefs(card.cardId, 'trigger').length > 0) {
      // An activated trigger card is trashed after resolving unless the effect
      // moves it (CR 10-1-5-3). It is trashed up front; 'playSelf' plays it
      // from the trash.
      const hand = player.hand.filter((c) => c.instanceId !== card.instanceId)
      newState = {
        ...newState,
        players: {
          ...newState.players,
          [playerId]: { ...player, hand, trash: [...player.trash, card] },
        },
      }
      newState = runStack(queueEffects(newState, card, 'trigger', playerId), events)
    }
  }

  return settleDamage(newState, events)
}

/**
 * Resume damage that a [Trigger] suspended (CR 8-6-2-1) once nothing else is
 * pending. The resumed damage can itself pend a new trigger or choice, so this
 * runs as a loop and is safe to call after any resolution step.
 */
function settleDamage(state: GameState, events: GameEvent[]): GameState {
  let s = state
  let guard = 10
  while (
    guard-- > 0 &&
    s.pendingDamage &&
    !s.winner &&
    !s.pendingChoice &&
    !s.pendingTrigger &&
    s.stack.length === 0
  ) {
    const pd = s.pendingDamage
    s = { ...s, pendingDamage: null }
    s = runStack(dealLifeDamage(s, pd.playerId, pd.count, pd.banish, events, pd.sourceId), events)
  }
  return s
}

function processEndTurn(state: GameState, events: GameEvent[]): GameState {
  events.push({
    type: 'END_TURN',
    playerId: state.currentPlayer,
    description: `${state.currentPlayer} ended their turn`,
  })

  // [End of Your Turn] auto effects resolve before the turn switches; a choice
  // inside one pauses here, and the CHOOSE handler completes the switch
  const withEffects = runStack(queueEndOfTurnEffects({ ...state, pendingEndTurn: true }), events)
  return maybeFinishEndTurn(withEffects)
}

/** Complete a pending turn switch once nothing is left to resolve. */
function maybeFinishEndTurn(state: GameState): GameState {
  if (
    !state.pendingEndTurn ||
    state.stack.length > 0 ||
    state.pendingChoice ||
    state.pendingTrigger ||
    state.winner
  ) {
    return state
  }
  // Scheduled end-of-turn trashes (Thatch) happen before turn modifiers sweep
  let swept = state
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    for (const c of [...swept.players[pid].characters]) {
      if (hasFlag(swept, c, 'trashAtTurnEnd')) {
        swept = removeFromField(swept, c.instanceId, 'trash')
      }
    }
  }
  // "During this turn" player restrictions and unused play discounts expire now
  const cleared: GameState = {
    ...swept,
    pendingEndTurn: false,
    turnFlags: { player1: [], player2: [] },
    playDiscounts: { player1: [], player2: [] },
  }
  return autoAdvancePhases(executeEndPhase(cleared))
}

