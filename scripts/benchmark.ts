/**
 * Bot strength ladder:
 *   npm run benchmark            -> 40 games per pairing
 *   npm run benchmark -- 100    -> more games, tighter estimates
 * Mirror deck, seat-swapped, seeded.
 */
import { runBenchmark } from '@/sim/benchmark'
import type { AgentKind } from '@/sim/benchmark'

const games = Number(process.argv[2] ?? 40)
const kinds: AgentKind[] = (process.argv[3] ?? 'random,greedy,planner').split(',') as AgentKind[]
console.log(`Benchmark: ${kinds.join(' / ')} — ${games} games per pairing (mirror deck, seat-swapped)`)

const report = runBenchmark(kinds, games)

console.log('\npairings:')
for (const p of report.pairs) {
  const rate = Math.round((100 * p.aWins) / Math.max(1, p.aWins + p.bWins))
  console.log(
    `  ${p.a.padEnd(8)} vs ${p.b.padEnd(8)} ${String(p.aWins).padStart(3)}-${String(p.bWins).padEnd(3)}` +
    ` (${rate}% for ${p.a})  avg turns ${p.avgTurns.toFixed(1)}  ${p.msPerGame.toFixed(0)}ms/game`,
  )
}

console.log('\noverall win rates:')
for (const [k, r] of Object.entries(report.winRates).sort((x, y) => y[1] - x[1])) {
  console.log(`  ${k.padEnd(8)} ${(100 * r).toFixed(1)}%`)
}
