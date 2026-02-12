import type { GameState, GameAction, PlayerId } from './types'
import { MAX_CHARACTERS } from './constants'
import { getCardById } from '@/data/cardService'
import { getOpponent } from './turnManager'

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
    case 'CHOOSE_CHARACTER_TO_TRASH':
      return validateChooseCharacterToTrash(state, actingPlayer, action.cardInstanceId)
    case 'ACTIVATE_EFFECT':
      return { valid: true } // Effect validation is complex, handled in effect system
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
    const cardData = getCardById(attackerChar.cardId)
    const hasRush = cardData?.effectText?.includes('[Rush]')
    if (!hasRush) return { valid: false, reason: 'Character cannot attack the turn it was played' }
  }

  // Find target
  const opponentId = getOpponent(playerId)
  const opponent = state.players[opponentId]
  const isLeaderTarget = opponent.leader.instanceId === targetId
  const targetChar = opponent.characters.find((c) => c.instanceId === targetId)

  if (!isLeaderTarget && !targetChar) return { valid: false, reason: 'Invalid target' }

  // Can only attack rested characters (or leader who is always valid)
  if (targetChar && !targetChar.isRested) {
    // Check if attacker has effect to attack active characters
    const attackerData = getCardById(attacker.cardId)
    const canAttackActive = attackerData?.effectText?.includes('can also attack') &&
      attackerData?.effectText?.includes('active Characters')
    if (!canAttackActive) {
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

  const cardData = getCardById(blocker.cardId)
  if (!cardData?.effectText?.includes('[Blocker]')) {
    return { valid: false, reason: 'Character does not have Blocker' }
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
    if (cardData.counter === null && !cardData.effectText?.includes('[Counter]')) {
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

function validateChooseCharacterToTrash(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: string,
): ValidationResult {
  const player = state.players[playerId]
  const char = player.characters.find((c) => c.instanceId === cardInstanceId)
  if (!char) return { valid: false, reason: 'Character not found on field' }
  return { valid: true }
}
