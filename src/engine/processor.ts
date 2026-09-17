import type { GameState, GameAction, GameResult, GameEvent, PlayerId, BattleState } from './types'
import { getCardById } from '@/data/cardService'
import { validateAction } from './rules'
import { getOpponent, executeEndPhase, autoAdvancePhases, expireModifiers } from './turnManager'
import { performMulligan, acceptHand, isMulliganComplete, startGame } from './gameSetup'
import { resolveDamage } from './battleManager'
import { queueEffects, runStack, applyChoice, pushFrame } from './effects/interpreter'
import { getEffectDefs } from './effects/registry'

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
    case 'CHOOSE_CHARACTER_TO_TRASH':
      newState = processChooseCharacterToTrash(state, actingPlayer, action.cardInstanceId, events)
      break
    case 'CHOOSE':
      newState = checkBattleExit(runStack(applyChoice(state, action.instanceIds), events), events)
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
  let costRemaining = cardData.cost
  for (let i = 0; i < newDonArea.length && costRemaining > 0; i++) {
    if (!newDonArea[i].isRested) {
      newDonArea[i] = { ...newDonArea[i], isRested: true }
      costRemaining--
    }
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

  const timing = cardData.cardType === 'Event' ? 'main' : 'onPlay'
  newState = queueEffects(newState, playedCard, timing, playerId)
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

  return {
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

  // [When Attacking] effects fire in the attack step, before blocks (CR 7-1-1-3)
  const attacker =
    newLeader.instanceId === attackerId
      ? newLeader
      : newCharacters.find((c) => c.instanceId === attackerId)
  if (attacker) {
    newState = runStack(queueEffects(newState, attacker, 'whenAttacking', playerId), events)
  }
  return checkBattleExit(newState, events)
}

/**
 * Exit clause (CR 7-1-1-4): if an attack-step effect removed the target, skip
 * straight to end of battle. Deferred while a choice is pending; re-checked when
 * the stack resumes.
 */
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
  const cleaned = expireModifiers(state, (m) => m.duration === 'battle')
  return { ...cleaned, battle: null }
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
  return checkBattleExit(newState, events)
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
  // PASS_COUNTER proceeds to damage (CR 7-1-3-2: any number of times)
  return {
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
  }
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
  const defIndex = Number(effectId)
  let card = isLeader
    ? player.leader
    : player.characters.find((c) => c.instanceId === cardInstanceId)!
  const def = getEffectDefs(card.cardId)[defIndex]

  // Pay costs: rest DON in the cost area, rest the card itself, mark once-per-turn
  let costRemaining = def.cost?.restDon ?? 0
  const donArea = player.donArea.map((d) => {
    if (costRemaining > 0 && !d.isRested) {
      costRemaining--
      return { ...d, isRested: true }
    }
    return d
  })
  card = {
    ...card,
    isRested: def.cost?.restSelf ? true : card.isRested,
    activatedThisTurn: def.oncePerTurn
      ? [...card.activatedThisTurn, `am${defIndex}`]
      : card.activatedThisTurn,
  }

  const newState: GameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        donArea,
        leader: isLeader ? card : player.leader,
        characters: isLeader
          ? player.characters
          : player.characters.map((c) => (c.instanceId === cardInstanceId ? card : c)),
      },
    },
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

  let costRemaining = data.cost
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
  const counterDefs = getEffectDefs(card.cardId)
  for (let i = counterDefs.length - 1; i >= 0; i--) {
    if (counterDefs[i].timing === 'counter') {
      newState = pushFrame(newState, card, playerId, 'counter', i)
    }
  }
  return checkBattleExit(runStack(newState, events), events)
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
  if (!accept) return newState

  const player = newState.players[playerId]
  const card = player.hand.find((c) => c.instanceId === trigger.cardInstanceId)
  if (!card || getEffectDefs(card.cardId, 'trigger').length === 0) {
    // No automated trigger effect registered: legacy behavior, card stays in hand
    return newState
  }

  // An activated trigger card is trashed after resolving unless the effect moves it
  // (CR 10-1-5-3). It is trashed up front here; 'playSelf' then plays it from trash.
  const hand = player.hand.filter((c) => c.instanceId !== card.instanceId)
  newState = {
    ...newState,
    players: {
      ...newState.players,
      [playerId]: { ...player, hand, trash: [...player.trash, card] },
    },
  }
  newState = queueEffects(newState, card, 'trigger', playerId)
  return runStack(newState, events)
}

function processEndTurn(state: GameState, events: GameEvent[]): GameState {
  events.push({
    type: 'END_TURN',
    playerId: state.currentPlayer,
    description: `${state.currentPlayer} ended their turn`,
  })

  const afterEnd = executeEndPhase(state)
  return autoAdvancePhases(afterEnd)
}

function processChooseCharacterToTrash(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: string,
  events: GameEvent[],
): GameState {
  const player = state.players[playerId]
  const charIndex = player.characters.findIndex((c) => c.instanceId === cardInstanceId)
  const char = player.characters[charIndex]

  const newCharacters = [...player.characters]
  newCharacters.splice(charIndex, 1)

  const cardData = getCardById(char.cardId)
  events.push({
    type: 'TRASH_CHARACTER',
    playerId,
    description: `${playerId} trashed ${cardData?.name ?? 'a character'} (field limit)`,
  })

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        characters: newCharacters,
        trash: [...player.trash, char],
      },
    },
  }
}
