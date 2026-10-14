import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PlayerId } from '@/engine/types'
import { Wordmark } from '@/components/common/PageShell'
import Button from '@/components/common/Button'
import { legalActions, whoActs } from '@/engine/legalActions'
import { useGameStore } from '@/stores/gameStore'
import { useDeckStore } from '@/stores/deckStore'
import type { Agent } from '@/ai/agents'
import { AGENT_FACTORIES, type AgentKind } from '@/sim/benchmark'
import { evaluateState } from '@/ai/evaluate'
import GameBoard from '@/components/game/GameBoard'
import DeckSelect from '@/components/common/DeckSelect'
import { resolveDeckChoice, DEFAULT_CHOICE, type DeckChoice } from '@/components/common/deckChoice'

const AGENT_KINDS: AgentKind[] = ['random', 'greedy', 'planner', 'mcts', 'honest']

export default function WatchPage() {
  const { gameState, startNewGame, dispatch } = useGameStore()
  const { savedDecks } = useDeckStore()
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(400)
  const [kinds, setKinds] = useState<Record<PlayerId, AgentKind>>({
    player1: 'greedy',
    player2: 'greedy',
  })
  const [deck1Choice, setDeck1Choice] = useState<DeckChoice>(DEFAULT_CHOICE)
  const [deck2Choice, setDeck2Choice] = useState<DeckChoice>({ kind: 'mirror' })
  const agentsRef = useRef<Record<PlayerId, Agent>>({
    player1: AGENT_FACTORIES.greedy(Math.random),
    player2: AGENT_FACTORIES.greedy(Math.random),
  })

  const validDecks = savedDecks.filter((d) => d.leader && d.cards.length > 0)
  const deck1 = resolveDeckChoice(deck1Choice, validDecks)
  const deck2 = resolveDeckChoice(deck2Choice, validDecks, deck1)
  const ready = deck1 !== null && deck2 !== null

  const stepOnce = () => {
    const state = useGameStore.getState().gameState
    if (!state || state.winner) return
    const actor = whoActs(state)
    if (!actor) return
    const actions = legalActions(state)
    if (actions.length === 0) return
    const action = agentsRef.current[actor].choose(state, actions, actor)
    dispatch(action, actor)
  }

  useEffect(() => {
    if (!running || !gameState || gameState.winner) return
    const timer = setTimeout(stepOnce, speed)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, gameState, speed])

  const start = () => {
    if (!deck1 || !deck2) return
    agentsRef.current = {
      player1: AGENT_FACTORIES[kinds.player1](Math.random),
      player2: AGENT_FACTORIES[kinds.player2](Math.random),
    }
    startNewGame(deck1, deck2)
    setRunning(true)
  }

  const score = useMemo(() => (gameState ? evaluateState(gameState, 'player1') : 0.5), [gameState])

  const acting = gameState ? whoActs(gameState) : null

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-glass-border bg-ocean-950/80 px-4 py-2 backdrop-blur-md">
        <Link to="/" className="text-sm text-text-primary transition-opacity hover:opacity-80">
          <Wordmark />
        </Link>
        <span className="ui-label">Bot vs Bot</span>

        {(['player1', 'player2'] as PlayerId[]).map((pid) => (
          <label key={pid} className="flex items-center gap-1 text-xs text-text-secondary">
            {pid === 'player1' ? 'P1' : 'P2'}
            <select
              className="glass-panel px-1 py-0.5 text-xs text-text-primary"
              value={kinds[pid]}
              onChange={(e) => setKinds((k) => ({ ...k, [pid]: e.target.value as AgentKind }))}
            >
              {AGENT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
        ))}

        <Button size="sm" variant="success" disabled={!ready} onClick={start}>
          New match
        </Button>
        {gameState && !gameState.winner && (
          <>
            <Button size="sm" variant="gold" onClick={() => setRunning((r) => !r)}>
              {running ? 'Pause' : 'Play'}
            </Button>
            <Button size="sm" variant="ghost" onClick={stepOnce} disabled={running}>
              Step
            </Button>
          </>
        )}
        <label className="flex items-center gap-1 text-xs text-text-secondary">
          Speed
          <input
            type="range"
            min={50}
            max={1500}
            step={50}
            value={1550 - speed}
            onChange={(e) => setSpeed(1550 - Number(e.target.value))}
          />
        </label>

        {gameState && (
          <span className="text-xs text-text-secondary">
            Turn {gameState.turnNumber} &middot; {gameState.phase}
            {gameState.battle ? ` · battle:${gameState.battle.step}` : ''}
            {gameState.pendingChoice ? ' · choosing' : ''}
            {acting ? ` · ${acting} to act` : ''}
          </span>
        )}
        {gameState?.winner && (
          <span className="text-sm font-bold text-life-red">{gameState.winner} wins!</span>
        )}
      </div>

      {gameState && (
        <div
          className="flex items-center gap-2 px-4 pb-1"
          title="Player 1 win probability (hand-tuned eval)"
        >
          <span className="w-8 text-right text-[10px] text-text-secondary">P1</span>
          <div className="h-2 flex-1 overflow-hidden rounded bg-ocean-800/60">
            <div
              className="h-full rounded bg-don-gold transition-all duration-300"
              style={{ width: `${(score * 100).toFixed(1)}%` }}
            />
          </div>
          <span className="w-12 text-[10px] tabular-nums text-text-secondary">
            {(score * 100).toFixed(0)}%
          </span>
        </div>
      )}

      {gameState ? (
        // Spectator mode: the bots own every decision, so board clicks are disabled
        <div className="pointer-events-none flex-1">
          <GameBoard spectator />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="font-display text-2xl font-bold tracking-wide text-text-primary">
              Spectator mode
            </p>
            <p className="text-sm text-text-secondary">
              Pick the decks and agents, then watch the bots play.
            </p>
          </div>
          <div className="glass-panel grid gap-4 px-5 py-4 sm:grid-cols-2">
            <DeckSelect
              label="Player 1 deck"
              value={deck1Choice}
              onChange={setDeck1Choice}
              savedDecks={validDecks}
            />
            <DeckSelect
              label="Player 2 deck"
              value={deck2Choice}
              onChange={setDeck2Choice}
              savedDecks={validDecks}
              allowMirror
            />
          </div>
        </div>
      )}
    </div>
  )
}
