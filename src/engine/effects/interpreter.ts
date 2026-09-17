import type {
  GameState,
  GameCard,
  GameEvent,
  PlayerId,
  EffectFrame,
  Modifier,
} from '../types'
import type { CardDataFilter, EffectOp, EffectTiming, SelectFilter } from './ast'
import { getEffectDefs } from './registry'
import { recordEffectFired } from './telemetry'
import { evalCond, cardTypes } from './statics'
import { getCardById } from '@/data/cardService'
import { getEffectivePower } from '../powerCalc'
import { getOpponent } from '../turnManager'
import { createGameCard } from '../gameSetup'
import { shuffle } from '@/utils/shuffle'
import { MAX_CHARACTERS } from '../constants'

/**
 * Effect interpreter: runs frames from state.stack until the stack empties or an
 * op pauses on a player choice (state.pendingChoice). Choice ops are two-phase:
 * with no binding they publish a pendingChoice and wait; once the CHOOSE action
 * writes the binding, the same op re-executes and applies the result.
 */

function defMatches(
  state: GameState,
  controller: PlayerId,
  card: GameCard,
  timing: EffectTiming,
  defIndex: number,
): boolean {
  const def = getEffectDefs(card.cardId)[defIndex]
  if (!def || def.timing !== timing) return false
  if (def.donRequired && card.attachedDon < def.donRequired) return false
  return evalCond(state, controller, card, def.condition)
}

/** Queue every matching effect def on a card as a frame. Caller runs the stack. */
export function queueEffects(
  state: GameState,
  card: GameCard,
  timing: EffectTiming,
  controller: PlayerId,
): GameState {
  const defs = getEffectDefs(card.cardId)
  const frames: EffectFrame[] = []
  let s = state
  for (let i = 0; i < defs.length; i++) {
    if (!defMatches(s, controller, card, timing, i)) continue
    if (defs[i].oncePerTurn) {
      const key = `t${i}`
      const live = findFieldCard(s, card.instanceId)
      if (live) {
        if (live.activatedThisTurn.includes(key)) continue
        s = updateFieldCard(s, card.instanceId, (c) => ({
          ...c,
          activatedThisTurn: [...c.activatedThisTurn, key],
        }))
      }
    }
    frames.push(makeFrame(card, controller, timing, i))
  }
  if (frames.length === 0) return s
  // Card text resolves top to bottom (CR 1-3-7): first def runs first, so it goes on top
  return { ...s, stack: [...s.stack, ...frames.reverse()] }
}

/** Push one specific def (activated abilities, counter events, activateTiming).
 * `defCardId` overrides which registry entry supplies the ops - used by
 * rule-processing pseudo-defs ('$boardFull') acting on a real card instance. */
export function pushFrame(
  state: GameState,
  card: GameCard,
  controller: PlayerId,
  timing: EffectTiming,
  defIndex: number,
  defCardId?: string,
): GameState {
  return {
    ...state,
    stack: [...state.stack, makeFrame(card, controller, timing, defIndex, defCardId)],
  }
}

function makeFrame(
  card: GameCard,
  controller: PlayerId,
  timing: EffectTiming,
  defIndex: number,
  defCardId?: string,
): EffectFrame {
  const sourceCardId = defCardId ?? card.cardId
  recordEffectFired(sourceCardId, timing)
  return {
    sourceInstanceId: card.instanceId,
    sourceCardId,
    controller,
    pc: 0,
    timing,
    defIndex,
    bindings: { self: [card.instanceId] },
  }
}

export function runStack(state: GameState, events: GameEvent[]): GameState {
  let s = state
  let guard = 300
  while (s.stack.length > 0 && !s.pendingChoice && !s.winner && guard-- > 0) {
    const frame = s.stack[s.stack.length - 1]
    const def = getEffectDefs(frame.sourceCardId)[frame.defIndex]
    if (!def || frame.pc >= def.ops.length) {
      s = { ...s, stack: s.stack.slice(0, -1) }
      continue
    }
    s = executeOp(s, frame, def.ops[frame.pc], events)
  }
  return s
}

/** Resolve a CHOOSE action into the paused frame's bindings; caller runs the stack. */
export function applyChoice(state: GameState, instanceIds: string[]): GameState {
  const choice = state.pendingChoice!
  const stack = [...state.stack]
  const top = { ...stack[stack.length - 1] }
  top.bindings = { ...top.bindings, [choice.bind]: instanceIds }
  stack[stack.length - 1] = top
  return { ...state, stack, pendingChoice: null }
}

