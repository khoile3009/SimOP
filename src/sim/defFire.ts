import type { GameState, GameCard, GameAction, PlayerId } from '@/engine/types'
import type { EffectDef, SelectFilter } from '@/engine/effects/ast'
import { createGame, createGameCard } from '@/engine/gameSetup'
import { processAction } from '@/engine/processor'
import { legalActions, whoActs } from '@/engine/legalActions'
import { validateAction } from '@/engine/rules'
import { getEffectDefs } from '@/engine/effects/registry'
import { koById, removeByEffect, runStack, emitEngineEvent } from '@/engine/effects/interpreter'
import type { EngineEvent } from '@/engine/effects/interpreter'
import { effectUsageSnapshot, resetEffectUsage } from '@/engine/effects/telemetry'
import { getAllCards, getCardById } from '@/data/cardService'
import { cardHasName, getBattleAttribute } from '@/engine/rulesLayer'
import { makeAutoDeck } from '@/sim/selfplay'
import { buildCoverageDecks } from '@/sim/decks'
import { SET_MODULES } from '@/data/sets'
import { mulberry32, setRandomSource, resetRandomSource } from '@/utils/rng'

/**
 * Forced-fire harness: for every card x effect def, construct a minimal
 * scenario for its timing class and drive it to completion under a choice
 * policy. Edge-case discovery by construction - bot fleets only reach states
 * competent play reaches; this fires the code paths bots skip, under choice
 * policies bots never use (decline everything / take the maximum).
 */

export type Policy = 'min' | 'max' | 'random'
export type Status = 'fired' | 'notFired' | 'error' | 'violation' | 'noScenario'

export interface DefFireResult {
  cardId: string
  defIndex: number
  timing: string
  policy: Policy
  status: Status
  detail?: string
}

// ─── Scenario base ───────────────────────────────────────────────────────────

const VANILLAS = getAllCards()
  .filter((c) => c.cardType === 'Character' && !c.effectText && !c.triggerText)
  .sort((a, b) => (b.power ?? 0) - (a.power ?? 0))
const BIG_VANILLA = VANILLAS[0]?.id ?? 'OP01-038'
const SMALL_VANILLA = VANILLAS[VANILLAS.length - 1]?.id ?? 'OP01-038'

/** Leader that satisfies the card's leader conditions: its coverage deck's leader. */
const LEADER_FOR = new Map<string, string>()
for (const mod of SET_MODULES) {
  for (const deck of buildCoverageDecks(mod.code)) {
    for (const entry of deck.deck.cards) {
      if (!LEADER_FOR.has(entry.cardId)) LEADER_FOR.set(entry.cardId, deck.deck.leader)
    }
  }
}

type AnyCond = Record<string, unknown>

function findCharWhere(
  pred: (c: {
    id: string
    cost: number
    power: number | null
    attribute: string[]
    color: string[]
    effectText?: string | null
  }) => boolean,
): string | null {
  for (const c of getAllCards()) {
    if (c.cardType !== 'Character') continue
    if (!pred(c as never)) continue
    if (!c.effectText) return c.id
  }
  for (const c of getAllCards()) {
    if (c.cardType === 'Character' && pred(c as never)) return c.id
  }
  return null
}

function setLife(state: GameState, pid: PlayerId, n: number): GameState {
  const p = state.players[pid]
  if (p.lifeCards.length === n) return state
  if (p.lifeCards.length > n) {
    const life = [...p.lifeCards]
    const extra = life.splice(n)
    return {
      ...state,
      players: { ...state.players, [pid]: { ...p, lifeCards: life, deck: [...p.deck, ...extra] } },
    }
  }
  const deck = [...p.deck]
  const add = deck.splice(0, n - p.lifeCards.length)
  return {
    ...state,
    players: { ...state.players, [pid]: { ...p, deck, lifeCards: [...p.lifeCards, ...add] } },
  }
}

function trimHand(state: GameState, pid: PlayerId, n: number): GameState {
  const p = state.players[pid]
  if (p.hand.length <= n) return state
  const hand = [...p.hand]
  const extra = hand.splice(n)
  return {
    ...state,
    players: { ...state.players, [pid]: { ...p, hand, deck: [...p.deck, ...extra] } },
  }
}

function restOwnDon(state: GameState, pid: PlayerId, rested: number): GameState {
  const p = state.players[pid]
  const donArea = p.donArea.map((d, i) => ({ ...d, isRested: i < rested }))
  return { ...state, players: { ...state.players, [pid]: { ...p, donArea } } }
}

/** Satisfy a def's condition by construction where mechanically possible.
 * Unhandled cond families stay unmet and show up in the report. */
