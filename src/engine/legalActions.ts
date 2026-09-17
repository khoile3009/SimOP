import type { GameState, GameAction, PlayerId, GameCard } from './types'
import { getCardById } from '@/data/cardService'
import { validateAction } from './rules'
import { getOpponent } from './turnManager'
import { getBattlePower } from './powerCalc'
import { hasKeyword } from './keywords'
import { getEffectDefs } from './effects/registry'
import { getEffectiveCost } from './effects/statics'

/**
 * Which player must act next, or null if the game is over / no decision is pending.
 * The engine validates actions from either player during SETUP; for enumeration we
 * impose the official order (turn player decides mulligan first, CR 5-2-1-6).
 */
export function whoActs(state: GameState): PlayerId | null {
  if (state.winner) return null
  if (state.pendingChoice) return state.pendingChoice.playerId
  if (state.phase === 'SETUP') {
    if (state.mulliganState[state.currentPlayer] === 'pending') return state.currentPlayer
    const opp = getOpponent(state.currentPlayer)
    if (state.mulliganState[opp] === 'pending') return opp
    return null
  }
  if (state.pendingTrigger) return state.pendingTrigger.playerId
  if (state.battle && (state.battle.step === 'BLOCK' || state.battle.step === 'COUNTER')) {
    return state.battle.defenderPlayer
  }
  return state.currentPlayer
}

/**
 * Enumerate every action the acting player may take right now.
 * Candidates are generated structurally and then filtered through validateAction,
 * so this can never disagree with the rules module about legality.
 */
export function legalActions(state: GameState): GameAction[] {
  const actor = whoActs(state)
  if (!actor) return []
  return generateCandidates(state, actor).filter(
    (a) => validateAction(state, a, actor).valid,
  )
}

function generateCandidates(state: GameState, actor: PlayerId): GameAction[] {
  if (state.pendingChoice) return chooseOptions(state)
  if (state.phase === 'SETUP') {
    return [
      { type: 'MULLIGAN', accept: true },
      { type: 'MULLIGAN', accept: false },
    ]
  }

  if (state.pendingTrigger) {
    return [
      { type: 'ACTIVATE_TRIGGER', accept: true },
      { type: 'ACTIVATE_TRIGGER', accept: false },
    ]
  }

  if (state.battle?.step === 'BLOCK') return blockOptions(state, actor)
  if (state.battle?.step === 'COUNTER') return counterOptions(state, actor)

  return mainPhaseOptions(state, actor)
}

function mainPhaseOptions(state: GameState, actor: PlayerId): GameAction[] {
  const player = state.players[actor]
  const opponent = state.players[getOpponent(actor)]
  const actions: GameAction[] = []
  const activeDon = player.donArea.filter((d) => !d.isRested).length

  for (const card of player.hand) {
    const data = getCardById(card.cardId)
    if (!data || data.cardType === 'Leader') continue
    if (getEffectiveCost(state, actor, card) > activeDon) continue
    // Events are only playable at their printed timing: main here, counter in battle
    if (data.cardType === 'Event' && getEffectDefs(card.cardId, 'main').length === 0) continue
    // A full board is still playable: the '$boardFull' flow trashes one first
    actions.push({ type: 'PLAY_CARD', cardInstanceId: card.instanceId })
  }

  // Activated abilities on the leader and characters
  for (const card of [player.leader, ...player.characters]) {
    const defs = getEffectDefs(card.cardId)
    for (let i = 0; i < defs.length; i++) {
      if (defs[i].timing !== 'activateMain') continue
      actions.push({ type: 'ACTIVATE_EFFECT', cardInstanceId: card.instanceId, effectId: String(i) })
    }
  }

  if (activeDon > 0) {
    actions.push({ type: 'ATTACH_DON', count: 1, targetCardId: player.leader.instanceId })
    for (const c of player.characters) {
      actions.push({ type: 'ATTACH_DON', count: 1, targetCardId: c.instanceId })
    }
  }

  const attackers = [player.leader, ...player.characters].filter((a) => !a.isRested)
  const targets = [
    opponent.leader,
    ...opponent.characters.filter((c) => c.isRested),
  ]
  for (const attacker of attackers) {
    for (const target of targets) {
      actions.push({
        type: 'DECLARE_ATTACK',
        attackerId: attacker.instanceId,
        targetId: target.instanceId,
      })
    }
  }

  actions.push({ type: 'END_TURN' })
  return actions
}

