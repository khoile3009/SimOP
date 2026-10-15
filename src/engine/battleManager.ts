import type { GameState, GameCard, GameEvent, PlayerId } from './types'
import type { FlagName } from './effects/ast'
import { getCardById } from '@/data/cardService'
import { getOpponent, expireModifiers } from './turnManager'
import { getBattleAttribute, getCardRules } from './rulesLayer'
import { getBattlePower } from './powerCalc'
import { hasKeyword } from './keywords'
import { koById, queueEffects, removeFromField, emitEngineEvent } from './effects/interpreter'
import { hasFlag, getFlag } from './effects/statics'

/** Battle-KO protection: blanket, or scoped to the attacker's battle attribute. */
function protectedFromBattleKo(state: GameState, defender: GameCard, attacker: GameCard): boolean {
  if (hasFlag(state, defender, 'noBattleKo')) return true
  const attackerIsLeader = (['player1', 'player2'] as PlayerId[]).some(
    (pid) => state.players[pid].leader.instanceId === attacker.instanceId,
  )
  if (attackerIsLeader && hasFlag(state, defender, 'noBattleKoByLeader')) return true
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

  let newState: GameState = {
    ...state,
    defenseLog: [
      ...(state.defenseLog ?? []),
      {
        turn: state.turnNumber,
        defender: battle.defenderPlayer,
        attackerPower,
        defenderPower,
        counterPower: battle.defenderPowerBonus,
        blocked: battle.currentTargetId !== battle.originalTargetId,
        targetLeader: defenderPlayer.leader.instanceId === battle.originalTargetId,
        defenderLife: defenderPlayer.lifeCards.length,
        defenderHand: defenderPlayer.hand.length,
      },
    ].slice(-40),
  }

  if (attackerPower >= defenderPower) {
    // Attack succeeds
    const hasDoubleAttack = hasKeyword(state, attacker, 'Double Attack')
    const hasBanish = hasKeyword(state, attacker, 'Banish')

    if (isLeaderTarget) {
      // Leader hit: deal life damage
      const damageCount = hasDoubleAttack ? 2 : 1
      newState = dealLifeDamage(
        newState,
        battle.defenderPlayer,
        damageCount,
        hasBanish,
        events,
        battle.attackerId,
      )
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
  newState = endOfBattleCleanup(newState, battle.attackerId, events, battle.currentTargetId)

  return { state: newState, events }
}

/** Shared battle-end path: an attacker flagged 'bottomDeckAtBattleEnd' (Mr.2)
 * leaves for the deck bottom BEFORE battle-duration modifiers are swept. */
export function endOfBattleCleanup(
  state: GameState,
  attackerId: string,
  events: GameEvent[],
  targetId?: string,
): GameState {
  let s = state
  const findChar = (id: string | undefined) => {
    if (!id) return null
    for (const pid of ['player1', 'player2'] as PlayerId[]) {
      const c = s.players[pid].characters.find((x) => x.instanceId === id)
      if (c) return c
    }
    return null
  }
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
  // Ice Oni: a surviving character battle opponent goes under the deck when
  // the other battler carries 'bottomDecksBattledFoe' (value = max cost)
  for (const [aId, bId] of [
    [attackerId, targetId],
    [targetId, attackerId],
  ] as const) {
    const a = findChar(aId)
    const b = findChar(bId)
    if (!a || !b) continue
    const f = getFlag(s, a, 'bottomDecksBattledFoe')
    if (f.present && getCardById(b.cardId)?.cost !== undefined) {
      const cost = getCardById(b.cardId)!.cost
      if (cost <= f.value) {
        events.push({
          type: 'BATTLE_END_MOVE',
          playerId: b.ownerId,
          description: `${getCardById(b.cardId)?.name ?? 'Character'} is placed at the deck bottom`,
        })
        s = removeFromField(s, b.instanceId, 'deckBottom')
      }
    }
  }
  // Zoro leader: an attacker flagged 'activeAfterCharBattle' untaps after
  // battling a CHARACTER (not a leader); the flag is spent either way
  if (targetId) {
    for (const pid of ['player1', 'player2'] as PlayerId[]) {
      const p = s.players[pid]
      const wasCharTarget = (['player1', 'player2'] as PlayerId[]).every(
        (q) => s.players[q].leader.instanceId !== targetId,
      )
      const attacker =
        p.leader.instanceId === attackerId
          ? p.leader
          : p.characters.find((c) => c.instanceId === attackerId)
      if (attacker && wasCharTarget && hasFlag(s, attacker, 'activeAfterCharBattle')) {
        const strip = (c: GameCard): GameCard => ({
          ...c,
          isRested: false,
          modifiers: c.modifiers.filter(
            (m) => !(m.kind === 'flag' && m.flag === 'activeAfterCharBattle'),
          ),
        })
        s = {
          ...s,
          players: {
            ...s.players,
            [pid]:
              p.leader.instanceId === attackerId
                ? { ...p, leader: strip(p.leader) }
                : {
                    ...p,
                    characters: p.characters.map((c) =>
                      c.instanceId === attackerId ? strip(c) : c,
                    ),
                  },
          },
        }
      }
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
  sourceId?: string,
): GameState {
  const dealer = getOpponent(playerId)
  // "When ... deals damage to your opponent's Life" listeners, once per life card
  const damageEvent = (s: GameState): GameState =>
    emitEngineEvent(s, { kind: 'lifeDamageDealt', player: dealer, sourceInstanceId: sourceId })

  let s = state
  for (let i = 0; i < count; i++) {
    const player = s.players[playerId]
    if (player.lifeCards.length === 0) {
      // No life left: player loses
      const winner = dealer
      events.push({
        type: 'GAME_WIN',
        playerId: winner,
        description: `${winner} wins! ${playerId} has no life remaining.`,
      })
      return { ...s, winner }
    }

    const [lifeCard, ...lifeCards] = player.lifeCards

    // "When your Life reaches 0" listeners (Enel) respond before any further
    // damage lands; remaining hits park in pendingDamage and resume after
    const lifeZeroCheck = (st: GameState): GameState | null => {
      if (lifeCards.length > 0) return null
      const emitted = emitEngineEvent(st, { kind: 'lifeZero', player: playerId })
      if (emitted.stack.length === st.stack.length) return null
      const remaining = count - i - 1
      return remaining > 0
        ? { ...emitted, pendingDamage: { playerId, count: remaining, banish, sourceId } }
        : emitted
    }

    if (banish) {
      // Banish: card goes to trash, no trigger
      s = {
        ...s,
        players: {
          ...s.players,
          [playerId]: { ...player, lifeCards, trash: [...player.trash, lifeCard] },
        },
      }
      events.push({ type: 'LIFE_BANISHED', playerId, description: 'Life card banished to trash' })
      s = damageEvent(s)
      s = emitEngineEvent(s, { kind: 'lifeRemoved', player: playerId })
      const zeroed = lifeZeroCheck(s)
      if (zeroed) return zeroed
    } else if (lifeCard.revealed && getCardRules(player.leader.cardId)?.faceUpLifeToDeckBottom) {
      // ST13 Luffy's rule: face-up Life goes to the deck bottom instead of the
      // hand; no [Trigger] prompt (the card never enters the hand)
      s = {
        ...s,
        players: {
          ...s.players,
          [playerId]: {
            ...player,
            lifeCards,
            deck: [...player.deck, { ...lifeCard, revealed: false, seenByOwner: true }],
          },
        },
      }
      s = damageEvent(s)
      s = emitEngineEvent(s, { kind: 'lifeRemoved', player: playerId })
      const zeroed = lifeZeroCheck(s)
      if (zeroed) return zeroed
    } else {
      // Normal: card goes to hand WITHOUT being revealed - the owner checks it
      // privately, and only revealing to activate a [Trigger] makes it public
      s = {
        ...s,
        players: {
          ...s.players,
          [playerId]: {
            ...player,
            lifeCards,
            hand: [...player.hand, { ...lifeCard, revealed: false }],
          },
        },
      }
      s = damageEvent(s)
      s = emitEngineEvent(s, { kind: 'lifeAddedToHand', player: playerId })
      s = emitEngineEvent(s, { kind: 'lifeRemoved', player: playerId })
      const zeroed = lifeZeroCheck(s)
      if (zeroed) {
        const cardData0 = getCardById(lifeCard.cardId)
        // A trigger on the final life card still prompts; its parked damage (if
        // any) was already recorded by lifeZeroCheck
        return cardData0?.triggerText
          ? { ...zeroed, pendingTrigger: { cardInstanceId: lifeCard.instanceId, playerId } }
          : zeroed
      }
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
          ...s,
          pendingTrigger: { cardInstanceId: lifeCard.instanceId, playerId },
          pendingDamage: remaining > 0 ? { playerId, count: remaining, banish, sourceId } : null,
        }
      }
      events.push({ type: 'LIFE_DAMAGE', playerId, description: 'Life card moved to hand' })
    }
  }

  return s
}