function tuneForCond(state: GameState, owner: PlayerId, opp: PlayerId, cond?: AnyCond): GameState {
  if (!cond) return state
  let s = state
  const num = (k: string) => cond[k] as number
  const has = (k: string) => cond[k] !== undefined
  const addOwn = (cardId: string, props: Partial<GameCard> = {}) => {
    if (s.players[owner].characters.length >= 5) return
    s = addChar(s, owner, cardId, props).state
  }

  if (Array.isArray(cond.anyOf) && cond.anyOf.length > 0) {
    s = tuneForCond(s, owner, opp, cond.anyOf[0] as AnyCond)
  }
  if (has('maxHandSelf')) s = trimHand(s, owner, num('maxHandSelf'))
  if (has('handDisadvantageAtLeast'))
    s = trimHand(s, owner, Math.max(0, s.players[opp].hand.length - num('handDisadvantageAtLeast')))
  if (has('minHandOpp')) {
    const need = num('minHandOpp') - s.players[opp].hand.length
    for (let i = 0; i < need; i++) {
      const p = s.players[opp]
      const deck = [...p.deck]
      const card = deck.shift()
      if (!card) break
      s = { ...s, players: { ...s.players, [opp]: { ...p, deck, hand: [...p.hand, card] } } }
    }
  }
  if (has('maxLifeSelf'))
    s = setLife(s, owner, Math.min(num('maxLifeSelf'), s.players[owner].lifeCards.length))
  if (has('maxLifeOpp'))
    s = setLife(s, opp, Math.min(num('maxLifeOpp'), s.players[opp].lifeCards.length))
  if (has('maxTotalLife')) {
    s = setLife(s, owner, Math.min(2, num('maxTotalLife')))
    s = setLife(s, opp, Math.max(0, Math.min(2, num('maxTotalLife') - 2)))
  }
  if (has('minTotalLife') || has('minLifeSelf') || has('minLifeOpp')) {
    s = setLife(s, owner, 5)
    s = setLife(s, opp, 5)
  }
  if (cond.hasFaceUpLife) {
    const p = s.players[owner]
    const lifeCards =
      p.lifeCards.length > 0 ? [...p.lifeCards] : [createGameCard(SMALL_VANILLA, owner)]
    lifeCards[0] = { ...lifeCards[0], revealed: true }
    s = { ...s, players: { ...s.players, [owner]: { ...p, lifeCards } } }
  }
  if (has('maxDonFieldOpp')) {
    const p = s.players[opp]
    const keep = num('maxDonFieldOpp')
    if (p.donArea.length > keep) {
      s = { ...s, players: { ...s.players, [opp]: { ...p, donArea: p.donArea.slice(0, keep) } } }
    }
  }
  if (cond.lessLifeThanOpp) s = setLife(s, owner, 2)
  if (cond.atMostLifeOfOpp !== undefined) s = setLife(s, owner, s.players[opp].lifeCards.length)
  if (cond.anyPlayerLifeZero) s = setLife(s, opp, 0)
  if (has('maxDeckSelf')) {
    const p = s.players[owner]
    const keep = num('maxDeckSelf')
    if (p.deck.length > keep) {
      const deck = [...p.deck]
      const extra = deck.splice(keep)
      s = {
        ...s,
        players: { ...s.players, [owner]: { ...p, deck, trash: [...p.trash, ...extra] } },
      }
    }
  }
  if (has('maxTrashSelf')) {
    const p = s.players[owner]
    const keep = num('maxTrashSelf')
    if (p.trash.length > keep) {
      const trash = [...p.trash]
      const extra = trash.splice(keep)
      s = { ...s, players: { ...s.players, [owner]: { ...p, trash, deck: [...p.deck, ...extra] } } }
    }
  }
  if (has('minTrashEventsSelf')) {
    const ev =
      getAllCards().find((c) => c.cardType === 'Event' && !c.effectText) ??
      getAllCards().find((c) => c.cardType === 'Event')
    if (ev) {
      const p = s.players[owner]
      const extra = Array.from({ length: num('minTrashEventsSelf') }, () =>
        createGameCard(ev.id, owner),
      )
      s = { ...s, players: { ...s.players, [owner]: { ...p, trash: [...p.trash, ...extra] } } }
    }
  }
  if (Array.isArray(cond.trashContainsNames)) {
    const p = s.players[owner]
    const extra: GameCard[] = []
    for (const name of cond.trashContainsNames as string[]) {
      const match = getAllCards().find((c) => cardHasName(c.id, name))
      if (match) extra.push(createGameCard(match.id, owner))
    }
    s = { ...s, players: { ...s.players, [owner]: { ...p, trash: [...p.trash, ...extra] } } }
  }
  if (has('minSelfCharacters')) {
    while (s.players[owner].characters.length < num('minSelfCharacters')) addOwn(SMALL_VANILLA)
  }
  if (has('maxSelfCharacters')) {
    const p = s.players[owner]
    if (p.characters.length > num('maxSelfCharacters')) {
      s = {
        ...s,
        players: {
          ...s.players,
          [owner]: { ...p, characters: p.characters.slice(0, num('maxSelfCharacters')) },
        },
      }
    }
  }
  if (has('minSelfRestedCharacters')) {
    while (s.players[owner].characters.length < num('minSelfRestedCharacters'))
      addOwn(SMALL_VANILLA)
    const p = s.players[owner]
    s = {
      ...s,
      players: {
        ...s.players,
        [owner]: {
          ...p,
          characters: p.characters.map((c, i) =>
            i < num('minSelfRestedCharacters') ? { ...c, isRested: true } : c,
          ),
        },
      },
    }
  }
  if (has('minOppRestedCharacters') || has('minOppRestedAny') || has('minOppCharacters')) {
    const want =
      (num('minOppRestedCharacters') || num('minOppRestedAny') || num('minOppCharacters')) ?? 1
    while (s.players[opp].characters.length < Math.min(5, want))
      s = addChar(s, opp, SMALL_VANILLA, { isRested: true }).state
    const p = s.players[opp]
    s = {
      ...s,
      players: {
        ...s.players,
        [opp]: { ...p, characters: p.characters.map((c) => ({ ...c, isRested: true })) },
      },
    }
  }
  if (has('minSelfRestedAny')) {
    const p = s.players[owner]
    s = {
      ...s,
      players: {
        ...s.players,
        [owner]: { ...p, characters: p.characters.map((c) => ({ ...c, isRested: true })) },
      },
    }
    // leave enough active DON to pay an onPlay cost; paying rests DON anyway
    s = restOwnDon(s, owner, Math.min(5, num('minSelfRestedAny')))
  }
  if (has('minTurnNumber')) {
    s = { ...s, turnNumber: Math.max(s.turnNumber, num('minTurnNumber')) }
  }
  if (has('minOppGivenDon')) {
    const p = s.players[opp]
    s = {
      ...s,
      players: {
        ...s.players,
        [opp]: { ...p, leader: { ...p.leader, attachedDon: num('minOppGivenDon') } },
      },
    }
  }
  if (cond.charNamedPowerAtLeast) {
    const q = cond.charNamedPowerAtLeast as { name: string; power: number }
    const match = getAllCards().find((c) => c.cardType === 'Character' && cardHasName(c.id, q.name))
    if (match) {
      const want = Math.max(0, Math.ceil((q.power - (match.power ?? 0)) / 1000))
      addOwn(match.id, { attachedDon: Math.min(want, 10) })
    }
  }
  for (const key of ['hasCharacterNamed', 'hasOtherCharacterNamed'] as const) {
    if (typeof cond[key] === 'string') {
      const match = getAllCards().find(
        (c) => c.cardType === 'Character' && cardHasName(c.id, cond[key] as string),
      )
      if (match) addOwn(match.id)
    }
  }
  if (Array.isArray(cond.hasCharacterNamedAny)) {
    const match = getAllCards().find(
      (c) =>
        c.cardType === 'Character' &&
        (cond.hasCharacterNamedAny as string[]).some((n) => cardHasName(c.id, n)),
    )
    if (match) addOwn(match.id)
  }
  if (typeof cond.hasCharacterTypeIncludes === 'string') {
    const id = findCharWhere((c) =>
      (c.attribute ?? []).includes(cond.hasCharacterTypeIncludes as string),
    )
    if (id) addOwn(id)
  }
  if (typeof cond.hasOtherCharacterTyped === 'string') {
    const id = findCharWhere((c) =>
      (c.attribute ?? []).includes(cond.hasOtherCharacterTyped as string),
    )
    if (id) addOwn(id)
  }
  if (cond.hasOtherCharacterTypedColor) {
    const q = cond.hasOtherCharacterTypedColor as { type: string; color: string }
    const id = findCharWhere(
      (c) => (c.attribute ?? []).includes(q.type) && (c.color ?? []).some((col) => col === q.color),
    )
    if (id) addOwn(id)
  }
  if (
    typeof cond.allSelfCharsTyped === 'string' ||
    typeof cond.allSelfCharsTypeContains === 'string'
  ) {
    const t = (cond.allSelfCharsTyped ?? cond.allSelfCharsTypeContains) as string
    const id = findCharWhere((c) =>
      (c.attribute ?? []).some((x) => (cond.allSelfCharsTyped ? x === t : x.includes(t))),
    )
    if (id) {
      const p = s.players[owner]
      s = { ...s, players: { ...s.players, [owner]: { ...p, characters: [] } } }
      addOwn(id)
    }
  }
  if (cond.minSelfCharsTypedAny) {
    const q = cond.minSelfCharsTypedAny as { types: string[]; count: number }
    for (let i = 0; i < q.count; i++) {
      const id = findCharWhere((c) => q.types.some((t) => (c.attribute ?? []).includes(t)))
      if (id) addOwn(id)
    }
  }
  if (cond.minSelfCharsTypedDistinct) {
    const q = cond.minSelfCharsTypedDistinct as { type: string; count: number }
    const matches = getAllCards().filter(
      (c) => c.cardType === 'Character' && (c.attribute ?? []).includes(q.type),
    )
    const names = new Set<string>()
    for (const m of matches) {
      if (names.size >= q.count) break
      if (names.has(m.name)) continue
      names.add(m.name)
      addOwn(m.id)
    }
  }
  if (cond.charTypedPowerAtLeast) {
    const q = cond.charTypedPowerAtLeast as { type: string; power: number }
    const id = findCharWhere((c) => (c.attribute ?? []).includes(q.type))
    if (id) {
      const want = Math.max(0, Math.ceil((q.power - (getCardById(id)?.power ?? 0)) / 1000))
      addOwn(id, { attachedDon: Math.min(want, 5) })
    }
  }
  if (cond.charTypedCostAtLeast) {
    const q = cond.charTypedCostAtLeast as { type: string; cost: number; contains?: boolean }
    const id = findCharWhere(
      (c) =>
        (q.contains
          ? (c.attribute ?? []).some((t) => t.includes(q.type))
          : (c.attribute ?? []).includes(q.type)) && c.cost >= Math.min(q.cost, 10),
    )
    if (id) addOwn(id)
  }
  for (const key of ['minSelfCharCost', 'anyCharacterCostAtLeast', 'selfCostAtLeast'] as const) {
    if (has(key)) {
      const n = num(key)
      if (n > 10)
        addOwn('OP17-085') // Dorry: printed 5, +12-cost static
      else {
        const id = findCharWhere((c) => c.cost >= n)
        if (id) addOwn(id)
      }
    }
  }
  if (cond.minSelfCharsCostAtLeast) {
    const q = cond.minSelfCharsCostAtLeast as { cost: number; count: number }
    for (let i = 0; i < q.count; i++) {
      const id = findCharWhere((c) => c.cost >= Math.min(q.cost, 10))
      if (id) addOwn(id)
    }
  }
  for (const key of ['oppCharPowerAtLeast', 'oppBasePowerAtLeast'] as const) {
    if (has(key)) {
      const id = findCharWhere((c) => (c.power ?? 0) >= num(key))
      if (id && s.players[opp].characters.length < 5) s = addChar(s, opp, id).state
    }
  }
  if (has('otherCharPowerAtLeast')) {
    const id = findCharWhere((c) => (c.power ?? 0) >= num('otherCharPowerAtLeast'))
    if (id) addOwn(id)
  }
  if (has('oppCharCostAtMost')) {
    const id = findCharWhere((c) => c.cost <= num('oppCharCostAtMost'))
    if (id && s.players[opp].characters.length < 5) s = addChar(s, opp, id).state
  }
  if (cond.allSelfDonRested) s = restOwnDon(s, owner, 10)
  if (has('minSelfRestedDon')) s = restOwnDon(s, owner, num('minSelfRestedDon'))
  if (has('maxActiveDonSelf')) s = restOwnDon(s, owner, Math.max(0, 10 - num('maxActiveDonSelf')))
  if (has('maxDonField')) s = withDon(s, owner, Math.min(10, num('maxDonField')))
  if (cond.oppMoreDon) s = withDon(s, owner, 5)
  if (has('oppDonAdvantageAtLeast'))
    s = withDon(s, owner, Math.max(0, 10 - num('oppDonAdvantageAtLeast')))
  if (has('minSelfGivenDon')) {
    const p = s.players[owner]
    s = {
      ...s,
      players: {
        ...s.players,
        [owner]: { ...p, leader: { ...p.leader, attachedDon: num('minSelfGivenDon') } },
      },
    }
  }
  if (cond.oppCharKoedThisTurn) {
    s = {
      ...s,
      turnFlags: { ...s.turnFlags, [owner]: [...(s.turnFlags[owner] ?? []), 'oppCharKoed'] },
    }
  }
  if (has('anyCharacterCostAtMost') || has('oppCharCostAtMost')) {
    // no printed cost-0 characters exist; a -10 cost modifier gets effective cost there
    const key = has('anyCharacterCostAtMost') ? 'anyCharacterCostAtMost' : 'oppCharCostAtMost'
    const side = key === 'oppCharCostAtMost' ? opp : owner
    if (s.players[side].characters.length < 5) {
      const mod = {
        kind: 'cost' as const,
        value: -(10 - num(key)),
        duration: 'turn' as const,
        sourceCardId: 'HARNESS',
      }
      s = addChar(s, side, SMALL_VANILLA, { modifiers: [mod] }).state
    }
  }
  if (has('leaderPowerAtMost')) {
    const p = s.players[owner]
    const mod = {
      kind: 'power' as const,
      value: num('leaderPowerAtMost') - 5000,
      duration: 'turn' as const,
      sourceCardId: 'HARNESS',
    }
    s = {
      ...s,
      players: {
        ...s.players,
        [owner]: { ...p, leader: { ...p.leader, modifiers: [...p.leader.modifiers, mod] } },
      },
    }
  }
  if (has('maxLifePlusHandSelf')) {
    const budget = num('maxLifePlusHandSelf')
    s = setLife(s, owner, Math.min(2, budget))
    s = trimHand(s, owner, Math.max(0, budget - Math.min(2, budget)))
  }
  if (cond.oppAtLeastSelfDon) s = withDon(s, owner, 7)
  if (has('minOppRestedAny')) {
    const p = s.players[opp]
    s = {
      ...s,
      players: {
        ...s.players,
        [opp]: {
          ...p,
          donArea: p.donArea.map((d) => ({ ...d, isRested: true })),
          characters: p.characters.map((c) => ({ ...c, isRested: true })),
        },
      },
    }
  }
  if (cond.minCharsCostAtLeastAnywhere) {
    const q = cond.minCharsCostAtLeastAnywhere as { cost: number; count: number }
    for (let i = 0; i < q.count; i++) {
      const id = findCharWhere((c) => c.cost >= Math.min(q.cost, 10))
      if (id) addOwn(id)
    }
  }
  if (cond.minOppCharsBasePowerAtLeast) {
    const q = cond.minOppCharsBasePowerAtLeast as { power: number; count: number }
    for (let i = 0; i < q.count && s.players[opp].characters.length < 5; i++) {
      const id = findCharWhere((c) => (c.power ?? 0) >= q.power)
      if (id) s = addChar(s, opp, id).state
    }
  }
  if (cond.minSelfRestedCharsTyped) {
    const q = cond.minSelfRestedCharsTyped as { type: string; count: number }
    for (let i = 0; i < q.count; i++) {
      const id = findCharWhere((c) => (c.attribute ?? []).includes(q.type))
      if (id) addOwn(id, { isRested: true })
    }
  }
  if (cond.minSelfCharsTotalCost !== undefined) {
    const id = findCharWhere((c) => c.cost >= 9)
    if (id) {
      addOwn(id)
      addOwn(id)
    }
  }
  if (cond.maxSelfCharsPoweredAtLeast) {
    const q = cond.maxSelfCharsPoweredAtLeast as { power: number; count: number }
    const p = s.players[owner]
    const keep: GameCard[] = []
    let strong = 0
    for (const c of p.characters) {
      const pw = getCardById(c.cardId)?.power ?? 0
      if (pw >= q.power) {
        if (strong >= Math.max(0, q.count - 1)) continue
        strong++
      }
      keep.push(c)
    }
    s = { ...s, players: { ...s.players, [owner]: { ...p, characters: keep } } }
  }
  if (has('charDisadvantageAtLeast')) {
    const p = s.players[owner]
    s = { ...s, players: { ...s.players, [owner]: { ...p, characters: [] } } }
    while (s.players[opp].characters.length < Math.min(5, num('charDisadvantageAtLeast'))) {
      s = addChar(s, opp, SMALL_VANILLA).state
    }
  }
  return s
}

