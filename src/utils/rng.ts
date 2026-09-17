/** Mulberry32: small, fast, seedable PRNG. Good enough for game shuffles, not for crypto. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// All engine randomness (shuffles, first-player coin) flows through this source so
// headless simulation can be made deterministic per seed. The UI never touches this
// and keeps Math.random behavior.
let source: () => number = Math.random

export function random(): number {
  return source()
}

export function setRandomSource(fn: () => number): void {
  source = fn
}

export function resetRandomSource(): void {
  source = Math.random
}
