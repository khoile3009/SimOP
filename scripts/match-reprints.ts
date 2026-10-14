/**
 * Find EXACT functional reprints of existing pool cards inside a new set:
 * same name, card type, stats, colors, types, battle attribute, and
 * whitespace-normalized effect + trigger text. Matches alias through
 * SetModule.reprints so the donor's defs/statics/rules apply unchanged.
 *
 * Run: vite-node scripts/match-reprints.ts <SET> (writes src/data/<set>/reprints.json)
 */
import { writeFileSync } from 'node:fs'
import { getAllCards, getCardsBySet } from '@/data/cardService'
import { getBattleAttribute } from '@/engine/rulesLayer'

const setCode = (process.argv[2] ?? 'ST').toUpperCase()
const norm = (t: string | null | undefined) => (t ?? '').replace(/\s+/g, ' ').trim()
const sig = (c: ReturnType<typeof getAllCards>[number]) =>
  JSON.stringify([
    c.name,
    c.cardType,
    c.cost,
    c.power,
    c.counter,
    c.life ?? null,
    [...c.color].sort(),
    [...(c.attribute ?? [])].sort(),
    getBattleAttribute(c.id) ?? null,
    norm(c.effectText),
    norm(c.triggerText),
  ])

const pool = new Map<string, string>()
for (const c of getAllCards()) {
  if (c.set === setCode) continue
  const k = sig(c)
  if (!pool.has(k)) pool.set(k, c.id)
}

const reprints: Record<string, string> = {}
let withText = 0
for (const c of getCardsBySet(setCode)) {
  if (!c.effectText && !c.triggerText) continue
  withText++
  const donor = pool.get(sig(c))
  if (donor) reprints[c.id] = donor
}
writeFileSync(
  `src/data/${setCode.toLowerCase()}/reprints.json`,
  JSON.stringify(reprints, null, 2) + '\n',
)
console.log(
  `${setCode}: ${Object.keys(reprints).length}/${withText} texted cards are exact reprints`,
)
for (const [a, b] of Object.entries(reprints).slice(0, 10)) console.log(`  ${a} -> ${b}`)
