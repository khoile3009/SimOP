import type { GameCard } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getCardImageUrl, getCardBackUrl } from '@/utils/images'
import { useDragCard } from '@/hooks/useDragCard'

interface HandZoneProps {
  cards: GameCard[]
  faceDown?: boolean
  selectedId: string | null
  onSelect: (instanceId: string) => void
}

function DraggableHandCard({
  card,
  isSelected,
  left,
  yShift,
  rotDeg,
  zIndex,
  onSelect,
}: {
  card: GameCard
  isSelected: boolean
  left: number
  yShift: number
  rotDeg: number
  zIndex: number
  onSelect: () => void
}) {
  const cardData = getCardById(card.cardId)
  const { ref, attributes, listeners, style: dragStyle, isDragging } = useDragCard(card, 'hand')

  return (
    <button
      ref={ref}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`absolute bottom-0 w-14 overflow-hidden rounded transition-all ${
        isSelected
          ? '-translate-y-4 scale-110 ring-2 ring-info-blue z-20'
          : 'hover:-translate-y-2 hover:scale-105 hover:z-10'
      } ${isDragging ? 'opacity-30' : ''}`}
      style={{
        left,
        transform: `translateY(${isSelected ? -16 : yShift}px) rotate(${isSelected ? 0 : rotDeg}deg) scale(${isSelected ? 1.1 : 1})`,
        zIndex: isSelected ? 20 : zIndex,
        ...dragStyle,
      }}
    >
      <img
        src={getCardImageUrl(card.cardId)}
        alt={cardData?.name ?? ''}
        className="w-full"
        draggable={false}
      />
      {cardData && (
        <span className="absolute left-0.5 top-0.5 rounded bg-black/70 px-1 text-[9px] font-bold">
          {cardData.cost}
        </span>
      )}
    </button>
  )
}

export default function HandZone({ cards, faceDown, selectedId, onSelect }: HandZoneProps) {
  if (faceDown) {
    return (
      <div className="flex items-center justify-center gap-1 py-2" style={{ minHeight: 100 }}>
        {cards.map((c) => (
          <div key={c.instanceId} className="h-20 w-14 overflow-hidden rounded">
            <img src={getCardBackUrl()} alt="Card" className="h-full w-full object-cover" draggable={false} />
          </div>
        ))}
        <span className="ml-2 text-xs text-text-muted">{cards.length} cards</span>
      </div>
    )
  }

  // Fan layout: offset cards slightly for overlap when many
  const maxSpread = 64 // px per card at max
  const cardWidth = 56
  const totalWidth = Math.min(cards.length * maxSpread, 600)
  const spacing = cards.length > 1 ? totalWidth / (cards.length - 1) : 0

  return (
    <div className="flex items-end justify-center py-2" style={{ minHeight: 100 }}>
      <div className="relative" style={{ width: totalWidth + cardWidth, height: 88 }}>
        {cards.map((card, i) => {
          const isSelected = selectedId === card.instanceId
          const left = cards.length === 1 ? totalWidth / 2 : i * spacing

          // Slight arc effect
          const mid = (cards.length - 1) / 2
          const offset = i - mid
          const rotDeg = offset * 1.5
          const yShift = Math.abs(offset) * 2

          return (
            <DraggableHandCard
              key={card.instanceId}
              card={card}
              isSelected={isSelected}
              left={left}
              yShift={yShift}
              rotDeg={rotDeg}
              zIndex={i}
              onSelect={() => onSelect(card.instanceId)}
            />
          )
        })}
      </div>
    </div>
  )
}