function advance(state: GameState, popFrame = false): GameState {
  const stack = [...state.stack]
  if (popFrame) {
    stack.pop()
  } else {
    const top = { ...stack[stack.length - 1] }
    top.pc += 1
    stack[stack.length - 1] = top
  }
  return { ...state, stack }
}

function executeOp(
  state: GameState,
  frame: EffectFrame,
  op: EffectOp,
  events: GameEvent[],
): GameState {
  const controller = frame.controller
  const refs = (name: string) => frame.bindings[name] ?? []

  switch (op.op) {
    case 'draw':
      return advance(drawCards(state, controller, op.count, events))

    case 'select': {
      if (op.bind in frame.bindings) return advance(state)
      const options = selectOptions(state, frame, op.filter)
      if (options.length === 0 || op.max === 0) {
        return advance({ ...state, stack: withBinding(state.stack, op.bind, []) })
      }
      const chooser = op.chooser === 'opponent' ? getOpponent(controller) : controller
      return {
        ...state,
        pendingChoice: {
          playerId: chooser,
          prompt: op.prompt,
          options,
          min: Math.min(op.min, options.length),
          max: op.max,
          exact: op.exact,
          bind: op.bind,
        },
      }
    }

    case 'abortIfEmpty':
      return advance(state, refs(op.ref).length === 0)

    case 'requireCond': {
      const source = findFieldCard(state, frame.sourceInstanceId)
      return advance(state, !evalCond(state, controller, source, op.cond))
    }

    case 'powerMod':
    case 'grantKeyword':
    case 'grantFlag': {
      const modifier: Modifier =
        op.op === 'powerMod'
          ? { kind: 'power', value: op.amount, duration: op.duration, sourceCardId: frame.sourceCardId }
          : op.op === 'grantKeyword'
            ? { kind: 'keyword', value: 0, keyword: op.keyword, duration: op.duration, sourceCardId: frame.sourceCardId }
            : { kind: 'flag', value: op.value ?? 0, flag: op.flag, duration: op.duration, sourceCardId: frame.sourceCardId }
      if (modifier.duration === 'untilYourNextTurn') modifier.expiresFor = controller
      if (op.op === 'grantFlag' && op.duration === 'untilTurn') {
        modifier.untilTurn = state.turnNumber + (op.untilTurnOffset ?? 0)
      }
      let s = state
      for (const id of refs(op.ref)) {
        s = updateFieldCard(s, id, (c) => ({ ...c, modifiers: [...c.modifiers, modifier] }))
      }
      return advance(s)
    }

    case 'ko': {
      let s = state
      for (const id of refs(op.ref)) s = koById(s, id, events)
      return advance(s)
    }

    case 'koAll': {
      const targets: string[] = []
      for (const pid of ['player1', 'player2'] as PlayerId[]) {
        if (op.owner === 'opponent' && pid === controller) continue
        for (const c of state.players[pid].characters) {
          if (op.excludeSelf && c.instanceId === frame.sourceInstanceId) continue
          targets.push(c.instanceId)
        }
      }
      let s = state
      for (const id of targets) s = koById(s, id, events)
      return advance(s)
    }

    case 'trashFromField': {
      // Not a K.O. (CR 3-7-6-1-1, 10-2-1-3): no [On K.O.] effects fire
      let s = state
      for (const id of refs(op.ref)) s = removeFromField(s, id, 'trash')
      return advance(s)
    }

    case 'rest':
    case 'setActive': {
      const rested = op.op === 'rest'
      let s = state
      for (const id of refs(op.ref)) {
        s = updateFieldCard(s, id, (c) => ({ ...c, isRested: rested }))
      }
      return advance(s)
    }

    case 'bottomDeck': {
      let s = state
      for (const id of refs(op.ref)) s = moveHandToDeckBottom(s, controller, id)
      return advance(s)
    }

    case 'bottomDeckFromField': {
      let s = state
      for (const id of refs(op.ref)) s = removeFromField(s, id, 'deckBottom')
      return advance(s)
    }

    case 'returnToHand': {
      let s = state
      for (const id of refs(op.ref)) s = removeFromField(s, id, 'hand')
      return advance(s)
    }

    case 'toHand': {
      let s = state
      for (const id of refs(op.ref)) s = trashToHand(s, controller, id)
      return advance(s)
    }

    case 'trashCards': {
      let s = state
      for (const id of refs(op.ref)) s = handToTrash(s, id)
      return advance(s)
    }

    case 'lifeToHand': {
      let s = state
      for (const id of refs(op.ref)) {
        const p = s.players[controller]
        const idx = p.lifeCards.findIndex((c) => c.instanceId === id)
        if (idx < 0) continue
        const lifeCards = [...p.lifeCards]
        const [card] = lifeCards.splice(idx, 1)
        s = {
          ...s,
          players: { ...s.players, [controller]: { ...p, lifeCards, hand: [...p.hand, card] } },
        }
      }
      return advance(s)
    }

    case 'playCards': {
      let s = state
      for (const id of refs(op.ref)) {
        s = playCardFree(s, controller, id, op.rested ?? false, events)
      }
      return advance(s)
    }

    case 'playSelf':
      return advance(playCardFree(state, controller, frame.sourceInstanceId, false, events))

    case 'searchTop': {
      const bind = `$op${frame.pc}`
      const p = state.players[controller]
      const top = p.deck.slice(0, op.count)
      if (!(bind in frame.bindings)) {
        const options = top
          .filter((c) => matchCardData(c.cardId, op.filter))
          .map((c) => c.instanceId)
        if (options.length === 0) {
          return advance(moveDeckTopToBottom(state, controller, top.map((c) => c.instanceId)))
        }
        return {
          ...state,
          pendingChoice: {
            playerId: controller,
            prompt: `Reveal up to ${op.upTo}`,
            options,
            min: 0,
            max: op.upTo,
            bind,
          },
        }
      }
      const chosen = new Set(frame.bindings[bind])
      let s = state
      for (const id of chosen) {
        if (op.to === 'play') s = playCardFree(s, controller, id, false, events)
        else s = deckToHand(s, controller, id)
      }
      const rest = top.filter((c) => !chosen.has(c.instanceId)).map((c) => c.instanceId)
      return advance(moveDeckTopToBottom(s, controller, rest))
    }

    case 'scryBottom': {
      const bind = `$op${frame.pc}`
      const p = state.players[controller]
      const top = p.deck.slice(0, op.count)
      if (!(bind in frame.bindings)) {
        if (top.length === 0) return advance(state)
        return {
          ...state,
          pendingChoice: {
            playerId: controller,
            prompt: 'Choose cards to place at the bottom of your deck',
            options: top.map((c) => c.instanceId),
            min: 0,
            max: top.length,
            bind,
          },
        }
      }
      return advance(moveDeckTopToBottom(state, controller, frame.bindings[bind]))
    }

    case 'searchDeckByName': {
      const bind = `$op${frame.pc}`
      const p = state.players[controller]
      if (!(bind in frame.bindings)) {
        const options = p.deck
          .filter((c) => getCardById(c.cardId)?.name === op.name)
          .slice(0, 8)
          .map((c) => c.instanceId)
        if (options.length === 0) return advance(shuffleDeck(state, controller))
        return {
          ...state,
          pendingChoice: {
            playerId: controller,
            prompt: `Add up to ${op.upTo} [${op.name}] to your hand`,
            options,
            min: 0,
            max: op.upTo,
            bind,
          },
        }
      }
      let s = state
      for (const id of frame.bindings[bind]) {
        if (op.to === 'play') s = playCardFree(s, controller, id, false, events)
        else s = deckToHand(s, controller, id)
      }
      return advance(shuffleDeck(s, controller))
    }

    case 'revealTopMayPlay': {
      const bind = `$op${frame.pc}`
      const p = state.players[controller]
      const top = p.deck[0]
      if (!(bind in frame.bindings)) {
        if (!top || !matchCardData(top.cardId, op.filter)) return advance(state)
        return {
          ...state,
          pendingChoice: {
            playerId: controller,
            prompt: 'Play the revealed card?',
            options: [top.instanceId],
            min: 0,
            max: 1,
            bind,
          },
        }
      }
      let s = state
      for (const id of frame.bindings[bind]) {
        s = playCardFree(s, controller, id, op.rested ?? false, events)
      }
      return advance(s)
    }

    case 'addDon': {
      const p = state.players[controller]
      const take = Math.min(op.count, p.donDeck.length)
      const donDeck = [...p.donDeck]
      const moved = donDeck.splice(0, take).map((d) => ({ ...d, isRested: op.rested }))
      return advance({
        ...state,
        players: {
          ...state.players,
          [controller]: { ...p, donDeck, donArea: [...p.donArea, ...moved] },
        },
      })
    }

    case 'giveRestedDon': {
      const p = state.players[controller]
      const source = findFieldCard(state, frame.sourceInstanceId)
      if (!source) return advance(state)
      const donArea = [...p.donArea]
      let moved = 0
      for (let i = donArea.length - 1; i >= 0 && moved < op.upTo; i--) {
        if (donArea[i].isRested) {
          donArea.splice(i, 1)
          moved++
        }
      }
      if (moved === 0) return advance(state)
      let s: GameState = {
        ...state,
        players: { ...state.players, [controller]: { ...p, donArea } },
      }
      s = updateFieldCard(s, source.instanceId, (c) => ({
        ...c,
        attachedDon: c.attachedDon + moved,
      }))
      return advance(s)
    }

    case 'returnDon': {
      const p = state.players[controller]
      const ids = new Set(refs(op.ref))
      const returned = p.donArea.filter((d) => ids.has(d.instanceId))
      const donArea = p.donArea.filter((d) => !ids.has(d.instanceId))
      return advance({
        ...state,
        players: {
          ...state.players,
          [controller]: {
            ...p,
            donArea,
            donDeck: [...p.donDeck, ...returned.map((d) => ({ ...d, isRested: false }))],
          },
        },
      })
    }

    case 'activateTiming': {
      const defs = getEffectDefs(frame.sourceCardId)
      let s = advance(state)
      for (let i = defs.length - 1; i >= 0; i--) {
        if (defs[i].timing !== op.timing) continue
        const card = locateCardAnywhere(s, controller, frame.sourceInstanceId)
        if (!card) break
        s = pushFrame(s, card, controller, op.timing, i)
      }
      return s
    }
  }
}

