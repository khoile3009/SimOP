import { describe, it, expect } from 'vitest'
import cards from '../cards.json'
import { OP03_EFFECTS, OP03_STATICS, KEYWORD_ONLY_OP03, COVERAGE_NOTES_OP03 } from '../effects'
import { CARD_RULES } from '@/engine/rulesLayer'
import type { CardData } from '@/engine/types'

/**
 * The ingestion contract, same as OP01/OP02's: every card with printed effect
 * or trigger text must be accounted for - automated (defs/statics),
 * keyword-only, rules-layer, or in the coverage ledger with a reason.
 */
describe('OP03 effect coverage ledger', () => {
  const pool = cards as CardData[]

  it('accounts for every card with effect text', () => {
    const unaccounted: string[] = []
    for (const card of pool) {
      if (!card.effectText) continue
      const covered =
        card.id in OP03_EFFECTS ||
        card.id in OP03_STATICS ||
        card.id in CARD_RULES ||
        KEYWORD_ONLY_OP03.includes(card.id) ||
        card.id in COVERAGE_NOTES_OP03
      if (!covered) unaccounted.push(`${card.id} ${card.name}: ${card.effectText.slice(0, 60)}`)
    }
    expect(unaccounted).toEqual([])
  })

  it('accounts for every card with a trigger', () => {
    const unaccounted: string[] = []
    for (const card of pool) {
      if (!card.triggerText) continue
      const hasTriggerDef = (OP03_EFFECTS[card.id] ?? []).some((d) => d.timing === 'trigger')
      if (!hasTriggerDef && !(card.id in COVERAGE_NOTES_OP03)) {
        unaccounted.push(`${card.id} ${card.name}: [Trigger] ${card.triggerText.slice(0, 60)}`)
      }
    }
    expect(unaccounted).toEqual([])
  })

  it('keeps the ledger free of stale entries', () => {
    const ids = new Set(pool.map((c) => c.id))
    for (const id of [...Object.keys(COVERAGE_NOTES_OP03), ...KEYWORD_ONLY_OP03]) {
      expect(ids.has(id), `${id} is in the ledger but not in the card set`).toBe(true)
    }
    for (const [id, note] of Object.entries(COVERAGE_NOTES_OP03)) {
      if (note.startsWith('MISSING')) {
        expect(id in OP03_EFFECTS, `${id} is MISSING but has effect defs`).toBe(false)
        expect(id in OP03_STATICS, `${id} is MISSING but has statics`).toBe(false)
      }
    }
  })
})
