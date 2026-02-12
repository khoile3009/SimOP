import type { GameState } from '@/engine/types'

interface ControlsBarProps {
  gameState: GameState
  onEndTurn: () => void
  onDeclineBlock: () => void
  onPassCounter: () => void
}

export default function ControlsBar({
  gameState,
  onEndTurn,
  onDeclineBlock,
  onPassCounter,
}: ControlsBarProps) {
  const { battle, phase } = gameState

  // During battle block step
  if (battle && battle.step === 'BLOCK') {
    return (
      <div className="flex items-center justify-center gap-3 py-2">
        <span className="text-sm text-text-secondary">Block with a character?</span>
        <button
          onClick={onDeclineBlock}
          className="rounded bg-ocean-700 px-4 py-1.5 text-sm font-medium hover:bg-ocean-600"
        >
          Decline Block
        </button>
      </div>
    )
  }

  // During battle counter step
  if (battle && battle.step === 'COUNTER') {
    return (
      <div className="flex items-center justify-center gap-3 py-2">
        <span className="text-sm text-text-secondary">Play counter cards?</span>
        <button
          onClick={onPassCounter}
          className="rounded bg-ocean-700 px-4 py-1.5 text-sm font-medium hover:bg-ocean-600"
        >
          Pass
        </button>
      </div>
    )
  }

  // Main phase controls
  if (phase === 'MAIN') {
    return (
      <div className="flex items-center justify-center gap-3 py-2">
        <button
          onClick={onEndTurn}
          className="rounded bg-don-gold px-4 py-1.5 text-sm font-medium text-black hover:bg-yellow-500"
        >
          End Turn
        </button>
      </div>
    )
  }

  return <div style={{ minHeight: 44 }} />
}
