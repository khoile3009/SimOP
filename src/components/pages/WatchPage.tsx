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

/** Simplest to most sophisticated - the order the picker shows */
const AGENT_OPTIONS: { kind: AgentKind; label: string; hint: string }[] = [
  { kind: 'random', label: 'Random', hint: 'legal moves at random' },
  { kind: 'greedy', label: 'Greedy', hint: 'one move ahead' },
  { kind: 'planner', label: 'Planner', hint: 'plans the whole turn' },
  { kind: 'honest', label: 'Honest MCTS', hint: 'tree search over fair worlds' },
  { kind: 'mcts', label: 'Oracle MCTS', hint: 'tree search, sees hidden cards' },
  { kind: 'ismcts', label: 'IS-MCTS', hint: 'one shared info-set tree' },
]

const agentLabel = (kind: AgentKind): string =>
  AGENT_OPTIONS.find((o) => o.kind === kind)?.label ?? kind

export default function WatchPage() {
  const { gameState, startNewGame, dispatch } = useGameStore()
  const { savedDecks } = useDeckStore()
  const [running, setRunning] = useState(false)
  const [setupOpen, setSetupOpen] = useState(true)
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
    setSetupOpen(false)
    setRunning(true)
  }

  const showSetup = setupOpen || !gameState

  const score = useMemo(() => (gameState ? evaluateState(gameState, 'player1') : 0.5), [gameState])

  const acting = gameState ? whoActs(gameState) : null

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-glass-border bg-ocean-950/80 px-4 py-2 backdrop-blur-md">
        <Link to="/" className="text-sm text-text-primary transition-opacity hover:opacity-80">
          <Wordmark />
        </Link>
        <span className="ui-label">Bot vs Bot</span>

        {!showSetup && (
          <>
            <span className="text-xs text-text-secondary">
              {agentLabel(kinds.player1)} vs {agentLabel(kinds.player2)}
            </span>
            <Button
              size="sm"
              variant="success"
              onClick={() => {
                setRunning(false)
                setSetupOpen(true)
              }}
            >
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
          </>
        )}

        {!showSetup && gameState && (
          <span className="text-xs text-text-secondary">
            Turn {gameState.turnNumber} &middot; {gameState.phase}
            {gameState.battle ? ` · battle:${gameState.battle.step}` : ''}
            {gameState.pendingChoice ? ' · choosing' : ''}
            {acting ? ` · ${acting} to act` : ''}
          </span>
        )}
        {!showSetup && gameState?.winner && (
          <span className="text-sm font-bold text-life-red">{gameState.winner} wins!</span>
        )}
      </div>

      {!showSetup && gameState && (
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

      {!showSetup && gameState ? (
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
              Pick each player&apos;s deck and bot, then watch them play.
            </p>
          </div>
          <div className="glass-panel grid gap-x-4 gap-y-5 px-5 py-4 sm:grid-cols-2">
            <div className="flex flex-col gap-4">
              <DeckSelect
                label="Player 1 deck"
                value={deck1Choice}
                onChange={setDeck1Choice}
                savedDecks={validDecks}
              />
              <BotSelect
                label="Player 1 bot"
                value={kinds.player1}
                onChange={(k) => setKinds((prev) => ({ ...prev, player1: k }))}
              />
            </div>
            <div className="flex flex-col gap-4">
              <DeckSelect
                label="Player 2 deck"
                value={deck2Choice}
                onChange={setDeck2Choice}
                savedDecks={validDecks}
                allowMirror
              />
              <BotSelect
                label="Player 2 bot"
                value={kinds.player2}
                onChange={(k) => setKinds((prev) => ({ ...prev, player2: k }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Button variant="success" disabled={!ready} onClick={start} className="w-full">
                Start match
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BotSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: AgentKind
  onChange: (k: AgentKind) => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="ui-label">{label}</span>
      <select
        className="glass-panel w-full px-3 py-2.5 text-sm text-text-primary"
        value={value}
        onChange={(e) => onChange(e.target.value as AgentKind)}
      >
        {AGENT_OPTIONS.map((o) => (
          <option key={o.kind} value={o.kind}>
            {o.label} · {o.hint}
          </option>
        ))}
      </select>
    </div>
  )
}
