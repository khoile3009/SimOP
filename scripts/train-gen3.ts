/**
 * Gen-3 trainers (BOT_PLAN P2) over data/gen3-*.jsonl:
 *
 *   RANK - pairwise RankNet: maximize sigma(w . (f_chosen - f_rejected)) over the
 *          pairs the SEARCH actually compared. No bias term (the pair label is
 *          always "chosen wins", so a bias would just inflate); leader one-hots
 *          cancel inside a pair and train only through the boot variant.
 *   BOOT - Veness-style search bootstrap: regress sigma(w . f) toward the MCTS
 *          root value of the chosen afterstate (soft-label cross-entropy).
 *
 * Both split train/test BY GAME, init from the hand weights, and report the
 * hand-weight baseline on the same held-out metric. Prediction metrics never
 * decide adoption - the ladder gate does (scripts/gate-eval.ts <file>).
 *
 * Run: vite-node scripts/train-gen3.ts
 * Writes src/ai/weights.gen3rank.json and src/ai/weights.gen3boot.json.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { HAND_WEIGHTS } from '@/ai/evaluate'
import type { Weights, Features } from '@/ai/evaluate'

interface PairRow {
  k: 'p'
  g: number
  c: Features
  r: Features
}
interface BootRow {
  k: 'b'
  g: number
  f: Features
  v: number
}

const files = readdirSync('data').filter((f) => /^gen3-\d+\.jsonl$/.test(f))
const pairs: PairRow[] = []
const boots: BootRow[] = []
for (const f of files) {
  for (const line of readFileSync(`data/${f}`, 'utf8').split('\n')) {
    if (!line) continue
    const row = JSON.parse(line)
    if (row.k === 'p') pairs.push(row)
    else if (row.k === 'b') boots.push(row)
  }
}
console.log(`read ${files.length} shards: ${pairs.length} pairs, ${boots.length} boot rows`)

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
const dot = (w: Weights, f: Features) => {
  let sum = 0
  for (const k of Object.keys(f)) sum += (w[k] ?? 0) * f[k]
  return sum
}
const diff = (a: Features, b: Features): Features => {
  const d: Features = {}
  for (const k of Object.keys(a)) d[k] = a[k] - (b[k] ?? 0)
  for (const k of Object.keys(b)) if (!(k in d)) d[k] = -b[k]
  return d
}
const isTest = (g: number) => g % 5 === 0

// ─── RANK ────────────────────────────────────────────────────────────────────
{
  const rows = pairs.map((p) => ({ g: p.g, d: diff(p.c, p.r) }))
  const train = rows.filter((r) => !isTest(r.g))
  const test = rows.filter((r) => isTest(r.g))
  const accuracy = (w: Weights, data: typeof rows) =>
    data.length === 0 ? 0 : data.filter((r) => dot(w, r.d) > 0).length / data.length

  const w: Weights = {}
  for (const k of Object.keys(HAND_WEIGHTS)) w[k] = HAND_WEIGHTS[k]

  const LR = 0.2
  const L2 = 1e-5
  for (let epoch = 0; epoch < 300; epoch++) {
    const grad: Weights = {}
    for (const r of train) {
      const err = sigmoid(dot(w, r.d)) - 1 // label is always 1: chosen > rejected
      for (const k of Object.keys(r.d)) grad[k] = (grad[k] ?? 0) + err * r.d[k]
    }
    for (const k of Object.keys(grad)) {
      w[k] = (w[k] ?? 0) - LR * (grad[k] / train.length + L2 * (w[k] ?? 0))
    }
  }

  console.log(`\nRANK: train acc ${(100 * accuracy(w, train)).toFixed(1)}%`)
  console.log(`      test  acc ${(100 * accuracy(w, test)).toFixed(1)}%  (hand baseline ${(100 * accuracy(HAND_WEIGHTS, test)).toFixed(1)}%)`)
  const top = Object.entries(w).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 10)
  for (const [k, v] of top) console.log(`      ${k.padEnd(24)} ${v.toFixed(4)}`)
  writeFileSync(
    'src/ai/weights.gen3rank.json',
    JSON.stringify({ generatedAt: new Date().toISOString(), pairs: rows.length, weights: w }, null, 2) + '\n',
  )
}

// ─── BOOT ────────────────────────────────────────────────────────────────────
{
  const train = boots.filter((r) => !isTest(r.g))
  const test = boots.filter((r) => isTest(r.g))
  const ce = (w: Weights, data: BootRow[]) => {
    let loss = 0
    for (const r of data) {
      const p = Math.min(1 - 1e-9, Math.max(1e-9, sigmoid((w.bias ?? 0) + dot(w, r.f))))
      loss -= r.v * Math.log(p) + (1 - r.v) * Math.log(1 - p)
    }
    return loss / Math.max(1, data.length)
  }

  const w: Weights = { bias: 0 }
  for (const k of Object.keys(HAND_WEIGHTS)) w[k] = HAND_WEIGHTS[k]

  const LR = 0.2
  const L2 = 1e-5
  for (let epoch = 0; epoch < 300; epoch++) {
    const grad: Weights = {}
    for (const r of train) {
      const err = sigmoid((w.bias ?? 0) + dot(w, r.f)) - r.v
      grad.bias = (grad.bias ?? 0) + err
      for (const k of Object.keys(r.f)) grad[k] = (grad[k] ?? 0) + err * r.f[k]
    }
    for (const k of Object.keys(grad)) {
      w[k] = (w[k] ?? 0) - LR * (grad[k] / train.length + L2 * (w[k] ?? 0))
    }
  }

  console.log(`\nBOOT: test CE ${ce(w, test).toFixed(4)}  (hand baseline ${ce(HAND_WEIGHTS, test).toFixed(4)})`)
  writeFileSync(
    'src/ai/weights.gen3boot.json',
    JSON.stringify({ generatedAt: new Date().toISOString(), rows: boots.length, weights: w }, null, 2) + '\n',
  )
}
console.log('\nwrote src/ai/weights.gen3rank.json + weights.gen3boot.json')
console.log('next: vite-node scripts/gate-eval.ts 50 12 src/ai/weights.gen3rank.json')
