import type { GameState, GameCard, GameEvent, PlayerId, EffectFrame, Modifier } from '../types'
import type { CardDataFilter, EffectOp, EffectTiming, EngineEventKind, SelectFilter } from './ast'
import { getEffectDefs } from './registry'
import { recordEffectFired } from './telemetry'
import { evalCond, cardTypes, hasFlag, getEffectiveFieldCost, isNegated, donOnField } from './statics'
import { getCardById } from '@/data/cardService'
import { getEffectivePower } from '../powerCalc'
import { getOpponent } from '../turnManager'
import { hasKeyword } from '../keywords'
import { cardHasName, deckOutWinner, getBattleAttribute, getCardRules } from '../rulesLayer'
import { createGameCard } from '../gameSetup'
import { shuffle } from '@/utils/shuffle'
// Circular at module level with battleManager (which imports koById etc.);
// safe because both sides only call at run time
import { dealLifeDamage } from '../battleManager'
import { MAX_CHARACTERS } from '../constants'

export interface EngineEvent {
  kind: EngineEventKind
  /** The player the event happened to (activated / lost a character / dealt damage) */
  player: PlayerId
  /** characterPlayed: the played card */
  cardId?: string
  /** characterPlayed: played from its owner's hand */
  fromHand?: boolean
  /** lifeDamageDealt: the attacking card's instance */
  sourceInstanceId?: string
}

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
  if (isNegated(card)) return false
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

/**
 * Socket 1, the event pipeline: queue every field card's matching 'onEvent'
 * listener. The turn player's listeners are pushed last (stack top), so they
 * resolve first (CR 8-6-1). Caller runs the stack (or is already running it).
 */
export function emitEngineEvent(state: GameState, ev: EngineEvent): GameState {
  const order: PlayerId[] = [state.currentPlayer, getOpponent(state.currentPlayer)]
  const frames: EffectFrame[] = []
  let s = state
  for (const pid of order) {
    const p = s.players[pid]
    for (const card of [p.leader, ...p.characters, ...(p.stage ? [p.stage] : [])]) {
      const defs = getEffectDefs(card.cardId)
      for (let i = 0; i < defs.length; i++) {
        const def = defs[i]
        if (def.timing !== 'onEvent' || !def.on || def.on.kind !== ev.kind) continue
        const expected = def.on.who === 'self' ? pid : getOpponent(pid)
        if (ev.player !== expected) continue
        if (def.on.fromHand && !ev.fromHand) continue
        if (def.on.fromHand === false && ev.fromHand) continue
        if (
          def.on.minCost !== undefined &&
          (!ev.cardId || (getCardById(ev.cardId)?.cost ?? 0) < def.on.minCost)
        ) {
          continue
        }
        if (def.on.noBaseEffect && (!ev.cardId || getCardById(ev.cardId)?.effectText)) continue
        if (def.on.sourceIsSelf && ev.sourceInstanceId !== card.instanceId) continue
        if (!defMatches(s, pid, card, 'onEvent', i)) continue
        const marked = markOncePerTurn(s, card, def.oncePerTurn, `t${i}`)
        if (!marked) continue
        s = marked
        frames.push(makeFrame(card, pid, 'onEvent', i))
      }
    }
  }
  if (frames.length === 0) return s
  return { ...s, stack: [...s.stack, ...frames.reverse()] }
}

/** Queue the turn player's [End of Your Turn] effects (leader, characters, stage). */
export function queueEndOfTurnEffects(state: GameState): GameState {
  const pid = state.currentPlayer
  const p = state.players[pid]
  const frames: EffectFrame[] = []
  let s = state
  for (const card of [p.leader, ...p.characters, ...(p.stage ? [p.stage] : [])]) {
    const defs = getEffectDefs(card.cardId)
    for (let i = 0; i < defs.length; i++) {
      if (!defMatches(s, pid, card, 'endOfTurn', i)) continue
      const marked = markOncePerTurn(s, card, defs[i].oncePerTurn, `t${i}`)
      if (!marked) continue
      s = marked
      frames.push(makeFrame(card, pid, 'endOfTurn', i))
    }
  }
  if (frames.length === 0) return s
  return { ...s, stack: [...s.stack, ...frames.reverse()] }
}

export function queueStartOfTurnEffects(state: GameState): GameState {
  const pid = state.currentPlayer
  const p = state.players[pid]
  const frames: EffectFrame[] = []
  let s = state
  for (const card of [p.leader, ...p.characters, ...(p.stage ? [p.stage] : [])]) {
    const defs = getEffectDefs(card.cardId)
    for (let i = 0; i < defs.length; i++) {
      if (!defMatches(s, pid, card, 'startOfTurn', i)) continue
      const marked = markOncePerTurn(s, card, defs[i].oncePerTurn, `t${i}`)
      if (!marked) continue
      s = marked
      frames.push(makeFrame(card, pid, 'startOfTurn', i))
    }
  }
  if (frames.length === 0) return s
  return { ...s, stack: [...s.stack, ...frames.reverse()] }
}

