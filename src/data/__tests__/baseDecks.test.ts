import { describe, it, expect } from 'vitest'
import { BASE_DECKS } from '@/sim/baseDecks'
import { getCardById } from '@/data/cardService'
import { getCardRules } from '@/engine/rulesLayer'

describe('base deck pool', () => {
  it('every deck is legal: 50 cards, max 4 copies, colors match the leader', () => {
    expect(BASE_DECKS.length).toBeGreaterThanOrEqual(8)
    for (const deck of BASE_DECKS) {
      const leader = getCardById(deck.leader)
      expect(leader?.cardType, deck.id).toBe('Leader')
      const colors = new Set(leader!.color)
      let total = 0
      const seen = new Set<string>()
      for (const entry of deck.cards) {
        const card = getCardById(entry.cardId)
        expect(card, `${deck.id}: ${entry.cardId}`).toBeDefined()
        expect(card!.cardType, `${deck.id}: ${entry.cardId}`).not.toBe('Leader')
        expect(seen.has(entry.cardId), `${deck.id}: duplicate ${entry.cardId}`).toBe(false)
        seen.add(entry.cardId)
        const limitOk = getCardRules(entry.cardId)?.deckCopyLimit === 'any' || entry.qty <= 4
        expect(limitOk, `${deck.id}: ${entry.cardId} x${entry.qty}`).toBe(true)
        expect(
          card!.color.some((c) => colors.has(c)),
          `${deck.id}: ${entry.cardId} colors ${card!.color} vs leader ${leader!.color}`,
        ).toBe(true)
        total += entry.qty
      }
      expect(total, deck.id).toBe(50)
    }
  })

  it('every deck plays a clean seeded bot game', async () => {
    const { runGame } = await import('@/sim/selfplay')
    const { GreedyAgent } = await import('@/ai/agents')
    for (const deck of BASE_DECKS) {
      const record = runGame({
        deck1: deck,
        deck2: deck,
        agent1: new GreedyAgent(() => 0.42),
        agent2: new GreedyAgent(() => 0.42),
        seed: 7,
      })
      expect(record.winner, deck.id).toBeTruthy()
    }
  })
})
