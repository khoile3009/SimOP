import type { EffectDef, EffectTiming, StaticDef } from './ast'
import { OP01_EFFECTS, OP01_STATICS } from '@/data/op01/effects'

const registry: Record<string, EffectDef[]> = { ...OP01_EFFECTS }
const statics: Record<string, StaticDef[]> = { ...OP01_STATICS }

export function getEffectDefs(cardId: string, timing?: EffectTiming): EffectDef[] {
  const defs = registry[cardId] ?? []
  return timing ? defs.filter((d) => d.timing === timing) : defs
}

export function getStatics(cardId: string): StaticDef[] {
  return statics[cardId] ?? []
}

/** Test hooks: register defs for a card id (e.g. synthetic cards). */
export function registerEffects(cardId: string, defs: EffectDef[]): void {
  registry[cardId] = defs
}

export function registerStatics(cardId: string, defs: StaticDef[]): void {
  statics[cardId] = defs
}
