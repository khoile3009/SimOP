import { useDraggable } from '@dnd-kit/core'
import type { GameCard } from '@/engine/types'

export interface DragCardData {
  card: GameCard
  zone: 'hand' | 'character'
}

export function useDragCard(card: GameCard, zone: 'hand' | 'character', disabled?: boolean) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${zone}-${card.instanceId}`,
    data: { card, zone } satisfies DragCardData,
    disabled,
  })

  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return { ref: setNodeRef, attributes, listeners, style, isDragging }
}
