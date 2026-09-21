import type { GameState, GameCard, PlayerId } from '../types'
import type { Cond, FlagName } from './ast'
import { getStatics } from './registry'
import { getCardById } from '@/data/cardService'
import { getOpponent } from '../turnManager'
import { cardHasName } from '../rulesLayer'

export function cardTypes(cardId: string): string[] {
  // CardData.attribute holds the type list ({Straw Hat Crew} etc.) in this dataset
  return getCardById(cardId)?.attribute ?? []
}

export function donOnField(state: GameState, playerId: PlayerId): number {
  const p = state.players[playerId]
  return (
    p.donArea.length +
    p.leader.attachedDon +
    p.characters.reduce((sum, c) => sum + c.attachedDon, 0)
  )
}

export function evalCond(
  state: GameState,
  controller: PlayerId,
  source: GameCard | null,
  cond?: Cond,
): boolean {
  if (!cond) return true
  const me = state.players[controller]
  const opp = state.players[getOpponent(controller)]

  if (cond.yourTurn && state.currentPlayer !== controller) return false
  if (cond.opponentsTurn && state.currentPlayer === controller) return false
  if (cond.selfRested && !source?.isRested) return false
  if (cond.leaderNameIs && !cardHasName(me.leader.cardId, cond.leaderNameIs)) return false
  if (cond.leaderTypeIncludes && !cardTypes(me.leader.cardId).includes(cond.leaderTypeIncludes)) {
    return false
  }
  if (cond.anyCharacterCostAtMost !== undefined) {
    const anyMatch = (['player1', 'player2'] as PlayerId[]).some((pid) =>
      state.players[pid].characters.some(
        (c) => getEffectiveFieldCost(state, c) <= cond.anyCharacterCostAtMost!,
      ),
    )
    if (!anyMatch) return false
  }
  if (cond.allSelfDonRested && me.donArea.some((d) => !d.isRested)) return false
  if (cond.maxSelfCharacters !== undefined && me.characters.length > cond.maxSelfCharacters) {
    return false
  }
  if (cond.minSelfCharacters !== undefined && me.characters.length < cond.minSelfCharacters) {
    return false
  }
  if (
    cond.minSelfRestedCharacters !== undefined &&
    me.characters.filter((c) => c.isRested).length < cond.minSelfRestedCharacters
  ) {
    return false
  }
  if (
    cond.minOppRestedCharacters !== undefined &&
    opp.characters.filter((c) => c.isRested).length < cond.minOppRestedCharacters
  ) {
    return false
  }
  if (cond.minHandSelf !== undefined && me.hand.length < cond.minHandSelf) return false
  if (cond.maxHandSelf !== undefined && me.hand.length > cond.maxHandSelf) return false
  if (cond.minDonField !== undefined && donOnField(state, controller) < cond.minDonField) {
    return false
  }
  if (
    cond.minDonFieldOpp !== undefined &&
    donOnField(state, getOpponent(controller)) < cond.minDonFieldOpp
  ) {
    return false
  }
  if (cond.maxLifeSelf !== undefined && me.lifeCards.length > cond.maxLifeSelf) return false
  if (cond.minDeckSelf !== undefined && me.deck.length < cond.minDeckSelf) return false
  if (
    cond.hasCharacterNamed &&
    !me.characters.some((c) => cardHasName(c.cardId, cond.hasCharacterNamed!))
  ) {
    return false
  }
  if (
    cond.lacksCharacterNamed &&
    me.characters.some((c) => cardHasName(c.cardId, cond.lacksCharacterNamed!))
  ) {
    return false
  }
  return true
}

interface AuraGrant {
  power: number
  cost: number
  keywords: string[]
  flags: { flag: FlagName; value: number }[]
}