function withDon(state: GameState, pid: PlayerId, active = 10): GameState {
  const p = state.players[pid]
  const pool = [...p.donArea, ...p.donDeck]
  const donArea = pool.slice(0, active).map((d) => ({ ...d, isRested: false }))
  return {
    ...state,
    players: { ...state.players, [pid]: { ...p, donArea, donDeck: pool.slice(active) } },
  }
}

function seedTrash(state: GameState, pid: PlayerId, count: number): GameState {
  const p = state.players[pid]
  const deck = [...p.deck]
  const trash = [...p.trash, ...deck.splice(Math.max(0, deck.length - count))]
  return { ...state, players: { ...state.players, [pid]: { ...p, deck, trash } } }
}

function addChar(
  state: GameState,
  pid: PlayerId,
  cardId: string,
  props: Partial<GameCard> = {},
): { state: GameState; card: GameCard } {
  const card = { ...createGameCard(cardId, pid), turnPlayed: 1, ...props }
  const p = state.players[pid]
  return {
    state: {
      ...state,
      players: { ...state.players, [pid]: { ...p, characters: [...p.characters, card] } },
    },
    card,
  }
}

function addHand(
  state: GameState,
  pid: PlayerId,
  cardId: string,
): { state: GameState; card: GameCard } {
  const card = createGameCard(cardId, pid)
  const p = state.players[pid]
  return {
    state: { ...state, players: { ...state.players, [pid]: { ...p, hand: [...p.hand, card] } } },
    card,
  }
}

