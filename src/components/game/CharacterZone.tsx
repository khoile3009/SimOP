import { useDroppable } from '@dnd-kit/core'
import type { GameCard } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getCardImageUrl } from '@/utils/images'
import { getEffectivePower } from '@/engine'
import { MAX_CHARACTERS } from '@/engine/constants'
import CardActionPopup from './CardActionPopup'
import type { CardActions } from './CardActionPopup'

interface CharacterZoneProps {
  characters: GameCard[]
  selectedId: string | null
  onSelect: (instanceId: string) => void
  droppableId?: string
  cardActions?: CardActions
}

export default function CharacterZone({ characters, selectedId, onSelect, droppableId, cardActions }: CharacterZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId ?? 'character-zone' })

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 rounded-lg p-1 transition-all ${
        isOver ? 'ring-2 ring-action-green shadow-[0_0_12px_rgba(34,197,94,0.3)]' : ''
      }`}
    >
      {Array.from({ length: MAX_CHARACTERS }, (_, i) => {
        const char = characters[i]
        if (!char) {
          return (
            <div
              key={`empty-${i}`}
              className="flex h-24 w-16 items-center justify-center rounded border border-dashed border-glass-border"
            >
              <span className="text-[10px] text-text-muted/30">{i + 1}</span>
            </div>
          )
        }

        const cardData = getCardById(char.cardId)
        const power = getEffectivePower(char)
        const isSelected = selectedId === char.instanceId
        const hasSummonSickness = cardActions
          ? char.turnPlayed === cardActions.turnNumber && !cardData?.effectText?.includes('[Rush]')
          : false
        const canAttack = cardActions
          ? !char.isRested && cardActions.isMainPhase && !cardActions.isInBattle && !hasSummonSickness
          : false

        return (
          <div key={char.instanceId} className="relative">
            <button
              onClick={() => onSelect(char.instanceId)}
              className={`relative w-16 overflow-hidden rounded transition-all ${
                char.isRested ? 'rotate-90' : ''
              } ${isSelected ? 'ring-2 ring-info-blue scale-105' : 'hover:scale-102'}`}
            >
              <img
                src={getCardImageUrl(char.cardId)}
                alt={cardData?.name ?? ''}
                className="w-full"
                draggable={false}
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 text-center">
                <span className="text-[10px] font-semibold tabular-nums">{power}</span>
                {char.attachedDon > 0 && (
                  <span className="ml-0.5 text-[9px] text-don-gold">
                    {'◆'.repeat(char.attachedDon)}
                  </span>
                )}
              </div>
            </button>
            {isSelected && cardActions && (
              <CardActionPopup
                actions={[
                  ...(cardActions.isMainPhase && !cardActions.isInBattle
                    ? [{
                        label: 'Attack',
                        onClick: () => cardActions.onAttack(char.instanceId),
                        primary: canAttack,
                        disabled: !canAttack,
                        hint: hasSummonSickness ? 'Just played' : !canAttack ? 'Rested' : undefined,
                      }]
                    : []),
                  { label: 'Inspect', onClick: () => cardActions.onInspect(char.instanceId) },
                ]}
                onDeselect={cardActions.onDeselect}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
