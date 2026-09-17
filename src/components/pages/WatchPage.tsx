import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PlayerId } from '@/engine/types'
import { legalActions, whoActs } from '@/engine/legalActions'
import { useGameStore } from '@/stores/gameStore'
import { RandomAgent, GreedyAgent, type Agent } from '@/ai/agents'
import { evaluateState } from '@/ai/evaluate'
import { makeAutoDeck } from '@/sim/selfplay'
import GameBoard from '@/components/game/GameBoard'

type AgentKind = 'greedy' | 'random'

function makeAgent(kind: AgentKind): Agent {
  return kind === 'greedy' ? new GreedyAgent() : new RandomAgent()
}

export default function WatchPage() {
  const { gameState, startNewGame, dispatch } = useGameStore()
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(400)
  const [kinds, setKinds] = useState<Record<PlayerId, AgentKind>>({
    player1: 'greedy',
    player2: 'greedy',
  })
  const agentsRef = useRef<Record<PlayerId, Agent>>({
    player1: makeAgent('greedy'),
    player2: makeAgent('greedy'),
  })

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
    agentsRef.current = {
      player1: makeAgent(kinds.player1),
      player2: makeAgent(kinds.player2),
    }
    startNewGame(makeAutoDeck('OP01-001'), makeAutoDeck('OP01-001'))
    setRunning(true)
  }

  const score = useMemo(
    () => (gameState ? evaluateState(gameState, 'player1') : 0.5),
    [gameState],
  )

  const acting = gameState ? whoActs(gameState) : null

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 px-4 py-2">
        <Link to="/" className="text-xs text-text-secondary hover:text-text-primary">
          &larr; Home
        </Link>
        <span className="text-sm font-bold text-text-primary">Bot vs Bot</span>

        {(['player1', 'player2'] as PlayerId[]).map((pid) => (
          <label key={pid} className="flex items-center gap-1 text-xs text-text-secondary">
            {pid === 'player1' ? 'P1' : 'P2'}
            <select
              className="glass-panel px-1 py-0.5 text-xs text-text-primary"
              value={kinds[pid]}
              onChange={(e) => setKinds((k) => ({ ...k, [pid]: e.target.value as AgentKind }))}
            >
              <option value="greedy">greedy</option>
              <option value="random">random</option>
            </select>
          </label>
        ))}

        <button
          onClick={start}
          className="glass-panel px-3 py-1 text-xs text-action-green hover:text-text-primary"
        >
          New match
        </button>
        {gameState && !gameState.winner && (
          <>
            <button
              onClick={() => setRunning((r) => !r)}
              className="glass-panel px-3 py-1 text-xs text-don-gold hover:text-text-primary"
            >
              {running ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={stepOnce}
              disabled={running}
              className="glass-panel px-3 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-40"
            >
              Step
            </button>
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
        <div className="flex items-center gap-2 px-4 pb-1" title="Player 1 win probability (hand-tuned eval)">
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
        <div className="flex flex-1 items-center justify-center text-text-secondary">
          Pick agents and start a match to watch the bots play.
        </div>
      )}
    </div>
  )
}