function leaderFor(cardId: string, rawCond?: AnyCond): string {
  // A leader's own defs need the card itself leading the test game
  if (getCardById(cardId)?.cardType === 'Leader') return cardId
  const fallback = LEADER_FOR.get(cardId) ?? 'OP01-001'
  // anyOf hides leader conditions in its branches; satisfy the first branch
  const cond: AnyCond | undefined =
    rawCond && Array.isArray(rawCond.anyOf) && rawCond.anyOf.length > 0
      ? { ...(rawCond.anyOf[0] as AnyCond), ...rawCond, anyOf: undefined }
      : rawCond
  if (!cond) return 'OP01-001'
  const want = (l: { id: string; name: string; attribute: string[]; color: string[] }): boolean => {
    if (typeof cond.leaderNameIs === 'string' && !cardHasName(l.id, cond.leaderNameIs)) return false
    if (
      typeof cond.leaderTypeIncludes === 'string' &&
      !(l.attribute ?? []).includes(cond.leaderTypeIncludes)
    )
      return false
    if (
      typeof cond.leaderTypeContains === 'string' &&
      !(l.attribute ?? []).some((t) => t.includes(cond.leaderTypeContains as string))
    )
      return false
    if (
      Array.isArray(cond.leaderTypeIncludesAny) &&
      !(cond.leaderTypeIncludesAny as string[]).some((t) => (l.attribute ?? []).includes(t))
    )
      return false
    if (
      typeof cond.leaderColorIncludes === 'string' &&
      !(l.color ?? []).some((c) => c === cond.leaderColorIncludes)
    )
      return false
    if (cond.leaderMulticolor === true && (l.color ?? []).length < 2) return false
    if (
      typeof cond.leaderAttributeIs === 'string' &&
      getBattleAttribute(l.id) !== cond.leaderAttributeIs
    )
      return false
    return true
  }
  const hasLeaderCond = Object.keys(cond).some((k) => k.startsWith('leader'))
  // A neutral leader otherwise: coverage leaders carry their own rules
  // (Teach's noOnPlay negates every [On Play] in the test game)
  if (!hasLeaderCond) return 'OP01-001'
  const fb = getCardById(fallback)
  if (fb && want(fb as never)) return fallback
  const found = getAllCards().find((c) => c.cardType === 'Leader' && want(c as never))
  return found ? found.id : fallback
}

