import type { GameState, GameEvent, PlayerId } from './types'
import { getCardById } from '@/data/cardService'
import { getOpponent } from './turnManager'
import { getBattlePower } from './powerCalc'

/** Resolve the damage step of battle */
export function resolveDamage(state: GameState): { state: GameState; events: GameEvent[] } {
  const battle = state.battle
  if (!battle || battle.step !== 'DAMAGE') {
    return { state, events: [] }
  }

  const events: GameEvent[] = []
  const attackerPlayer = state.players[battle.attackerPlayer]
  const defenderPlayer = state.players[battle.defenderPlayer]

  // Find attacker card
  const attacker =
    attackerPlayer.leader.instanceId === battle.attackerId
      ? attackerPlayer.leader
      : attackerPlayer.characters.find((c) => c.instanceId === battle.attackerId)

  if (!attacker) {
    // Attacker was removed (shouldn't happen normally)
    return { state: { ...state, battle: null }, events }
  }

  // Find defender card
  const isLeaderTarget = defenderPlayer.leader.instanceId === battle.currentTargetId
  const defenderChar = defenderPlayer.characters.find(
    (c) => c.instanceId === battle.currentTargetId,
  )
  const defender = isLeaderTarget ? defenderPlayer.leader : defenderChar

  if (!defender) {
    return { state: { ...state, battle: null }, events }
  }

  const attackerPower = getBattlePower(attacker, battle.attackerPowerBonus)
  const defenderPower = getBattlePower(defender, battle.defenderPowerBonus)

  let newState = state

  if (attackerPower >= defenderPower) {
    // Attack succeeds
    const attackerData = getCardById(attacker.cardId)
    const hasDoubleAttack = attackerData?.effectText?.includes('[Double Attack]') ?? false
    const hasBanish = attackerData?.effectText?.includes('[Banish]') ?? false

    if (isLeaderTarget) {
      // Leader hit: deal life damage
      const damageCount = hasDoubleAttack ? 2 : 1
      newState = dealLifeDamage(newState, battle.defenderPlayer, damageCount, hasBanish, events)
    } else {
      // Character KO
      newState = koCharacter(newState, battle.defenderPlayer, battle.currentTargetId, events)
    }

    events.push({
      type: 'ATTACK_SUCCESS',
      playerId: battle.attackerPlayer,
      description: `Attack succeeded (${attackerPower} vs ${defenderPower})`,
    })
  } else {
    events.push({
      type: 'ATTACK_FAILED',
      playerId: battle.attackerPlayer,
      description: `Attack failed (${attackerPower} vs ${defenderPower})`,
    })
  }

  // Clear battle
  newState = { ...newState, battle: null }

  return { state: newState, events }
}

function dealLifeDamage(
  state: GameState,
  playerId: PlayerId,
  count: number,
  banish: boolean,
  events: GameEvent[],
): GameState {
  const player = state.players[playerId]
  const newLifeCards = [...player.lifeCards]
  const newHand = [...player.hand]
  const newTrash = [...player.trash]

  for (let i = 0; i < count; i++) {
    if (newLifeCards.length === 0) {
      // No life left: player loses
      const winner = getOpponent(playerId)
      events.push({
        type: 'GAME_WIN',
        playerId: winner,
        description: `${winner} wins! ${playerId} has no life remaining.`,
      })
      return {
        ...state,
        winner,
        players: {
          ...state.players,
          [playerId]: { ...player, lifeCards: newLifeCards, hand: newHand, trash: newTrash },
        },
      }
    }

    const lifeCard = newLifeCards.shift()!

    if (banish) {
      // Banish: card goes to trash, no trigger
      newTrash.push(lifeCard)
      events.push({
        type: 'LIFE_BANISHED',
        playerId,
        description: `Life card banished to trash`,
      })
    } else {
      // Normal: card goes to hand, may have trigger
      newHand.push(lifeCard)
      const cardData = getCardById(lifeCard.cardId)

      if (cardData?.triggerText) {
        events.push({
          type: 'TRIGGER_AVAILABLE',
          playerId,
          description: `Trigger available: ${cardData.name}`,
        })
        // Set pending trigger (will be resolved by player action)
        return {
          ...state,
          pendingTrigger: { cardInstanceId: lifeCard.instanceId, playerId },
          players: {
            ...state.players,
            [playerId]: { ...player, lifeCards: newLifeCards, hand: newHand, trash: newTrash },
          },
        }
      } else {
        events.push({
          type: 'LIFE_DAMAGE',
          playerId,
          description: `Life card moved to hand`,
        })
      }
    }
  }

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: { ...player, lifeCards: newLifeCards, hand: newHand, trash: newTrash },
    },
  }
}

function koCharacter(
  state: GameState,
  playerId: PlayerId,
  characterId: string,
  events: GameEvent[],
): GameState {
  const player = state.players[playerId]
  const charIndex = player.characters.findIndex((c) => c.instanceId === characterId)

  if (charIndex < 0) return state

  const char = player.characters[charIndex]
  const cardData = getCardById(char.cardId)
  const newCharacters = [...player.characters]
  newCharacters.splice(charIndex, 1)

  events.push({
    type: 'CHARACTER_KO',
    playerId,
    description: `${cardData?.name ?? 'Character'} was KO'd`,
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
