import type { GameState, GameAction, PlayerId } from './types'
import { MAX_CHARACTERS } from './constants'
import { getCardById } from '@/data/cardService'
import { getOpponent } from './turnManager'
import { hasKeyword } from './keywords'
import { getEffectDefs } from './effects/registry'
import { evalCond, getFlag, hasFlag } from './effects/statics'
import { getEffectivePower } from './powerCalc'

export interface ValidationResult {
  valid: boolean
  reason?: string
}

export function validateAction(
  state: GameState,
  action: GameAction,
  actingPlayer: PlayerId,
): ValidationResult {
  // Can't act if game is over
  if (state.winner) return { valid: false, reason: 'Game is over' }

  // A pending effect choice blocks every other action until resolved
  if (state.pendingChoice) {
    if (action.type !== 'CHOOSE') {
      return { valid: false, reason: 'An effect choice is pending' }
    }
    return validateChoose(state, action.instanceIds, actingPlayer)
  }
  if (action.type === 'CHOOSE') {
    return { valid: false, reason: 'No pending choice' }
  }

  switch (action.type) {
    case 'MULLIGAN':
      return validateMulligan(state, actingPlayer)
    case 'PLAY_CARD':
      return validatePlayCard(state, actingPlayer, action.cardInstanceId)
    case 'ATTACH_DON':
      return validateAttachDon(state, actingPlayer, action.count, action.targetCardId)
    case 'DECLARE_ATTACK':
      return validateDeclareAttack(state, actingPlayer, action.attackerId, action.targetId)
    case 'ACTIVATE_BLOCKER':
      return validateActivateBlocker(state, actingPlayer, action.blockerId)
    case 'DECLINE_BLOCK':
      return validateDeclineBlock(state, actingPlayer)
    case 'USE_COUNTER':
      return validateUseCounter(state, actingPlayer, action.cardInstanceIds)
    case 'PASS_COUNTER':
      return validatePassCounter(state, actingPlayer)
    case 'ACTIVATE_TRIGGER':
      return validateActivateTrigger(state, actingPlayer)
    case 'ADVANCE_PHASE':
      return validateAdvancePhase(state, actingPlayer)
    case 'END_TURN':
      return validateEndTurn(state, actingPlayer)
    case 'ACTIVATE_EFFECT':
      return validateActivateEffect(state, actingPlayer, action.cardInstanceId, action.effectId)
    case 'PLAY_COUNTER_EVENT':
      return validatePlayCounterEvent(state, actingPlayer, action.cardInstanceId)
    default:
      return { valid: false, reason: 'Unknown action type' }
  }
}

function validateMulligan(state: GameState, playerId: PlayerId): ValidationResult {
  if (state.phase !== 'SETUP') return { valid: false, reason: 'Not in setup phase' }
  if (state.mulliganState[playerId] !== 'pending') {
    return { valid: false, reason: 'Already made mulligan decision' }
  }
  return { valid: true }
}

function validatePlayCard(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: string,
): ValidationResult {
  if (state.phase !== 'MAIN') return { valid: false, reason: 'Can only play cards in Main Phase' }
  if (state.currentPlayer !== playerId) return { valid: false, reason: 'Not your turn' }
  if (state.battle) return { valid: false, reason: 'Cannot play cards during battle' }

  const player = state.players[playerId]
  const card = player.hand.find((c) => c.instanceId === cardInstanceId)
  if (!card) return { valid: false, reason: 'Card not in hand' }

  const cardData = getCardById(card.cardId)
  if (!cardData) return { valid: false, reason: 'Card data not found' }
  if (cardData.cardType === 'Leader') return { valid: false, reason: 'Cannot play Leader cards' }

  // Check DON cost
  const activeDon = player.donArea.filter((d) => !d.isRested).length
  if (activeDon < cardData.cost) {
    return { valid: false, reason: `Need ${cardData.cost} active DON (have ${activeDon})` }
  }

  // Check field limit for Characters
  if (cardData.cardType === 'Character' && player.characters.length >= MAX_CHARACTERS) {
    // Can still play but must trash one (handled separately)
    return { valid: true }
  }

  return { valid: true }
}

