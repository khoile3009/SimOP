import type { GameState, GameAction, GameResult, GameEvent, PlayerId, BattleState } from './types'
import { getCardById } from '@/data/cardService'
import { validateAction } from './rules'
import { getOpponent, executeEndPhase, autoAdvancePhases } from './turnManager'
import { performMulligan, acceptHand, isMulliganComplete, startGame } from './gameSetup'
import { resolveDamage } from './battleManager'

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

  return {
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
}

function processAttachDon(
  state: GameState,
  playerId: PlayerId,
  count: number,
  targetCardId: string,
  events: GameEvent[],
): GameState {
  const player = state.players[playerId]

  // Rest DON from cost area
  const newDonArea = [...player.donArea]
  let attached = 0
  for (let i = 0; i < newDonArea.length && attached < count; i++) {
    if (!newDonArea[i].isRested) {
      newDonArea[i] = { ...newDonArea[i], isRested: true }
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

  return {
    ...state,
    battle,
    players: {
      ...state.players,
      [playerId]: { ...player, leader: newLeader, characters: newCharacters },
    },
  }
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

  return {
    ...state,
    battle: { ...battle, currentTargetId: blockerId, step: 'COUNTER' },
    players: {
      ...state.players,
      [playerId]: { ...player, characters: newCharacters },
    },
  }
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

  // Move to damage step and resolve
  const afterCounter: GameState = {
    ...state,
    battle: {
      ...battle,
      defenderPowerBonus: battle.defenderPowerBonus + totalCounterPower,
      counterCardsUsed: [...battle.counterCardsUsed, ...cardInstanceIds],
      step: 'DAMAGE',
    },
    players: {
      ...state.players,
      [playerId]: { ...player, hand: newHand, trash: newTrash },
    },
  }

  const result = resolveDamage(afterCounter)
  events.push(...result.events)
  return result.state
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
  return result.state
}

function processActivateTrigger(
  state: GameState,
  playerId: PlayerId,
  accept: boolean,
  events: GameEvent[],
): GameState {
  // For now, just clear the trigger. Full effect system comes in Phase 5.
  events.push({
    type: 'ACTIVATE_TRIGGER',
    playerId,
    description: accept ? 'Trigger activated' : 'Trigger declined',
  })

  return {
    ...state,
    pendingTrigger: null,
  }
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
