import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { legalActions, whoActs } from '@/engine/legalActions'
import { useGameStore } from '@/stores/gameStore'
import { useDeckStore } from '@/stores/deckStore'
import type { Agent } from '@/ai/agents'
import { AGENT_FACTORIES } from '@/sim/benchmark'
import GameBoard from '@/components/game/GameBoard'
import PageShell, { Wordmark } from '@/components/common/PageShell'
import Button from '@/components/common/Button'
import DeckSelect from '@/components/common/DeckSelect'
import { resolveDeckChoice, DEFAULT_CHOICE, type DeckChoice } from '@/components/common/deckChoice'

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
  { value: 'ismcts', label: 'IS-MCTS', hint: 'Hard · fair, never peeks' },
  { value: 'honest', label: 'Honest MCTS', hint: 'Hard · fair (classic)' },
  { value: 'mcts', label: 'Oracle MCTS', hint: 'Expert · sees your hand' },
] as const

export default function PlayPage() {
  const { gameState, aiPlayer, analyze, toggleAnalyze, startNewGame, aiKind, setAiKind } =
    useGameStore()
  const { savedDecks } = useDeckStore()
  useAiDriver()

  const validDecks = savedDecks.filter((d) => d.leader && d.cards.length > 0)
  const [yourChoice, setYourChoice] = useState<DeckChoice>(() =>
    validDecks.length > 0 ? { kind: 'saved', id: validDecks[0].id } : DEFAULT_CHOICE,
  )
  const [oppChoice, setOppChoice] = useState<DeckChoice>({ kind: 'mirror' })

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
  const yourDeck = resolveDeckChoice(yourChoice, validDecks)
  const oppDeck = resolveDeckChoice(oppChoice, validDecks, yourDeck)
  const ready = yourDeck !== null && oppDeck !== null

  return (
    <PageShell title="Play" subtitle="Face the AI, or drive both sides in a hotseat match.">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6">
        <section className="glass-panel flex flex-col gap-4 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <DeckSelect
              label="Your deck"
              value={yourChoice}
              onChange={setYourChoice}
              savedDecks={validDecks}
            />
            <DeckSelect
              label="Opponent's deck"
              value={oppChoice}
              onChange={setOppChoice}
              savedDecks={validDecks}
              allowMirror
            />
          </div>
          {validDecks.length === 0 && (
            <p className="text-xs text-text-muted">
              No saved decks yet — auto decks work out of the box, or{' '}
              <Link to="/deck-builder" className="text-info-blue hover:underline">
                build your own
              </Link>
              .
            </p>
          )}
        </section>

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

        <section className="flex gap-3">
          <Button
            variant="success"
            size="lg"
            disabled={!ready}
            onClick={() => ready && startNewGame(yourDeck, oppDeck, 'player2')}
          >
            Play vs AI
          </Button>
          <Button
            variant="subtle"
            size="lg"
            disabled={!ready}
            onClick={() => ready && startNewGame(yourDeck, oppDeck)}
          >
            Hotseat
          </Button>
        </section>
      </div>
    </PageShell>
  )
}
