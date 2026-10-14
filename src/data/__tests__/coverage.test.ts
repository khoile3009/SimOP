import { describe, it, expect } from 'vitest'
import { SET_MODULES } from '../sets'
import { CARD_RULES } from '@/engine/rulesLayer'

/**
 * The ingestion contract, for every registered set: a card with printed
 * effect or trigger text must be accounted for - automated (defs/statics),
 * keyword-only, rules-layer, or in the coverage ledger with a reason. New
 * sets that miss a card fail here instead of silently playing it as vanilla.
 */
describe.each(SET_MODULES.map((s) => [s.code, s] as const))('%s coverage ledger', (_code, set) => {
  it('accounts for every card with effect text', () => {
    const unaccounted: string[] = []
    for (const card of set.cards) {
      if (!card.effectText) continue
      const covered =
        card.id in set.effects ||
        card.id in set.statics ||
        card.id in CARD_RULES ||
        set.keywordOnly.includes(card.id) ||
        card.id in set.notes ||
        card.id in (set.reprints ?? {})
      if (!covered) unaccounted.push(`${card.id} ${card.name}: ${card.effectText.slice(0, 60)}`)
    }
    expect(unaccounted).toEqual([])
  })

  it('accounts for every card with a trigger', () => {
    const unaccounted: string[] = []
    for (const card of set.cards) {
      if (!card.triggerText) continue
      if (card.id in (set.reprints ?? {})) continue
      const hasTriggerDef = (set.effects[card.id] ?? []).some((d) => d.timing === 'trigger')
      if (!hasTriggerDef && !(card.id in set.notes)) {
        unaccounted.push(`${card.id} ${card.name}: [Trigger] ${card.triggerText.slice(0, 60)}`)
      }
    }
    expect(unaccounted).toEqual([])
  })

  it('keeps the ledger free of stale entries', () => {
    const ids = new Set(set.cards.map((c) => c.id))
    for (const id of [...Object.keys(set.notes), ...set.keywordOnly]) {
      expect(ids.has(id), `${id} is in the ledger but not in the card set`).toBe(true)
    }
    for (const [id, note] of Object.entries(set.notes)) {
      if (note.startsWith('MISSING')) {
        expect(id in set.effects, `${id} is MISSING but has effect defs`).toBe(false)
        expect(id in set.statics, `${id} is MISSING but has statics`).toBe(false)
      }
    }
  })
})
