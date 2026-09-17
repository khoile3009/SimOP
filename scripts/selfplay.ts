/**
 * Headless self-play demo:
 *   npm run selfplay              -> 20 games, greedy vs random
 *   npm run selfplay -- 50 rr    -> 50 games, random vs random
 *   npm run selfplay -- 30 gg    -> 30 games, greedy vs greedy
 */
import { RandomAgent, GreedyAgent, type Agent } from '@/ai/agents'
import { runMatch, makeAutoDeck } from '@/sim/selfplay'

const n = Number(process.argv[2] ?? 20)
const mode = process.argv[3] ?? 'gr'

const makers: Record<string, (rand: () => number) => Agent> = {
  g: (rand) => new GreedyAgent(rand),
  r: (rand) => new RandomAgent(rand),
}
const make1 = makers[mode[0]] ?? makers.g
const make2 = makers[mode[1]] ?? makers.r

const deck1 = makeAutoDeck('OP01-001')
const deck2 = makeAutoDeck('OP01-001')

console.log(`Running ${n} games: player1=${make1(Math.random).name} vs player2=${make2(Math.random).name}`)
const start = Date.now()
const result = runMatch(n, make1, make2, deck1, deck2, 2026)
const elapsed = Date.now() - start

const avgTurns = result.games.reduce((s, g) => s + g.turnCount, 0) / result.games.length
const avgActions = result.games.reduce((s, g) => s + g.actionCount, 0) / result.games.length
console.log(`player1: ${result.wins.player1}  player2: ${result.wins.player2}  draws: ${result.draws}`)
console.log(`avg turns: ${avgTurns.toFixed(1)}  avg actions: ${avgActions.toFixed(1)}  (${elapsed}ms total, ${(elapsed / n).toFixed(1)}ms/game)`)

const sample = result.games[0]
console.log(`\nSample game (seed ${sample.seed}): winner=${sample.winner} in ${sample.turnCount} turns`)
console.log('player1 win-probability by turn:')
for (const snap of sample.evalTrace) {
  const bar = '#'.repeat(Math.round(snap.player1Score * 40))
  console.log(`  t${String(snap.turnNumber).padStart(2)} ${snap.player1Score.toFixed(2)} ${bar}`)
}
