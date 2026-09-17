/**
 * Eval A/B ladder: hand weights vs fitted weights, same search, cross-deck:
 *   npm run evalab -- 40
 * The adoption gate for npm run train - fitted weights ship only if they win
 * games, not just predictions.
 */
import { runHeadToHead } from '@/sim/benchmark'
import type { Deck } from '@/engine/types'
import { buildCoverageDecks } from '@/sim/decks'
import { HAND_WEIGHTS, makeEval } from '@/ai/evaluate'
import type { Weights } from '@/ai/evaluate'
import { GreedyAgent } from '@/ai/agents'
import { TurnPlannerAgent } from '@/ai/turnSearch'
import fitted from '@/ai/weights.fitted.json'

const games = Number(process.argv[2] ?? 40)
const fittedWeights = fitted.weights as Weights
if (Object.keys(fittedWeights).length === 0) {
  console.error('No fitted weights - run npm run gendata and npm run train first.')
  process.exit(1)
}

const handEval = makeEval(HAND_WEIGHTS)
const fitEval = makeEval(fittedWeights)

// Non-mirror deck pairs so matchup-conditional features can matter
const decks = buildCoverageDecks('OP01')
const deckPairs: [Deck, Deck][] = decks.map(
  (d, i) => [d.deck, decks[(i + 3) % decks.length].deck] as [Deck, Deck],
)

console.log(`Eval A/B: hand vs fitted, ${games} games per matchup, ${deckPairs.length} deck pairs\n`)

const greedy = runHeadToHead(
  { name: 'greedy-hand', factory: (r) => new GreedyAgent(r, handEval) },
  { name: 'greedy-fitted', factory: (r) => new GreedyAgent(r, fitEval) },
  games,
  { deckPairs },
)
console.log(
  `greedy : hand ${greedy.aWins} - ${greedy.bWins} fitted (draws ${greedy.draws})  ` +
  `fitted win rate ${Math.round((100 * greedy.bWins) / Math.max(1, greedy.aWins + greedy.bWins))}%`,
)

const planner = runHeadToHead(
  { name: 'planner-hand', factory: (r) => new TurnPlannerAgent(r, { evalFn: handEval }) },
  { name: 'planner-fitted', factory: (r) => new TurnPlannerAgent(r, { evalFn: fitEval }) },
  games,
  { deckPairs },
)
console.log(
  `planner: hand ${planner.aWins} - ${planner.bWins} fitted (draws ${planner.draws})  ` +
  `fitted win rate ${Math.round((100 * planner.bWins) / Math.max(1, planner.aWins + planner.bWins))}%`,
)
