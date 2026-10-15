/* Write the live HAND_WEIGHTS to a gate-eval weights file, optionally zeroing
 * named keys - the "old" side for feature on/off gates.
 * Run: vite-node scripts/dump-weights.ts <out.json> [keyToZero ...]
 */
import { writeFileSync } from 'node:fs'
import { HAND_WEIGHTS } from '@/ai/evaluate'

const out = process.argv[2] ?? 'data/hand-weights.json'
const weights = { ...HAND_WEIGHTS }
for (const key of process.argv.slice(3)) weights[key] = 0
writeFileSync(out, JSON.stringify({ weights }, null, 2) + '\n')
console.log(`${out}: ${process.argv.slice(3).join(', ') || 'no keys'} zeroed`)
