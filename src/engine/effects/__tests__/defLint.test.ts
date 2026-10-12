import { describe, it, expect } from 'vitest'
import type { CardData } from '@/engine/types'
import type { Cond, SelectFilter } from '../ast'
import { SET_MODULES } from '@/data/sets'
import { IMPLEMENTED_CONDS } from '../statics'
import { getAllCards, getCardById } from '@/data/cardService'
import { cardHasName } from '@/engine/rulesLayer'

/**
 * Static semantics linter for effect definitions. Every rule here maps to a
 * bug class that actually shipped once: unbound refs are silent no-ops,
 * free-to-activate abilities get spammed by bots (Byrnndi World), keyword and
 * type-name typos become dead conditions the fleet can only find at scale,
 * and list cross-contamination hides cards from the coverage gates.
 */

const SETS = SET_MODULES.map((s) => ({
  set: s.code,
  effects: s.effects,
  statics: s.statics,
  keywordOnly: s.keywordOnly,
}))

const KNOWN_KEYWORDS = new Set(['Rush', 'Blocker', 'Double Attack', 'Banish', 'Unblockable'])
const ALL_TYPES = new Set(getAllCards().flatMap((c: CardData) => c.attribute))
const nameExists = (name: string) => getAllCards().some((c) => cardHasName(c.id, name))
const typeExists = (t: string) => ALL_TYPES.has(t)
const typeSubstringExists = (t: string) => [...ALL_TYPES].some((x) => x.includes(t))

function lintFilter(where: string, f: SelectFilter, errors: string[]) {
  if (f.typeIncludes && !typeExists(f.typeIncludes)) {
    errors.push(`${where}: unknown type "${f.typeIncludes}"`)
  }
  for (const t of f.typeIncludesAny ?? []) {
    if (!typeExists(t)) errors.push(`${where}: unknown type "${t}"`)
  }
  if (f.typeContains && !typeSubstringExists(f.typeContains)) {
    errors.push(`${where}: no type contains "${f.typeContains}"`)
  }
  if (f.nameIs && !nameExists(f.nameIs)) errors.push(`${where}: unknown name "${f.nameIs}"`)
  if (f.nameNot && !nameExists(f.nameNot)) errors.push(`${where}: unknown name "${f.nameNot}"`)
}

function lintCond(where: string, cond: Cond | undefined, errors: string[]) {
  if (!cond) return
  if (cond.leaderNameIs && !nameExists(cond.leaderNameIs)) {
    errors.push(`${where}: unknown leader name "${cond.leaderNameIs}"`)
  }
  if (cond.leaderTypeIncludes && !typeExists(cond.leaderTypeIncludes)) {
    errors.push(`${where}: unknown leader type "${cond.leaderTypeIncludes}"`)
  }
  if (cond.leaderTypeContains && !typeSubstringExists(cond.leaderTypeContains)) {
    errors.push(`${where}: no type contains "${cond.leaderTypeContains}"`)
  }
  for (const key of ['hasCharacterNamed', 'lacksCharacterNamed'] as const) {
    const v = cond[key]
    if (v && !nameExists(v)) errors.push(`${where}: unknown name "${v}"`)
  }
}