function blockOptions(state: GameState, actor: PlayerId): GameAction[] {
  const player = state.players[actor]
  const actions: GameAction[] = [{ type: 'DECLINE_BLOCK' }]
  for (const c of player.characters) {
    if (c.isRested) continue
    if (hasKeyword(state, c, 'Blocker')) {
      actions.push({ type: 'ACTIVATE_BLOCKER', blockerId: c.instanceId })
    }
  }
  return actions
}

/** Enumerate CHOOSE actions: every legal subset of the options within [min, max]. */
function chooseOptions(state: GameState): GameAction[] {
  const { options, min, max, exact } = state.pendingChoice!
  const actions: GameAction[] = []
  const sizeOk = (n: number) =>
    n >= min && n <= max && (!exact || n === min || n === max)
  const subset: string[] = []
  const build = (start: number) => {
    if (sizeOk(subset.length)) {
      actions.push({ type: 'CHOOSE', instanceIds: [...subset] })
    }
    if (subset.length >= max || actions.length > 200) return
    for (let i = start; i < options.length; i++) {
      subset.push(options[i])
      build(i + 1)
      subset.pop()
    }
  }
  build(0)
  return actions
}

/**
 * Counter step, with deliberate action-space pruning: countering below the amount
 * that flips the battle wastes cards, and countering above it overpays, so the only
 * options offered are PASS and the cheapest hand subset that saves the target.
 * validateAction still accepts any subset from the UI; this reduction is for agents.
 */
function counterOptions(state: GameState, actor: PlayerId): GameAction[] {
  const battle = state.battle!
  const player = state.players[actor]
  const attackerSide = state.players[battle.attackerPlayer]
  const actions: GameAction[] = [{ type: 'PASS_COUNTER' }]

  const attacker =
    attackerSide.leader.instanceId === battle.attackerId
      ? attackerSide.leader
      : attackerSide.characters.find((c) => c.instanceId === battle.attackerId)
  const defender =
    player.leader.instanceId === battle.currentTargetId
      ? player.leader
      : player.characters.find((c) => c.instanceId === battle.currentTargetId)
  if (!attacker || !defender) return actions

  // Counter events are offered whenever affordable; agents evaluate their worth
  const activeDon = player.donArea.filter((d) => !d.isRested).length
  for (const card of player.hand) {
    const data = getCardById(card.cardId)
    if (data?.cardType !== 'Event') continue
    if (getEffectiveCost(state, actor, card) > activeDon) continue
    if (getEffectDefs(card.cardId, 'counter').length === 0) continue
    actions.push({ type: 'PLAY_COUNTER_EVENT', cardInstanceId: card.instanceId })
  }

  const attackerPower = getBattlePower(state, attacker, battle.attackerPowerBonus)
  const defenderPower = getBattlePower(state, defender, battle.defenderPowerBonus)
  // Attacker wins ties (CR 7-1-4-1): the defender survives only with strictly more power.
  const needed = attackerPower - defenderPower + 1000
  if (needed <= 0) return actions

  const counters = player.hand
    .map((card) => ({ card, value: getCardById(card.cardId)?.counter ?? 0 }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)

  const subset: GameCard[] = []
  let total = 0
  for (const { card, value } of counters) {
    if (total >= needed) break
    subset.push(card)
    total += value
  }
  if (total >= needed && subset.length > 0) {
    actions.push({ type: 'USE_COUNTER', cardInstanceIds: subset.map((c) => c.instanceId) })
  }
  return actions
}
