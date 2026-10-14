import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * PRB01 (ONE PIECE CARD THE BEST) effect definitions. The API feed carries a
 * single new card; everything else in the product is a reprint with its
 * original ID.
 */
export const PRB01_EFFECTS: Record<string, EffectDef[]> = {
  'PRB01-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'self', zone: 'characters', costAtMost: 8, noOnPlayEffect: true },
          min: 0,
          max: 1,
          prompt: 'A Character without an [On Play] effect gains [Rush]',
        },
        { op: 'grantKeyword', ref: 'r', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const PRB01_STATICS: Record<string, StaticDef[]> = {}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_PRB01: string[] = []

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_PRB01: Record<string, string> = {}
