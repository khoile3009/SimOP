import type { CardData } from '@/engine/types'
import type { EffectDef, StaticDef } from '@/engine/effects/ast'

import op01Cards from './op01/cards.json'
import op01Attrs from './op01/battleAttributes.json'
import { OP01_EFFECTS, OP01_STATICS, KEYWORD_ONLY, COVERAGE_NOTES } from './op01/effects'
import op02Cards from './op02/cards.json'
import op02Attrs from './op02/battleAttributes.json'
import { OP02_EFFECTS, OP02_STATICS, KEYWORD_ONLY_OP02, COVERAGE_NOTES_OP02 } from './op02/effects'
import op03Cards from './op03/cards.json'
import op03Attrs from './op03/battleAttributes.json'
import { OP03_EFFECTS, OP03_STATICS, KEYWORD_ONLY_OP03, COVERAGE_NOTES_OP03 } from './op03/effects'
import op04Cards from './op04/cards.json'
import op04Attrs from './op04/battleAttributes.json'
import { OP04_EFFECTS, OP04_STATICS, KEYWORD_ONLY_OP04, COVERAGE_NOTES_OP04 } from './op04/effects'
import op05Cards from './op05/cards.json'
import op05Attrs from './op05/battleAttributes.json'
import { OP05_EFFECTS, OP05_STATICS, KEYWORD_ONLY_OP05, COVERAGE_NOTES_OP05 } from './op05/effects'
import op06Cards from './op06/cards.json'
import op06Attrs from './op06/battleAttributes.json'
import { OP06_EFFECTS, OP06_STATICS, KEYWORD_ONLY_OP06, COVERAGE_NOTES_OP06 } from './op06/effects'
import op07Cards from './op07/cards.json'
import op07Attrs from './op07/battleAttributes.json'
import { OP07_EFFECTS, OP07_STATICS, KEYWORD_ONLY_OP07, COVERAGE_NOTES_OP07 } from './op07/effects'

/**
 * The set manifest: registering a set here is the ONLY wiring step after
 * `npm run ingest` + authoring its effects module. Everything else - card
 * service, effect registry, battle attributes, coverage/lint tests, the
 * playtest fleet, the compiler's dry-run - iterates this list.
 */
export interface SetModule {
  code: string
  cards: CardData[]
  battleAttributes: Record<string, string>
  effects: Record<string, EffectDef[]>
  statics: Record<string, StaticDef[]>
  keywordOnly: string[]
  notes: Record<string, string>
}

export const SET_MODULES: SetModule[] = [
  {
    code: 'OP01',
    cards: op01Cards as CardData[],
    battleAttributes: op01Attrs,
    effects: OP01_EFFECTS,
    statics: OP01_STATICS,
    keywordOnly: KEYWORD_ONLY,
    notes: COVERAGE_NOTES,
  },
  {
    code: 'OP02',
    cards: op02Cards as CardData[],
    battleAttributes: op02Attrs,
    effects: OP02_EFFECTS,
    statics: OP02_STATICS,
    keywordOnly: KEYWORD_ONLY_OP02,
    notes: COVERAGE_NOTES_OP02,
  },
  {
    code: 'OP03',
    cards: op03Cards as CardData[],
    battleAttributes: op03Attrs,
    effects: OP03_EFFECTS,
    statics: OP03_STATICS,
    keywordOnly: KEYWORD_ONLY_OP03,
    notes: COVERAGE_NOTES_OP03,
  },
  {
    code: 'OP04',
    cards: op04Cards as CardData[],
    battleAttributes: op04Attrs,
    effects: OP04_EFFECTS,
    statics: OP04_STATICS,
    keywordOnly: KEYWORD_ONLY_OP04,
    notes: COVERAGE_NOTES_OP04,
  },
  {
    code: 'OP05',
    cards: op05Cards as CardData[],
    battleAttributes: op05Attrs,
    effects: OP05_EFFECTS,
    statics: OP05_STATICS,
    keywordOnly: KEYWORD_ONLY_OP05,
    notes: COVERAGE_NOTES_OP05,
  },
  {
    code: 'OP06',
    cards: op06Cards as CardData[],
    battleAttributes: op06Attrs,
    effects: OP06_EFFECTS,
    statics: OP06_STATICS,
    keywordOnly: KEYWORD_ONLY_OP06,
    notes: COVERAGE_NOTES_OP06,
  },
  {
    code: 'OP07',
    cards: op07Cards as CardData[],
    battleAttributes: op07Attrs,
    effects: OP07_EFFECTS,
    statics: OP07_STATICS,
    keywordOnly: KEYWORD_ONLY_OP07,
    notes: COVERAGE_NOTES_OP07,
  },
]