/** Returns the state with the once-per-turn use marked, or null if already used. */
function markOncePerTurn(
  state: GameState,
  card: GameCard,
  oncePerTurn: boolean | undefined,
  key: string,
): GameState | null {
  if (!oncePerTurn) return state
  const live = findFieldCard(state, card.instanceId)
  if (!live || live.activatedThisTurn.includes(key)) return null
  return updateFieldCard(state, card.instanceId, (c) => ({
    ...c,
    activatedThisTurn: [...c.activatedThisTurn, key],
  }))
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
    case 'draw': {
      const drawer = op.who === 'opponent' ? getOpponent(controller) : controller
      if (state.turnFlags[drawer]?.includes('noEffectDraw')) return advance(state)
      return advance(drawCards(state, drawer, op.count, events))
    }

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

    case 'abortIfChosen':
      return advance(state, refs(op.ref).length > 0)

    case 'millSelf': {
      const p = state.players[controller]
      const take = Math.min(op.count, p.deck.length)
      if (take === 0) return advance(state)
      const deck = [...p.deck]
      const milled = deck.splice(0, take)
      return advance({
        ...state,
        players: {
          ...state.players,
          [controller]: { ...p, deck, trash: [...p.trash, ...milled] },
        },
      })
    }

    case 'deckTopToLife': {
      let s = state
      for (let i = 0; i < op.count; i++) {
        const p = s.players[controller]
        if (p.deck.length === 0) break
        const [top, ...deck] = p.deck
        s = {
          ...s,
          players: {
            ...s.players,
            [controller]: { ...p, deck, lifeCards: [{ ...top, revealed: false }, ...p.lifeCards] },
          },
        }
      }
      return advance(s)
    }

    case 'trashLifeTop': {
      const pid = op.owner === 'self' ? controller : getOpponent(controller)
      let s = state
      for (let i = 0; i < op.count; i++) {
        const p = s.players[pid]
        if (p.lifeCards.length === 0) break
        const [top, ...lifeCards] = p.lifeCards
        s = {
          ...s,
          players: { ...s.players, [pid]: { ...p, lifeCards, trash: [...p.trash, top] } },
        }
        s = emitEngineEvent(s, { kind: 'lifeRemoved', player: pid })
      }
      return advance(s)
    }

    case 'fieldToLife': {
      let s = state
      for (const id of refs(op.ref)) {
        if (removalBlocked(s, id, controller, events)) continue
        const card = findFieldCard(s, id)
        if (!card) continue
        const owner = card.ownerId
        const removed = removeFromField(s, id, 'trash')
        if (removed === s) continue
        // Redirect from trash to the top of the owner's life stack
        const p = removed.players[owner]
        const idx = p.trash.findIndex((c) => c.instanceId === id)
        if (idx < 0) {
          s = removed
          continue
        }
        const trash = [...p.trash]
        const [moved] = trash.splice(idx, 1)
        s = {
          ...removed,
          players: {
            ...removed.players,
            [owner]: { ...p, trash, lifeCards: [{ ...moved, revealed: false }, ...p.lifeCards] },
          },
        }
      }
      return advance(s)
    }

    case 'handToLife': {
      let s = state
      for (const id of refs(op.ref)) {
        const p = s.players[controller]
        const idx = p.hand.findIndex((c) => c.instanceId === id)
        if (idx < 0) continue
        const hand = [...p.hand]
        const [card] = hand.splice(idx, 1)
        s = {
          ...s,
          players: {
            ...s.players,
            [controller]: { ...p, hand, lifeCards: [{ ...card, revealed: false }, ...p.lifeCards] },
          },
        }
      }
      return advance(s)
    }

    case 'revealLifeTopMayPlay': {
      const bind = `$op${frame.pc}`
      const p = state.players[controller]
      const top = p.lifeCards[0]
      if (!top) return advance(state)
      if (!(bind in frame.bindings)) {
        if (!matchCardData(top.cardId, op.filter)) return advance(state)
        return {
          ...state,
          pendingChoice: {
            playerId: controller,
            prompt: 'Play the revealed Life card?',
            options: [top.instanceId],
            min: 0,
            max: 1,
            bind,
          },
        }
      }
      const chosen = frame.bindings[bind]
      if (chosen.length === 0) return advance(state)
      // Move the card out of life, then play it from a hand-like holding spot
      const lifeCards = p.lifeCards.slice(1)
      const s: GameState = {
        ...state,
        players: {
          ...state.players,
          [controller]: { ...p, lifeCards, hand: [...p.hand, { ...top, revealed: true }] },
        },
      }
      return advance(playCardFree(s, controller, top.instanceId, false, events))
    }

    case 'revealTopCheck': {
      const p = state.players[controller]
      const top = p.deck[0]
      if (!top) return advance(state)
      let s = state
      if (matchCardData(top.cardId, op.filter)) {
        const source = findFieldCard(s, frame.sourceInstanceId)
        if (source) {
          const modifier: Modifier = op.keyword
            ? {
                kind: 'keyword',
                value: 0,
                keyword: op.keyword,
                duration: op.duration,
                sourceCardId: frame.sourceCardId,
              }
            : {
                kind: 'power',
                value: op.amount,
                duration: op.duration,
                sourceCardId: frame.sourceCardId,
              }
          s = updateFieldCard(s, source.instanceId, (c) => ({
            ...c,
            modifiers: [...c.modifiers, modifier],
          }))
        }
      }
      return advance(moveDeckTopToBottom(s, controller, [top.instanceId]))
    }

    case 'shuffleHandIntoDeckDraw': {
      const pid = op.who === 'opponent' ? getOpponent(controller) : controller
      const p = state.players[pid]
      const count = op.draw ?? p.hand.length
      const shuffled = {
        ...state,
        players: {
          ...state.players,
          [pid]: {
            ...p,
            hand: [],
            deck: shuffle([...p.deck, ...p.hand.map((c) => ({ ...c, revealed: false }))]),
          },
        },
      }
      return advance(drawCards(shuffled, pid, count, events))
    }
    case 'basePowerToAttacker': {
      const attackerId = state.battle?.attackerId
      const attacker = attackerId ? findFieldCard(state, attackerId) : null
      const self = findFieldCard(state, frame.sourceInstanceId)
      if (!attacker || !self) return advance(state)
      const selfBase = getCardById(self.cardId)?.power ?? 0
      const delta = getEffectivePower(state, attacker) - selfBase
      const modifier: Modifier = {
        kind: 'power',
        value: delta,
        duration: op.duration,
        sourceCardId: frame.sourceCardId,
      }
      return advance(
        updateFieldCard(state, self.instanceId, (c) => ({
          ...c,
          modifiers: [...c.modifiers, modifier],
        })),
      )
    }

    case 'basePowerToOppLeader': {
      const self = findFieldCard(state, frame.sourceInstanceId)
      if (!self) return advance(state)
      const oppLeader = state.players[getOpponent(controller)].leader
      const selfBase = getCardById(self.cardId)?.power ?? 0
      const delta = getEffectivePower(state, oppLeader) - selfBase
      const modifier: Modifier = {
        kind: 'power',
        value: delta,
        duration: op.duration,
        sourceCardId: frame.sourceCardId,
      }
      if (modifier.duration === 'untilYourNextTurn') modifier.expiresFor = controller
      return advance(
        updateFieldCard(state, self.instanceId, (c) => ({
          ...c,
          modifiers: [...c.modifiers, modifier],
        })),
      )
    }

    case 'restAll': {
      const pid = op.owner === 'self' ? controller : getOpponent(controller)
      const p = state.players[pid]
      return advance({
        ...state,
        players: {
          ...state.players,
          [pid]: { ...p, characters: p.characters.map((c) => ({ ...c, isRested: true })) },
        },
      })
    }

    case 'dealDamage': {
      const s = dealLifeDamage(state, getOpponent(controller), op.count, false, events)
      return advance(s)
    }

    case 'requireRefPowerAtMost': {
      for (const id of refs(op.ref)) {
        const card = findFieldCard(state, id)
        if (card && getEffectivePower(state, card) > op.max) return advance(state, true)
      }
      return advance(state)
    }

    case 'requireRefCostAtMost': {
      for (const id of refs(op.ref)) {
        const card = findFieldCard(state, id)
        if (card && getEffectiveFieldCost(state, card) > op.max) return advance(state, true)
      }
      return advance(state)
    }

    case 'millPerRef': {
      const count = refs(op.countRef).length
      if (count === 0) return advance(state)
      const p = state.players[controller]
      const take = Math.min(count, p.deck.length)
      if (take === 0) return advance(state)
      const deck = [...p.deck]
      const milled = deck.splice(0, take)
      return advance({
        ...state,
        players: {
          ...state.players,
          [controller]: { ...p, deck, trash: [...p.trash, ...milled] },
        },
      })
    }

    case 'winGame':
      return advance({ ...state, winner: controller })

    case 'grantFlagAll': {
      const modifier: Modifier = {
        kind: 'flag',
        value: op.value ?? 0,
        flag: op.flag,
        duration: op.duration,
        sourceCardId: frame.sourceCardId,
      }
      if (modifier.duration === 'untilYourNextTurn') modifier.expiresFor = controller
      if (op.duration === 'untilTurn') {
        modifier.untilTurn = state.turnNumber + (op.untilTurnOffset ?? 0)
      }
      const p = state.players[controller]
      const targets = [
        ...(op.includeLeader ? [p.leader.instanceId] : []),
        ...p.characters.map((c) => c.instanceId),
      ]
      let s = state
      for (const id of targets) {
        s = updateFieldCard(s, id, (c) => ({ ...c, modifiers: [...c.modifiers, modifier] }))
      }
      return advance(s)
    }

    case 'guardResolve': {
      if (refs(op.choiceRef).length > 0) return advance(state) // guard paid: target lives
      let s = state
      for (const id of refs(op.targetRef)) {
        const card = findFieldCard(s, id)
        if (!card) continue
        const removed = removeFromField(s, id, 'trash')
        if (removed === s) continue
        s = removed
        events.push({
          type: 'CHARACTER_KO',
          playerId: card.ownerId,
          description: `${getCardById(card.cardId)?.name ?? 'Character'} was KO'd`,
        })
        s = queueEffects(s, card, 'onKo', card.ownerId)
        s = emitEngineEvent(s, { kind: 'characterKoed', player: card.ownerId })
      }
      return advance(s, true) // guard declined: stop this frame
    }

    case 'lifeToTrash': {
      let s = state
      for (const id of refs(op.ref)) {
        for (const pid of ['player1', 'player2'] as PlayerId[]) {
          const p = s.players[pid]
          const idx = p.lifeCards.findIndex((c) => c.instanceId === id)
          if (idx < 0) continue
          const lifeCards = [...p.lifeCards]
          const [card] = lifeCards.splice(idx, 1)
          s = {
            ...s,
            players: { ...s.players, [pid]: { ...p, lifeCards, trash: [...p.trash, card] } },
          }
          s = emitEngineEvent(s, { kind: 'lifeRemoved', player: pid })
          break
        }
      }
      return advance(s)
    }

    case 'extraTurn':
      return advance({ ...state, extraTurnFor: controller })

    case 'removeAll': {
      let s = state
      for (const pid of ['player1', 'player2'] as PlayerId[]) {
        if (op.owner === 'self' && pid !== controller) continue
        if (op.owner === 'opponent' && pid === controller) continue
        for (const c of [...s.players[pid].characters]) {
          if (op.excludeSelf && c.instanceId === frame.sourceInstanceId) continue
          if (op.costAtMost !== undefined && getEffectiveFieldCost(s, c) > op.costAtMost) continue
          if (op.rested !== undefined && c.isRested !== op.rested) continue
          if (op.dest === 'trash') s = koById(s, c.instanceId, events, { controller })
          else {
            if (removalBlocked(s, c.instanceId, controller, events)) continue
            s = removeFromField(s, c.instanceId, 'deckBottom')
          }
        }
      }
      return advance(s)
    }

    case 'discardTo': {
      let s = state
      for (const pid of ['player1', 'player2'] as PlayerId[]) {
        if (op.who === 'self' && pid !== controller) continue
        if (op.who === 'opponent' && pid === controller) continue
        const p = s.players[pid]
        if (p.hand.length <= op.count) continue
        const hand = [...p.hand]
        const trashed = hand.splice(op.count)
        s = {
          ...s,
          players: { ...s.players, [pid]: { ...p, hand, trash: [...p.trash, ...trashed] } },
        }
      }
      return advance(s)
    }

    case 'lifeFaceUp': {
      const p = state.players[controller]
      const faceDown = p.lifeCards.filter((c) => !c.revealed)
      if (faceDown.length < op.count) return advance(state, true)
      let flipped = 0
      const lifeCards = p.lifeCards.map((c) => {
        if (!c.revealed && flipped < op.count) {
          flipped++
          return { ...c, revealed: true }
        }
        return c
      })
      return advance({
        ...state,
        players: { ...state.players, [controller]: { ...p, lifeCards } },
      })
    }

    case 'lifeFaceDown': {
      const p = state.players[controller]
      const faceUp = p.lifeCards.filter((c) => c.revealed).length
      if (op.count !== 'all' && faceUp < op.count) return advance(state, true)
      const want = op.count === 'all' ? faceUp : op.count
      let flipped = 0
      const lifeCards = p.lifeCards.map((c) => {
        if (c.revealed && flipped < want) {
          flipped++
          return { ...c, revealed: false }
        }
        return c
      })
      return advance({
        ...state,
        players: { ...state.players, [controller]: { ...p, lifeCards } },
      })
    }

    case 'millTopCheck': {
      const p = state.players[controller]
      if (p.deck.length === 0) return advance(state)
      const [top, ...deck] = p.deck
      let s: GameState = {
        ...state,
        players: {
          ...state.players,
          [controller]: { ...p, deck, trash: [...p.trash, top] },
        },
      }
      if (matchCardData(top.cardId, op.filter)) {
        const modifier: Modifier = {
          kind: 'power',
          value: op.amount,
          duration: op.duration,
          sourceCardId: frame.sourceCardId,
        }
        for (const id of refs(op.ref)) {
          s = updateFieldCard(s, id, (c) => ({ ...c, modifiers: [...c.modifiers, modifier] }))
        }
      }
      return advance(s)
    }

    case 'peekOppTop': {
      const opp = state.players[getOpponent(controller)]
      if (opp.deck.length === 0) return advance(state)
      const [top, ...rest] = opp.deck
      return advance({
        ...state,
        players: {
          ...state.players,
          [getOpponent(controller)]: { ...opp, deck: [{ ...top, revealed: true }, ...rest] },
        },
      })
    }

    case 'costGuessCheck': {
      const oppId = getOpponent(controller)
      const opp = state.players[oppId]
      const top = opp.deck[0]
      if (!top) return advance(state, true)
      const known = top.revealed === true
      // The public reveal happens either way
      const s: GameState = {
        ...state,
        players: {
          ...state.players,
          [oppId]: { ...opp, deck: [{ ...top, revealed: true }, ...opp.deck.slice(1)] },
        },
      }
      // Without prior knowledge the guess is treated as a miss (SIMPLIFIED)
      return known ? advance(s) : advance(s, true)
    }

    case 'activateEventFromHand': {
      let s = state
      for (const id of refs(op.ref)) {
        const p = s.players[controller]
        const idx = p.hand.findIndex((c) => c.instanceId === id)
        if (idx < 0) continue
        if (getCardById(p.hand[idx].cardId)?.cardType !== 'Event') continue
        const hand = [...p.hand]
        const [card] = hand.splice(idx, 1)
        s = {
          ...s,
          players: {
            ...s.players,
            [controller]: { ...p, hand, trash: [...p.trash, card] },
          },
        }
        events.push({
          type: 'PLAY_CARD',
          playerId: controller,
          description: `${getCardById(card.cardId)?.name ?? 'Event'} activated by effect`,
        })
        s = emitEngineEvent(s, { kind: 'eventActivated', player: controller })
        s = queueEffects(s, card, 'main', controller)
      }
      return advance(s)
    }

    case 'koSelfNoReplace': {
      const card = findFieldCard(state, frame.sourceInstanceId)
      if (!card) return advance(state)
      const s = removeFromField(state, frame.sourceInstanceId, 'trash')
      if (s === state) return advance(state)
      events.push({
        type: 'CHARACTER_KO',
        playerId: card.ownerId,
        description: `${getCardById(card.cardId)?.name ?? 'Character'} was KO'd`,
      })
      let out = queueEffects(s, card, 'onKo', card.ownerId)
      out = emitEngineEvent(out, { kind: 'characterKoed', player: card.ownerId })
      return advance(out)
    }

    case 'trashToDeckBottom': {
      let s = state
      for (const id of refs(op.ref)) {
        for (const pid of ['player1', 'player2'] as PlayerId[]) {
          const p = s.players[pid]
          const idx = p.trash.findIndex((c) => c.instanceId === id)
          if (idx < 0) continue
          const trash = [...p.trash]
          const [moved] = trash.splice(idx, 1)
          s = {
            ...s,
            players: {
              ...s.players,
              [pid]: { ...p, trash, deck: [...p.deck, { ...moved, revealed: false }] },
            },
          }
          break
        }
      }
      return advance(s)
    }

    case 'trashIntoDeckShuffle': {
      const p = state.players[controller]
      const take = Math.min(op.count, p.trash.length)
      if (take === 0) return advance(state)
      const moved = p.trash.slice(0, take).map((c) => ({ ...c, revealed: false }))
      return advance({
        ...state,
        players: {
          ...state.players,
          [controller]: {
            ...p,
            trash: p.trash.slice(take),
            deck: shuffle([...p.deck, ...moved]),
          },
        },
      })
    }

    case 'requireCond': {
      const source = findFieldCard(state, frame.sourceInstanceId)
      return advance(state, !evalCond(state, controller, source, op.cond))
    }

    case 'powerMod':
    case 'grantKeyword':
    case 'grantFlag': {
      // (untilTurn durations pick up their expiry turn below)
      const modifier: Modifier =
        op.op === 'powerMod'
          ? {
              kind: 'power',
              value: op.amount,
              duration: op.duration,
              sourceCardId: frame.sourceCardId,
            }
          : op.op === 'grantKeyword'
            ? {
                kind: 'keyword',
                value: 0,
                keyword: op.keyword,
                duration: op.duration,
                sourceCardId: frame.sourceCardId,
              }
            : {
                kind: 'flag',
                value: op.value ?? 0,
                flag: op.flag,
                duration: op.duration,
                sourceCardId: frame.sourceCardId,
              }
      if (modifier.duration === 'untilYourNextTurn') modifier.expiresFor = controller
      if (op.duration === 'untilTurn') {
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
      const before = refs(op.ref).filter((id) => findFieldCard(s, id)).length
      for (const id of refs(op.ref)) s = koById(s, id, events, { controller })
      const after = refs(op.ref).filter((id) => findFieldCard(s, id)).length
      if (after < before) {
        s = emitEngineEvent(s, { kind: 'charRemovedByEffect', player: controller })
      }
      return advance(s)
    }

    case 'moveAttachedDon': {
      const targetId = refs(op.toRef)[0]
      const target = targetId ? findFieldCard(state, targetId) : null
      if (!target) return advance(state)
      let s = state
      let moved = 0
      const owner = s.players[controller]
      for (const source of [owner.leader, ...owner.characters]) {
        if (moved >= op.upTo || source.instanceId === targetId) continue
        const take = Math.min(source.attachedDon, op.upTo - moved)
        if (take === 0) continue
        s = updateFieldCard(s, source.instanceId, (c) => ({ ...c, attachedDon: c.attachedDon - take }))
        moved += take
      }
      if (moved > 0) {
        s = updateFieldCard(s, targetId, (c) => ({ ...c, attachedDon: c.attachedDon + moved }))
      }
      return advance(s)
    }

    case 'setPower': {
      let s = state
      for (const id of refs(op.ref)) {
        const card = findFieldCard(s, id)
        if (!card) continue
        const modifier: Modifier = {
          kind: 'power',
          value: op.value - getEffectivePower(s, card),
          duration: op.duration,
          sourceCardId: frame.sourceCardId,
        }
        if (modifier.duration === 'untilYourNextTurn') modifier.expiresFor = controller
        s = updateFieldCard(s, id, (c) => ({ ...c, modifiers: [...c.modifiers, modifier] }))
      }
      return advance(s)
    }

    case 'selfToHand': {
      for (const pid of ['player1', 'player2'] as PlayerId[]) {
        const p = state.players[pid]
        const idx = p.trash.findIndex((c) => c.instanceId === frame.sourceInstanceId)
        if (idx < 0) continue
        const trash = [...p.trash]
        const [card] = trash.splice(idx, 1)
        return advance({
          ...state,
          players: {
            ...state.players,
            [pid]: { ...p, trash, hand: [...p.hand, { ...card, revealed: true }] },
          },
        })
      }
      return advance(state)
    }

    case 'costMod': {
      const modifier: Modifier = {
        kind: 'cost',
        value: op.amount,
        duration: op.duration,
        sourceCardId: frame.sourceCardId,
      }
      if (op.duration === 'untilTurn') {
        modifier.untilTurn = state.turnNumber + (op.untilTurnOffset ?? 0)
      }
      let s = state
      for (const id of refs(op.ref)) {
        s = updateFieldCard(s, id, (c) => ({ ...c, modifiers: [...c.modifiers, modifier] }))
      }
      return advance(s)
    }

    case 'powerModPerRef': {
      const units = op.per ? Math.floor(refs(op.countRef).length / op.per) : refs(op.countRef).length
      const amount = op.amountPer * units
      if (amount === 0) return advance(state)
      const modifier: Modifier = {
        kind: 'power',
        value: amount,
        duration: op.duration,
        sourceCardId: frame.sourceCardId,
      }
      if (modifier.duration === 'untilYourNextTurn') modifier.expiresFor = controller
      let s = state
      for (const id of refs(op.ref)) {
        s = updateFieldCard(s, id, (c) => ({ ...c, modifiers: [...c.modifiers, modifier] }))
      }
      return advance(s)
    }

    case 'scryLifeTops': {
      const bind = `$op${frame.pc}`
      if (!(bind in frame.bindings)) {
        const options = (['player1', 'player2'] as PlayerId[])
          .map((pid) => state.players[pid].lifeCards[0])
          .filter((c): c is GameCard => !!c)
          .map((c) => c.instanceId)
        if (options.length === 0) return advance(state)
        return {
          ...state,
          pendingChoice: { playerId: controller, prompt: op.prompt, options, min: 0, max: 1, bind },
        }
      }
      let s = state
      for (const id of frame.bindings[bind]) {
        for (const pid of ['player1', 'player2'] as PlayerId[]) {
          const p = s.players[pid]
          if (p.lifeCards[0]?.instanceId !== id) continue
          const [top, ...rest] = p.lifeCards
          s = {
            ...s,
            players: { ...s.players, [pid]: { ...p, lifeCards: [...rest, top] } },
          }
        }
      }
      return advance(s)
    }

    case 'powerModAll': {
      const modifier: Modifier = {
        kind: 'power',
        value: op.amount,
        duration: op.duration,
        sourceCardId: frame.sourceCardId,
      }
      if (modifier.duration === 'untilYourNextTurn') modifier.expiresFor = controller
      const who = op.who === 'opponent' ? getOpponent(controller) : controller
      const p = state.players[who]
      const targets = [
        ...(op.includeLeader ? [p.leader.instanceId] : []),
        ...p.characters.map((c) => c.instanceId),
      ]
      let s = state
      for (const id of targets) {
        s = updateFieldCard(s, id, (c) => ({ ...c, modifiers: [...c.modifiers, modifier] }))
      }
      return advance(s)
    }

    case 'drawTo': {
      if (state.turnFlags[controller]?.includes('noEffectDraw')) return advance(state)
      const deficit = op.count - state.players[controller].hand.length
      return advance(deficit > 0 ? drawCards(state, controller, deficit, events) : state)
    }

    case 'lifeTopToHand': {
      const who = op.who === 'opponent' ? getOpponent(controller) : controller
      if (state.turnFlags[who]?.includes('noLifeToHand')) return advance(state)
      let s = state
      for (let i = 0; i < op.count; i++) {
        const p = s.players[who]
        if (p.lifeCards.length === 0) break
        const [top, ...rest] = p.lifeCards
        s = {
          ...s,
          players: {
            ...s.players,
            [who]: { ...p, lifeCards: rest, hand: [...p.hand, { ...top, revealed: false }] },
          },
        }
        s = emitEngineEvent(s, { kind: 'lifeAddedToHand', player: who })
        s = emitEngineEvent(s, { kind: 'lifeRemoved', player: who })
      }
      return advance(s)
    }

    case 'oppReturnDon': {
      const oppId = getOpponent(controller)
      const opp = state.players[oppId]
      // Forced return; returning rested DON first is the opponent-optimal pick
      const sorted = [...opp.donArea].sort((a, b) => Number(b.isRested) - Number(a.isRested))
      const returned = sorted.slice(0, op.count)
      if (returned.length === 0) return advance(state)
      const ids = new Set(returned.map((d) => d.instanceId))
      let s: GameState = {
        ...state,
        players: {
          ...state.players,
          [oppId]: {
            ...opp,
            donArea: opp.donArea.filter((d) => !ids.has(d.instanceId)),
            donDeck: [...opp.donDeck, ...returned.map((d) => ({ ...d, isRested: false }))],
          },
        },
      }
      s = emitEngineEvent(s, { kind: 'donReturned', player: oppId })
      return advance(s)
    }

    case 'restrictSelf': {
      const flags = state.turnFlags[controller] ?? []
      if (flags.includes(op.restriction)) return advance(state)
      return advance({
        ...state,
        turnFlags: { ...state.turnFlags, [controller]: [...flags, op.restriction] },
      })
    }

    case 'grantPlayDiscount': {
      const discounts = state.playDiscounts[controller] ?? []
      const discount = {
        amount: op.amount,
        cardType: op.cardType,
        typeIncludes: op.typeIncludes,
        minCost: op.minCost,
        nameIs: op.nameIs,
      }
      return advance({
        ...state,
        playDiscounts: { ...state.playDiscounts, [controller]: [...discounts, discount] },
      })
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
      for (const id of targets) s = koById(s, id, events, { controller })
      return advance(s)
    }

    case 'trashFromField': {
      // Not a K.O. (CR 3-7-6-1-1, 10-2-1-3): no [On K.O.] effects fire
      let s = state
      const before = charCount(s)
      for (const id of refs(op.ref)) s = removeFromField(s, id, 'trash')
      if (charCount(s) < before) {
        s = emitEngineEvent(s, { kind: 'charRemovedByEffect', player: controller })
      }
      return advance(s)
    }

    case 'rest':
    case 'setActive': {
      const rested = op.op === 'rest'
      let s = state
      let restedAChar = false
      for (const id of refs(op.ref)) {
        if (rested) {
          const card = findFieldCard(s, id)
          if (card && hasFlag(s, card, 'noRest')) continue
          const isChar = ['player1', 'player2'].some((pid) =>
            s.players[pid as PlayerId].characters.some((c) => c.instanceId === id),
          )
          if (card && isChar && !card.isRested) restedAChar = true
        }
        s = updateFieldCard(s, id, (c) => ({ ...c, isRested: rested }))
      }
      // "a Character is rested by your effect" listeners (Bartolomeo); cost
      // rests are not distinguished from effect rests (SIMPLIFIED)
      if (restedAChar) s = emitEngineEvent(s, { kind: 'restedByEffect', player: controller })
      return advance(s)
    }

    case 'bottomDeck': {
      let s = state
      for (const id of refs(op.ref)) {
        for (const pid of ['player1', 'player2'] as PlayerId[]) {
          if (s.players[pid].hand.some((c) => c.instanceId === id)) {
            s = moveHandToDeckBottom(s, pid, id)
            break
          }
        }
      }
      return advance(s)
    }

    case 'bottomDeckFromField': {
      let s = state
      const before = charCount(s)
      for (const id of refs(op.ref)) {
        if (removalBlocked(s, id, controller, events)) continue
        s = removeFromField(s, id, 'deckBottom')
      }
      if (charCount(s) < before) {
        s = emitEngineEvent(s, { kind: 'charRemovedByEffect', player: controller })
      }
      return advance(s)
    }

    case 'returnToHand': {
      let s = state
      const before = charCount(s)
      for (const id of refs(op.ref)) {
        if (removalBlocked(s, id, controller, events)) continue
        s = removeFromField(s, id, 'hand')
      }
      if (charCount(s) < before) {
        s = emitEngineEvent(s, { kind: 'charRemovedByEffect', player: controller })
      }
      return advance(s)
    }

    case 'toHand': {
      let s = state
      for (const id of refs(op.ref)) s = trashToHand(s, controller, id)
      return advance(s)
    }

    case 'trashCards': {
      let s = state
      for (const id of refs(op.ref)) {
        const inOwnHand = s.players[controller].hand.some((c) => c.instanceId === id)
        s = handToTrash(s, id)
        // "a card was trashed from your hand by your effect" listeners (Kuzan
        // leader); cost trashes are not distinguished from effect trashes
        if (inOwnHand) s = emitEngineEvent(s, { kind: 'handTrashed', player: controller })
      }
      return advance(s)
    }
    case 'lifeToHand': {
      if (state.turnFlags[controller]?.includes('noLifeToHand')) return advance(state)
      let s = state
      for (const id of refs(op.ref)) {
        const p = s.players[controller]
        const idx = p.lifeCards.findIndex((c) => c.instanceId === id)
        if (idx < 0) continue
        const lifeCards = [...p.lifeCards]
        // Life cards added to hand by an effect stay hidden from the opponent
        // (only revealing to activate a [Trigger] makes a life card public)
        const [card] = lifeCards.splice(idx, 1)
        s = {
          ...s,
          players: {
            ...s.players,
            [controller]: { ...p, lifeCards, hand: [...p.hand, { ...card, revealed: false }] },
          },
        }
        s = emitEngineEvent(s, { kind: 'lifeAddedToHand', player: controller })
        s = emitEngineEvent(s, { kind: 'lifeRemoved', player: controller })
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
      return advance(
        playCardFree(state, controller, frame.sourceInstanceId, op.rested ?? false, events),
      )

    case 'searchDeck': {
      const bind = `$op${frame.pc}`
      const p = state.players[controller]
      if (!(bind in frame.bindings)) {
        const options = p.deck
          .filter((c) => matchCardData(c.cardId, op.filter))
          .slice(0, 8)
          .map((c) => c.instanceId)
        if (options.length === 0) return advance(shuffleDeck(state, controller))
        return {
          ...state,
          pendingChoice: {
            playerId: controller,
            prompt: `Reveal up to ${op.upTo} from your deck`,
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

    case 'searchTop': {
      const bind = `$op${frame.pc}`
      const p = state.players[controller]
      const top = p.deck.slice(0, op.count)
      if (!(bind in frame.bindings)) {
        const options = top
          .filter((c) => matchCardData(c.cardId, op.filter))
          .map((c) => c.instanceId)
        if (options.length === 0) {
          return advance(
            moveDeckTopToBottom(
              state,
              controller,
              top.map((c) => c.instanceId),
            ),
          )
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
        if (op.to === 'play') s = playCardFree(s, controller, id, op.playRested ?? false, events)
        else if (op.to === 'trash') s = deckToTrash(s, controller, id)
        else s = deckToHand(s, controller, id)
      }
      const rest = top.filter((c) => !chosen.has(c.instanceId)).map((c) => c.instanceId)
      if (op.restTo === 'trash') {
        for (const id of rest) s = deckToTrash(s, controller, id)
        return advance(s)
      }
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
          .filter((c) => cardHasName(c.cardId, op.name))
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
        if (op.keyword && findFieldCard(s, id)) {
          const modifier: Modifier = {
            kind: 'keyword',
            value: 0,
            keyword: op.keyword,
            duration: 'turn',
            sourceCardId: frame.sourceCardId,
          }
          s = updateFieldCard(s, id, (c) => ({ ...c, modifiers: [...c.modifiers, modifier] }))
        }
      }
      return advance(s)
    }

    case 'addDon': {
      const who = op.who === 'opponent' ? getOpponent(controller) : controller
      const p = state.players[who]
      const take = Math.min(op.count, p.donDeck.length)
      const donDeck = [...p.donDeck]
      const moved = donDeck.splice(0, take).map((d) => ({ ...d, isRested: op.rested }))
      return advance({
        ...state,
        players: {
          ...state.players,
          [who]: { ...p, donDeck, donArea: [...p.donArea, ...moved] },
        },
      })
    }

    case 'giveRestedDon': {
      const targets = op.toRef ? refs(op.toRef) : [frame.sourceInstanceId]
      let s = state
      for (const targetId of targets) {
        const p = s.players[controller]
        if (!findFieldCard(s, targetId)) continue
        const donArea = [...p.donArea]
        let moved = 0
        for (let i = donArea.length - 1; i >= 0 && moved < op.upTo; i--) {
          if (op.fromActive ? !donArea[i].isRested : donArea[i].isRested) {
            donArea.splice(i, 1)
            moved++
          }
        }
        if (moved === 0) continue
        s = { ...s, players: { ...s.players, [controller]: { ...p, donArea } } }
        s = updateFieldCard(s, targetId, (c) => ({
          ...c,
          attachedDon: c.attachedDon + moved,
        }))
        s = emitEngineEvent(s, { kind: 'donAttached', player: controller })
      }
      return advance(s)
    }
    case 'returnDon': {
      const p = state.players[controller]
      const ids = new Set(refs(op.ref))
      const returned = p.donArea.filter((d) => ids.has(d.instanceId))
      const donArea = p.donArea.filter((d) => !ids.has(d.instanceId))
      let s: GameState = {
        ...state,
        players: {
          ...state.players,
          [controller]: {
            ...p,
            donArea,
            donDeck: [...p.donDeck, ...returned.map((d) => ({ ...d, isRested: false }))],
          },
        },
      }
      if (returned.length > 0) {
        s = emitEngineEvent(s, { kind: 'donReturned', player: controller })
      }
      return advance(s)
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

    case 'reveal': {
      let s = state
      for (const id of refs(op.ref)) {
        s = updateHandCard(s, id, (c) => ({ ...c, revealed: true }))
      }
      return advance(s)
    }

    case 'requireRefIs': {
      const ids = refs(op.ref)
      const ok =
        ids.length > 0 &&
        ids.every((id) => {
          const card = findCardAnywhere(state, id)
          return card && getCardById(card.cardId)?.cardType === op.cardType
        })
      return advance(state, !ok)
    }

    case 'lifeToDeckBottom': {
      let s = state
      for (const id of refs(op.ref)) {
        for (const pid of ['player1', 'player2'] as PlayerId[]) {
          const p = s.players[pid]
          const idx = p.lifeCards.findIndex((c) => c.instanceId === id)
          if (idx < 0) continue
          const lifeCards = [...p.lifeCards]
          const [card] = lifeCards.splice(idx, 1)
          s = {
            ...s,
            players: {
              ...s.players,
              [pid]: { ...p, lifeCards, deck: [...p.deck, { ...card, revealed: false }] },
            },
          }
          break
        }
      }
      return advance(s)
    }
  }
}

/** "Cannot be removed from the field by your opponent's effects" (Inuarashi). */
function removalBlocked(
  state: GameState,
  instanceId: string,
  controller: PlayerId,
  events: GameEvent[],
): boolean {
  const card = findFieldCard(state, instanceId)
  if (!card || card.ownerId === controller) return false
  if (!hasFlag(state, card, 'noOppEffectRemove')) return false
  events.push({
    type: 'REMOVAL_PREVENTED',
    playerId: card.ownerId,
    description: `${getCardById(card.cardId)?.name ?? 'Card'} cannot be removed by opponent effects`,
  })
  return true
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
  const targetPlayer = filter.owner === 'self' ? frame.controller : getOpponent(frame.controller)
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
    case 'leader':
      pool = [player.leader]
      break
    case 'stage':
      pool = player.stage ? [player.stage] : []
      break
    case 'leaderOrStage':
      pool = [player.leader, ...(player.stage ? [player.stage] : [])]
      break
    case 'guarded':
      pool = (frame.bindings['target'] ?? [])
        .map((id) => findFieldCard(state, id))
        .filter((c): c is GameCard => !!c)
      break
    default:
      pool = player.characters
  }
  // Cost modifiers apply to cards on the field; hidden/hand zones use printed cost
  const onField = ['characters', 'leaderOrCharacters', 'leader', 'stage'].includes(filter.zone)

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
      if (
        filter.costAtMost !== undefined ||
        filter.costIs !== undefined ||
        filter.costAtMostTotalLife ||
        filter.costAtMostOppLife ||
        filter.costAtMostSelfLife ||
        filter.costAtMostSelfDon ||
        filter.costAtMostOppDon
      ) {
        const cost = onField ? getEffectiveFieldCost(state, c) : (data?.cost ?? 0)
        if (filter.costAtMost !== undefined && cost > filter.costAtMost) return false
        if (filter.costIs !== undefined && cost !== filter.costIs) return false
        if (filter.costAtMostTotalLife) {
          const total =
            state.players.player1.lifeCards.length + state.players.player2.lifeCards.length
          if (cost > total) return false
        }
        if (filter.costAtMostOppLife) {
          const oppLife = state.players[getOpponent(frame.controller)].lifeCards.length
          if (cost > oppLife) return false
        }
        if (filter.costAtMostSelfLife) {
          if (cost > state.players[frame.controller].lifeCards.length) return false
        }
        if (filter.costAtMostSelfDon && cost > donOnField(state, frame.controller)) return false
        if (filter.costAtMostOppDon && cost > donOnField(state, getOpponent(frame.controller))) {
          return false
        }
      }
      if (filter.costAtLeast !== undefined) {
        const cost = onField ? getEffectiveFieldCost(state, c) : (data?.cost ?? 0)
        if (cost < filter.costAtLeast) return false
      }
      if (
        filter.typeOrTrigger &&
        !cardTypes(c.cardId).includes(filter.typeOrTrigger) &&
        !data?.triggerText
      ) {
        return false
      }
      if (filter.basePowerAtMost !== undefined && (data?.power ?? 0) > filter.basePowerAtMost) {
        return false
      }
      if (filter.noBaseEffect && data?.effectText) return false
      if (filter.excludeSelf && c.instanceId === frame.sourceInstanceId) return false
      if (filter.attributeIs && getBattleAttribute(c.cardId) !== filter.attributeIs) return false
      if (filter.hasTrigger && !data?.triggerText) return false
      if (
        filter.hasKeywordIs &&
        !hasKeyword(state, c, filter.hasKeywordIs as Parameters<typeof hasKeyword>[2])
      ) {
        return false
      }
      if (filter.powerAtLeast !== undefined && getEffectivePower(state, c) < filter.powerAtLeast) {
        return false
      }
      if (
        filter.typeContains &&
        !cardTypes(c.cardId).some((t) => t.includes(filter.typeContains!))
      ) {
        return false
      }
      if (filter.powerAtMost !== undefined && getEffectivePower(state, c) > filter.powerAtMost) {
        return false
      }
      if (filter.cardType && data?.cardType !== filter.cardType) return false
      if (filter.cardTypeAny && !filter.cardTypeAny.some((t) => data?.cardType === t)) return false
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
      if (filter.nameIs && !cardHasName(c.cardId, filter.nameIs)) return false
      if (filter.nameNot && cardHasName(c.cardId, filter.nameNot)) return false
      return true
    })
    .map((c) => c.instanceId)
}

function matchCardData(cardId: string, filter: CardDataFilter): boolean {
  const data = getCardById(cardId)
  if (!data) return false
  if (filter.orNameIs && cardHasName(cardId, filter.orNameIs)) return true
  if (filter.orTypeIncludes && data.attribute.includes(filter.orTypeIncludes)) return true
  if (filter.nameIsAny && !filter.nameIsAny.some((n) => cardHasName(cardId, n))) return false
  if (filter.powerAtLeast !== undefined && (data.power ?? 0) < filter.powerAtLeast) return false
  if (filter.powerAtMost !== undefined && (data.power ?? 0) > filter.powerAtMost) return false
  if (filter.cardType && data.cardType !== filter.cardType) return false
  if (filter.costAtMost !== undefined && data.cost > filter.costAtMost) return false
  if (filter.costAtLeast !== undefined && data.cost < filter.costAtLeast) return false
  if (filter.costIs !== undefined && data.cost !== filter.costIs) return false
  if (filter.typeIncludes && !data.attribute.includes(filter.typeIncludes)) return false
  if (filter.typeIncludesAny && !filter.typeIncludesAny.some((t) => data.attribute.includes(t))) {
    return false
  }
  if (filter.typeContains && !data.attribute.some((t) => t.includes(filter.typeContains!))) {
    return false
  }
  if (filter.colorIncludes && !data.color.some((c) => c === filter.colorIncludes)) return false
  if (filter.nameIs && !cardHasName(cardId, filter.nameIs)) return false
  if (filter.nameNot && cardHasName(cardId, filter.nameNot)) return false
  if (filter.hasTrigger && !data.triggerText) return false
  if (filter.attributeIs && getBattleAttribute(cardId) !== filter.attributeIs) return false
  return true
}

// ─── State helpers ───────────────────────────────────────────────────────────


/** Total characters on both fields - used to detect effect removals. */
function charCount(state: GameState): number {
  return state.players.player1.characters.length + state.players.player2.characters.length
}

export function findFieldCard(state: GameState, instanceId: string): GameCard | null {
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    if (p.leader.instanceId === instanceId) return p.leader
    if (p.stage?.instanceId === instanceId) return p.stage
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

function findCardAnywhere(state: GameState, instanceId: string): GameCard | null {
  return (
    locateCardAnywhere(state, 'player1', instanceId) ??
    locateCardAnywhere(state, 'player2', instanceId)
  )
}

/** Update a card in whichever player's hand holds it. */
function updateHandCard(
  state: GameState,
  instanceId: string,
  fn: (c: GameCard) => GameCard,
): GameState {
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    const idx = p.hand.findIndex((c) => c.instanceId === instanceId)
    if (idx < 0) continue
    const hand = [...p.hand]
    hand[idx] = fn(hand[idx])
    return { ...state, players: { ...state.players, [pid]: { ...p, hand } } }
  }
  return state
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
    if (p.stage?.instanceId === instanceId) {
      players[pid] = { ...p, stage: fn(p.stage) }
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
export function removeFromField(
  state: GameState,
  instanceId: string,
  dest: 'trash' | 'hand' | 'deckBottom',
): GameState {
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    if (p.stage?.instanceId === instanceId) {
      const stageCard: GameCard = { ...p.stage, modifiers: [], activatedThisTurn: [] }
      const next = { ...p, stage: null as GameCard | null }
      if (dest === 'trash') next.trash = [...p.trash, stageCard]
      else if (dest === 'hand') next.hand = [...p.hand, { ...stageCard, revealed: true }]
      else next.deck = [...p.deck, { ...stageCard, revealed: false }]
      return { ...state, players: { ...state.players, [pid]: next } }
    }
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
    // A card bounced from the public field is knowledge: it enters hand revealed
    else if (dest === 'hand') next.hand = [...next.hand, { ...card, revealed: true }]
    else next.deck = [...next.deck, { ...card, revealed: false }]
    return { ...state, players: { ...state.players, [pid]: next } }
  }
  return state
}

/** K.O. a character (or stage) by instance id: field -> trash, then queue its
 * [On K.O.] effects. Effect K.O.s pass the effect's controller so protection
 * flags apply; battle K.O.s pass byBattle. */
export function koById(
  state: GameState,
  instanceId: string,
  events: GameEvent[],
  opts: { byBattle?: boolean; controller?: PlayerId } = {},
): GameState {
  const card = findFieldCard(state, instanceId)
  if (!card) return state
  const owner = card.ownerId

  if (!opts.byBattle) {
    const protectedFromEffects =
      hasFlag(state, card, 'noEffectKo') ||
      (opts.controller !== undefined &&
        opts.controller !== owner &&
        (hasFlag(state, card, 'noOppEffectRemove') || hasFlag(state, card, 'noOppEffectKo')))
    if (protectedFromEffects) {
      events.push({
        type: 'KO_PREVENTED',
        playerId: owner,
        description: `${getCardById(card.cardId)?.name ?? 'Card'} cannot be K.O.'d by effects`,
      })
      return state
    }
  }

  // Socket 2, the replacement window: a matching 'replaceKo' def on the card
  // runs INSTEAD of the K.O. - the card stays, no trash, no [On K.O.], no
  // characterKoed event. First matching def wins.
  const defs = getEffectDefs(card.cardId)
  for (let i = 0; i < defs.length; i++) {
    if (!defMatches(state, owner, card, 'replaceKo', i)) continue
    if (!replaceWindowOpen(defs[i].replaceWhen, opts, owner)) continue
    const marked = markOncePerTurn(state, card, defs[i].oncePerTurn, `t${i}`)
    if (!marked) continue
    events.push({
      type: 'KO_REPLACED',
      playerId: owner,
      description: `${getCardById(card.cardId)?.name ?? 'Character'}'s effect replaced the K.O.`,
    })
    return pushFrame(marked, card, owner, 'replaceKo', i)
  }

  // Guard replacements from OTHER cards the owner controls (Sabo leader,
  // Rosinante): the first matching guard suspends the K.O.; its ops decide
  // via 'guardResolve' whether the target lives
  const p = state.players[owner]
  for (const guard of [p.leader, ...p.characters, ...(p.stage ? [p.stage] : [])]) {
    if (guard.instanceId === instanceId) continue
    const gDefs = getEffectDefs(guard.cardId)
    for (let i = 0; i < gDefs.length; i++) {
      const gd = gDefs[i]
      if (gd.timing !== 'guardKo' || !gd.guard) continue
      if (!replaceWindowOpen(gd.replaceWhen, opts, owner)) continue
      if (!defMatches(state, owner, guard, 'guardKo', i)) continue
      if (!guardTargetMatches(state, card, gd.guard)) continue
      const marked = markOncePerTurn(state, guard, gd.oncePerTurn, `t${i}`)
      if (!marked) continue
      const framed = pushFrame(marked, guard, owner, 'guardKo', i)
      const stack = [...framed.stack]
      const top = { ...stack[stack.length - 1] }
      top.bindings = { ...top.bindings, target: [instanceId] }
      stack[stack.length - 1] = top
      return { ...framed, stack }
    }
  }

  const s = removeFromField(state, instanceId, 'trash')
  if (s === state) return state
  events.push({
    type: 'CHARACTER_KO',
    playerId: owner,
    description: `${getCardById(card.cardId)?.name ?? 'Character'} was KO'd`,
  })
  // [On K.O.] activates on the field but resolves from the trash (CR 10-2-17);
  // listeners land on top of the stack so the turn player's resolve first
  const withOnKo = queueEffects(s, card, 'onKo', owner)
  return emitEngineEvent(withOnKo, { kind: 'characterKoed', player: owner })
}

/** Whether a replacement window applies given how the K.O. arrived. */
function replaceWindowOpen(
  when: 'any' | 'oppEffect' | 'effect' | 'battle' | undefined,
  opts: { byBattle?: boolean; controller?: PlayerId },
  owner: PlayerId,
): boolean {
  if (when === 'oppEffect') {
    return !opts.byBattle && opts.controller !== undefined && opts.controller !== owner
  }
  if (when === 'effect') return !opts.byBattle
  if (when === 'battle') return opts.byBattle === true
  return true
}

/** Does a dying card fall under a guardKo def's protection filter? */
function guardTargetMatches(state: GameState, card: GameCard, g: SelectFilter): boolean {
  if (g.powerAtLeast !== undefined && getEffectivePower(state, card) < g.powerAtLeast) return false
  if (
    g.basePowerAtMost !== undefined &&
    (getCardById(card.cardId)?.power ?? 0) > g.basePowerAtMost
  ) {
    return false
  }
  if (g.attributeIs && getBattleAttribute(card.cardId) !== g.attributeIs) return false
  if (g.colorIncludes && !(getCardById(card.cardId)?.color ?? []).some((c) => c === g.colorIncludes)) {
    return false
  }
  if (g.powerAtMost !== undefined && getEffectivePower(state, card) > g.powerAtMost) return false
  if (g.rested !== undefined && card.isRested !== g.rested) return false
  if (g.costAtMost !== undefined && getEffectiveFieldCost(state, card) > g.costAtMost) return false
  if (g.typeIncludes && !cardTypes(card.cardId).includes(g.typeIncludes)) return false
  if (g.nameIs && !cardHasName(card.cardId, g.nameIs)) return false
  return true
}

export function drawCards(
  state: GameState,
  playerId: PlayerId,
  count: number,
  events: GameEvent[],
): GameState {
  let s = count > 0 ? emitEngineEvent(state, { kind: 'drawnExtra', player: playerId }) : state
  for (let i = 0; i < count; i++) {
    const p = s.players[playerId]
    if (p.deck.length === 0) {
      const winner = deckOutWinner(p.leader.cardId, playerId)
      events.push({
        type: 'GAME_WIN',
        playerId: winner,
        description: `${playerId} decked out`,
      })
      return { ...s, winner }
    }
    const deck = [...p.deck]
    const drawn = { ...deck.shift()!, revealed: false }
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
    players: {
      ...state.players,
      [playerId]: { ...p, hand, deck: [...p.deck, { ...card, revealed: false }] },
    },
  }
}

function moveDeckTopToBottom(
  state: GameState,
  playerId: PlayerId,
  instanceIds: string[],
): GameState {
  if (instanceIds.length === 0) return state
  const ids = new Set(instanceIds)
  const p = state.players[playerId]
  const moved = p.deck.filter((c) => ids.has(c.instanceId))
  const deck = [...p.deck.filter((c) => !ids.has(c.instanceId)), ...moved]
  return { ...state, players: { ...state.players, [playerId]: { ...p, deck } } }
}

function deckToTrash(state: GameState, playerId: PlayerId, instanceId: string): GameState {
  const p = state.players[playerId]
  const idx = p.deck.findIndex((c) => c.instanceId === instanceId)
  if (idx < 0) return state
  const deck = [...p.deck]
  const [card] = deck.splice(idx, 1)
  return {
    ...state,
    players: { ...state.players, [playerId]: { ...p, deck, trash: [...p.trash, card] } },
  }
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
    players: {
      ...state.players,
      [playerId]: { ...p, trash, hand: [...p.hand, { ...card, revealed: true }] },
    },
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
  for (const zone of ['hand', 'trash', 'deck'] as const) {
    const idx = p[zone].findIndex((c) => c.instanceId === instanceId)
    if (idx < 0) continue
    const source = [...p[zone]]
    const [raw] = source.splice(idx, 1)
    const cardType = getCardById(raw.cardId)?.cardType
    if (cardType !== 'Character' && cardType !== 'Stage') return state
    if (getCardRules(raw.cardId)?.notPlayableByEffects) return state
    const played: GameCard = {
      ...raw,
      // Lim (OP09-022): this player's Character cards always enter rested
      isRested:
        rested ||
        (cardType === 'Character' &&
          (getCardRules(p.leader.cardId)?.playsCharactersRested ?? false)),
      turnPlayed: state.turnNumber,
      modifiers: [],
      attachedDon: 0,
      activatedThisTurn: [],
    }
    if (cardType === 'Stage') {
      // A new stage replaces the old one (old to trash); when playing FROM the
      // trash, build on the already-spliced list so the card isn't duplicated
      const baseTrash = zone === 'trash' ? source : p.trash
      const trash = p.stage ? [...baseTrash, p.stage] : baseTrash
      return {
        ...state,
        players: {
          ...state.players,
          [controller]: { ...p, [zone]: source, trash, stage: played },
        },
      }
    }
    if (p.characters.length >= MAX_CHARACTERS) return state
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
    s = emitEngineEvent(s, {
      kind: 'characterPlayed',
      player: controller,
      cardId: played.cardId,
      fromHand: zone === 'hand',
    })
    // 'noOnPlay' on this player's leader negates their [On Play] effects (Teach)
    if (!hasFlag(s, s.players[controller].leader, 'noOnPlay')) {
      s = queueEffects(s, played, 'onPlay', controller)
    }
    return s
  }
  return state
}
