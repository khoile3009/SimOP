import type { GameState, PlayerId } from '@/engine/types'
import { featureVector } from './evaluate'
import type { EvalFn } from './evaluate'

/**
 * Runtime for the small-MLP eval (scripts/train-mlp.ts): one tanh hidden layer
 * over the dense named features, z-scored with the training stats baked into
 * the model file. ~D x H multiplies per call - comparable to the linear eval.
 */
export interface MlpModel {
  kind: 'mlp'
  hidden: number
  featureKeys: string[]
  mean: number[]
  std: number[]
  W1: number[][]
  b1: number[]
  W2: number[]
  b2: number
}

export function makeMlpEval(model: MlpModel): EvalFn {
  const { featureKeys, mean, std, W1, b1, W2, b2, hidden } = model
  const D = featureKeys.length
  return (state: GameState, playerId: PlayerId): number => {
    if (state.winner) return state.winner === playerId ? 1 : 0
    const f = featureVector(state, playerId)
    const z = new Array(D)
    for (let j = 0; j < D; j++) z[j] = ((f[featureKeys[j]] ?? 0) - mean[j]) / std[j]
    let out = b2
    for (let i = 0; i < hidden; i++) {
      let s = b1[i]
      const w = W1[i]
      for (let j = 0; j < D; j++) s += w[j] * z[j]
      out += W2[i] * Math.tanh(s)
    }
    return 1 / (1 + Math.exp(-out))
  }
}
