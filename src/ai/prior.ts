import type { GameState, PlayerId } from '@/engine/types'
import { featureVector } from './evaluate'
import type { Weights } from './evaluate'
import gen3rank from './weights.gen3rank.json'

/**
 * Policy prior for PUCT selection (BOT_PLAN: priors cut effective branching).
 *
 * The gen-3 pairwise rank model was REJECTED as an evaluation - its biases
 * ("dumping cards looks like winning") poison a value function. As a PRIOR it
 * only orders which children get visits first, and UCT corrects a biased
 * ordering with evidence, so the same weights are recycled here in the role
 * where the bias is harmless. Scores are raw logits over afterstate features
 * from the CHOOSING player's perspective; the search softmaxes them over
 * siblings.
 */

export type PriorFn = (state: GameState, actor: PlayerId) => number

export function makeRankPrior(weights: Weights): PriorFn {
  const entries = Object.entries(weights)
  return (state, actor) => {
    const f = featureVector(state, actor)
    let score = 0
    for (const [key, w] of entries) score += w * (f[key] ?? 0)
    return score
  }
}

/** The recycled gen-3 rank model (158k training pairs, Oct 2026). */
export const rankPrior: PriorFn = makeRankPrior(gen3rank.weights as Weights)
