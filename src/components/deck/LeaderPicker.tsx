import { useMemo, useState } from 'react'
import type { CardData } from '@/engine/types'
import { getLeaders } from '@/data/cardService'
import CardImage from '@/components/cards/CardImage'

interface LeaderPickerProps {
  onSelect: (leaderId: string) => void
}

export default function LeaderPicker({ onSelect }: LeaderPickerProps) {
  const leaders = useMemo(() => getLeaders('OP01'), [])
  const [hovered, setHovered] = useState<CardData | null>(null)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <h2 className="text-xl font-bold">Choose Your Leader</h2>
      <p className="text-sm text-text-muted">Your deck's color is determined by your leader.</p>

      <div className="grid grid-cols-4 gap-4">
        {leaders.map((leader) => (
          <button
            key={leader.id}
            onClick={() => onSelect(leader.id)}
            onMouseEnter={() => setHovered(leader)}
            onMouseLeave={() => setHovered(null)}
            className="group relative w-40 overflow-hidden rounded transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-info-blue"
          >
            <CardImage card={leader} className="w-full" />
          </button>
        ))}
      </div>

      {hovered && (
        <div className="glass-panel max-w-md p-4 text-center text-sm">
          <p className="font-semibold">{hovered.name}</p>
          <p className="text-text-muted">
            {hovered.color.join('/')} &middot; Life: {hovered.life} &middot; Power: {hovered.power}
          </p>
          {hovered.effectText && (
            <p className="mt-2 text-text-secondary">{hovered.effectText}</p>
          )}
        </div>
      )}
    </div>
  )
}
