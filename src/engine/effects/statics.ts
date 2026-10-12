import type { GameState, GameCard, PlayerId } from '../types'
import type { Cond, FlagName } from './ast'
import { getStatics } from './registry'
import { getCardById } from '@/data/cardService'
import { getEffectivePower } from '../powerCalc'
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
  if (
    cond.leaderTypeContains &&
    !cardTypes(me.leader.cardId).some((t) => t.includes(cond.leaderTypeContains!))
  ) {
    return false
  }
  if (cond.maxDeckSelf !== undefined && me.deck.length > cond.maxDeckSelf) return false
  if (cond.minTrashSelf !== undefined && me.trash.length < cond.minTrashSelf) return false
  if (cond.maxTrashSelf !== undefined && me.trash.length > cond.maxTrashSelf) return false
  if (
    cond.minActiveDonSelf !== undefined &&
    me.donArea.filter((d) => !d.isRested).length < cond.minActiveDonSelf
  ) {
    return false
  }
  if (
    cond.maxLifePlusHandSelf !== undefined &&
    me.lifeCards.length + me.hand.length > cond.maxLifePlusHandSelf
  ) {
    return false
  }
  if (
    cond.minSelfCharCost !== undefined &&
    !me.characters.some((c) => getEffectiveFieldCost(state, c) >= cond.minSelfCharCost!)
  ) {
    return false
  }
  if (
    cond.lacksSelfCharCost !== undefined &&
    me.characters.some((c) => getEffectiveFieldCost(state, c) >= cond.lacksSelfCharCost!)
  ) {
    return false
  }
  if (
    cond.maxTotalLife !== undefined &&
    me.lifeCards.length + opp.lifeCards.length > cond.maxTotalLife
  ) {
    return false
  }
  if (cond.lessLifeThanOpp && me.lifeCards.length >= opp.lifeCards.length) return false
  if (cond.leaderActive && me.leader.isRested) return false
  if (cond.leaderMulticolor && (getCardById(me.leader.cardId)?.color.length ?? 0) < 2) return false
  if (
    cond.selfPowerAtLeast !== undefined &&
    (!source || condPower(state, source) < cond.selfPowerAtLeast)
  ) {
    return false
  }
  if (
    cond.leaderPowerAtMost !== undefined &&
    condPower(state, me.leader) > cond.leaderPowerAtMost
  ) {
    return false
  }
  if (
    cond.hasCharacterTypeIncludes &&
    !me.characters.some((c) => cardTypes(c.cardId).includes(cond.hasCharacterTypeIncludes!))
  ) {
    return false
  }
  if (
    cond.allSelfCharsTyped &&
    !me.characters.every((c) => cardTypes(c.cardId).includes(cond.allSelfCharsTyped!))
  ) {
    return false
  }
  if (cond.maxDonField !== undefined && donOnField(state, controller) > cond.maxDonField) {
    return false
  }
  if (
    cond.noCharacterNamedAnywhere &&
    (['player1', 'player2'] as PlayerId[]).some((pid) =>
      state.players[pid].characters.some((c) =>
        cardHasName(c.cardId, cond.noCharacterNamedAnywhere!),
      ),
    )
  ) {
    return false
  }
  if (
    cond.hasOtherCharacterNamed &&
    !me.characters.some(
      (c) =>
        c.instanceId !== source?.instanceId && cardHasName(c.cardId, cond.hasOtherCharacterNamed!),
    )
  ) {
    return false
  }
  if (cond.minLifeOpp !== undefined && opp.lifeCards.length < cond.minLifeOpp) return false
  if (cond.maxLifeOpp !== undefined && opp.lifeCards.length > cond.maxLifeOpp) return false
  if (cond.minHandOpp !== undefined && opp.hand.length < cond.minHandOpp) return false
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
  if (cond.otherCharPowerAtLeast !== undefined) {
    const found = state.players[controller].characters.some(
      (c) =>
        c.instanceId !== source?.instanceId && condPower(state, c) >= cond.otherCharPowerAtLeast!,
    )
    if (!found) return false
  }
  if (cond.donFieldZeroOrAtLeast !== undefined) {
    const mine = donOnField(state, controller)
    if (mine !== 0 && mine < cond.donFieldZeroOrAtLeast) return false
  }
  if (
    cond.oppMoreDon &&
    donOnField(state, getOpponent(controller)) <= donOnField(state, controller)
  ) {
    return false
  }
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
  if (cond.minLifeSelf !== undefined && me.lifeCards.length < cond.minLifeSelf) return false
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

