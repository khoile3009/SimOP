import type { GameCard } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getCardImageUrl } from '@/utils/images'

interface LifeZoneProps {
  lifeCards: GameCard[]
  maxLife: number
}

export default function LifeZone({ lifeCards, maxLife }: LifeZoneProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="ui-label">Life</span>
      <div className="flex flex-col gap-0.5">
        {Array.from({ length: Math.max(maxLife, lifeCards.length) }, (_, i) => {
          const card = lifeCards[i]
          if (!card) {
            return (
              <div key={i} className="h-3 w-9 rounded-sm border border-ocean-600 bg-ocean-800" />
            )
          }
          // Face-up life is public knowledge: show the actual card
          if (card.revealed) {
            const data = getCardById(card.cardId)
            return (
              <div
                key={card.instanceId}
                className="group relative w-9 transition-transform hover:z-10 hover:scale-[2.2]"
                title={`${data?.name ?? card.cardId} (face-up)`}
              >
                <img
                  src={getCardImageUrl(card.cardId)}
                  alt={data?.name ?? 'Face-up life'}
                  className="w-full rounded-sm ring-1 ring-don-gold"
                  draggable={false}
                />
              </div>
            )
          }
          return (
            <div
              key={card.instanceId}
              className="h-3 w-9 rounded-sm bg-life-red shadow-[0_0_6px_rgba(239,68,68,0.5)]"
            />
          )
        })}
      </div>
      <span className="text-xs font-semibold tabular-nums text-life-red">{lifeCards.length}</span>
    </div>
  )
}
