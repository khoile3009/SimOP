import type { GameState } from '@/engine/types'
import { getCardById } from '@/data/cardService'

export interface Activatable {
  cardInstanceId: string
  effectId: string
  name: string
}

interface ControlsBarProps {
  gameState: GameState
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

  // Main phase controls
  if (phase === 'MAIN') {
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
