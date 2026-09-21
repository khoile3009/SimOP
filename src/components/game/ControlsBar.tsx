import type { GameState } from '@/engine/types'
import { getCardById } from '@/data/cardService'

export interface Activatable {
  cardInstanceId: string
  effectId: string
  name: string
}

export interface ChoiceStrip {
  prompt: string
  count: number
  min: number
  max: number
  exact?: boolean
  onConfirm: () => void
  onSkip?: () => void
}

interface ControlsBarProps {
  gameState: GameState
  choice?: ChoiceStrip
  /** It is actually this seat's Main Phase: no battle, no pending decisions */
  canEndTurn: boolean
  onEndTurn: () => void
  onDeclineBlock: () => void
  onActivateBlocker: (blockerId: string) => void
  blockerIds: string[]
  activatables: Activatable[]
  onActivateEffect: (cardInstanceId: string, effectId: string) => void
  counterEvents: { cardInstanceId: string; name: string; cost: number }[]
  onPlayCounterEvent: (cardInstanceId: string) => void
  onPassCounter: () => void
  onUseCounter: () => void
  counterTotal: number
  counterCount: number
}

export default function ControlsBar({
  gameState,
  choice,
  canEndTurn,
  onEndTurn,
  onDeclineBlock,
  onActivateBlocker,
  blockerIds,
  activatables,
  onActivateEffect,
  counterEvents,
  onPlayCounterEvent,
  onPassCounter,
  onUseCounter,
  counterTotal,
  counterCount,
}: ControlsBarProps) {
  const { battle, phase } = gameState

  // A pending effect choice blocks everything else: the board is the picker,
  // this strip is the prompt
  if (choice) {
    const okSize =
      choice.count >= choice.min &&
      choice.count <= choice.max &&
      (!choice.exact || choice.count === choice.min || choice.count === choice.max)
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 py-2">
        <span className="max-w-md text-sm font-medium text-text-primary">{choice.prompt}</span>
        <span className="rounded bg-black/30 px-2 py-0.5 text-xs tabular-nums text-text-secondary">
          {choice.count} / {choice.max}
        </span>
        {choice.onSkip && (
          <button
            onClick={choice.onSkip}
            className="rounded bg-ocean-700 px-4 py-1.5 text-sm font-medium hover:bg-ocean-600"
          >
            Choose none
          </button>
        )}
        <button
          onClick={choice.onConfirm}
          disabled={!okSize}
          className="rounded bg-action-green px-4 py-1.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-40"
        >
          Confirm
        </button>
      </div>
    )
  }

  // During battle block step
  if (battle && battle.step === 'BLOCK') {
    const defender = gameState.players[battle.defenderPlayer]
    return (
      <div className="flex items-center justify-center gap-3 py-2">
        <span className="text-sm text-text-secondary">Block with a character?</span>
        {blockerIds.map((id) => {
          const blocker = defender.characters.find((c) => c.instanceId === id)
          const name = blocker ? (getCardById(blocker.cardId)?.name ?? 'Blocker') : 'Blocker'
          return (
            <button
              key={id}
              onClick={() => onActivateBlocker(id)}
              className="rounded bg-info-blue/80 px-4 py-1.5 text-sm font-medium text-white hover:bg-info-blue"
            >
              Block: {name}
            </button>
          )
        })}
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
      <div className="flex flex-wrap items-center justify-center gap-3 py-2">
        <span className="text-sm text-text-secondary">
          Select counter cards from hand
        </span>
        {counterEvents.map((e) => (
          <button
            key={e.cardInstanceId}
            onClick={() => onPlayCounterEvent(e.cardInstanceId)}
            className="rounded bg-info-blue/80 px-4 py-1.5 text-sm font-medium text-white hover:bg-info-blue"
          >
            Event: {e.name} ({e.cost} DON)
          </button>
        ))}
        {counterCount > 0 && (
          <button
            onClick={onUseCounter}
            className="rounded bg-action-green px-4 py-1.5 text-sm font-medium text-white hover:bg-green-600"
          >
            Use Counter (+{counterTotal})
          </button>
        )}
        <button
          onClick={onPassCounter}
          className="rounded bg-ocean-700 px-4 py-1.5 text-sm font-medium hover:bg-ocean-600"
        >
          Pass
        </button>
      </div>
    )
  }

  // Main phase controls - only when this seat can actually act (End Turn used
  // to render through the opponent's turn and mid-battle, as a dead button)
  if (phase === 'MAIN' && canEndTurn) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 py-2">
        {activatables.map((a) => (
          <button
            key={`${a.cardInstanceId}-${a.effectId}`}
            onClick={() => onActivateEffect(a.cardInstanceId, a.effectId)}
            className="rounded bg-info-blue/80 px-4 py-1.5 text-sm font-medium text-white hover:bg-info-blue"
          >
            Activate: {a.name}
          </button>
        ))}
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
