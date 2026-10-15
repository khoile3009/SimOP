import type { GameCard } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getEffectDefs } from '@/engine/effects/registry'
import { getPrintedKeywords, isCounterEvent } from '@/engine/keywords'

/**
 * Out-class sampling (M4.5 #2, shared by the punisher pass and the
 * playing-to-outs mode): players count outs in CLASSES, never in cards.
 * Given a hidden pool (a deck multiset), pick one representative card per
 * class, weighted by how much of the pool the class covers.
 */

export type OutClass = 'removal' | 'threat' | 'counter' | 'blocker' | 'ordinary'

export interface OutClassRep {
  cls: OutClass
  card: GameCard
  /** Fraction of the pool in this class (overlaps allowed, normalized later) */
  mass: number
}

const REMOVAL_OPS = new Set(['ko', 'koAll', 'removeAll', 'bottomDeckFromField', 'trashFromField'])

/** Does playing this card threaten the OPPONENT's field? Read the effect
 * defs: a removal op whose select targets the opponent (or a mass removal). */
function isRemoval(cardId: string): boolean {
  for (const def of getEffectDefs(cardId)) {
    if (def.timing === 'trigger') continue
    const oppSelects = new Set<string>()
    for (const op of def.ops) {
      if (op.op === 'select' && (op.filter.owner === 'opponent' || op.filter.owner === 'any')) {
        oppSelects.add(op.bind)
      }
      if (op.op === 'koAll' || op.op === 'removeAll') return true
      if (REMOVAL_OPS.has(op.op) && 'ref' in op && oppSelects.has(op.ref as string)) return true
      if (op.op === 'returnToHand' && oppSelects.has(op.ref)) return true
    }
  }
  return false
}

function counterValue(cardId: string): number {
  const d = getCardById(cardId)
  if (!d) return 0
  if (d.cardType === 'Event' && isCounterEvent(d)) return 3000 // event proxy
  return d.counter ?? 0
}

function isBlocker(cardId: string): boolean {
  return getPrintedKeywords(cardId).has('Blocker')
}

/**
 * One representative per out-class present in the pool, mass = class share.
 * Representatives: cheapest removal (most playable), biggest threat, best
 * counter, strongest blocker, and the median-cost card as the ordinary draw.
 */
export function sampleOutClasses(pool: GameCard[]): OutClassRep[] {
  if (pool.length === 0) return []
  const reps: OutClassRep[] = []
  const used = new Set<string>()

  const pick = (
    cls: OutClass,
    members: GameCard[],
    best: (a: GameCard, b: GameCard) => GameCard,
  ): void => {
    if (members.length === 0) return
    const card = members.reduce(best)
    if (used.has(card.instanceId)) return
    used.add(card.instanceId)
    reps.push({ cls, card, mass: members.length / pool.length })
  }

  const data = (c: GameCard) => getCardById(c.cardId)

  pick(
    'removal',
    pool.filter((c) => isRemoval(c.cardId)),
    (a, b) => ((data(a)?.cost ?? 99) <= (data(b)?.cost ?? 99) ? a : b),
  )
  pick(
    'threat',
    pool.filter((c) => (data(c)?.power ?? 0) >= 6000 && data(c)?.cardType === 'Character'),
    (a, b) => ((data(a)?.power ?? 0) >= (data(b)?.power ?? 0) ? a : b),
  )
  pick(
    'counter',
    pool.filter((c) => counterValue(c.cardId) >= 1000),
    (a, b) => (counterValue(a.cardId) >= counterValue(b.cardId) ? a : b),
  )
  pick(
    'blocker',
    pool.filter((c) => isBlocker(c.cardId)),
    (a, b) => ((data(a)?.power ?? 0) >= (data(b)?.power ?? 0) ? a : b),
  )

  // Ordinary draw: the median-cost card among those not already representing
  const rest = pool.filter((c) => !used.has(c.instanceId))
  if (rest.length > 0) {
    const sorted = [...rest].sort((a, b) => (data(a)?.cost ?? 0) - (data(b)?.cost ?? 0))
    const median = sorted[Math.floor(sorted.length / 2)]
    reps.push({ cls: 'ordinary', card: median, mass: rest.length / pool.length })
  }
  return reps
}
