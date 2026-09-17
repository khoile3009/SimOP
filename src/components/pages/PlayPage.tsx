import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Deck } from '@/engine/types'
import { legalActions, whoActs } from '@/engine/legalActions'
import { useGameStore } from '@/stores/gameStore'
import { useDeckStore } from '@/stores/deckStore'
import { GreedyAgent } from '@/ai/agents'
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

/** Drives the AI seat: whenever the engine is waiting on the AI, play its move. */
function useAiDriver() {
  const gameState = useGameStore((s) => s.gameState)
  const aiPlayer = useGameStore((s) => s.aiPlayer)
  const dispatch = useGameStore((s) => s.dispatch)
  const agentRef = useRef(new GreedyAgent())

  useEffect(() => {
    if (!gameState || gameState.winner || !aiPlayer) return
    if (whoActs(gameState) !== aiPlayer) return
    const timer = setTimeout(() => {
      const state = useGameStore.getState().gameState
      if (!state || state.winner || whoActs(state) !== aiPlayer) return
      const actions = legalActions(state)
      if (actions.length === 0) return
      dispatch(agentRef.current.choose(state, actions, aiPlayer), aiPlayer)
    }, 600)
    return () => clearTimeout(timer)
  }, [gameState, aiPlayer, dispatch])
}

export default function PlayPage() {
  const { gameState, aiPlayer, analyze, toggleAnalyze, startNewGame } = useGameStore()
  const { savedDecks } = useDeckStore()
  useAiDriver()

  if (gameState) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-4 px-4 pt-2">
          <Link to="/" className="text-xs text-text-secondary hover:text-text-primary">
            &larr; Home
          </Link>
          {aiPlayer && (
            <span className="text-xs text-text-muted">
              You are Player 1 &middot; AI plays Player 2
            </span>
          )}
          <button
            onClick={toggleAnalyze}
            className={`rounded px-3 py-0.5 text-xs font-medium ${
              analyze ? 'bg-info-blue text-white' : 'bg-ocean-700 text-text-secondary hover:text-text-primary'
            }`}
          >
            {analyze ? 'Analyze: on' : 'Analyze'}
          </button>
        </div>
        <GameBoard />
      </div>
    )
  }

  // Game setup screen
  const validDecks = savedDecks.filter((d) => d.leader && d.cards.length > 0)

  const startButtons = (deck: Deck) => (
    <div className="flex gap-2">
      <button
        onClick={() => startNewGame(deck, deck, 'player2')}
        className="rounded bg-action-green px-4 py-1.5 text-sm font-medium text-white hover:bg-green-600"
      >
        vs AI
      </button>
      <button
        onClick={() => startNewGame(deck, deck)}
        className="rounded bg-ocean-700 px-4 py-1.5 text-sm font-medium hover:bg-ocean-600"
      >
        Hotseat
      </button>
    </div>
  )

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/" className="text-text-secondary hover:text-text-primary">
          &larr; Home
        </Link>
        <h1 className="text-2xl font-bold">Play</h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <p className="text-text-secondary">
          Play against the AI, or control both sides in hotseat mode.
        </p>

        {validDecks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {validDecks.map((deck) => (
              <div
                key={deck.id}
                className="glass-panel flex items-center justify-between gap-6 px-6 py-3"
              >
                <div>
                  <p className="font-medium">{deck.name}</p>
                  <p className="text-sm text-text-muted">
                    {deck.cards.reduce((s, c) => s + c.qty, 0)} cards
                  </p>
                </div>
                {startButtons(deck)}
              </div>
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

        <div className="glass-panel flex items-center justify-between gap-6 px-6 py-3">
          <div>
            <p className="font-medium">Quick Start</p>
            <p className="text-sm text-text-muted">Red Zoro mirror</p>
          </div>
          {startButtons(makeQuickDeck())}
        </div>
      </div>
    </div>
  )
}
