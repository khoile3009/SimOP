/**
 * Gen-3 trainers (BOT_PLAN P2) over data/gen3-*.jsonl:
 *
 *   BOOT  - Veness-style search bootstrap: regress sigma(w . f) toward the MCTS
 *           root value of the chosen afterstate (soft-label cross-entropy).
 *   BLEND - boot target mixed with the game outcome (0.75 search + 0.25 outcome)
 *           for absolute calibration.
 *   (RANK over same-parent pairs was gen-3 iteration 1 and is retired: pairs
 *   from one decision teach an action-style prior, not state value - it gated
 *   at 24%/35%. Pairs are still logged for future cross-parent work.)
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
  /** Game outcome from the row actor's perspective (gen-3.1 shards) */
  w?: number
}

const files = readdirSync('data').filter((f) => /^(gen3-\d+|flywheel)\.jsonl$/.test(f))
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
const isTest = (g: number) => g % 5 === 0

// ─── BOOT + BLEND ────────────────────────────────────────────────────────────
for (const variant of [
  { name: 'boot', file: 'src/ai/weights.gen3boot.json', alpha: 0 },
  { name: 'blend', file: 'src/ai/weights.gen3blend.json', alpha: 0.25 },
]) {
  const target = (r: BootRow) => (1 - variant.alpha) * r.v + variant.alpha * (r.w ?? r.v)
  const train = boots.filter((r) => !isTest(r.g))
  const test = boots.filter((r) => isTest(r.g))
  const ce = (w: Weights, data: BootRow[]) => {
    let loss = 0
    for (const r of data) {
      const p = Math.min(1 - 1e-9, Math.max(1e-9, sigmoid((w.bias ?? 0) + dot(w, r.f))))
      const t = target(r)
      loss -= t * Math.log(p) + (1 - t) * Math.log(1 - p)
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
      const err = sigmoid((w.bias ?? 0) + dot(w, r.f)) - target(r)
      grad.bias = (grad.bias ?? 0) + err
      for (const k of Object.keys(r.f)) grad[k] = (grad[k] ?? 0) + err * r.f[k]
    }
    for (const k of Object.keys(grad)) {
      w[k] = (w[k] ?? 0) - LR * (grad[k] / train.length + L2 * (w[k] ?? 0))
    }
  }

  console.log(
    `\n${variant.name.toUpperCase()}: test CE ${ce(w, test).toFixed(4)}  (hand baseline ${ce(HAND_WEIGHTS, test).toFixed(4)})`,
  )
  const top = Object.entries(w)
    .filter(([k]) => !k.startsWith('ldr'))
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 8)
  for (const [k, v] of top) console.log(`  ${k.padEnd(24)} ${v.toFixed(4)}`)
  writeFileSync(
    variant.file,
    JSON.stringify({ generatedAt: new Date().toISOString(), rows: boots.length, weights: w }, null, 2) + '\n',
  )
}

console.log('\nwrote weights.gen3boot.json + weights.gen3blend.json')
console.log('next: vite-node scripts/gate-eval.ts 50 12 src/ai/weights.gen3boot.json')
