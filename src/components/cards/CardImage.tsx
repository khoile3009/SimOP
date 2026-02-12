import { useState } from 'react'
import type { CardData } from '@/engine/types'
import { getCardImageUrl, getCardBackUrl } from '@/utils/images'

interface CardImageProps {
  card: CardData
  className?: string
  onClick?: () => void
}

export default function CardImage({ card, className = '', onClick }: CardImageProps) {
  const [failed, setFailed] = useState(false)
  const src = failed ? getCardBackUrl() : getCardImageUrl(card.id)

  return (
    <img
      src={src}
      alt={card.name}
      className={`rounded-sm ${className}`}
      onError={() => setFailed(true)}
      onClick={onClick}
      draggable={false}
    />
  )
}