function baseState(cardId: string, cond?: AnyCond): GameState {
  const leader1 = leaderFor(cardId, cond)
  setRandomSource(mulberry32(97))
  let s = createGame(makeAutoDeck(leader1), makeAutoDeck('OP01-001'))
  s = processAction(s, { type: 'MULLIGAN', accept: true }, whoActs(s)!).state
  s = processAction(s, { type: 'MULLIGAN', accept: true }, whoActs(s)!).state
  resetRandomSource()
  s = { ...s, currentPlayer: 'player1', turnNumber: 7, phase: 'MAIN', battle: null }
  s = withDon(s, 'player1')
  s = withDon(s, 'player2')
  s = seedTrash(s, 'player1', 16)
  s = seedTrash(s, 'player2', 6)
  // Bystanders: targets for selects and bodies for board conditions
  s = addChar(s, 'player1', BIG_VANILLA).state
  s = addChar(s, 'player2', BIG_VANILLA).state
  s = addChar(s, 'player2', SMALL_VANILLA, { isRested: true }).state
  return s
}

// ─── Driving ────────────────────────────────────────────────────────────────

function cardTotal(state: GameState, pid: PlayerId): number {
  const p = state.players[pid]
  return (
    p.deck.length +
    p.hand.length +
    p.trash.length +
    p.lifeCards.length +
    p.characters.length +
    (p.stage ? 1 : 0)
  )
}
function donTotal(state: GameState, pid: PlayerId): number {
  const p = state.players[pid]
  return (
    p.donArea.length +
    p.donDeck.length +
    p.leader.attachedDon +
    p.characters.reduce((n, c) => n + c.attachedDon, 0)
  )
}

/** The scenario builders conjure cards, so conservation is checked as a DELTA
 * from the state the drive starts in, not against the printed 50/10. */
function checkDelta(state: GameState, base: Record<PlayerId, [number, number]>): string | null {
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    if (cardTotal(state, pid) !== base[pid][0]) {
      return `${pid} card conservation drift: ${cardTotal(state, pid)} != ${base[pid][0]}`
    }
    if (donTotal(state, pid) !== base[pid][1]) {
      return `${pid} DON conservation drift: ${donTotal(state, pid)} != ${base[pid][1]}`
    }
    if (state.players[pid].characters.length > 5) return `${pid} over the character cap`
    for (const c of state.players[pid].characters) {
      if (c.attachedDon < 0) return `${pid} negative attached DON`
    }
  }
  const pc = state.pendingChoice
  if (pc) {
    if (pc.options.length === 0) return 'pendingChoice with zero options'
    if (new Set(pc.options).size !== pc.options.length) return 'pendingChoice duplicate options'
  }
  if (state.stack.length > 20) return `stack depth ${state.stack.length}`
  return null
}

/** Resolve all pending decisions under the policy; stop at a quiet MAIN state. */
function drive(
  state: GameState,
  policy: Policy,
  rand: () => number,
  prefer?: (a: GameAction) => boolean,
  maxSteps = 120,
): { state: GameState; violation?: string } {
  let s = state
  const base: Record<PlayerId, [number, number]> = {
    player1: [cardTotal(s, 'player1'), donTotal(s, 'player1')],
    player2: [cardTotal(s, 'player2'), donTotal(s, 'player2')],
  }
  for (let step = 0; step < maxSteps; step++) {
    const busy =
      s.pendingChoice || s.pendingTrigger || s.battle || s.pendingEndTurn || s.stack.length > 0
    if (!busy || s.winner) return { state: s }
    const actor = whoActs(s)
    if (!actor) return { state: s }
    const actions = legalActions(s)
    if (actions.length === 0) return { state: s, violation: 'busy state with no legal actions' }
    let action = prefer ? actions.find(prefer) : undefined
    if (!action) {
      if (s.pendingTrigger) {
        action = actions.find((a) => a.type === 'ACTIVATE_TRIGGER' && a.accept) ?? actions[0]
      } else if (policy === 'min') {
        action = actions.reduce((best, a) => (weight(a) < weight(best) ? a : best))
      } else if (policy === 'max') {
        action = actions.reduce((best, a) => (weight(a) > weight(best) ? a : best))
      } else {
        action = actions[Math.floor(rand() * actions.length)]
      }
    }
    s = processAction(s, action, actor).state
    const bad = checkDelta(s, base)
    if (bad) return { state: s, violation: bad }
  }
  return { state: s, violation: 'did not quiesce within step budget' }
}