function withBinding(stack: EffectFrame[], bind: string, ids: string[]): EffectFrame[] {
  const next = [...stack]
  const top = { ...next[next.length - 1] }
  top.bindings = { ...top.bindings, [bind]: ids }
  next[next.length - 1] = top
  return next
}

// ─── Selection ───────────────────────────────────────────────────────────────

function selectOptions(state: GameState, frame: EffectFrame, filter: SelectFilter): string[] {
  const targetPlayer =
    filter.owner === 'self' ? frame.controller : getOpponent(frame.controller)
  const player = state.players[targetPlayer]
  let pool: GameCard[]
  switch (filter.zone) {
    case 'hand':
      pool = player.hand
      break
    case 'trash':
      pool = player.trash
      break
    case 'don':
      pool = player.donArea
      break
    case 'life':
      // "Add 1 card from your Life area" takes the top card
      pool = player.lifeCards.slice(0, 1)
      break
    case 'leaderOrCharacters':
      pool = [player.leader, ...player.characters]
      break
    default:
      pool = player.characters
  }

  const excluded = new Set<string>()
  if (filter.differentColorThanRef) {
    for (const id of frame.bindings[filter.differentColorThanRef] ?? []) {
      const bound = locateCardAnywhere(state, targetPlayer, id)
      if (bound) {
        const colors = new Set(getCardById(bound.cardId)?.color ?? [])
        for (const c of pool) {
          if ((getCardById(c.cardId)?.color ?? []).some((col) => colors.has(col))) {
            excluded.add(c.instanceId)
          }
        }
      }
    }
  }

  return pool
    .filter((c) => {
      if (excluded.has(c.instanceId)) return false
      const data = getCardById(c.cardId)
      if (filter.rested !== undefined && c.isRested !== filter.rested) return false
      if (filter.costAtMost !== undefined && (data?.cost ?? 0) > filter.costAtMost) return false
      if (filter.powerAtMost !== undefined && getEffectivePower(state, c) > filter.powerAtMost) {
        return false
      }
      if (filter.cardType && data?.cardType !== filter.cardType) return false
      if (filter.typeIncludes && !cardTypes(c.cardId).includes(filter.typeIncludes)) return false
      if (
        filter.typeIncludesAny &&
        !filter.typeIncludesAny.some((t) => cardTypes(c.cardId).includes(t))
      ) {
        return false
      }
      if (filter.colorIncludes && !(data?.color ?? []).some((c) => c === filter.colorIncludes)) {
        return false
      }
      if (filter.nameIs && data?.name !== filter.nameIs) return false
      if (filter.nameNot && data?.name === filter.nameNot) return false
      return true
    })
    .map((c) => c.instanceId)
}

