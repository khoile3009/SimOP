import type { Deck } from '@/engine/types'
import { getCardsBySet, getLeaders, getCardById } from '@/data/cardService'
import { getEffectDefs } from '@/engine/effects/registry'
import { DECK_SIZE, MAX_CARD_COPIES } from '@/engine/constants'

/**
 * Coverage decks: partition a set's card pool into legal decks such that every
 * card rides in at least one, and cards whose effects are gated on a specific
 * leader ("if your Leader is [X]" / "has the {Y} type") ride with a leader that
 * satisfies the condition - otherwise those effects could never fire and the
 * fleet's usage-hole check would cry wolf. Adding cards to a set automatically
 * grows these decks, so new cards are playtested without any wiring.
 */

export interface CoverageDeck {
  deck: Deck
  leaderName: string
}

export function buildCoverageDecks(set = 'OP01'): CoverageDeck[] {
  const leaders = getLeaders(set)
  const pool = getCardsBySet(set).filter(
    (c) => c.cardType === 'Character' || c.cardType === 'Event',
  )

  // Anchor on one leader per color, then add any extra leader some card's
  // condition specifically needs (by name or type)
  const anchors = new Map<string, (typeof leaders)[number]>()
  for (const color of ['Red', 'Green', 'Blue', 'Purple'] as const) {
    const mono = leaders.find((l) => l.color.length === 1 && l.color[0] === color)
    const any = mono ?? leaders.find((l) => l.color.includes(color))
    if (any) anchors.set(any.id, any)
  }
  for (const card of pool) {
    for (const def of getEffectDefs(card.id)) {
      const cond = def.condition
      if (!cond) continue
      const satisfied = [...anchors.values()].some(
        (l) =>
          (!cond.leaderNameIs || l.name === cond.leaderNameIs) &&
          (!cond.leaderTypeIncludes || l.attribute.includes(cond.leaderTypeIncludes)),
      )
      if (satisfied) continue
      const provider = leaders.find(
        (l) =>
          (!cond.leaderNameIs || l.name === cond.leaderNameIs) &&
          (!cond.leaderTypeIncludes || l.attribute.includes(cond.leaderTypeIncludes)),
      )
      if (provider) anchors.set(provider.id, provider)
    }
  }

  // Assign every card to one home deck: a leader-condition provider when the
  // card needs one, otherwise the first anchor sharing a color
  const anchorList = [...anchors.values()]
  const assignments = new Map<string, string[]>() // leaderId -> cardIds
  for (const l of anchorList) assignments.set(l.id, [])

  for (const card of pool) {
    let home = anchorList.find((l) => card.color.some((c) => l.color.includes(c)))
    for (const def of getEffectDefs(card.id)) {
      const cond = def.condition
      if (!cond?.leaderNameIs && !cond?.leaderTypeIncludes) continue
      const provider = anchorList.find(
        (l) =>
          card.color.some((c) => l.color.includes(c)) &&
          (!cond.leaderNameIs || l.name === cond.leaderNameIs) &&
          (!cond.leaderTypeIncludes || l.attribute.includes(cond.leaderTypeIncludes)),
      )
      if (provider) home = provider
    }
    if (home) assignments.get(home.id)!.push(card.id)
  }

  // Build 50-card decks: 4x each assigned card, split into multiple decks per
  // leader when the assignment overflows, pad short decks from the color pool
  const result: CoverageDeck[] = []
  const perDeck = Math.floor(DECK_SIZE / MAX_CARD_COPIES) + 1 // 13 ids (last at qty 2)

  for (const leader of anchorList) {
    const ids = assignments.get(leader.id)!
    const chunks: string[][] = []
    for (let i = 0; i < ids.length; i += perDeck) chunks.push(ids.slice(i, i + perDeck))
    if (chunks.length === 0) chunks.push([])

    chunks.forEach((chunk, ci) => {
      const cards: Deck['cards'] = []
      let total = 0
      for (const id of chunk) {
        const qty = Math.min(MAX_CARD_COPIES, DECK_SIZE - total)
        if (qty <= 0) break
        cards.push({ cardId: id, qty })
        total += qty
      }
      // Pad with same-color pool cards not already in this deck
      for (const filler of pool) {
        if (total >= DECK_SIZE) break
        if (!filler.color.some((c) => leader.color.includes(c))) continue
        if (cards.some((c) => c.cardId === filler.id)) continue
        const qty = Math.min(MAX_CARD_COPIES, DECK_SIZE - total)
        cards.push({ cardId: filler.id, qty })
        total += qty
      }
      if (total !== DECK_SIZE) {
        throw new Error(`Coverage deck for ${leader.name} came out at ${total}/${DECK_SIZE}`)
      }
      result.push({
        deck: {
          id: `coverage-${leader.id}-${ci}`,
          name: `${leader.name} coverage ${ci + 1}`,
          leader: leader.id,
          cards,
          createdAt: 0,
          updatedAt: 0,
        },
        leaderName: leader.name,
      })
    })
  }
  return result
}

/** Every cardId that appears in any coverage deck (leaders included). */
export function coverageCardIds(decks: CoverageDeck[]): Set<string> {
  const ids = new Set<string>()
  for (const { deck } of decks) {
    ids.add(deck.leader)
    for (const c of deck.cards) ids.add(c.cardId)
  }
  return ids
}

/** Explain unfired effects whose conditions no deck's leader can satisfy. */
export function annotateUnreachable(key: string, decks: CoverageDeck[]): string {
  const [cardId] = key.split(':')
  for (const def of getEffectDefs(cardId)) {
    const cond = def.condition
    if (!cond?.leaderNameIs && !cond?.leaderTypeIncludes) continue
    const satisfiable = decks.some(({ deck }) => {
      const leader = getCardById(deck.leader)
      return (
        leader &&
        (!cond.leaderNameIs || leader.name === cond.leaderNameIs) &&
        (!cond.leaderTypeIncludes || leader.attribute.includes(cond.leaderTypeIncludes))
      )
    })
    if (!satisfiable) {
      return ` (condition needs leader ${cond.leaderNameIs ?? `{${cond.leaderTypeIncludes}}`} - no such leader in the pool)`
    }
  }
  return ''
}