function validateAttachDon(
  state: GameState,
  playerId: PlayerId,
  count: number,
  targetCardId: string,
): ValidationResult {
  if (state.phase !== 'MAIN') return { valid: false, reason: 'Can only attach DON in Main Phase' }
  if (state.currentPlayer !== playerId) return { valid: false, reason: 'Not your turn' }
  if (state.battle) return { valid: false, reason: 'Cannot attach DON during battle' }
  if (count < 1) return { valid: false, reason: 'Must attach at least 1 DON' }

  const player = state.players[playerId]
  const activeDon = player.donArea.filter((d) => !d.isRested).length
  if (activeDon < count) {
    return { valid: false, reason: `Not enough active DON (have ${activeDon}, need ${count})` }
  }

  // Target must be leader or a character on field
  const isLeader = player.leader.instanceId === targetCardId
  const isCharacter = player.characters.some((c) => c.instanceId === targetCardId)
  if (!isLeader && !isCharacter) {
    return { valid: false, reason: 'Target must be your Leader or a Character on field' }
  }

  return { valid: true }
}

function validateDeclareAttack(
  state: GameState,
  playerId: PlayerId,
  attackerId: string,
  targetId: string,
): ValidationResult {
  if (state.phase !== 'MAIN') return { valid: false, reason: 'Can only attack in Main Phase' }
  if (state.currentPlayer !== playerId) return { valid: false, reason: 'Not your turn' }
  if (state.battle) return { valid: false, reason: 'Already in battle' }

  // First turn: no attacks
  if (state.turnNumber <= 2) {
    // Both players' first turns (turn 1 and turn 2)
    const isFirstTurn =
      (state.turnNumber === 1) ||
      (state.turnNumber === 2)
    if (isFirstTurn) {
      return { valid: false, reason: 'Cannot attack on first turn' }
    }
  }

  const player = state.players[playerId]

  // Find attacker
  const isLeaderAttacker = player.leader.instanceId === attackerId
  const attackerChar = player.characters.find((c) => c.instanceId === attackerId)
  const attacker = isLeaderAttacker ? player.leader : attackerChar

  if (!attacker) return { valid: false, reason: 'Attacker not found' }
  if (attacker.isRested) return { valid: false, reason: 'Attacker is rested' }

  // Characters can't attack the turn they're played (unless Rush)
  if (attackerChar && attackerChar.turnPlayed === state.turnNumber) {
    if (!hasKeyword(state, attackerChar, 'Rush')) {
      return { valid: false, reason: 'Character cannot attack the turn it was played' }
    }
  }

  if (hasFlag(state, attacker, 'cannotAttack')) {
    return { valid: false, reason: 'This card cannot attack' }
  }

  // Find target
  const opponentId = getOpponent(playerId)
  const opponent = state.players[opponentId]
  const isLeaderTarget = opponent.leader.instanceId === targetId
  const targetChar = opponent.characters.find((c) => c.instanceId === targetId)

  if (!isLeaderTarget && !targetChar) return { valid: false, reason: 'Invalid target' }

  // Taunt (e.g. rested Kid): every attack must target the taunting character
  const taunters = opponent.characters.filter((c) => hasFlag(state, c, 'taunt'))
  if (taunters.length > 0 && !taunters.some((t) => t.instanceId === targetId)) {
    return { valid: false, reason: 'Must attack the taunting Character' }
  }

  // Can only attack rested characters (or leader who is always valid)
  if (targetChar && !targetChar.isRested) {
    if (!hasFlag(state, attacker, 'canAttackActive')) {
      return { valid: false, reason: 'Can only attack rested Characters' }
    }
  }

  return { valid: true }
}

