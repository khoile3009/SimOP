import { useState } from 'react'
import type { PlayerId } from '@/engine/types'
import { whoActs } from '@/engine/legalActions'
import { useGameStore } from '@/stores/gameStore'
import { evaluateState } from '@/ai/evaluate'
import { searchTurnLines } from '@/ai/turnSearch'
import type { TurnLine } from '@/ai/turnSearch'
import { honestLines } from '@/ai/honest'
import type { HonestReport } from '@/ai/honest'

/**
 * Chess-style analysis: live win probability, the eval-by-turn history, and
 * whole-turn line recommendations (complete action sequences to end of turn,
 * scored after the opponent's best battle responses).
 */
export default function AnalyzePanel() {
  const gameState = useGameStore((s) => s.gameState)
  const aiPlayer = useGameStore((s) => s.aiPlayer)
  const evalHistory = useGameStore((s) => s.evalHistory)
  const [lines, setLines] = useState<TurnLine[] | null>(null)
  const [honest, setHonest] = useState<HonestReport | null>(null)
  const [mode, setMode] = useState<'revealed' | 'honest'>('revealed')
  const [forTurn, setForTurn] = useState(0)
  const [searching, setSearching] = useState(false)

  if (!gameState) return null

  const p1Score = evaluateState(gameState, 'player1')
  const analyzedPlayer: PlayerId = aiPlayer === 'player1' ? 'player2' : 'player1'
  const actor = whoActs(gameState)
  const canSearch =
    !gameState.winner &&
    actor === analyzedPlayer &&
    gameState.phase === 'MAIN' &&
    !gameState.battle &&
    !gameState.pendingChoice

  const runSearch = () => {
    setSearching(true)
    // Let the spinner paint before the synchronous search
    setTimeout(() => {
      const state = useGameStore.getState().gameState
      if (state) {
        if (mode === 'revealed') {
          setLines(searchTurnLines(state, analyzedPlayer))
          setHonest(null)
        } else {
          setHonest(honestLines(state, analyzedPlayer, { worlds: 10, seed: state.turnNumber }))
          setLines(null)
        }
        setForTurn(state.turnNumber)
      }
      setSearching(false)
    }, 30)
  }

  const stale = lines !== null && forTurn !== gameState.turnNumber
  const pct = (x: number) => `${Math.round(x * 100)}%`
  const scoreFor = (x: number) => (analyzedPlayer === 'player1' ? x : 1 - x)

  return (
    <div className="flex w-72 flex-col gap-3 overflow-y-auto border-l border-glass-border p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-bold">Analysis</span>
        <span className="text-xs text-text-muted">
          P1 {pct(p1Score)} · P2 {pct(1 - p1Score)}
        </span>
      </div>

      {/* Eval history sparkline (player 1 perspective) */}
      {evalHistory.length > 1 && (
        <svg viewBox="0 0 200 48" className="w-full rounded bg-ocean-900/60">
          <line x1="0" y1="24" x2="200" y2="24" stroke="rgba(255,255,255,.15)" strokeWidth="1" />
          <polyline
            fill="none"
            stroke="#E9B308"
            strokeWidth="2"
            points={evalHistory
              .map((h, i) => `${(i / Math.max(1, evalHistory.length - 1)) * 200},${48 - h.p1 * 48}`)
              .join(' ')}
          />
        </svg>
      )}

      <div className="flex gap-1 text-xs">
        {(['revealed', 'honest'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            title={
              m === 'revealed'
                ? 'Reads both hands - engine-analysis style'
                : 'Samples possible opponent hands - what you could actually know'
            }
            className={`rounded px-2 py-0.5 font-medium ${
              mode === m ? 'bg-info-blue text-white' : 'bg-ocean-700 text-text-secondary'
            }`}
          >
            {m === 'revealed' ? 'Revealed hands' : 'Honest'}
          </button>
        ))}
      </div>

      <button
        onClick={runSearch}
        disabled={!canSearch || searching}
        className="rounded bg-info-blue/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-info-blue disabled:opacity-40"
      >
        {searching
          ? mode === 'honest'
            ? 'Sampling worlds…'
            : 'Searching lines…'
          : 'Suggest lines (this turn)'}
      </button>
      {!canSearch && !gameState.winner && (
        <p className="text-xs text-text-muted">
          Available during {aiPlayer ? 'your' : "the turn player's"} main phase, outside battle.
        </p>
      )}

      {honest && (
        <div className="flex flex-col gap-3">
          {stale && <p className="text-xs text-life-red">From turn {forTurn} — search again.</p>}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">{honest.worlds} sampled worlds</span>
            {honest.lethalAvailable > 0 && (
              <span className="rounded bg-life-red/70 px-1.5 text-[10px] font-bold text-white">
                LETHAL IN {Math.round(honest.lethalAvailable * 100)}% OF WORLDS
              </span>
            )}
          </div>
          {honest.lines.map((line, i) => (
            <div key={i} className="glass-panel p-2">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-don-gold">#{i + 1}</span>
                <span className="tabular-nums">
                  best in {line.worlds}/{honest.worlds} worlds
                </span>
                <span className="tabular-nums text-text-muted">
                  avg {pct(scoreFor(line.avgWorstCase))}
                </span>
                {line.lethalRate > 0 && (
                  <span className="tabular-nums text-life-red">
                    lethal {Math.round(line.lethalRate * 100)}%
                  </span>
                )}
              </div>
              <ol className="flex flex-col gap-0.5 text-xs text-text-secondary">
                {line.labels.map((label, j) => (
                  <li key={j}>
                    {j + 1}. {label}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {lines && (
        <div className="flex flex-col gap-3">
          {stale && <p className="text-xs text-life-red">From turn {forTurn} — search again.</p>}
          {lines.length === 0 && <p className="text-xs text-text-muted">No lines found.</p>}
          {lines.map((line, i) => {
            const delta = Math.round((line.worstCase - line.baseline) * 100)
            const optimistic = line.score - line.worstCase > 0.02
            return (
              <div key={i} className="glass-panel p-2">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-don-gold">#{i + 1}</span>
                  <span
                    className="font-medium tabular-nums"
                    title="Value assuming the opponent defends perfectly"
                  >
                    {pct(scoreFor(line.worstCase))}
                  </span>
                  {optimistic && (
                    <span className="text-[10px] tabular-nums text-text-muted">
                      (up to {pct(scoreFor(line.score))})
                    </span>
                  )}
                  <span className={`text-xs tabular-nums ${delta >= 0 ? 'text-action-green' : 'text-life-red'}`}>
                    {delta >= 0 ? '+' : ''}
                    {delta}pp vs pass
                  </span>
                  {line.guaranteed ? (
                    <span
                      className="rounded bg-life-red px-1.5 text-[10px] font-bold text-white"
                      title="Wins against ANY possible hand (before life triggers)"
                    >
                      GUARANTEED LETHAL
                    </span>
                  ) : line.lethal ? (
                    <span
                      className="rounded bg-life-red/70 px-1.5 text-[10px] font-bold text-white"
                      title="Wins through the best defense with their current hand"
                    >
                      LETHAL
                    </span>
                  ) : null}
                </div>
                <ol className="flex flex-col gap-0.5 text-xs text-text-secondary">
                  {line.labels.map((label, j) => (
                    <li key={j} className="flex justify-between gap-2">
                      <span>
                        {j + 1}. {label}
                      </span>
                      <span className="tabular-nums text-text-muted">
                        {pct(scoreFor(line.stepScores[j]))}
                      </span>
                    </li>
                  ))}
                </ol>
                {i === 0 && line.branches.length > 1 && (
                  <div className="mt-1.5 border-t border-glass-border pt-1 text-[11px] text-text-muted">
                    {line.branches.map((b, j) => (
                      <div key={j} className="flex justify-between gap-2">
                        <span>If {b.label}</span>
                        <span className="tabular-nums">{pct(scoreFor(b.value))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
