/**
 * Small-MLP eval (BOT_PLAN eval path step 3 - the first capacity step).
 * Trains a 1-hidden-layer net (tanh) on the gen-3.1 deep-label corpus with the
 * BLEND target (0.75 search value + 0.25 outcome). Inputs are the dense named
 * features (leader one-hots dropped for v1), z-scored with train-set stats that
 * are baked into the saved model. Hand-rolled Adam; no dependencies.
 *
 * Rationale: four linear fits gated at/below parity while every adopted eval
 * improvement was a nonlinear hand feature - the function class, not the
 * target, is the bottleneck. This tests that theory directly.
 *
 * Run: vite-node scripts/train-mlp.ts [hidden] [epochs]
 * Writes src/ai/weights.mlp.json; gate with
 *   vite-node scripts/gate-eval.ts 50 12 src/ai/weights.mlp.json
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { HAND_WEIGHTS } from '@/ai/evaluate'
import type { Features } from '@/ai/evaluate'
import { mulberry32 } from '@/utils/rng'

const H = Number(process.argv[2] ?? 24)
const EPOCHS = Number(process.argv[3] ?? 40)
const ALPHA = 0.25 // outcome anchor weight in the target

interface BootRow {
  k: 'b'
  g: number
  f: Features
  v: number
  w?: number
}

const files = readdirSync('data').filter((f) => /^gen3-\d+\.jsonl$/.test(f))
const rows: BootRow[] = []
for (const f of files) {
  for (const line of readFileSync(`data/${f}`, 'utf8').split('\n')) {
    if (!line) continue
    const row = JSON.parse(line)
    if (row.k === 'b') rows.push(row)
  }
}
console.log(`read ${files.length} shards: ${rows.length} boot rows`)

// Dense feature vocabulary (drop the sparse leader one-hots for v1)
const keySet = new Set<string>()
for (const r of rows) for (const k of Object.keys(r.f)) if (!k.startsWith('ldr')) keySet.add(k)
const featureKeys = [...keySet].sort()
const D = featureKeys.length
console.log(`${D} dense features, hidden ${H}`)

const target = (r: BootRow) => (1 - ALPHA) * r.v + ALPHA * (r.w ?? r.v)
const trainRows = rows.filter((r) => r.g % 5 !== 0)
const testRows = rows.filter((r) => r.g % 5 === 0)

// Standardization from the train split
const mean = new Array(D).fill(0)
const std = new Array(D).fill(0)
for (const r of trainRows) featureKeys.forEach((k, j) => (mean[j] += r.f[k] ?? 0))
for (let j = 0; j < D; j++) mean[j] /= trainRows.length
for (const r of trainRows) {
  featureKeys.forEach((k, j) => {
    const d = (r.f[k] ?? 0) - mean[j]
    std[j] += d * d
  })
}
for (let j = 0; j < D; j++) std[j] = Math.max(1e-6, Math.sqrt(std[j] / trainRows.length))

const vectorize = (f: Features): number[] =>
  featureKeys.map((k, j) => ((f[k] ?? 0) - mean[j]) / std[j])

const X = trainRows.map((r) => vectorize(r.f))
const T = trainRows.map(target)
const Xt = testRows.map((r) => vectorize(r.f))
const Tt = testRows.map(target)

// Model
const rand = mulberry32(1234)
const init = (n: number, scale: number) =>
  Array.from({ length: n }, () => (rand() * 2 - 1) * scale)
const W1 = Array.from({ length: H }, () => init(D, Math.sqrt(1 / D)))
const b1 = new Array(H).fill(0)
const W2 = init(H, Math.sqrt(1 / H))
let b2 = 0

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
function forward(z: number[]): { h: number[]; y: number } {
  const h = new Array(H)
  for (let i = 0; i < H; i++) {
    let s = b1[i]
    const w = W1[i]
    for (let j = 0; j < D; j++) s += w[j] * z[j]
    h[i] = Math.tanh(s)
  }
  let o = b2
  for (let i = 0; i < H; i++) o += W2[i] * h[i]
  return { h, y: sigmoid(o) }
}

const ce = (Xs: number[][], Ts: number[]) => {
  let loss = 0
  for (let n = 0; n < Xs.length; n++) {
    const p = Math.min(1 - 1e-9, Math.max(1e-9, forward(Xs[n]).y))
    loss -= Ts[n] * Math.log(p) + (1 - Ts[n]) * Math.log(1 - p)
  }
  return loss / Math.max(1, Xs.length)
}

// Hand-weight baseline on the same target, for scale
{
  let loss = 0
  for (const r of testRows) {
    let s = 0
    for (const k of Object.keys(r.f)) s += (HAND_WEIGHTS[k] ?? 0) * r.f[k]
    const p = Math.min(1 - 1e-9, Math.max(1e-9, sigmoid(s)))
    const t = target(r)
    loss -= t * Math.log(p) + (1 - t) * Math.log(1 - p)
  }
  console.log(`hand baseline test CE: ${(loss / testRows.length).toFixed(4)}`)
}

// Adam
const WD = 1e-4 // decoupled weight decay (AdamW)
const LR = 0.005
const B1 = 0.9
const B2 = 0.999
const EPS = 1e-8
const BATCH = 256
type Moments = { m: number; v: number }
const mom = {
  W1: Array.from({ length: H }, () => Array.from({ length: D }, (): Moments => ({ m: 0, v: 0 }))),
  b1: Array.from({ length: H }, (): Moments => ({ m: 0, v: 0 })),
  W2: Array.from({ length: H }, (): Moments => ({ m: 0, v: 0 })),
  b2: { m: 0, v: 0 } as Moments,
}
let step = 0
function adam(param: number, grad: number, mo: Moments): number {
  mo.m = B1 * mo.m + (1 - B1) * grad
  mo.v = B2 * mo.v + (1 - B2) * grad * grad
  const mh = mo.m / (1 - Math.pow(B1, step))
  const vh = mo.v / (1 - Math.pow(B2, step))
  return param - (LR * mh) / (Math.sqrt(vh) + EPS) - LR * WD * param
}

// Early stopping: keep the weights at the best validation CE (rows within a
// game are correlated, so the net overfits within a few epochs)
let bestCe = Infinity
let best = { W1: W1.map((r) => [...r]), b1: [...b1], W2: [...W2], b2 }

const order = X.map((_, n) => n)
for (let epoch = 0; epoch < EPOCHS; epoch++) {
  // Fisher-Yates with the seeded rng
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  for (let start = 0; start < order.length; start += BATCH) {
    const batch = order.slice(start, start + BATCH)
    step++
    const gW1 = Array.from({ length: H }, () => new Array(D).fill(0))
    const gb1 = new Array(H).fill(0)
    const gW2 = new Array(H).fill(0)
    let gb2 = 0
    for (const n of batch) {
      const z = X[n]
      const { h, y } = forward(z)
      const dy = (y - T[n]) / batch.length
      gb2 += dy
      for (let i = 0; i < H; i++) {
        gW2[i] += dy * h[i]
        const dh = dy * W2[i] * (1 - h[i] * h[i])
        gb1[i] += dh
        const g = gW1[i]
        for (let j = 0; j < D; j++) g[j] += dh * z[j]
      }
    }
    for (let i = 0; i < H; i++) {
      for (let j = 0; j < D; j++) W1[i][j] = adam(W1[i][j], gW1[i][j], mom.W1[i][j])
      b1[i] = adam(b1[i], gb1[i], mom.b1[i])
      W2[i] = adam(W2[i], gW2[i], mom.W2[i])
    }
    b2 = adam(b2, gb2, mom.b2)
  }
  const testCe = ce(Xt, Tt)
  if (testCe < bestCe) {
    bestCe = testCe
    best = { W1: W1.map((r) => [...r]), b1: [...b1], W2: [...W2], b2 }
  }
  if (epoch % 5 === 4 || epoch === 0) {
    console.log(
      `epoch ${String(epoch + 1).padStart(2)}: train CE ${ce(X, T).toFixed(4)}  val CE ${testCe.toFixed(4)}  (best ${bestCe.toFixed(4)})`,
    )
  }
}
console.log(`early-stop: best val CE ${bestCe.toFixed(4)}`)

writeFileSync(
  'src/ai/weights.mlp.json',
  JSON.stringify(
    {
      kind: 'mlp',
      generatedAt: new Date().toISOString(),
      rows: rows.length,
      hidden: H,
      featureKeys,
      mean,
      std,
      W1: best.W1,
      b1: best.b1,
      W2: best.W2,
      b2: best.b2,
    },
    null,
    0,
  ) + '\n',
)
console.log('\nwrote src/ai/weights.mlp.json')
console.log('gate: vite-node scripts/gate-eval.ts 50 12 src/ai/weights.mlp.json')
