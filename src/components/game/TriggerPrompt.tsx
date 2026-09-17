import type { GameState } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getCardImageUrl } from '@/utils/images'

interface TriggerPromptProps {
  gameState: GameState
  onResolve: (activate: boolean) => void
}

/** Life-card [Trigger] prompt: activate the trigger or keep the card in hand. */
export default function TriggerPrompt({ gameState, onResolve }: TriggerPromptProps) {
  const trigger = gameState.pendingTrigger!
  const player = gameState.players[trigger.playerId]
  const card = player.hand.find((c) => c.instanceId === trigger.cardInstanceId)
  const data = card ? getCardById(card.cardId) : null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="glass-panel flex flex-col items-center gap-4 p-6">
        <p className="text-sm font-medium">Trigger available</p>
        {card && (
          <img src={getCardImageUrl(card.cardId)} alt={data?.name ?? ''} className="w-32 rounded" draggable={false} />
        )}
        {data?.triggerText && (
          <p className="max-w-xs text-center text-xs text-text-secondary">
            [Trigger] {data.triggerText}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => onResolve(true)}
            className="rounded bg-action-green px-4 py-1.5 text-sm font-medium text-white hover:bg-green-600"
          >
            Activate Trigger
          </button>
          <button
            onClick={() => onResolve(false)}
            className="rounded bg-ocean-700 px-4 py-1.5 text-sm font-medium hover:bg-ocean-600"
          >
            Add to Hand
          </button>
        </div>
      </div>
    </div>
  )
}