function matchCardData(cardId: string, filter: CardDataFilter): boolean {
  const data = getCardById(cardId)
  if (!data) return false
  if (filter.cardType && data.cardType !== filter.cardType) return false
  if (filter.costAtMost !== undefined && data.cost > filter.costAtMost) return false
  if (filter.typeIncludes && !data.attribute.includes(filter.typeIncludes)) return false
  if (filter.colorIncludes && !data.color.some((c) => c === filter.colorIncludes)) return false
  if (filter.nameIs && data.name !== filter.nameIs) return false
  if (filter.nameNot && data.name === filter.nameNot) return false
  return true
}

// ─── State helpers ───────────────────────────────────────────────────────────

export function findFieldCard(state: GameState, instanceId: string): GameCard | null {
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    if (p.leader.instanceId === instanceId) return p.leader
    const c = p.characters.find((x) => x.instanceId === instanceId)
    if (c) return c
  }
  return null
}

function locateCardAnywhere(
  state: GameState,
  owner: PlayerId,
  instanceId: string,
): GameCard | null {
  const onField = findFieldCard(state, instanceId)
  if (onField) return onField
  const p = state.players[owner]
  for (const zone of [p.hand, p.trash, p.deck, p.lifeCards]) {
    const c = zone.find((x) => x.instanceId === instanceId)
    if (c) return c
  }
  return null
}

