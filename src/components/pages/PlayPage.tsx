import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Deck } from '@/engine/types'
import { legalActions, whoActs } from '@/engine/legalActions'
import { useGameStore } from '@/stores/gameStore'
import { useDeckStore } from '@/stores/deckStore'
import { getCardById } from '@/data/cardService'
import type { Agent } from '@/ai/agents'
import { AGENT_FACTORIES } from '@/sim/benchmark'
import GameBoard from '@/components/game/GameBoard'
import PageShell, { Wordmark } from '@/components/common/PageShell'
import Button from '@/components/common/Button'

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
  const agentRef = useRef<{ kind: string; agent: Agent } | null>(null)

  useEffect(() => {
    if (!gameState || gameState.winner || !aiPlayer) return
    if (whoActs(gameState) !== aiPlayer) return
    const timer = setTimeout(() => {
      const state = useGameStore.getState().gameState
      if (!state || state.winner || whoActs(state) !== aiPlayer) return
      const actions = legalActions(state)
      if (actions.length === 0) return
      const kind = useGameStore.getState().aiKind
      if (!agentRef.current || agentRef.current.kind !== kind) {
        agentRef.current = { kind, agent: AGENT_FACTORIES[kind](Math.random) }
      }
      dispatch(agentRef.current.agent.choose(state, actions, aiPlayer), aiPlayer)
    }, 600)
    return () => clearTimeout(timer)
  }, [gameState, aiPlayer, dispatch])
}

const DIFFICULTIES = [
  { value: 'greedy', label: 'Greedy', hint: 'Easy · instant moves' },
  { value: 'planner', label: 'Planner', hint: 'Medium · plans whole turns' },
  { value: 'mcts', label: 'MCTS', hint: 'Hard · tree search' },
] as const

export default function PlayPage() {
  const { gameState, aiPlayer, analyze, toggleAnalyze, startNewGame, aiKind, setAiKind } =
    useGameStore()
  const { savedDecks } = useDeckStore()
  useAiDriver()

  if (gameState) {
    return (
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex h-11 items-center gap-4 border-b border-glass-border bg-ocean-950/80 px-4 backdrop-blur-md">
          <Link to="/" className="text-sm text-text-primary transition-opacity hover:opacity-80">
            <Wordmark />
          </Link>
          <span className="ui-label">
            {aiPlayer ? 'You are Player 1 · AI plays Player 2' : 'Hotseat match'}
          </span>
          <div className="ml-auto">
            <Button size="sm" variant={analyze ? 'primary' : 'ghost'} onClick={toggleAnalyze}>
              {analyze ? 'Analyze: on' : 'Analyze'}
            </Button>
          </div>
        </div>
        <GameBoard />
      </div>
    )
  }

  // Game setup screen
  const validDecks = savedDecks.filter((d) => d.leader && d.cards.length > 0)

  const DeckRow = ({ deck, hint }: { deck: Deck; hint?: string }) => {
    const leader = getCardById(deck.leader)
    return (
      <div className="glass-panel flex items-center gap-4 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-ocean-800">
          <span className="font-display text-sm font-bold text-don-gold">
            {(leader?.name ?? '?').slice(0, 2)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{deck.name}</p>
          <p className="truncate text-sm text-text-muted">
            {hint ??
              `${leader?.name ?? deck.leader} · ${leader?.color.join('/') ?? ''} · ${deck.cards.reduce((s, c) => s + c.qty, 0)} cards`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="success" size="md" onClick={() => startNewGame(deck, deck, 'player2')}>
            vs AI
          </Button>
          <Button variant="subtle" size="md" onClick={() => startNewGame(deck, deck)}>
            Hotseat
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageShell title="Play" subtitle="Face the AI, or drive both sides in a hotseat match.">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6">
        <section className="flex flex-col gap-2">
          <span className="ui-label">AI difficulty</span>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setAiKind(d.value)}
                className={`glass-panel flex flex-col gap-0.5 px-4 py-3 text-left transition-all ${
                  aiKind === d.value
                    ? 'border-info-blue ring-1 ring-info-blue'
                    : 'hover:border-glass-border-hover'
                }`}
              >
                <span className="font-semibold">{d.label}</span>
                <span className="text-xs text-text-muted">{d.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <span className="ui-label">Your decks</span>
          {validDecks.length > 0 ? (
            <div className="flex flex-col gap-3">
              {validDecks.map((deck) => (
                <DeckRow key={deck.id} deck={deck} />
              ))}
            </div>
          ) : (
            <div className="glass-panel px-5 py-4 text-sm text-text-muted">
              No saved decks yet —{' '}
              <Link to="/deck-builder" className="text-info-blue hover:underline">
                build one
              </Link>{' '}
              or jump in with the quick start deck below.
            </div>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <span className="ui-label">Quick start</span>
          <DeckRow deck={makeQuickDeck()} hint="Red Zoro mirror · ready to go" />
        </section>
      </div>
    </PageShell>
  )
}
