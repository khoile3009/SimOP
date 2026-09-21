import type { GameState, GameCard, GameEvent, PlayerId } from './types'
import type { FlagName } from './effects/ast'
import { getCardById } from '@/data/cardService'
import { getOpponent, expireModifiers } from './turnManager'
import { getBattleAttribute } from './rulesLayer'
import { getBattlePower } from './powerCalc'
import { hasKeyword } from './keywords'
import { koById, queueEffects, removeFromField } from './effects/interpreter'
import { hasFlag } from './effects/statics'

/** Battle-KO protection: blanket, or scoped to the attacker's battle attribute. */
function protectedFromBattleKo(state: GameState, defender: GameCard, attacker: GameCard): boolean {
  if (hasFlag(state, defender, 'noBattleKo')) return true
  const attr = getBattleAttribute(attacker.cardId)
  return attr !== null && hasFlag(state, defender, `noBattleKoBy${attr}` as FlagName)
}

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

  const attackerPower = getBattlePower(state, attacker, battle.attackerPowerBonus)
  const defenderPower = getBattlePower(state, defender, battle.defenderPowerBonus)

  let newState = state

  if (attackerPower >= defenderPower) {
    // Attack succeeds
    const hasDoubleAttack = hasKeyword(state, attacker, 'Double Attack')
    const hasBanish = hasKeyword(state, attacker, 'Banish')

    if (isLeaderTarget) {
      // Leader hit: deal life damage
      const damageCount = hasDoubleAttack ? 2 : 1
      newState = dealLifeDamage(newState, battle.defenderPlayer, damageCount, hasBanish, events)
    } else if (defenderChar && protectedFromBattleKo(state, defenderChar, attacker)) {
      // Protected (e.g. Semimaru's aura): the battle is won but nothing happens
      events.push({
        type: 'KO_PREVENTED',
        playerId: battle.defenderPlayer,
        description: `${getCardById(defenderChar.cardId)?.name ?? 'Character'} cannot be K.O.'d in battle`,
      })
    } else {
      // Character KO (queues the target's [On K.O.] effects; processor runs the stack)
      newState = koById(newState, battle.currentTargetId, events, { byBattle: true })
      // The attacker's "when this battles and K.O.s a Character" effects (Isuka)
      const koed = !newState.players[battle.defenderPlayer].characters.some(
        (c) => c.instanceId === battle.currentTargetId,
      )
      const attackerIsCharacter = attackerPlayer.leader.instanceId !== battle.attackerId
      if (koed && attackerIsCharacter) {
        newState = queueEffects(newState, attacker, 'afterBattleKo', battle.attackerPlayer)
      }
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

  // End of battle: scheduled battle-end moves, then "during this battle"
  // effects expire and the battle clears
  newState = endOfBattleCleanup(newState, battle.attackerId, events)

  return { state: newState, events }
}

/** Shared battle-end path: an attacker flagged 'bottomDeckAtBattleEnd' (Mr.2)
 * leaves for the deck bottom BEFORE battle-duration modifiers are swept. */
export function endOfBattleCleanup(
  state: GameState,
  attackerId: string,
  events: GameEvent[],
): GameState {
  let s = state
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const attacker = s.players[pid].characters.find((c) => c.instanceId === attackerId)
    if (attacker && hasFlag(s, attacker, 'bottomDeckAtBattleEnd')) {
      events.push({
        type: 'BATTLE_END_MOVE',
        playerId: pid,
        description: `${getCardById(attacker.cardId)?.name ?? 'Character'} returns to the deck bottom`,
      })
      s = removeFromField(s, attackerId, 'deckBottom')
    }
  }
  s = expireModifiers(s, (m) => m.duration === 'battle')
  return { ...s, battle: null }
}

export function dealLifeDamage(
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
      // Normal: card goes to hand WITHOUT being revealed - the owner checks it
      // privately, and only revealing to activate a [Trigger] makes it public
      newHand.push({ ...lifeCard, revealed: false })
      const cardData = getCardById(lifeCard.cardId)

      if (cardData?.triggerText) {
        events.push({
          type: 'TRIGGER_AVAILABLE',
          playerId,
          description: `Trigger available: ${cardData.name}`,
        })
        // The trigger suspends damage processing; any remaining damage (e.g.
        // the second hit of [Double Attack]) is parked and resumes after
        const remaining = count - i - 1
        return {
          ...state,
          pendingTrigger: { cardInstanceId: lifeCard.instanceId, playerId },
          pendingDamage: remaining > 0 ? { playerId, count: remaining, banish } : null,
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

