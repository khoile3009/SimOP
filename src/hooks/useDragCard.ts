import { useDraggable } from '@dnd-kit/core'
import type { GameCard } from '@/engine/types'

export interface DragCardData {
  card: GameCard
  zone: 'hand'
}

export function useDragCard(card: GameCard, zone: 'hand') {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.instanceId,
    data: { card, zone } satisfies DragCardData,
  })

  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return { ref: setNodeRef, attributes, listeners, style, isDragging }
}
