import { getCardBackUrl } from '@/utils/images'

interface DeckTrashZoneProps {
  deckCount: number
  trashCount: number
}

export default function DeckTrashZone({ deckCount, trashCount }: DeckTrashZoneProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Deck */}
      <div className="relative">
        <div className="h-20 w-14 overflow-hidden rounded bg-ocean-800">
          <img src={getCardBackUrl()} alt="Deck" className="h-full w-full object-cover" draggable={false} />
        </div>
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ocean-600 px-1 text-[10px] font-bold">
          {deckCount}
        </span>
      </div>

      {/* Trash */}
      <div className="relative flex h-12 w-14 items-center justify-center rounded border border-dashed border-glass-border">
        <span className="text-[10px] text-text-muted">Trash</span>
        {trashCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ocean-600 px-1 text-[9px] font-bold">
            {trashCount}
          </span>
        )}
      </div>
    </div>
  )
}
