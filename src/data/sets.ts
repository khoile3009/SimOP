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
import op08Cards from './op08/cards.json'
import op08Attrs from './op08/battleAttributes.json'
import { OP08_EFFECTS, OP08_STATICS, KEYWORD_ONLY_OP08, COVERAGE_NOTES_OP08 } from './op08/effects'
import op09Cards from './op09/cards.json'
import op09Attrs from './op09/battleAttributes.json'
import { OP09_EFFECTS, OP09_STATICS, KEYWORD_ONLY_OP09, COVERAGE_NOTES_OP09 } from './op09/effects'
import op10Cards from './op10/cards.json'
import op10Attrs from './op10/battleAttributes.json'
import { OP10_EFFECTS, OP10_STATICS, KEYWORD_ONLY_OP10, COVERAGE_NOTES_OP10 } from './op10/effects'
import op11Cards from './op11/cards.json'
import op11Attrs from './op11/battleAttributes.json'
import { OP11_EFFECTS, OP11_STATICS, KEYWORD_ONLY_OP11, COVERAGE_NOTES_OP11 } from './op11/effects'
import op12Cards from './op12/cards.json'
import op12Attrs from './op12/battleAttributes.json'
import { OP12_EFFECTS, OP12_STATICS, KEYWORD_ONLY_OP12, COVERAGE_NOTES_OP12 } from './op12/effects'
import op13Cards from './op13/cards.json'
import op13Attrs from './op13/battleAttributes.json'
import { OP13_EFFECTS, OP13_STATICS, KEYWORD_ONLY_OP13, COVERAGE_NOTES_OP13 } from './op13/effects'
import op16Cards from './op16/cards.json'
import op16Attrs from './op16/battleAttributes.json'
import { OP16_EFFECTS, OP16_STATICS, KEYWORD_ONLY_OP16, COVERAGE_NOTES_OP16 } from './op16/effects'
import op17Cards from './op17/cards.json'
import op17Attrs from './op17/battleAttributes.json'
import { OP17_EFFECTS, OP17_STATICS, KEYWORD_ONLY_OP17, COVERAGE_NOTES_OP17 } from './op17/effects'
import op14Cards from './op14/cards.json'
import op14Attrs from './op14/battleAttributes.json'
import { OP14_EFFECTS, OP14_STATICS, KEYWORD_ONLY_OP14, COVERAGE_NOTES_OP14 } from './op14/effects'
import stCards from './st/cards.json'
import stAttrs from './st/battleAttributes.json'
import stReprints from './st/reprints.json'
import { ST_EFFECTS, ST_STATICS, KEYWORD_ONLY_ST, COVERAGE_NOTES_ST } from './st/effects'
import prb01Cards from './prb01/cards.json'
import prb01Attrs from './prb01/battleAttributes.json'
import {
  PRB01_EFFECTS,
  PRB01_STATICS,
  KEYWORD_ONLY_PRB01,
  COVERAGE_NOTES_PRB01,
} from './prb01/effects'
import prb02Cards from './prb02/cards.json'
import prb02Attrs from './prb02/battleAttributes.json'
import {
  PRB02_EFFECTS,
  PRB02_STATICS,
  KEYWORD_ONLY_PRB02,
  COVERAGE_NOTES_PRB02,
} from './prb02/effects'
import eb04Cards from './eb04/cards.json'
import eb04Attrs from './eb04/battleAttributes.json'
import { EB04_EFFECTS, EB04_STATICS, KEYWORD_ONLY_EB04, COVERAGE_NOTES_EB04 } from './eb04/effects'
import eb03Cards from './eb03/cards.json'
import eb03Attrs from './eb03/battleAttributes.json'
import { EB03_EFFECTS, EB03_STATICS, KEYWORD_ONLY_EB03, COVERAGE_NOTES_EB03 } from './eb03/effects'
import eb02Cards from './eb02/cards.json'
import eb02Attrs from './eb02/battleAttributes.json'
import { EB02_EFFECTS, EB02_STATICS, KEYWORD_ONLY_EB02, COVERAGE_NOTES_EB02 } from './eb02/effects'
import eb01Cards from './eb01/cards.json'
import eb01Attrs from './eb01/battleAttributes.json'
import { EB01_EFFECTS, EB01_STATICS, KEYWORD_ONLY_EB01, COVERAGE_NOTES_EB01 } from './eb01/effects'
import op15Cards from './op15/cards.json'
import op15Attrs from './op15/battleAttributes.json'
import { OP15_EFFECTS, OP15_STATICS, KEYWORD_ONLY_OP15, COVERAGE_NOTES_OP15 } from './op15/effects'

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
  /** Functional reprints: new card id -> donor id whose defs/statics/rules apply */
  reprints?: Record<string, string>
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
  {
    code: 'OP08',
    cards: op08Cards as CardData[],
    battleAttributes: op08Attrs,
    effects: OP08_EFFECTS,
    statics: OP08_STATICS,
    keywordOnly: KEYWORD_ONLY_OP08,
    notes: COVERAGE_NOTES_OP08,
  },
  {
    code: 'OP09',
    cards: op09Cards as CardData[],
    battleAttributes: op09Attrs,
    effects: OP09_EFFECTS,
    statics: OP09_STATICS,
    keywordOnly: KEYWORD_ONLY_OP09,
    notes: COVERAGE_NOTES_OP09,
  },
  {
    code: 'OP10',
    cards: op10Cards as CardData[],
    battleAttributes: op10Attrs,
    effects: OP10_EFFECTS,
    statics: OP10_STATICS,
    keywordOnly: KEYWORD_ONLY_OP10,
    notes: COVERAGE_NOTES_OP10,
  },
  {
    code: 'OP11',
    cards: op11Cards as CardData[],
    battleAttributes: op11Attrs,
    effects: OP11_EFFECTS,
    statics: OP11_STATICS,
    keywordOnly: KEYWORD_ONLY_OP11,
    notes: COVERAGE_NOTES_OP11,
  },
  {
    code: 'OP12',
    cards: op12Cards as CardData[],
    battleAttributes: op12Attrs,
    effects: OP12_EFFECTS,
    statics: OP12_STATICS,
    keywordOnly: KEYWORD_ONLY_OP12,
    notes: COVERAGE_NOTES_OP12,
  },
  {
    code: 'OP13',
    cards: op13Cards as CardData[],
    battleAttributes: op13Attrs,
    effects: OP13_EFFECTS,
    statics: OP13_STATICS,
    keywordOnly: KEYWORD_ONLY_OP13,
    notes: COVERAGE_NOTES_OP13,
  },
  {
    code: 'OP14',
    cards: op14Cards as CardData[],
    battleAttributes: op14Attrs,
    effects: OP14_EFFECTS,
    statics: OP14_STATICS,
    keywordOnly: KEYWORD_ONLY_OP14,
    notes: COVERAGE_NOTES_OP14,
  },
  {
    code: 'OP15',
    cards: op15Cards as CardData[],
    battleAttributes: op15Attrs,
    effects: OP15_EFFECTS,
    statics: OP15_STATICS,
    keywordOnly: KEYWORD_ONLY_OP15,
    notes: COVERAGE_NOTES_OP15,
  },
  {
    code: 'EB01',
    cards: eb01Cards as CardData[],
    battleAttributes: eb01Attrs,
    effects: EB01_EFFECTS,
    statics: EB01_STATICS,
    keywordOnly: KEYWORD_ONLY_EB01,
    notes: COVERAGE_NOTES_EB01,
  },
  {
    code: 'EB02',
    cards: eb02Cards as CardData[],
    battleAttributes: eb02Attrs,
    effects: EB02_EFFECTS,
    statics: EB02_STATICS,
    keywordOnly: KEYWORD_ONLY_EB02,
    notes: COVERAGE_NOTES_EB02,
  },
  {
    code: 'EB03',
    cards: eb03Cards as CardData[],
    battleAttributes: eb03Attrs,
    effects: EB03_EFFECTS,
    statics: EB03_STATICS,
    keywordOnly: KEYWORD_ONLY_EB03,
    notes: COVERAGE_NOTES_EB03,
  },
  {
    code: 'EB04',
    cards: eb04Cards as CardData[],
    battleAttributes: eb04Attrs,
    effects: EB04_EFFECTS,
    statics: EB04_STATICS,
    keywordOnly: KEYWORD_ONLY_EB04,
    notes: COVERAGE_NOTES_EB04,
  },
  {
    code: 'ST',
    cards: stCards as CardData[],
    battleAttributes: stAttrs,
    effects: ST_EFFECTS,
    statics: ST_STATICS,
    keywordOnly: KEYWORD_ONLY_ST,
    notes: COVERAGE_NOTES_ST,
    reprints: stReprints,
  },
  {
    code: 'PRB01',
    cards: prb01Cards as CardData[],
    battleAttributes: prb01Attrs,
    effects: PRB01_EFFECTS,
    statics: PRB01_STATICS,
    keywordOnly: KEYWORD_ONLY_PRB01,
    notes: COVERAGE_NOTES_PRB01,
  },
  {
    code: 'PRB02',
    cards: prb02Cards as CardData[],
    battleAttributes: prb02Attrs,
    effects: PRB02_EFFECTS,
    statics: PRB02_STATICS,
    keywordOnly: KEYWORD_ONLY_PRB02,
    notes: COVERAGE_NOTES_PRB02,
  },
  {
    code: 'OP16',
    cards: op16Cards as CardData[],
    battleAttributes: op16Attrs,
    effects: OP16_EFFECTS,
    statics: OP16_STATICS,
    keywordOnly: KEYWORD_ONLY_OP16,
    notes: COVERAGE_NOTES_OP16,
  },
  {
    code: 'OP17',
    cards: op17Cards as CardData[],
    battleAttributes: op17Attrs,
    effects: OP17_EFFECTS,
    statics: OP17_STATICS,
    keywordOnly: KEYWORD_ONLY_OP17,
    notes: COVERAGE_NOTES_OP17,
  },
]
