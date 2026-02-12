import type { GameCard } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getCardImageUrl } from '@/utils/images'
import { getEffectivePower } from '@/engine'
import CardActionPopup from './CardActionPopup'
import type { CardActions } from './CardActionPopup'

interface LeaderZoneProps {
  leader: GameCard
  isSelected: boolean
  onClick: () => void
  cardActions?: CardActions
}

export default function LeaderZone({ leader, isSelected, onClick, cardActions }: LeaderZoneProps) {
  const cardData = getCardById(leader.cardId)
  const power = getEffectivePower(leader)
  const canAttack = cardActions ? !leader.isRested && cardActions.isMainPhase && !cardActions.isInBattle : false

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <button
          onClick={onClick}
          className={`relative w-20 overflow-hidden rounded transition-all ${
            leader.isRested ? 'rotate-90' : ''
          } ${isSelected ? 'ring-2 ring-info-blue scale-105' : 'hover:scale-102'}`}
        >
          <img
            src={getCardImageUrl(leader.cardId)}
            alt={cardData?.name ?? 'Leader'}
            className="w-full"
            draggable={false}
          />
          {leader.attachedDon > 0 && (
            <span className="absolute bottom-0.5 right-0.5 rounded bg-don-gold px-1 text-[10px] font-bold text-black">
              {'◆'.repeat(leader.attachedDon)}
            </span>
          )}
        </button>
        {isSelected && cardActions && (
          <CardActionPopup
            actions={[
              ...(cardActions.isMainPhase && !cardActions.isInBattle
                ? [{
                    label: 'Attack',
                    onClick: () => cardActions.onAttack(leader.instanceId),
                    primary: canAttack,
                    disabled: !canAttack,
                    hint: !canAttack ? 'Rested' : undefined,
                  }]
                : []),
              { label: 'Inspect', onClick: () => cardActions.onInspect(leader.instanceId) },
            ]}
            onDeselect={cardActions.onDeselect}
          />
        )}
      </div>
      <span className="text-xs font-semibold tabular-nums">
        {power}
        {leader.attachedDon > 0 && (
          <span className="text-don-gold"> +{leader.attachedDon * 1000}</span>
        )}
      </span>
    </div>
  )
}
