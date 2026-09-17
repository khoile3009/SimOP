import { describe, it, expect } from 'vitest'
import cards from '../cards.json'
import { OP01_EFFECTS, OP01_STATICS, KEYWORD_ONLY, COVERAGE_NOTES } from '../effects'
import type { CardData } from '@/engine/types'

/**
 * The ingestion contract: every card with printed effect or trigger text must be
 * accounted for - automated (defs/statics), keyword-only, or in the coverage
 * ledger with a reason. New sets that miss a card fail here instead of silently
 * playing it as vanilla.
 */
describe('OP01 effect coverage ledger', () => {
  const pool = cards as CardData[]

  it('accounts for every card with effect text', () => {
    const unaccounted: string[] = []
    for (const card of pool) {
      if (!card.effectText) continue
      const covered =
        card.id in OP01_EFFECTS ||
        card.id in OP01_STATICS ||
        KEYWORD_ONLY.includes(card.id) ||
        card.id in COVERAGE_NOTES
      if (!covered) unaccounted.push(`${card.id} ${card.name}: ${card.effectText.slice(0, 60)}`)
    }
    expect(unaccounted).toEqual([])
  })

  it('accounts for every card with a trigger', () => {
    const unaccounted: string[] = []
    for (const card of pool) {
      if (!card.triggerText) continue
      const hasTriggerDef = (OP01_EFFECTS[card.id] ?? []).some((d) => d.timing === 'trigger')
      if (!hasTriggerDef && !(card.id in COVERAGE_NOTES)) {
        unaccounted.push(`${card.id} ${card.name}: [Trigger] ${card.triggerText.slice(0, 60)}`)
      }
    }
    expect(unaccounted).toEqual([])
  })

  it('keeps the ledger free of stale entries', () => {
    const ids = new Set(pool.map((c) => c.id))
    for (const id of [...Object.keys(COVERAGE_NOTES), ...KEYWORD_ONLY]) {
      expect(ids.has(id), `${id} is in the ledger but not in the card set`).toBe(true)
    }
    // MISSING entries must not also claim implementations
    for (const [id, note] of Object.entries(COVERAGE_NOTES)) {
      if (note.startsWith('MISSING')) {
        expect(id in OP01_EFFECTS, `${id} is MISSING but has effect defs`).toBe(false)
        expect(id in OP01_STATICS, `${id} is MISSING but has statics`).toBe(false)
      }
    }
  })
})
