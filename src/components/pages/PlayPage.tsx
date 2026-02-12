import { Link } from 'react-router-dom'
import type { Deck } from '@/engine/types'
import { useGameStore } from '@/stores/gameStore'
import { useDeckStore } from '@/stores/deckStore'
import GameBoard from '@/components/game/GameBoard'

// Fallback test deck if user has no saved decks
function makeQuickDeck(): Deck {
  return {
    id: 'quick-deck',
    name: 'Quick Deck',
    leader: 'OP01-001',
    cards: [
      { cardId: 'OP01-004', qty: 4 },
      { cardId: 'OP01-006', qty: 4 },
      { cardId: 'OP01-009', qty: 4 },
      { cardId: 'OP01-010', qty: 4 },
      { cardId: 'OP01-012', qty: 4 },
      { cardId: 'OP01-017', qty: 4 },
      { cardId: 'OP01-018', qty: 4 },
      { cardId: 'OP01-022', qty: 4 },
      { cardId: 'OP01-023', qty: 4 },
      { cardId: 'OP01-025', qty: 4 },
      { cardId: 'OP01-028', qty: 4 },
      { cardId: 'OP01-029', qty: 4 },
      { cardId: 'OP01-013', qty: 2 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export default function PlayPage() {
  const { gameState, startNewGame } = useGameStore()
  const { savedDecks } = useDeckStore()

  if (gameState) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-4 px-4 pt-2">
          <Link to="/" className="text-xs text-text-secondary hover:text-text-primary">
            &larr; Home
          </Link>
        </div>
        <GameBoard />
      </div>
    )
  }

  // Game setup screen
  const validDecks = savedDecks.filter((d) => d.leader && d.cards.length > 0)

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/" className="text-text-secondary hover:text-text-primary">
          &larr; Home
        </Link>
        <h1 className="text-2xl font-bold">Play</h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <p className="text-text-secondary">Self-play: you control both sides.</p>

        {validDecks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {validDecks.map((deck) => (
              <button
                key={deck.id}
                onClick={() => startNewGame(deck, deck)}
                className="glass-panel px-6 py-3 text-left hover:border-glass-border-hover"
              >
                <p className="font-medium">{deck.name}</p>
                <p className="text-sm text-text-muted">
                  {deck.cards.reduce((s, c) => s + c.qty, 0)} cards
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No saved decks.{' '}
            <Link to="/deck-builder" className="text-info-blue hover:underline">
              Build one
            </Link>{' '}
            or use the quick start deck.
          </p>
        )}

        <button
          onClick={() => {
            const deck = makeQuickDeck()
            startNewGame(deck, deck)
          }}
          className="rounded bg-action-green px-6 py-2 font-medium text-white hover:bg-green-600"
        >
          Quick Start (Red Zoro Mirror)
        </button>
      </div>
    </div>
  )
}
