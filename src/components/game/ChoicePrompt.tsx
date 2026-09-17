import { useState } from 'react'
import type { GameState, GameCard, PlayerId } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getCardImageUrl } from '@/utils/images'

interface ChoicePromptProps {
  gameState: GameState
  onChoose: (instanceIds: string[]) => void
}

/**
 * Bottom-sheet picker for hidden-zone choices (deck reveals, trash, life, DON
 * piles) - the zones with nothing on the board to click. Renders the option
 * cards and enforces min/max/exact; the board stays visible above the sheet.
 * Field and hand choices never come here: they pick in place.
 */
export default function ChoicePrompt({ gameState, onChoose }: ChoicePromptProps) {
  const [selected, setSelected] = useState<string[]>([])
  const choice = gameState.pendingChoice!

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < choice.max
          ? [...prev, id]
          : prev,
    )
  }

  const sizeOk =
    selected.length >= choice.min &&
    selected.length <= choice.max &&
    (!choice.exact || selected.length === choice.min || selected.length === choice.max)

  const confirm = () => {
    onChoose(selected)
    setSelected([])
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2 z-40 flex justify-center px-3">
      <div className="glass-panel pointer-events-auto flex max-h-[45vh] max-w-2xl flex-col items-center gap-3 overflow-y-auto border border-glass-border-hover bg-ocean-900/95 p-4 shadow-2xl">
        <p className="max-w-md text-center text-sm font-medium">{choice.prompt}</p>
        <p className="text-xs text-text-muted">
          {choice.min === choice.max
            ? `Choose ${choice.max}`
            : choice.exact
              ? `Choose ${choice.min} or ${choice.max}`
              : `Choose ${choice.min}-${choice.max}`}
          {` · ${gameState.pendingChoice!.playerId === 'player1' ? 'Player 1' : 'Player 2'} decides`}
        </p>

        <div className="flex max-w-xl flex-wrap justify-center gap-2">
          {choice.options.map((id) => {
            const card = findInstance(gameState, id)
            const isSelected = selected.includes(id)
            const border = isSelected ? 'ring-2 ring-action-green' : 'ring-1 ring-glass-border'
            if (!card || card.cardId === 'DON') {
              return (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  className={`flex h-24 w-16 items-center justify-center rounded bg-ocean-800 text-xl text-don-gold ${border}`}
                >
                  ◆
                </button>
              )
            }
            const data = getCardById(card.cardId)
            return (
              <button key={id} onClick={() => toggle(id)} className={`w-20 overflow-hidden rounded ${border}`}>
                <img src={getCardImageUrl(card.cardId)} alt={data?.name ?? ''} className="w-full" draggable={false} />
              </button>
            )
          })}
        </div>

        <div className="flex gap-3">
          {choice.min === 0 && (
            <button
              onClick={() => {
                setSelected([])
                onChoose([])
              }}
              className="rounded bg-ocean-700 px-4 py-1.5 text-sm font-medium hover:bg-ocean-600"
            >
              Choose none
            </button>
          )}
          <button
            onClick={confirm}
            disabled={!sizeOk}
            className="rounded bg-action-green px-4 py-1.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-40"
          >
            Confirm ({selected.length})
          </button>
        </div>
      </div>
    </div>
  )
}

function findInstance(state: GameState, instanceId: string): GameCard | null {
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    for (const zone of [[p.leader], p.characters, p.hand, p.trash, p.donArea, p.lifeCards, p.deck]) {
      const card = zone.find((c) => c.instanceId === instanceId)
      if (card) return card
    }
  }
  return null
}
