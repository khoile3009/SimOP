import type { GameState, GameCard, GameAction, PlayerId } from '@/engine/types'
import { getOpponent } from '@/engine/turnManager'
import { getCardById } from '@/data/cardService'

/**
 * Chance-node support for MCTS (BOT_PLAN / M4.5 #3, Choe & Kim lazy
 * determinization + Zhang & Buro outcome bucketing).
 *
 * A determinized (or oracle) world fixes the entire future deck order, so a
 * tree that crosses a draw secretly knows the topdeck - strategy fusion over
 * chance events. The fix: at transitions that consume a hidden card, fan out
 * into a small set of outcome children, each built by RESAMPLING the unknown
 * portions of both players' decks and life stacks, with the consumed card
 * forced to a bucket representative. Cards the owner has placed or seen
 * (seenByOwner) and publicly revealed cards are knowledge, not chance - they
 * never move.
 */

export interface ChanceTrigger {
  kind: 'draw' | 'life'
  player: PlayerId
}

export interface ChanceOutcome {
  state: GameState
  weight: number
}

const pinnedDeck = (c: GameCard) => c.seenByOwner === true || c.revealed === true
const pinnedLife = (c: GameCard) => c.revealed === true

/** Does applying `action` to `state` consume a hidden card worth branching on? */
export function chanceTrigger(state: GameState, action: GameAction): ChanceTrigger | null {
  if (action.type === 'END_TURN') {
    const drawer = getOpponent(state.currentPlayer)
    const deck = state.players[drawer].deck
    if (deck.length === 0 || pinnedDeck(deck[0])) return null
    return { kind: 'draw', player: drawer }
  }
  if (action.type === 'PASS_COUNTER') {
    const battle = state.battle
    if (!battle) return null
    const defender = state.players[battle.defenderPlayer]
    if (battle.currentTargetId !== defender.leader.instanceId) return null
    if (defender.lifeCards.length === 0 || pinnedLife(defender.lifeCards[0])) return null
    return { kind: 'life', player: battle.defenderPlayer }
  }
  return null
}

/** Draw buckets, priority-ordered: what class of card comes off the top? */
function drawClass(cardId: string, drawerDon: number): string {
  const d = getCardById(cardId)
  if ((d?.counter ?? 0) >= 1000) return 'counter'
  if ((d?.power ?? 0) >= 6000) return 'threat'
  if ((d?.cost ?? 0) <= Math.min(10, drawerDon + 2)) return 'curve'
  return 'dead'
}

function shuffleInPlace<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

/** Permute the unknown cards of a zone among the unknown SLOTS, leaving
 * pinned cards exactly where they are. `forcedId` (an instanceId from the
 * unknown pool) is placed in the first unknown slot. */
function resampleZone(
  zone: GameCard[],
  isPinned: (c: GameCard) => boolean,
  rand: () => number,
  forcedId?: string,
): GameCard[] {
  const slots: number[] = []
  const unknown: GameCard[] = []
  zone.forEach((c, i) => {
    if (!isPinned(c)) {
      slots.push(i)
      unknown.push(c)
    }
  })
  if (unknown.length <= 1) return zone
  shuffleInPlace(unknown, rand)
  if (forcedId) {
    const at = unknown.findIndex((c) => c.instanceId === forcedId)
    if (at > 0) [unknown[0], unknown[at]] = [unknown[at], unknown[0]]
  }
  const next = [...zone]
  slots.forEach((slot, i) => {
    next[slot] = unknown[i]
  })
  return next
}

/** Resample every unknowable ordering in the state; optionally force one
 * card to the consuming zone's first unknown slot. */
export function resampleHidden(
  state: GameState,
  rand: () => number,
  force?: { kind: 'draw' | 'life'; player: PlayerId; instanceId: string },
): GameState {
  const players = { ...state.players }
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = players[pid]
    const deckForce = force?.kind === 'draw' && force.player === pid ? force.instanceId : undefined
    const lifeForce = force?.kind === 'life' && force.player === pid ? force.instanceId : undefined
    players[pid] = {
      ...p,
      deck: resampleZone(p.deck, pinnedDeck, rand, deckForce),
      lifeCards: resampleZone(p.lifeCards, pinnedLife, rand, lifeForce),
    }
  }
  return { ...state, players }
}

/** Bucket the hidden pool the trigger consumes from and return up to `k`
 * pre-action states, one per bucket representative, weighted by bucket mass. */
export function chanceOutcomeStates(
  state: GameState,
  trigger: ChanceTrigger,
  k: number,
  rand: () => number,
): ChanceOutcome[] {
  const p = state.players[trigger.player]
  const pool =
    trigger.kind === 'draw'
      ? p.deck.filter((c) => !pinnedDeck(c))
      : p.lifeCards.filter((c) => !pinnedLife(c))
  if (pool.length === 0) return [{ state, weight: 1 }]

  const buckets = new Map<string, GameCard[]>()
  for (const c of pool) {
    const cls =
      trigger.kind === 'draw'
        ? drawClass(c.cardId, p.donArea.length)
        : getCardById(c.cardId)?.triggerText
          ? 'trigger'
          : 'plain'
    const list = buckets.get(cls)
    if (list) list.push(c)
    else buckets.set(cls, [c])
  }

  const ranked = [...buckets.values()].sort((a, b) => b.length - a.length).slice(0, Math.max(1, k))
  const total = ranked.reduce((s, b) => s + b.length, 0)
  return ranked.map((bucket) => {
    const rep = bucket[Math.floor(rand() * bucket.length)]
    return {
      state: resampleHidden(state, rand, {
        kind: trigger.kind,
        player: trigger.player,
        instanceId: rep.instanceId,
      }),
      weight: bucket.length / total,
    }
  })
}
