/**
 * Forced-fire sweep: fire every effect def of every card under adversarial
 * choice policies and report errors, invariant violations, and defs the
 * harness could not reach. `npm run deffire`
 */
import { runDefFire } from '@/sim/defFire'

const results = runDefFire()
const by = (s: string) => results.filter((r) => r.status === s)
const errors = by('error')
const violations = by('violation')
const noScenario = by('noScenario')
const notFired = by('notFired')
const fired = by('fired')

console.log(`defs x policies: ${results.length}`)
console.log(`fired: ${fired.length}  notFired: ${notFired.length}  noScenario: ${noScenario.length}`)
console.log(`ERRORS: ${errors.length}  VIOLATIONS: ${violations.length}\n`)

const dedupe = (rows: typeof results) => {
  const seen = new Map<string, typeof results[number]>()
  for (const r of rows) {
    const key = `${r.cardId}:${r.defIndex}:${r.detail}`
    if (!seen.has(key)) seen.set(key, r)
  }
  return [...seen.values()]
}

if (errors.length) {
  console.log('── errors ──')
  for (const r of dedupe(errors)) console.log(`  ${r.cardId} def[${r.defIndex}] ${r.timing} (${r.policy}): ${r.detail}`)
}
if (violations.length) {
  console.log('── violations ──')
  for (const r of dedupe(violations)) console.log(`  ${r.cardId} def[${r.defIndex}] ${r.timing} (${r.policy}): ${r.detail}`)
}
if (noScenario.length) {
  console.log('── no scenario ──')
  for (const r of dedupe(noScenario)) console.log(`  ${r.cardId} def[${r.defIndex}] ${r.timing}: ${r.detail}`)
}
// A def is covered if ANY policy fired it (max-policy counters legitimately
// prevent trigger damage, etc.) - the real gap list is never-fired-anywhere
const firedKeys = new Set(fired.map((r) => `${r.cardId}:${r.defIndex}`))
const never = dedupe(notFired.filter((r) => !firedKeys.has(`${r.cardId}:${r.defIndex}`)))
console.log(`── never fired under ANY policy: ${never.length} ──`)
for (const r of never) console.log(`  ${r.cardId} def[${r.defIndex}] ${r.timing}: ${r.detail}`)
