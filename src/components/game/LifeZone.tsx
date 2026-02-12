import type { GameCard } from '@/engine/types'

interface LifeZoneProps {
  lifeCards: GameCard[]
  maxLife: number
}

export default function LifeZone({ lifeCards, maxLife }: LifeZoneProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-text-muted">Life</span>
      <div className="flex flex-col gap-0.5">
        {Array.from({ length: maxLife }, (_, i) => {
          const alive = i < lifeCards.length
          return (
            <div
              key={i}
              className={`h-3 w-8 rounded-sm transition-colors ${
                alive
                  ? 'bg-life-red shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                  : 'border border-ocean-600 bg-ocean-800'
              }`}
            />
          )
        })}
      </div>
      <span className="text-xs font-semibold text-life-red">{lifeCards.length}</span>
    </div>
  )
}