describe('effect definition linter', () => {
  it('every op reference is bound by an earlier select (or is self)', () => {
    const errors: string[] = []
    for (const { effects } of SETS) {
      for (const [id, defs] of Object.entries(effects)) {
        defs.forEach((def, di) => {
          const bound = new Set(['self'])
          def.ops.forEach((op, oi) => {
            const o = op as Record<string, unknown>
            for (const key of ['ref', 'toRef', 'countRef']) {
              const v = o[key]
              if (typeof v === 'string' && !bound.has(v)) {
                errors.push(`${id} def[${di}] op[${oi}] ${op.op}: unbound ref "${v}"`)
              }
            }
            if (typeof o.bind === 'string') bound.add(o.bind)
          })
        })
      }
    }
    expect(errors).toEqual([])
  })

  it('no free-to-activate ability whose only cost is an optional ops-encoded one', () => {
    const errors: string[] = []
    for (const { effects } of SETS) {
      for (const [id, defs] of Object.entries(effects)) {
        defs.forEach((def, di) => {
          if (def.timing !== 'activateMain' || def.cost || def.oncePerTurn) return
          const [first, second] = def.ops
          const optionalCost =
            first?.op === 'select' && first.min === 0 && second?.op === 'abortIfEmpty'
          if (optionalCost || def.ops.every((o) => o.op !== 'select' || o.min === 0)) {
            // A declineable first cost (or no mandatory selection at all) means
            // bots can activate forever for free - the Byrnndi World spam bug
            if (optionalCost) errors.push(`${id} def[${di}]: activateMain with only an optional cost`)
          }
        })
      }
    }
    expect(errors).toEqual([])
  })

  it('keyword grants use real keywords', () => {
    const errors: string[] = []
    for (const { effects, statics } of SETS) {
      for (const [id, defs] of Object.entries(effects)) {
        for (const def of defs) {
          for (const op of def.ops) {
            if (op.op === 'grantKeyword' && !KNOWN_KEYWORDS.has(op.keyword)) {
              errors.push(`${id}: unknown keyword "${op.keyword}"`)
            }
          }
        }
      }
      for (const [id, sts] of Object.entries(statics)) {
        for (const st of sts) {
          if (st.keyword && !KNOWN_KEYWORDS.has(st.keyword)) {
            errors.push(`${id}: unknown keyword "${st.keyword}"`)
          }
        }
      }
    }
    expect(errors).toEqual([])
  })

  it('type and name references point at real cards', () => {
    const errors: string[] = []
    for (const { effects, statics } of SETS) {
      for (const [id, defs] of Object.entries(effects)) {
        defs.forEach((def, di) => {
          lintCond(`${id} def[${di}]`, def.condition, errors)
          def.ops.forEach((op, oi) => {
            const where = `${id} def[${di}] op[${oi}]`
            if ('filter' in op && op.op === 'select') lintFilter(where, op.filter as SelectFilter, errors)
            if (op.op === 'requireCond') lintCond(where, op.cond, errors)
            if ((op.op === 'searchTop' || op.op === 'searchDeck') && op.filter) {
              const f = op.filter
              if (f.typeIncludes && !typeExists(f.typeIncludes)) errors.push(`${where}: unknown type "${f.typeIncludes}"`)
              if (f.typeContains && !typeSubstringExists(f.typeContains)) errors.push(`${where}: no type contains "${f.typeContains}"`)
              if (f.nameIs && !nameExists(f.nameIs)) errors.push(`${where}: unknown name "${f.nameIs}"`)
              if (f.nameNot && !nameExists(f.nameNot)) errors.push(`${where}: unknown name "${f.nameNot}"`)
              if ('orNameIs' in f && f.orNameIs && !nameExists(f.orNameIs)) errors.push(`${where}: unknown name "${f.orNameIs}"`)
            }
            if (op.op === 'searchDeckByName' && !nameExists(op.name)) {
              errors.push(`${where}: unknown name "${op.name}"`)
            }
          })
        })
      }
      for (const [id, sts] of Object.entries(statics)) {
        sts.forEach((st, si) => {
          const where = `${id} static[${si}]`
          lintCond(where, st.condition, errors)
          if (st.target.typeIncludes && !typeExists(st.target.typeIncludes)) {
            errors.push(`${where}: unknown type "${st.target.typeIncludes}"`)
          }
          if (st.target.nameIs && !nameExists(st.target.nameIs)) errors.push(`${where}: unknown name "${st.target.nameIs}"`)
          if (st.target.nameNot && !nameExists(st.target.nameNot)) errors.push(`${where}: unknown name "${st.target.nameNot}"`)
        })
      }
    }
    expect(errors).toEqual([])
  })

  it('registered ids exist in the card database and lists do not overlap', () => {
    const errors: string[] = []
    for (const { set, effects, statics, keywordOnly } of SETS) {
      for (const id of [...Object.keys(effects), ...Object.keys(statics), ...keywordOnly]) {
        if (!getCardById(id)) errors.push(`${set}: ${id} not in the card database`)
      }
      for (const id of keywordOnly) {
        if (id in effects || id in statics) {
          errors.push(`${set}: ${id} is KEYWORD_ONLY but also has defs/statics`)
        }
      }
    }
    expect(errors).toEqual([])
  })

  it('every condition field used in data is actually implemented by evalCond', () => {
    // Guards the OP06-OP11 regression where Cond fields existed in the AST but
    // evalCond never read them - the "conditions" silently always passed
    const errors: string[] = []
    const checkCond = (where: string, cond: Record<string, unknown> | undefined) => {
      if (!cond) return
      for (const key of Object.keys(cond)) {
        if (!IMPLEMENTED_CONDS.has(key)) errors.push(`${where}: cond "${key}" not implemented`)
      }
    }
    for (const { effects, statics } of SETS) {
      for (const [id, defs] of Object.entries(effects)) {
        defs.forEach((def, di) => {
          checkCond(`${id} def[${di}]`, def.condition as Record<string, unknown> | undefined)
          def.ops.forEach((op, oi) => {
            if (op.op === 'requireCond') {
              checkCond(`${id} def[${di}] op[${oi}]`, op.cond as Record<string, unknown>)
            }
          })
        })
      }
      for (const [id, sts] of Object.entries(statics)) {
        sts.forEach((st, si) =>
          checkCond(`${id} static[${si}]`, st.condition as Record<string, unknown> | undefined),
        )
      }
    }
    expect(errors).toEqual([])
  })

  it('DON requirements and once-per-turn marks sit on field-capable cards', () => {
    const errors: string[] = []
    for (const { effects } of SETS) {
      for (const [id, defs] of Object.entries(effects)) {
        const data = getCardById(id)
        if (data?.cardType !== 'Event') continue
        defs.forEach((def, di) => {
          // Events resolve from the hand/trash: attached-DON conditions can
          // never hold and once-per-turn marks have no live card to stick to
          if (def.donRequired) errors.push(`${id} def[${di}]: donRequired on an Event card`)
          if (def.oncePerTurn) errors.push(`${id} def[${di}]: oncePerTurn on an Event card`)
        })
      }
    }
    expect(errors).toEqual([])
  })
})
