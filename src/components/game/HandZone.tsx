import type { GameCard } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getCardImageUrl, getCardBackUrl } from '@/utils/images'
import { useDragCard } from '@/hooks/useDragCard'
import CardActionPopup from './CardActionPopup'
import type { CardActions } from './CardActionPopup'

interface HandZoneProps {
  cards: GameCard[]
  faceDown?: boolean
  flipped?: boolean
  selectedId: string | null
  onSelect: (instanceId: string) => void
  cardActions?: CardActions
  counterMode?: {
    selectedIds: string[]
    onToggle: (instanceId: string) => void
  }
}

function DraggableHandCard({
  card,
  isSelected,
  left,
  yShift,
  rotDeg,
  zIndex,
  onSelect,
  cardActions,
}: {
  card: GameCard
  isSelected: boolean
  left: number
  yShift: number
  rotDeg: number
  zIndex: number
  onSelect: () => void
  cardActions?: CardActions
}) {
  const cardData = getCardById(card.cardId)
  const { ref, attributes, listeners, style: dragStyle, isDragging } = useDragCard(card, 'hand')
  const canAfford = cardActions && cardData ? cardActions.activeDon >= cardData.cost : false

  return (
    <div
      ref={ref}
      {...attributes}
      {...listeners}
      className="absolute bottom-0 w-14"
      style={{
        left,
        transform: `translateY(${isSelected ? -16 : yShift}px) rotate(${isSelected ? 0 : rotDeg}deg) scale(${isSelected ? 1.1 : 1})`,
        zIndex: isSelected ? 20 : zIndex,
        ...dragStyle,
      }}
    >
      <button
        onClick={onSelect}
        className={`w-full overflow-hidden rounded transition-all ${
          isSelected ? 'ring-2 ring-info-blue' : ''
        } ${isDragging ? 'opacity-30' : ''}`}
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
      {isSelected && cardActions && (
        <CardActionPopup
          actions={[
            ...(cardActions.isMainPhase && !cardActions.isInBattle
              ? [{
                  label: 'Play',
                  onClick: () => cardActions.onPlay(card.instanceId),
                  primary: canAfford,
                  disabled: !canAfford,
                  hint: !canAfford && cardData ? `Need ${cardData.cost} DON` : undefined,
                }]
              : []),
            { label: 'Inspect', onClick: () => cardActions.onInspect(card.instanceId) },
          ]}
          onDeselect={cardActions.onDeselect}
        />
      )}
    </div>
  )
}

export default function HandZone({ cards, faceDown, flipped, selectedId, onSelect, cardActions, counterMode }: HandZoneProps) {
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

  // Counter mode: show selectable counter cards
  if (counterMode) {
    return (
      <div className="flex items-end justify-center py-2" style={{ minHeight: 100 }}>
        <div className="relative" style={{ width: totalWidth + cardWidth, height: 88 }}>
          {cards.map((card, i) => {
            const cardData = getCardById(card.cardId)
            const hasCounter = cardData && (cardData.counter !== null || cardData.effectText?.includes('[Counter]'))
            const isCounterSelected = counterMode.selectedIds.includes(card.instanceId)
            const left = cards.length === 1 ? totalWidth / 2 : i * spacing
            const mid = (cards.length - 1) / 2
            const offset = i - mid
            const rotDeg = offset * 1.5
            const yShift = Math.abs(offset) * 2

            return (
              <div
                key={card.instanceId}
                className="absolute bottom-0 w-14"
                style={{
                  left,
                  transform: `translateY(${isCounterSelected ? -16 : yShift}px) rotate(${isCounterSelected ? 0 : rotDeg}deg) scale(${isCounterSelected ? 1.1 : 1})`,
                  zIndex: isCounterSelected ? 20 : i,
                }}
              >
                <button
                  onClick={() => hasCounter && counterMode.onToggle(card.instanceId)}
                  className={`w-full overflow-hidden rounded transition-all ${
                    isCounterSelected ? 'ring-2 ring-action-green' : ''
                  } ${!hasCounter ? 'opacity-40' : 'cursor-pointer'}`}
                  disabled={!hasCounter}
                >
                  <img
                    src={getCardImageUrl(card.cardId)}
                    alt={cardData?.name ?? ''}
                    className="w-full"
                    draggable={false}
                  />
                  {hasCounter && cardData.counter !== null && (
                    <span className="absolute bottom-0.5 left-0.5 rounded bg-action-green/90 px-1 text-[10px] font-bold text-white">
                      +{cardData.counter}
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${flipped ? 'items-start' : 'items-end'} justify-center py-2`} style={{ minHeight: 100 }}>
      <div className="relative" style={{ width: totalWidth + cardWidth, height: 88 }}>
        {cards.map((card, i) => {
          const isSelected = selectedId === card.instanceId
          const left = cards.length === 1 ? totalWidth / 2 : i * spacing

          // Slight arc effect (flipped for opponent)
          const mid = (cards.length - 1) / 2
          const offset = i - mid
          const rotDeg = flipped ? -(offset * 1.5) : offset * 1.5
          const yShift = Math.abs(offset) * 2

          if (flipped) {
            const cardData = getCardById(card.cardId)
            return (
              <div
                key={card.instanceId}
                className="absolute top-0 w-14"
                style={{
                  left,
                  transform: `translateY(${yShift}px) rotate(${rotDeg}deg)`,
                  zIndex: i,
                }}
              >
                <div className="w-full overflow-hidden rounded">
                  <img
                    src={getCardImageUrl(card.cardId)}
                    alt={cardData?.name ?? ''}
                    className="w-full"
                    draggable={false}
                  />
                </div>
              </div>
            )
          }

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
              cardActions={cardActions}
            />
          )
        })}
      </div>
    </div>
  )
}