function validateActivateBlocker(
  state: GameState,
  playerId: PlayerId,
  blockerId: string,
): ValidationResult {
  if (!state.battle) return { valid: false, reason: 'Not in battle' }
  if (state.battle.step !== 'BLOCK') return { valid: false, reason: 'Not in block step' }
  if (state.battle.defenderPlayer !== playerId) return { valid: false, reason: 'Not the defender' }

  const player = state.players[playerId]
  const blocker = player.characters.find((c) => c.instanceId === blockerId)

  if (!blocker) return { valid: false, reason: 'Blocker not found' }
  if (blocker.isRested) return { valid: false, reason: 'Blocker is already rested' }
  if (blocker.instanceId === state.battle.currentTargetId) {
    return { valid: false, reason: 'Cannot block with the current target' }
  }

  if (!hasKeyword(state, blocker, 'Blocker')) {
    return { valid: false, reason: 'Character does not have Blocker' }
  }

  // Blocker locks on the attacker (e.g. Shanks: blockers at or below a power threshold)
  const attackerSide = state.players[state.battle.attackerPlayer]
  const attacker =
    attackerSide.leader.instanceId === state.battle.attackerId
      ? attackerSide.leader
      : attackerSide.characters.find((c) => c.instanceId === state.battle!.attackerId)
  if (attacker) {
    const lock = getFlag(state, attacker, 'noBlockPowerAtMost')
    if (lock.present && getEffectivePower(state, blocker) <= lock.value) {
      return { valid: false, reason: 'This Character cannot block this attack' }
    }
  }

  return { valid: true }
}

function validateDeclineBlock(state: GameState, playerId: PlayerId): ValidationResult {
  if (!state.battle) return { valid: false, reason: 'Not in battle' }
  if (state.battle.step !== 'BLOCK') return { valid: false, reason: 'Not in block step' }
  if (state.battle.defenderPlayer !== playerId) return { valid: false, reason: 'Not the defender' }
  return { valid: true }
}

function validateUseCounter(
  state: GameState,
  playerId: PlayerId,
  cardInstanceIds: string[],
): ValidationResult {
  if (!state.battle) return { valid: false, reason: 'Not in battle' }
  if (state.battle.step !== 'COUNTER') return { valid: false, reason: 'Not in counter step' }
  if (state.battle.defenderPlayer !== playerId) return { valid: false, reason: 'Not the defender' }

  const player = state.players[playerId]
  for (const id of cardInstanceIds) {
    const card = player.hand.find((c) => c.instanceId === id)
    if (!card) return { valid: false, reason: 'Counter card not in hand' }
    const cardData = getCardById(card.cardId)
    if (!cardData) return { valid: false, reason: 'Card data not found' }
    // Counter VALUES only; [Counter] events go through PLAY_COUNTER_EVENT (and pay cost)
    if (cardData.counter === null || cardData.counter <= 0) {
      return { valid: false, reason: `${cardData.name} has no counter value` }
    }
  }

  return { valid: true }
}

function validatePassCounter(state: GameState, playerId: PlayerId): ValidationResult {
  if (!state.battle) return { valid: false, reason: 'Not in battle' }
  if (state.battle.step !== 'COUNTER') return { valid: false, reason: 'Not in counter step' }
  if (state.battle.defenderPlayer !== playerId) return { valid: false, reason: 'Not the defender' }
  return { valid: true }
}

function validateActivateTrigger(state: GameState, playerId: PlayerId): ValidationResult {
  if (!state.pendingTrigger) return { valid: false, reason: 'No pending trigger' }
  if (state.pendingTrigger.playerId !== playerId) {
    return { valid: false, reason: 'Not your trigger' }
  }
  return { valid: true }
}

function validateAdvancePhase(state: GameState, playerId: PlayerId): ValidationResult {
  if (state.currentPlayer !== playerId) return { valid: false, reason: 'Not your turn' }
  if (state.phase !== 'MAIN') return { valid: false, reason: 'Can only advance from Main Phase' }
  if (state.battle) return { valid: false, reason: 'Cannot advance during battle' }
  return { valid: true }
}

