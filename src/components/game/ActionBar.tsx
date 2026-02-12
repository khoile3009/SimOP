import type { GameState, PlayerId, GameCard } from '@/engine/types'
import { getCardById } from '@/data/cardService'

interface ActionBarProps {
  gameState: GameState
  selectedCard: GameCard | null
  selectedZone: 'hand' | 'character' | 'leader' | null
  currentPlayer: PlayerId
  onPlay: () => void
  onAttack: () => void
  onInspect: () => void
}

export default function ActionBar({
  gameState,
  selectedCard,
  selectedZone,
  currentPlayer,
  onPlay,
  onAttack,
  onInspect,
}: ActionBarProps) {
  if (!selectedCard) return null

  const cardData = getCardById(selectedCard.cardId)
  const isMainPhase = gameState.phase === 'MAIN' && gameState.currentPlayer === currentPlayer
  const isInBattle = !!gameState.battle
  const activeDon = gameState.players[currentPlayer].donArea.filter((d) => !d.isRested).length

  const actions: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean; hint?: string }[] = []

  if (selectedZone === 'hand' && isMainPhase && !isInBattle) {
    const canAfford = cardData ? activeDon >= cardData.cost : false
    actions.push({
      label: 'Play',
      onClick: onPlay,
      primary: canAfford,
      disabled: !canAfford,
      hint: !canAfford && cardData ? `Need ${cardData.cost} DON` : undefined,
    })
  }

  if ((selectedZone === 'character' || selectedZone === 'leader') && isMainPhase && !isInBattle) {
    const canAttack = !selectedCard.isRested
    actions.push({
      label: 'Attack',
      onClick: onAttack,
      primary: canAttack,
      disabled: !canAttack,
      hint: !canAttack ? 'Rested' : undefined,
    })
  }

  actions.push({ label: 'Inspect', onClick: onInspect })

  return (
    <div className="flex items-center gap-1.5">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          disabled={a.disabled}
          title={a.hint}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            a.primary
              ? 'bg-action-green text-white hover:bg-green-600'
              : a.disabled
                ? 'cursor-not-allowed bg-ocean-800 text-text-muted/50'
                : 'bg-ocean-700 text-text-secondary hover:bg-ocean-600'
          }`}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}
