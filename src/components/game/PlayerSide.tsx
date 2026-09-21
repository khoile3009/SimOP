import type { PlayerState } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import type { CardActions } from './CardActionPopup'
import LeaderZone from './LeaderZone'
import LifeZone from './LifeZone'
import CharacterZone from './CharacterZone'
import { choiceStateFor, choiceRing } from './choice'
import type { ChoiceHighlight } from './choice'
import { getCardImageUrl } from '@/utils/images'
import DonZone from './DonZone'
import DeckTrashZone from './DeckTrashZone'

interface PlayerSideProps {
  player: PlayerState
  isActive: boolean
  selectedId: string | null
  donAttachCount: number
  onSelectCard: (instanceId: string, zone: 'leader' | 'character') => void
  onClickDon: () => void
  cardActions?: CardActions
  attackTargets?: boolean
  choice?: ChoiceHighlight
}

export default function PlayerSide({
  player,
  isActive,
  selectedId,
  donAttachCount,
  onSelectCard,
  onClickDon,
  cardActions,
  attackTargets,
  choice,
}: PlayerSideProps) {
  const leaderData = getCardById(player.leader.cardId)
  const maxLife = leaderData?.life ?? 5

  return (
    <div className={`flex items-end gap-3 rounded-lg px-3 py-2 ${isActive ? 'bg-ocean-900/50' : 'opacity-80'}`}>
      {/* Life */}
      <LifeZone lifeCards={player.lifeCards} maxLife={maxLife} />

      {/* Leader */}
      <LeaderZone
        leader={player.leader}
        isSelected={selectedId === player.leader.instanceId}
        onClick={() => onSelectCard(player.leader.instanceId, 'leader')}
        cardActions={cardActions}
        attackTargetId={attackTargets ? `attack-target-${player.leader.instanceId}` : undefined}
        choiceState={choiceStateFor(choice, player.leader.instanceId)}
      />

      {/* Characters + DON */}
      <div className="flex flex-1 flex-col items-center gap-1">
        <CharacterZone
          characters={player.characters}
          selectedId={selectedId}
          onSelect={(id) => onSelectCard(id, 'character')}
          droppableId={isActive ? 'character-zone' : 'opponent-character-zone'}
          cardActions={cardActions}
          attackTargets={attackTargets}
          choice={choice}
        />
        <DonZone
          donArea={player.donArea}
          donDeckCount={player.donDeck.length}
          attachCount={isActive ? donAttachCount : 0}
          onClickPool={onClickDon}
        />
      </div>

      {/* Stage */}
      {player.stage && (
        <div
          className={`w-14 shrink-0 transition-transform ${player.stage.isRested ? 'rotate-90' : ''} ${choiceRing(choiceStateFor(choice, player.stage.instanceId))}`}
          title={getCardById(player.stage.cardId)?.name ?? 'Stage'}
        >
          <img
            src={getCardImageUrl(player.stage.cardId)}
            alt={getCardById(player.stage.cardId)?.name ?? 'Stage'}
            className="w-full rounded"
            draggable={false}
          />
        </div>
      )}

      {/* Deck + Trash */}
      <DeckTrashZone deckCount={player.deck.length} trashCount={player.trash.length} />
    </div>
  )
}