/**
 * Power read for aura CONDITIONS. A power-based condition on a static
 * (Inazuma's "a Character with 7000 power or more") re-enters auraGrants
 * through getEffectivePower; nested reads settle on base + DON + modifiers,
 * mirroring the costEvalDepth guard below.
 */
/** Negation is carried by a 'negated' flag MODIFIER only (never an aura), so
 * reads stay recursion-free: a negated card grants no statics, loses printed
 * keywords, and its effect defs stop matching. */
export function isNegated(card: GameCard): boolean {
  return card.modifiers.some((m) => m.kind === 'flag' && m.flag === 'negated')
}

let powerCondDepth = 0
function condPower(state: GameState, card: GameCard): number {
  if (powerCondDepth > 0) {
    const base = getCardById(card.cardId)?.power ?? 0
    const donBonus = state.currentPlayer === card.ownerId ? card.attachedDon * 1000 : 0
    let mods = 0
    for (const m of card.modifiers) if (m.kind === 'power') mods += m.value
    return base + donBonus + mods
  }
  powerCondDepth++
  try {
    return getEffectivePower(state, card)
  } finally {
    powerCondDepth--
  }
}

/** Everything active auras grant to `card` right now. Auras never stack recursively. */
export function auraGrants(state: GameState, card: GameCard): AuraGrant {
  const result: AuraGrant = { power: 0, cost: 0, keywords: [], flags: [] }

  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    for (const source of [p.leader, ...p.characters, ...(p.stage ? [p.stage] : [])]) {
      if (isNegated(source)) continue
      for (const def of getStatics(source.cardId)) {
        if (def.donRequired && source.attachedDon < def.donRequired) continue
        if (!evalCond(state, pid, source, def.condition)) continue

        const t = def.target
        if (t.scope === 'myHand' || t.scope === 'handSelf') continue // cost: see getEffectiveCost
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
        if (
          t.colorIncludes &&
          !(getCardById(card.cardId)?.color ?? []).some((col) => col === t.colorIncludes)
        )
          continue
        if (t.cardType && getCardById(card.cardId)?.cardType !== t.cardType) continue
        if (t.costAtLeast !== undefined && (getCardById(card.cardId)?.cost ?? 0) < t.costAtLeast)
          continue
        if (t.costAtMost !== undefined && (getCardById(card.cardId)?.cost ?? 0) > t.costAtMost)
          continue
        if (t.costIs !== undefined && (getCardById(card.cardId)?.cost ?? 0) !== t.costIs) continue
        if (t.activeOnly && card.isRested) continue

        let power = def.power ?? 0
        if (def.powerPer) {
          const owner = state.players[pid]
          if (def.powerPer.handCards) power += def.powerPer.amount * owner.hand.length
          if (def.powerPer.trashPer5) {
            power += def.powerPer.amount * Math.floor(owner.trash.length / 5)
          }
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
  for (const source of [p.leader, ...p.characters, ...(p.stage ? [p.stage] : [])]) {
    for (const def of getStatics(source.cardId)) {
      if (!def.costMod || def.target.scope !== 'myHand') continue
      if (def.donRequired && source.attachedDon < def.donRequired) continue
      if (!evalCond(state, playerId, source, def.condition)) continue
      const t = def.target
      if (t.cardType && data?.cardType !== t.cardType) continue
      if (t.colorIncludes && !(data?.color ?? []).some((c) => c === t.colorIncludes)) continue
      if (t.typeIncludes && !cardTypes(card.cardId).includes(t.typeIncludes)) continue
      if (t.costAtLeast !== undefined && (data?.cost ?? 0) < t.costAtLeast) continue
      if (t.costAtMost !== undefined && (data?.cost ?? 0) > t.costAtMost) continue
      cost += def.costMod
    }
  }
  // 'handSelf' statics ride on the hand card itself (OP07 Sanji's own -3)
  for (const def of getStatics(card.cardId)) {
    if (!def.costMod || def.target.scope !== 'handSelf') continue
    if (!evalCond(state, playerId, card, def.condition)) continue
    cost += def.costMod
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
