import type { EffectDef, EffectTiming, StaticDef } from './ast'
import { SET_MODULES } from '@/data/sets'

/**
 * Rule-processing pseudo-defs, keyed by '$'-prefixed ids that are never real
 * cards. '$boardFull' implements CR 3-7-6-1: playing a 6th character trashes an
 * existing one first (rule processing, not a K.O.), then the staged card - the
 * frame's source - is played.
 */
const RULES_EFFECTS: Record<string, EffectDef[]> = {
  $boardFull: [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'characters' },
          min: 1,
          max: 1,
          prompt: 'Character area is full: trash 1 of your Characters',
        },
        { op: 'trashFromField', ref: 't' },
        { op: 'playSelf' },
      ],
    },
  ],
}

const registry: Record<string, EffectDef[]> = Object.assign(
  {},
  ...SET_MODULES.map((s) => s.effects),
  RULES_EFFECTS,
)
const statics: Record<string, StaticDef[]> = Object.assign({}, ...SET_MODULES.map((s) => s.statics))
/** Functional reprints resolve to their donor's registrations. */
export const REPRINTS: Record<string, string> = Object.assign(
  {},
  ...SET_MODULES.map((s) => s.reprints ?? {}),
)

const resolve = (cardId: string): string => REPRINTS[cardId] ?? cardId

export function getEffectDefs(cardId: string, timing?: EffectTiming): EffectDef[] {
  const defs = registry[resolve(cardId)] ?? []
  return timing ? defs.filter((d) => d.timing === timing) : defs
}

export function getStatics(cardId: string): StaticDef[] {
  return statics[resolve(cardId)] ?? []
}

/** Test hooks: register defs for a card id (e.g. synthetic cards). */
export function registerEffects(cardId: string, defs: EffectDef[]): void {
  registry[cardId] = defs
}

export function registerStatics(cardId: string, defs: StaticDef[]): void {
  statics[cardId] = defs
}
