/**
 * Effect-usage telemetry for playtest campaigns: counts every effect frame the
 * interpreter queues, keyed by cardId:timing. Cards whose defs never fire across
 * thousands of games are a bug signal (dead condition, unreachable timing,
 * unpayable cost). Zero overhead concerns: plain counters, off the hot path.
 */
const counts = new Map<string, number>()

export function recordEffectFired(cardId: string, timing: string): void {
  const key = `${cardId}:${timing}`
  counts.set(key, (counts.get(key) ?? 0) + 1)
}

export function effectUsageSnapshot(): Record<string, number> {
  return Object.fromEntries(counts)
}

export function resetEffectUsage(): void {
  counts.clear()
}