export function updateFieldCard(
  state: GameState,
  instanceId: string,
  fn: (c: GameCard) => GameCard,
): GameState {
  const players = { ...state.players }
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = players[pid]
    if (p.leader.instanceId === instanceId) {
      players[pid] = { ...p, leader: fn(p.leader) }
      return { ...state, players }
    }
    let idx = p.characters.findIndex((c) => c.instanceId === instanceId)
    if (idx >= 0) {
      const characters = [...p.characters]
      characters[idx] = fn(characters[idx])
      players[pid] = { ...p, characters }
      return { ...state, players }
    }
    idx = p.donArea.findIndex((c) => c.instanceId === instanceId)
    if (idx >= 0) {
      const donArea = [...p.donArea]
      donArea[idx] = fn(donArea[idx])
      players[pid] = { ...p, donArea }
      return { ...state, players }
    }
  }
  return state
}

/**
 * A character leaving the field: attached DON returns to the owner's cost area
 * rested (CR 6-5-5-4), and the instance loses modifiers (new-object rule 3-1-6).
 */
function removeFromField(
  state: GameState,
  instanceId: string,
  dest: 'trash' | 'hand' | 'deckBottom',
): GameState {
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    const idx = p.characters.findIndex((c) => c.instanceId === instanceId)
    if (idx < 0) continue
    const characters = [...p.characters]
    const [raw] = characters.splice(idx, 1)
    const returnedDon: GameCard[] = []
    for (let i = 0; i < raw.attachedDon; i++) {
      returnedDon.push({ ...createGameCard('DON', pid), isRested: true })
    }
    const card: GameCard = { ...raw, attachedDon: 0, modifiers: [], activatedThisTurn: [] }
    const next = { ...p, characters, donArea: [...p.donArea, ...returnedDon] }
    if (dest === 'trash') next.trash = [...next.trash, card]
    else if (dest === 'hand') next.hand = [...next.hand, card]
    else next.deck = [...next.deck, card]
    return { ...state, players: { ...state.players, [pid]: next } }
  }
  return state
}

/** K.O. a character by instance id: field -> trash, then queue its [On K.O.] effects. */
export function koById(state: GameState, instanceId: string, events: GameEvent[]): GameState {
  const card = findFieldCard(state, instanceId)
  if (!card) return state
  const owner = card.ownerId
  const s = removeFromField(state, instanceId, 'trash')
  if (s === state) return state
  events.push({
    type: 'CHARACTER_KO',
    playerId: owner,
    description: `${getCardById(card.cardId)?.name ?? 'Character'} was KO'd`,
  })
  // [On K.O.] activates on the field but resolves from the trash (CR 10-2-17)
  return queueEffects(s, card, 'onKo', owner)
}

