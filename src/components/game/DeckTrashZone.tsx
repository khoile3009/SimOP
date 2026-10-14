import { useState } from 'react'
import type { GameCard } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getCardBackUrl, getCardImageUrl } from '@/utils/images'

interface DeckTrashZoneProps {
  deckCount: number
  trashCards: GameCard[]
  ownerLabel: string
}

export default function DeckTrashZone({ deckCount, trashCards, ownerLabel }: DeckTrashZoneProps) {
  const [open, setOpen] = useState(false)
  const trashCount = trashCards.length

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Deck */}
      <div className="relative">
        <div className="h-20 w-14 overflow-hidden rounded bg-ocean-800">
          <img
            src={getCardBackUrl()}
            alt="Deck"
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ocean-600 px-1 text-[10px] font-bold">
          {deckCount}
        </span>
      </div>

      {/* Trash (click to browse - it is public information) */}
      <button
        onClick={() => trashCount > 0 && setOpen(true)}
        className={`relative flex h-12 w-14 items-center justify-center rounded border border-dashed border-glass-border ${
          trashCount > 0
            ? 'cursor-pointer transition-colors hover:border-glass-border-hover hover:bg-ocean-800/60'
            : 'cursor-default'
        }`}
        title={trashCount > 0 ? 'View trash pile' : 'Trash (empty)'}
      >
        <span className="text-[10px] text-text-muted">Trash</span>
        {trashCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ocean-600 px-1 text-[9px] font-bold">
            {trashCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-panel flex max-h-[80vh] w-full max-w-3xl flex-col gap-3 overflow-hidden bg-ocean-900/95 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {ownerLabel} trash · {trashCount} card{trashCount === 1 ? '' : 's'}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="rounded bg-ocean-700 px-3 py-1 text-xs font-medium hover:bg-ocean-600"
              >
                Close
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 overflow-y-auto">
              {/* Newest on top of the pile: show last-trashed first */}
              {[...trashCards].reverse().map((card) => (
                <div
                  key={card.instanceId}
                  className="w-20 overflow-hidden rounded ring-1 ring-glass-border"
                >
                  <img
                    src={getCardImageUrl(card.cardId)}
                    alt={getCardById(card.cardId)?.name ?? ''}
                    className="w-full"
                    loading="lazy"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
