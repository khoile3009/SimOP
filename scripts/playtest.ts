/**
 * Bot-fleet playtest campaign:
 *   npm run playtest              -> 400 games across all matchups
 *   npm run playtest -- 2000     -> bigger campaign
 * Exit code 1 when violations occur; failure repros land in playtest-failures/.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { runPlaytest } from '@/sim/playtest'
import { buildCoverageDecks } from '@/sim/decks'

const games = Number(process.argv[2] ?? 400)
const decks = [
  ...buildCoverageDecks('OP01'),
  ...buildCoverageDecks('OP02'),
  ...buildCoverageDecks('OP03'),
]
console.log(
  `Playtest fleet: ${games} games (matchups gr/rg/gg/rr, seeded) across ${decks.length} coverage decks:`,
)
for (const d of decks) console.log(`  ${d.deck.name} (${d.deck.cards.length} unique cards)`)

const report = runPlaytest({ games, decks })

console.log(
  `\nwins: p1=${report.wins.player1} p2=${report.wins.player2} draws=${report.draws}` +
  `  avg turns=${report.avgTurns.toFixed(1)} avg actions=${report.avgActions.toFixed(1)}` +
  `  (${(report.elapsedMs / 1000).toFixed(1)}s)`,
)

console.log('\naction usage:')
for (const [type, n] of Object.entries(report.actionCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type.padEnd(20)} ${n}`)
}

if (report.unusedActionTypes.length) {
  console.log('\n⚠ action types NEVER used (each needs an explanation):')
  for (const t of report.unusedActionTypes) console.log(`  ${t}`)
}

if (report.unusedEffects.length) {
  console.log('\n⚠ registered effects that NEVER fired (dead condition / unpayable cost?):')
  for (const k of report.unusedEffects) console.log(`  ${k}`)
}

console.log(
  `\nUX friction: block prompts ${report.ux.blockSteps} (trivial ${report.ux.trivialBlockSteps})` +
  ` · counter prompts ${report.ux.counterSteps} (trivial ${report.ux.trivialCounterSteps})` +
  ` · choices ${report.ux.choices} (single-option ${report.ux.singleOptionChoices}, declined ${report.ux.declinedChoices})`,
)
if (report.uxNotes.length) {
  console.log('\n📋 UX suggestions from the fleet:')
  for (const note of report.uxNotes) console.log(`  - ${note}`)
}

if (report.violations.length) {
  console.log(`\n✗ ${report.violations.length} violation(s):`)
  mkdirSync('playtest-failures', { recursive: true })
  for (const v of report.violations.slice(0, 20)) {
    console.log(`  game ${v.game} [${v.matchup} seed ${v.seed}] action#${v.actionIndex} ${v.actionType}: ${v.message}`)
    writeFileSync(
      `playtest-failures/game-${v.game}-seed-${v.seed}.json`,
      JSON.stringify(v, null, 2),
    )
  }
  console.log('  repros written to playtest-failures/')
  process.exit(1)
}

console.log('\n✓ no invariant violations')