function weight(a: GameAction): number {
  if (a.type === 'CHOOSE') return a.instanceIds.length
  if (a.type === 'PASS_COUNTER' || a.type === 'DECLINE_BLOCK') return 0
  return 1
}

// ─── Scenario builders per timing ───────────────────────────────────────────

function matchesGuard(cardId: string, g: SelectFilter): boolean {
  const d = getCardById(cardId)
  if (!d || d.cardType !== 'Character') return false
  const types = d.attribute ?? []
  if (g.typeIncludes && !types.includes(g.typeIncludes)) return false
  if (g.typeContains && !types.some((t) => t.includes(g.typeContains!))) return false
  if (g.typeIncludesAny && !g.typeIncludesAny.some((t) => types.includes(t))) return false
  if (g.nameIs && !cardHasName(cardId, g.nameIs)) return false
  if (g.nameNot && cardHasName(cardId, g.nameNot)) return false
  if (g.colorIncludes && !(d.color ?? []).some((c) => c === g.colorIncludes)) return false
  if (g.costAtMost !== undefined && d.cost > g.costAtMost) return false
  if (g.baseCostAtMost !== undefined && d.cost > g.baseCostAtMost) return false
  if (g.basePowerAtMost !== undefined && (d.power ?? 0) > g.basePowerAtMost) return false
  if (g.basePowerIs !== undefined && (d.power ?? 0) !== g.basePowerIs) return false
  if (g.baseCostAtLeast !== undefined && d.cost < g.baseCostAtLeast) return false
  if (g.basePowerAtLeast !== undefined && (d.power ?? 0) < g.basePowerAtLeast) return false
  if (g.powerAtLeast !== undefined && (d.power ?? 0) < g.powerAtLeast) return false
  if (g.powerAtMost !== undefined && (d.power ?? 0) > g.powerAtMost) return false
  if (g.attributeIs && getBattleAttribute(cardId) !== g.attributeIs) return false
  return true
}

function findVictim(g: SelectFilter): string | null {
  for (const c of getAllCards()) {
    if (c.cardType === 'Character' && !c.effectText && matchesGuard(c.id, g)) return c.id
  }
  for (const c of getAllCards()) {
    if (c.cardType === 'Character' && matchesGuard(c.id, g)) return c.id
  }
  return null
}

function syntheticEvent(
  def: EffectDef,
  owner: PlayerId,
  opp: PlayerId,
  self: GameCard,
): EngineEvent | null {
  const q = def.on
  if (!q) return null
  const player = q.anyPlayer ? owner : q.who === 'self' ? owner : opp
  const ev: EngineEvent = { kind: q.kind, player }
  if (q.minCount !== undefined) ev.count = q.minCount
  else if (q.kind === 'donReturned') ev.count = 1
  if (q.byOwnEffect) ev.byController = owner
  else if (q.byOppEffect) ev.byController = opp
  else ev.byController = player
  if (q.byEffect) ev.byBattle = false
  if (q.sourceIsSelf) ev.sourceInstanceId = self.instanceId
  if (q.attackerIsLeader !== undefined) ev.attackerIsLeader = q.attackerIsLeader
  if (q.targetIsLeader !== undefined) ev.targetIsLeader = q.targetIsLeader
  // find a card satisfying the payload filters
  const needCard =
    q.removedTypeIncludes ||
    q.removedTypeContains ||
    q.basePowerAtLeast !== undefined ||
    q.minCost !== undefined ||
    q.withTrigger ||
    q.noBaseEffect ||
    q.removedOwn
  if (needCard) {
    const match = getAllCards().find((c) => {
      const types = c.attribute ?? []
      if (q.removedTypeIncludes && !types.includes(q.removedTypeIncludes)) return false
      if (q.removedTypeContains && !types.some((t) => t.includes(q.removedTypeContains!)))
        return false
      if (q.basePowerAtLeast !== undefined && (c.power ?? 0) < q.basePowerAtLeast) return false
      if (q.minCost !== undefined && c.cost < q.minCost) return false
      if (q.withTrigger && !c.triggerText) return false
      if (q.noBaseEffect && c.effectText) return false
      return true
    })
    if (!match) return null
    ev.cardId = match.id
    ev.cardOwner = q.removedOwn ? owner : opp
  }
  if (q.fromHand !== undefined) ev.fromHand = q.fromHand
  else if (q.kind === 'characterPlayed') ev.fromHand = true
  return ev
}

