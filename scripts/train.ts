/**
 * Fit the evaluation weights by logistic regression on self-play outcomes:
 *   npm run train
 * Reads data/train.jsonl, splits 80/20 BY GAME, initializes from the hand
 * weights, runs gradient descent with L2, and reports held-out log-loss plus a
 * calibration table. Writes src/ai/weights.fitted.json, which evaluate.ts
 * loads as the active weights.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { HAND_WEIGHTS } from '@/ai/evaluate'
import type { Weights } from '@/ai/evaluate'

interface Row {
  game: number
  label: number
  features: Record<string, number>
}

const rows: Row[] = readFileSync('data/train.jsonl', 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line))

const games = [...new Set(rows.map((r) => r.game))]
// Deterministic by-game split
const testGames = new Set(games.filter((g) => g % 5 === 0))
const train = rows.filter((r) => !testGames.has(r.game))
const test = rows.filter((r) => testGames.has(r.game))
console.log(`${rows.length} rows, ${games.length} games -> train ${train.length} / test ${test.length}`)

// Feature vocabulary
const keys = new Set<string>(['bias'])
for (const r of rows) for (const k of Object.keys(r.features)) keys.add(k)

const w: Weights = { bias: 0 }
for (const k of keys) w[k] = HAND_WEIGHTS[k] ?? 0

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
const predict = (weights: Weights, f: Record<string, number>) => {
  let sum = weights.bias ?? 0
  for (const k of Object.keys(f)) sum += (weights[k] ?? 0) * f[k]
  return sigmoid(sum)
}
const logLoss = (data: Row[], weights: Weights) => {
  let loss = 0
  for (const r of data) {
    const p = Math.min(1 - 1e-9, Math.max(1e-9, predict(weights, r.features)))
    loss -= r.label * Math.log(p) + (1 - r.label) * Math.log(1 - p)
  }
  return loss / data.length
}

const LR = 0.1
const L2 = 1e-5
const EPOCHS = 300
for (let epoch = 0; epoch < EPOCHS; epoch++) {
  const grad: Weights = {}
  for (const r of train) {
    const err = predict(w, r.features) - r.label
    grad.bias = (grad.bias ?? 0) + err
    for (const k of Object.keys(r.features)) grad[k] = (grad[k] ?? 0) + err * r.features[k]
  }
  for (const k of Object.keys(grad)) {
    w[k] = (w[k] ?? 0) - LR * (grad[k] / train.length + L2 * (w[k] ?? 0))
  }
  if (epoch % 75 === 74 || epoch === 0) {
    console.log(
      `epoch ${String(epoch + 1).padStart(2)}: train ${logLoss(train, w).toFixed(4)}  test ${logLoss(test, w).toFixed(4)}`,
    )
  }
}

console.log(`\nhand-weight baseline test log-loss: ${logLoss(test, HAND_WEIGHTS).toFixed(4)}`)
console.log(`fitted test log-loss:               ${logLoss(test, w).toFixed(4)}`)

// Calibration on held-out games
const buckets = Array.from({ length: 10 }, () => ({ n: 0, wins: 0, pSum: 0 }))
for (const r of test) {
  const p = predict(w, r.features)
  const b = Math.min(9, Math.floor(p * 10))
  buckets[b].n++
  buckets[b].wins += r.label
  buckets[b].pSum += p
}
console.log('\ncalibration (held-out): predicted -> actual (n)')
buckets.forEach((b, i) => {
  if (b.n === 0) return
  console.log(
    `  ${String(i * 10).padStart(2)}-${i * 10 + 10}%: ${((100 * b.pSum) / b.n).toFixed(0)}% -> ${((100 * b.wins) / b.n).toFixed(0)}% (${b.n})`,
  )
})

// Top weights for a readability check
const top = Object.entries(w)
  .filter(([k]) => k !== 'bias')
  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
  .slice(0, 14)
console.log('\nlargest fitted weights:')
for (const [k, v] of top) console.log(`  ${k.padEnd(24)} ${v.toFixed(4)}`)

writeFileSync(
  'src/ai/weights.fitted.json',
  JSON.stringify({ generatedAt: new Date().toISOString(), games: games.length, weights: w }, null, 2) + '\n',
)
console.log('\nwrote src/ai/weights.fitted.json (restart tooling to pick it up)')
