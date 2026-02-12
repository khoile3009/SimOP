import type { CardData } from '@/engine/types'
import CardImage from './CardImage'

interface CardGridProps {
  cards: CardData[]
  onSelect: (card: CardData) => void
}

export default function CardGrid({ cards, onSelect }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-text-muted">No cards match your filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => onSelect(card)}
          className="group relative overflow-hidden rounded transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-info-blue"
        >
          <CardImage card={card} className="w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2 opacity-0 transition-opacity group-hover:opacity-100">
            <p className="truncate text-xs font-medium">{card.name}</p>
            <p className="text-xs text-text-muted">{card.id}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