export function fireDef(cardId: string, defIndex: number, policy: Policy): DefFireResult {
  const def = getEffectDefs(cardId)[defIndex]
  const timing = def.timing
  const result = (status: Status, detail?: string): DefFireResult => ({
    cardId,
    defIndex,
    timing,
    policy,
    status,
    detail,
  })
  const data = getCardById(cardId)
  if (!data) return result('noScenario', 'no card data')
  const rand = mulberry32(1234 + defIndex)
  const before = effectUsageSnapshot()[`${cardId}:${timing}`] ?? 0

  try {
    const owner: PlayerId = 'player1'
    const opp: PlayerId = 'player2'
    let s = baseState(cardId, def.condition as AnyCond | undefined)
    // Typed hand and trash from the card's own coverage deck: typed costs
    // ("trash a {X} card from your hand") become payable
    const deckMates = (
      buildCoverageDecks(cardId.slice(0, cardId.indexOf('-')))
        .find((d) => d.deck.cards.some((e) => e.cardId === cardId))
        ?.deck.cards.map((e) => e.cardId) ?? []
    ).filter((id) => id !== cardId)
    for (const mate of deckMates.slice(0, 5)) s = addHand(s, owner, mate).state
    {
      const p = s.players[owner]
      const extra = deckMates.slice(0, 10).map((id) => createGameCard(id, owner))
      s = { ...s, players: { ...s.players, [owner]: { ...p, trash: [...p.trash, ...extra] } } }
    }
    s = tuneForCond(s, owner, opp, def.condition as AnyCond | undefined)
    // onBlock scenarios place the def's card on the DEFENDER's side: tune there too
    if (def.timing === 'onBlock') {
      s = tuneForCond(s, opp, owner, def.condition as AnyCond | undefined)
    }
    if (
      def.condition &&
      (def.condition as AnyCond).opponentsTurn &&
      ['onKo', 'guardKo', 'replaceKo', 'onEvent'].includes(timing)
    ) {
      s = { ...s, currentPlayer: opp }
    }
    const condAny = def.condition as AnyCond | undefined
    const stamp: Partial<GameCard> = {}
    if (condAny?.selfPlayedThisTurn) stamp.turnPlayed = 7
    if (typeof condAny?.selfPowerAtLeast === 'number') {
      const need = Math.ceil((condAny.selfPowerAtLeast - (data.power ?? 0)) / 1000)
      stamp.attachedDon = Math.max(def.donRequired ?? 0, Math.min(10, Math.max(0, need)))
    }
    if (condAny?.selfRested === true) stamp.isRested = true
    if (typeof condAny?.selfCostAtLeast === 'number' && condAny.selfCostAtLeast > data.cost) {
      stamp.modifiers = [
        {
          kind: 'cost',
          value: condAny.selfCostAtLeast - data.cost,
          duration: 'turn',
          sourceCardId: 'HARNESS',
        },
      ]
    }
    const events: never[] = []
    let driven: { state: GameState; violation?: string } | null = null

    const finish = (st: GameState) => {
      driven = drive(st, policy, rand)
      return driven
    }

    switch (timing) {
      case 'onPlay': {
        if (data.cardType === 'Leader') return result('noScenario', 'leader onPlay')
        const { state: st, card } = addHand(s, owner, cardId)
        s = st
        const kick = { type: 'PLAY_CARD', cardInstanceId: card.instanceId } as const
        let v = validateAction(s, kick, owner)
        if (!v.valid) {
          // Conds that cap field DON below the card's cost (ST10-008) make a
          // rules-legal play impossible; a one-shot discount stands in for the
          // effect-play that reaches these cards in real games
          s = {
            ...s,
            playDiscounts: {
              ...s.playDiscounts,
              [owner]: [...(s.playDiscounts?.[owner] ?? []), { amount: data.cost }],
            },
          }
          v = validateAction(s, kick, owner)
          if (!v.valid) return result('notFired', `PLAY_CARD refused: ${v.reason}`)
        }
        driven = drive(processAction(s, kick, owner).state, policy, rand)
        break
      }
      case 'main': {
        const { state: st, card } = addHand(s, owner, cardId)
        driven = drive(
          processAction(st, { type: 'PLAY_CARD', cardInstanceId: card.instanceId }, owner).state,
          policy,
          rand,
        )
        break
      }
      case 'activateMain': {
        let st: GameState
        let target: GameCard
        if (data.cardType === 'Leader') {
          st = {
            ...s,
            players: {
              ...s.players,
              [owner]: {
                ...s.players[owner],
                leader: { ...s.players[owner].leader, attachedDon: def.donRequired ?? 0 },
              },
            },
          }
          target = st.players[owner].leader
        } else if (data.cardType === 'Stage') {
          target = createGameCard(cardId, owner)
          st = { ...s, players: { ...s.players, [owner]: { ...s.players[owner], stage: target } } }
        } else {
          const added = addChar(s, owner, cardId, { attachedDon: def.donRequired ?? 0, ...stamp })
          st = added.state
          target = added.card
        }
        driven = drive(
          processAction(
            st,
            {
              type: 'ACTIVATE_EFFECT',
              cardInstanceId: target.instanceId,
              effectId: String(defIndex),
            },
            owner,
          ).state,
          policy,
          rand,
        )
        break
      }
      case 'whenAttacking': {
        const added =
          data.cardType === 'Leader'
            ? null
            : addChar(s, owner, cardId, { attachedDon: def.donRequired ?? 0, ...stamp })
        const st = added
          ? added.state
          : {
              ...s,
              players: {
                ...s.players,
                [owner]: {
                  ...s.players[owner],
                  leader: { ...s.players[owner].leader, attachedDon: def.donRequired ?? 0 },
                },
              },
            }
        const attackerId = added ? added.card.instanceId : st.players[owner].leader.instanceId
        const targetId = st.players[opp].leader.instanceId
        driven = drive(
          processAction(st, { type: 'DECLARE_ATTACK', attackerId, targetId }, owner).state,
          policy,
          rand,
        )
        break
      }
      case 'afterBattleKo': {
        const added = addChar(s, owner, cardId, { attachedDon: def.donRequired ?? 0, ...stamp })
        const victim = addChar(added.state, opp, SMALL_VANILLA, { isRested: true })
        driven = drive(
          processAction(
            victim.state,
            {
              type: 'DECLARE_ATTACK',
              attackerId: added.card.instanceId,
              targetId: victim.card.instanceId,
            },
            owner,
          ).state,
          policy,
          rand,
        )
        break
      }
      case 'onBlock': {
        const blocker = addChar(s, opp, cardId, { attachedDon: def.donRequired ?? 0, ...stamp })
        const attacker = addChar(blocker.state, owner, BIG_VANILLA)
        const st = processAction(
          attacker.state,
          {
            type: 'DECLARE_ATTACK',
            attackerId: attacker.card.instanceId,
            targetId: st0Leader(attacker.state, opp),
          },
          owner,
        ).state
        driven = drive(
          st,
          policy,
          rand,
          (a) => a.type === 'ACTIVATE_BLOCKER' && a.blockerId === blocker.card.instanceId,
        )
        break
      }
      case 'counter': {
        const inHand = addHand(s, owner, cardId)
        const attacker = addChar(inHand.state, opp, BIG_VANILLA)
        let st: GameState = { ...attacker.state, currentPlayer: opp }
        st = processAction(
          st,
          {
            type: 'DECLARE_ATTACK',
            attackerId: attacker.card.instanceId,
            targetId: st.players[owner].leader.instanceId,
          },
          opp,
        ).state
        driven = drive(
          st,
          policy,
          rand,
          (a) => a.type === 'PLAY_COUNTER_EVENT' && a.cardInstanceId === inHand.card.instanceId,
        )
        break
      }
      case 'trigger': {
        const card = createGameCard(cardId, owner)
        const p = s.players[owner]
        let st: GameState = {
          ...s,
          players: { ...s.players, [owner]: { ...p, lifeCards: [card, ...p.lifeCards] } },
        }
        const attacker = addChar(st, opp, BIG_VANILLA)
        st = { ...attacker.state, currentPlayer: opp }
        st = processAction(
          st,
          {
            type: 'DECLARE_ATTACK',
            attackerId: attacker.card.instanceId,
            targetId: st.players[owner].leader.instanceId,
          },
          opp,
        ).state
        driven = drive(st, policy, rand)
        break
      }
      case 'onKo': {
        const added = addChar(s, owner, cardId, { attachedDon: def.donRequired ?? 0, ...stamp })
        let st = koById(added.state, added.card.instanceId, events, { controller: opp })
        if (st.players[owner].characters.some((c) => c.instanceId === added.card.instanceId)) {
          // effect-K.O. prevented by a self-protection static: K.O. in battle instead
          st = koById(st, added.card.instanceId, events, { byBattle: true })
        }
        st = runStack(st, events)
        driven = finish(st)
        break
      }
      case 'replaceKo':
      case 'guardKo': {
        let st = s
        let victimId: string
        if (timing === 'guardKo' && def.guard) {
          const guardAdd = addChar(st, owner, cardId, {
            attachedDon: def.donRequired ?? 0,
            ...stamp,
          })
          st = guardAdd.state
          const victimCard = findVictim(def.guard)
          if (!victimCard) return result('noScenario', 'no victim matches guard filter')
          const victimAdd = addChar(st, owner, victimCard, { isRested: def.guard.rested === true })
          st = victimAdd.state
          victimId = victimAdd.card.instanceId
        } else {
          const selfAdd = addChar(st, owner, cardId, {
            attachedDon: def.donRequired ?? 0,
            ...stamp,
          })
          st = selfAdd.state
          victimId = selfAdd.card.instanceId
        }
        if (def.guardScope === 'removal') {
          st = removeByEffect(st, victimId, 'hand', events, { controller: opp })
        } else {
          st = koById(st, victimId, events, {
            controller: def.replaceWhen === 'battle' ? owner : opp,
            byBattle: def.replaceWhen === 'battle',
          })
        }
        st = runStack(st, events)
        driven = finish(st)
        break
      }
      case 'onEvent': {
        if (data.cardType === 'Leader' && def.donRequired) {
          const p = s.players[owner]
          s = {
            ...s,
            players: {
              ...s.players,
              [owner]: { ...p, leader: { ...p.leader, attachedDon: def.donRequired } },
            },
          }
        }
        const added =
          data.cardType === 'Leader'
            ? { state: s, card: s.players[owner].leader }
            : data.cardType === 'Stage'
              ? (() => {
                  const c = createGameCard(cardId, owner)
                  return {
                    state: {
                      ...s,
                      players: { ...s.players, [owner]: { ...s.players[owner], stage: c } },
                    },
                    card: c,
                  }
                })()
              : addChar(s, owner, cardId, { attachedDon: def.donRequired ?? 0, ...stamp })
        let evState = added.state
        const ev = syntheticEvent(def, owner, opp, added.card)
        if (!ev) return result('noScenario', 'no payload satisfies the event query')
        if (def.on?.attackerAttributeIs) {
          const want = def.on.attackerAttributeIs
          const atkId = findCharWhere((c) => getBattleAttribute(c.id) === want)
          if (!atkId) return result('noScenario', 'no attacker with the required attribute')
          const atk = addChar(evState, opp, atkId)
          evState = atk.state
          ev.sourceInstanceId = atk.card.instanceId
        }
        let st = emitEngineEvent(evState, ev)
        st = runStack(st, events)
        driven = finish(st)
        break
      }
      case 'endOfTurn': {
        const added = addChar(s, owner, cardId, { attachedDon: def.donRequired ?? 0, ...stamp })
        driven = drive(processAction(added.state, { type: 'END_TURN' }, owner).state, policy, rand)
        break
      }
      case 'startOfTurn': {
        const added = addChar(s, owner, cardId, { attachedDon: def.donRequired ?? 0, ...stamp })
        const st: GameState = { ...added.state, currentPlayer: opp }
        driven = drive(processAction(st, { type: 'END_TURN' }, opp).state, policy, rand)
        break
      }
      default:
        return result('noScenario', `unhandled timing ${timing}`)
    }

    if (driven?.violation) return result('violation', driven.violation)
    const after = effectUsageSnapshot()[`${cardId}:${timing}`] ?? 0
    if (after > before) return result('fired')
    const condKeys = def.condition ? Object.keys(def.condition).join(',') : ''
    return result('notFired', condKeys ? `cond: ${condKeys}` : 'window/cost/target unmet')
  } catch (e) {
    return result('error', e instanceof Error ? `${e.message}` : String(e))
  }
}

function st0Leader(state: GameState, pid: PlayerId): string {
  return state.players[pid].leader.instanceId
}

export function runDefFire(policies: Policy[] = ['min', 'max', 'random']): DefFireResult[] {
  resetEffectUsage()
  const results: DefFireResult[] = []
  for (const mod of SET_MODULES) {
    for (const cardId of Object.keys(mod.effects)) {
      const defs = getEffectDefs(cardId)
      for (let i = 0; i < defs.length; i++) {
        for (const policy of policies) {
          results.push(fireDef(cardId, i, policy))
        }
      }
    }
  }
  return results
}
