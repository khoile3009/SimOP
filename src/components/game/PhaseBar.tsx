import type { GamePhase, PlayerId } from '@/engine/types'

interface PhaseBarProps {
  phase: GamePhase
  turnNumber: number
  currentPlayer: PlayerId
}

const PHASES: { key: GamePhase; label: string }[] = [
  { key: 'REFRESH', label: 'Refresh' },
  { key: 'DRAW', label: 'Draw' },
  { key: 'DON', label: 'DON!!' },
  { key: 'MAIN', label: 'Main' },
  { key: 'END', label: 'End' },
]

const phaseOrder = (p: GamePhase) => PHASES.findIndex((x) => x.key === p)

export default function PhaseBar({ phase, turnNumber, currentPlayer }: PhaseBarProps) {
  const activeIdx = phaseOrder(phase)

  return (
    <div className="glass-panel flex items-center gap-1 px-4 py-2">
      {PHASES.map((p, i) => {
        const isActive = p.key === phase
        const isPast = i < activeIdx
        return (
          <span
            key={p.key}
            className={`rounded-full px-3 py-0.5 text-xs font-semibold tracking-wide transition-colors ${
              isActive
                ? 'bg-don-gold text-ocean-950 shadow-[0_0_12px_rgba(226,178,58,0.35)]'
                : isPast
                  ? 'text-text-muted'
                  : 'text-text-muted/50'
            }`}
          >
            {p.label}
          </span>
        )
      })}
      <span className="ml-auto text-xs tabular-nums text-text-muted">Turn {turnNumber}</span>
      <span
        className={`rounded px-2 py-0.5 text-xs font-bold ${
          currentPlayer === 'player1'
            ? 'bg-info-blue/20 text-info-blue'
            : 'bg-life-red/20 text-life-red'
        }`}
      >
        {currentPlayer === 'player1' ? 'P1' : 'P2'}
      </span>
    </div>
  )
}