export function drawCards(
  state: GameState,
  playerId: PlayerId,
  count: number,
  events: GameEvent[],
): GameState {
  let s = state
  for (let i = 0; i < count; i++) {
    const p = s.players[playerId]
    if (p.deck.length === 0) {
      events.push({
        type: 'GAME_WIN',
        playerId: getOpponent(playerId),
        description: `${playerId} decked out`,
      })
      return { ...s, winner: getOpponent(playerId) }
    }
    const deck = [...p.deck]
    const drawn = deck.shift()!
    s = {
      ...s,
      players: { ...s.players, [playerId]: { ...p, deck, hand: [...p.hand, drawn] } },
    }
  }
  return s
}

function moveHandToDeckBottom(state: GameState, playerId: PlayerId, instanceId: string): GameState {
  const p = state.players[playerId]
  const idx = p.hand.findIndex((c) => c.instanceId === instanceId)
  if (idx < 0) return state
  const hand = [...p.hand]
  const [card] = hand.splice(idx, 1)
  return {
    ...state,
    players: { ...state.players, [playerId]: { ...p, hand, deck: [...p.deck, card] } },
  }
}

function moveDeckTopToBottom(state: GameState, playerId: PlayerId, instanceIds: string[]): GameState {
  if (instanceIds.length === 0) return state
  const ids = new Set(instanceIds)
  const p = state.players[playerId]
  const moved = p.deck.filter((c) => ids.has(c.instanceId))
  const deck = [...p.deck.filter((c) => !ids.has(c.instanceId)), ...moved]
  return { ...state, players: { ...state.players, [playerId]: { ...p, deck } } }
}

function deckToHand(state: GameState, playerId: PlayerId, instanceId: string): GameState {
  const p = state.players[playerId]
  const idx = p.deck.findIndex((c) => c.instanceId === instanceId)
  if (idx < 0) return state
  const deck = [...p.deck]
  const [card] = deck.splice(idx, 1)
  return {
    ...state,
    players: { ...state.players, [playerId]: { ...p, deck, hand: [...p.hand, card] } },
  }
}

function shuffleDeck(state: GameState, playerId: PlayerId): GameState {
  const p = state.players[playerId]
  return {
    ...state,
    players: { ...state.players, [playerId]: { ...p, deck: shuffle([...p.deck]) } },
  }
}

function trashToHand(state: GameState, playerId: PlayerId, instanceId: string): GameState {
  const p = state.players[playerId]
  const idx = p.trash.findIndex((c) => c.instanceId === instanceId)
  if (idx < 0) return state
  const trash = [...p.trash]
  const [card] = trash.splice(idx, 1)
  return {
    ...state,
    players: { ...state.players, [playerId]: { ...p, trash, hand: [...p.hand, card] } },
  }
}

/** Trash a card from whichever player's hand holds it (covers opponent discards). */
function handToTrash(state: GameState, instanceId: string): GameState {
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    const idx = p.hand.findIndex((c) => c.instanceId === instanceId)
    if (idx < 0) continue
    const hand = [...p.hand]
    const [card] = hand.splice(idx, 1)
    return {
      ...state,
      players: { ...state.players, [pid]: { ...p, hand, trash: [...p.trash, card] } },
    }
  }
  return state
}

/** Play a card without paying its cost, from the controller's hand/deck/trash. */
function playCardFree(
  state: GameState,
  controller: PlayerId,
  instanceId: string,
  rested: boolean,
  events: GameEvent[],
): GameState {
  const p = state.players[controller]
  if (p.characters.length >= MAX_CHARACTERS) return state
  for (const zone of ['hand', 'trash', 'deck'] as const) {
    const idx = p[zone].findIndex((c) => c.instanceId === instanceId)
    if (idx < 0) continue
    const source = [...p[zone]]
    const [raw] = source.splice(idx, 1)
    if (getCardById(raw.cardId)?.cardType !== 'Character') return state
    const played: GameCard = {
      ...raw,
      isRested: rested,
      turnPlayed: state.turnNumber,
      modifiers: [],
      attachedDon: 0,
      activatedThisTurn: [],
    }
    let s: GameState = {
      ...state,
      players: {
        ...state.players,
        [controller]: { ...p, [zone]: source, characters: [...p.characters, played] },
      },
    }
    events.push({
      type: 'PLAY_CARD',
      playerId: controller,
      description: `${getCardById(raw.cardId)?.name ?? 'Card'} played by effect`,
    })
    s = queueEffects(s, played, 'onPlay', controller)
    return s
  }
  return state
}