/** Everything active auras grant to `card` right now. Auras never stack recursively. */
export function auraGrants(state: GameState, card: GameCard): AuraGrant {
  const result: AuraGrant = { power: 0, cost: 0, keywords: [], flags: [] }

  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    for (const source of [p.leader, ...p.characters, ...(p.stage ? [p.stage] : [])]) {
      for (const def of getStatics(source.cardId)) {
        if (def.donRequired && source.attachedDon < def.donRequired) continue
        if (!evalCond(state, pid, source, def.condition)) continue

        const t = def.target
        if (t.scope === 'myHand') continue // cost modifiers: see getEffectiveCost
        // Character-scoped auras never hit stages (or leaders, below)
        const targetIsStage = state.players[card.ownerId].stage?.instanceId === card.instanceId
        if (targetIsStage && t.scope !== 'self') continue
        if (t.scope === 'self') {
          if (source.instanceId !== card.instanceId) continue
        } else if (t.scope === 'myLeader') {
          if (card.ownerId !== pid || !isLeader(state, card)) continue
        } else if (t.scope === 'oppCharacters') {
          if (card.ownerId === pid || isLeader(state, card)) continue
        } else {
          // myCharacters / myCharactersOther
          if (card.ownerId !== pid || isLeader(state, card)) continue
          if (t.scope === 'myCharactersOther' && card.instanceId === source.instanceId) continue
        }
        if (t.typeIncludes && !cardTypes(card.cardId).includes(t.typeIncludes)) continue
        if (t.nameIs && !cardHasName(card.cardId, t.nameIs)) continue
        if (t.nameNot && cardHasName(card.cardId, t.nameNot)) continue

        let power = def.power ?? 0
        if (def.powerPer) {
          const owner = state.players[pid]
          if (def.powerPer.handCards) power += def.powerPer.amount * owner.hand.length
          if (def.powerPer.trashEventsPer2) {
            const events = owner.trash.filter(
              (c) => getCardById(c.cardId)?.cardType === 'Event',
            ).length
            power += def.powerPer.amount * Math.floor(events / 2)
          }
        }
        result.power += power
        result.cost += def.costMod ?? 0
        if (def.keyword) result.keywords.push(def.keyword)
        if (def.flag) result.flags.push({ flag: def.flag, value: def.flagValue ?? 0 })
      }
    }
  }
  return result
}

function isLeader(state: GameState, card: GameCard): boolean {
  return state.players[card.ownerId].leader.instanceId === card.instanceId
}

/** Flag check across modifiers and auras. Returns the highest value when several apply. */
export function getFlag(
  state: GameState,
  card: GameCard,
  flag: FlagName,
): { present: boolean; value: number } {
  let present = false
  let value = -Infinity
  for (const m of card.modifiers) {
    if (m.kind === 'flag' && m.flag === flag) {
      present = true
      value = Math.max(value, m.value)
    }
  }
  for (const g of auraGrants(state, card).flags) {
    if (g.flag === flag) {
      present = true
      value = Math.max(value, g.value)
    }
  }
  return { present, value: present ? value : 0 }
}

export function hasFlag(state: GameState, card: GameCard, flag: FlagName): boolean {
  return getFlag(state, card, flag).present
}

/**
 * A FIELD card's cost after cost modifiers and field-scoped cost auras
 * (Black's -N cost effects). Cost-based targeting and conditions read this,
 * never the printed cost.
 *
 * Recursion guard: an aura's CONDITION may itself ask about costs (Onigumo's
 * "if there is a Character with a cost of 0"), which would re-enter
 * auraGrants forever. Nested cost reads settle on printed cost + modifiers -
 * exact for this pool, since no cost aura's own condition depends on costs.
 */
let costEvalDepth = 0
export function getEffectiveFieldCost(state: GameState, card: GameCard): number {
  let cost = getCardById(card.cardId)?.cost ?? 0
  for (const m of card.modifiers) {
    if (m.kind === 'cost') cost += m.value
  }
  if (costEvalDepth === 0) {
    costEvalDepth++
    try {
      cost += auraGrants(state, card).cost
    } finally {
      costEvalDepth--
    }
  }
  return Math.max(0, cost)
}

/**
 * A hand card's cost after 'myHand' cost statics on the owner's field
 * (e.g. OP01-067 Crocodile: blue Events in your hand -1 cost) and one-shot
 * play discounts (Kin'emon). Computed on read, never stored, like power.
 */
export function getEffectiveCost(state: GameState, playerId: PlayerId, card: GameCard): number {
  const data = getCardById(card.cardId)
  let cost = data?.cost ?? 0
  const p = state.players[playerId]
  for (const source of [p.leader, ...p.characters]) {
    for (const def of getStatics(source.cardId)) {
      if (!def.costMod || def.target.scope !== 'myHand') continue
      if (def.donRequired && source.attachedDon < def.donRequired) continue
      if (!evalCond(state, playerId, source, def.condition)) continue
      const t = def.target
      if (t.cardType && data?.cardType !== t.cardType) continue
      if (t.colorIncludes && !(data?.color ?? []).some((c) => c === t.colorIncludes)) continue
      if (t.typeIncludes && !cardTypes(card.cardId).includes(t.typeIncludes)) continue
      cost += def.costMod
    }
  }
  for (const d of state.playDiscounts?.[playerId] ?? []) {
    if (discountMatches(card, d)) cost -= d.amount
  }
  return Math.max(0, cost)
}

export function discountMatches(
  card: GameCard,
  d: { amount: number; cardType?: string; typeIncludes?: string; minCost?: number },
): boolean {
  const data = getCardById(card.cardId)
  if (d.cardType && data?.cardType !== d.cardType) return false
  if (d.typeIncludes && !cardTypes(card.cardId).includes(d.typeIncludes)) return false
  if (d.minCost !== undefined && (data?.cost ?? 0) < d.minCost) return false
  return true
}