function validateEndTurn(state: GameState, playerId: PlayerId): ValidationResult {
  if (state.currentPlayer !== playerId) return { valid: false, reason: 'Not your turn' }
  if (state.phase !== 'MAIN') return { valid: false, reason: 'Can only end turn from Main Phase' }
  if (state.battle) return { valid: false, reason: 'Cannot end turn during battle' }
  return { valid: true }
}

function validateChoose(
  state: GameState,
  instanceIds: string[],
  playerId: PlayerId,
): ValidationResult {
  const choice = state.pendingChoice!
  if (choice.playerId !== playerId) return { valid: false, reason: 'Not your choice' }
  if (instanceIds.length < choice.min || instanceIds.length > choice.max) {
    return { valid: false, reason: `Must choose between ${choice.min} and ${choice.max}` }
  }
  if (choice.exact && instanceIds.length !== choice.min && instanceIds.length !== choice.max) {
    return { valid: false, reason: `Must choose exactly ${choice.min} or ${choice.max}` }
  }
  const unique = new Set(instanceIds)
  if (unique.size !== instanceIds.length) return { valid: false, reason: 'Duplicate targets' }
  for (const id of instanceIds) {
    if (!choice.options.includes(id)) return { valid: false, reason: 'Not a valid option' }
  }
  return { valid: true }
}

function validateActivateEffect(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: string,
  effectId: string,
): ValidationResult {
  if (state.phase !== 'MAIN') return { valid: false, reason: 'Main Phase only' }
  if (state.currentPlayer !== playerId) return { valid: false, reason: 'Not your turn' }
  if (state.battle) return { valid: false, reason: 'Cannot activate during battle' }

  const player = state.players[playerId]
  const card =
    player.leader.instanceId === cardInstanceId
      ? player.leader
      : player.characters.find((c) => c.instanceId === cardInstanceId)
  if (!card) return { valid: false, reason: 'Card not on your field' }

  const defIndex = Number(effectId)
  const def = getEffectDefs(card.cardId)[defIndex]
  if (!def || def.timing !== 'activateMain') {
    return { valid: false, reason: 'No such activated ability' }
  }
  if (def.donRequired && card.attachedDon < def.donRequired) {
    return { valid: false, reason: `Needs ${def.donRequired} DON!! attached` }
  }
  if (!evalCond(state, playerId, card, def.condition)) {
    return { valid: false, reason: 'Condition not met' }
  }
  if (def.oncePerTurn && card.activatedThisTurn.includes(`am${defIndex}`)) {
    return { valid: false, reason: 'Already activated this turn' }
  }
  const activeDon = player.donArea.filter((d) => !d.isRested).length
  if (def.cost?.restDon && activeDon < def.cost.restDon) {
    return { valid: false, reason: `Needs ${def.cost.restDon} active DON!!` }
  }
  if (def.cost?.restSelf && card.isRested) {
    return { valid: false, reason: 'Card must be active to rest as cost' }
  }
  return { valid: true }
}

function validatePlayCounterEvent(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: string,
): ValidationResult {
  if (!state.battle) return { valid: false, reason: 'Not in battle' }
  if (state.battle.step !== 'COUNTER') return { valid: false, reason: 'Not in counter step' }
  if (state.battle.defenderPlayer !== playerId) return { valid: false, reason: 'Not the defender' }

  const player = state.players[playerId]
  const card = player.hand.find((c) => c.instanceId === cardInstanceId)
  if (!card) return { valid: false, reason: 'Card not in hand' }
  const data = getCardById(card.cardId)
  if (data?.cardType !== 'Event') return { valid: false, reason: 'Not an Event' }
  if (getEffectDefs(card.cardId, 'counter').length === 0) {
    return { valid: false, reason: 'No [Counter] effect' }
  }
  const activeDon = player.donArea.filter((d) => !d.isRested).length
  if (activeDon < data.cost) {
    return { valid: false, reason: `Need ${data.cost} active DON (have ${activeDon})` }
  }
  return { valid: true }
}

