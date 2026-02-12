import { useMemo } from 'react'
import type { Deck } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { DECK_SIZE } from '@/engine/constants'
import { getTotalCards, getLeaderColors } from '@/stores/deckStore'
import { getCardImageUrl } from '@/utils/images'

interface DeckListProps {
  deck: Deck
  onRemove: (cardId: string) => void
  onNameChange: (name: string) => void
  onSave: () => void
  onChangeLeader: () => void
}

export default function DeckList({ deck, onRemove, onNameChange, onSave, onChangeLeader }: DeckListProps) {
  const total = getTotalCards(deck)
  const leader = deck.leader ? getCardById(deck.leader) : null
  const leaderColors = getLeaderColors(deck.leader)
  const isValid = total === DECK_SIZE

  const sortedCards = useMemo(() => {
    return [...deck.cards]
      .map((entry) => ({ ...entry, card: getCardById(entry.cardId) }))
      .filter((e) => e.card)
      .sort((a, b) => {
        // Sort by type, then cost, then name
        const typeOrder = { Character: 0, Event: 1, Stage: 2 }
        const ta = typeOrder[a.card!.cardType as keyof typeof typeOrder] ?? 3
        const tb = typeOrder[b.card!.cardType as keyof typeof typeOrder] ?? 3
        if (ta !== tb) return ta - tb
        if (a.card!.cost !== b.card!.cost) return a.card!.cost - b.card!.cost
        return a.card!.name.localeCompare(b.card!.name)
      })
  }, [deck.cards])

  return (
    <div className="glass-panel flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-glass-border p-3">
        <input
          type="text"
          value={deck.name}
          onChange={(e) => onNameChange(e.target.value)}
          className="mb-2 w-full bg-transparent text-lg font-bold focus:outline-none"
        />
        <div className="flex items-center gap-2 text-sm">
          <span className={total === DECK_SIZE ? 'text-action-green' : 'text-don-gold'}>
            {total}/{DECK_SIZE}
          </span>
          <span className="text-text-muted">&middot;</span>
          <span className="text-text-muted">{leaderColors.join('/')}</span>
        </div>
      </div>

      {/* Leader */}
      {leader && (
        <div className="flex items-center gap-2 border-b border-glass-border p-3">
          <img
            src={getCardImageUrl(leader.id)}
            alt={leader.name}
            className="h-10 w-7 rounded-sm object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{leader.name}</p>
            <p className="text-xs text-text-muted">Leader</p>
          </div>
          <button
            onClick={onChangeLeader}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Change
          </button>
        </div>
      )}

      {/* Card list */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedCards.length === 0 ? (
          <p className="p-3 text-center text-sm text-text-muted">
            Click cards from the pool to add them.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {sortedCards.map(({ cardId, qty, card }) => (
              <button
                key={cardId}
                onClick={() => onRemove(cardId)}
                className="group flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-ocean-800"
              >
                <span className="w-5 text-center text-sm font-medium text-don-gold">{qty}x</span>
                <span className="w-6 text-center text-xs text-text-muted">{card!.cost}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{card!.name}</span>
                <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100">
                  -1
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-glass-border p-3">
        <button
          onClick={onSave}
          disabled={!isValid}
          className={`w-full rounded px-4 py-2 text-sm font-medium transition-colors ${
            isValid
              ? 'bg-action-green text-white hover:bg-green-600'
              : 'cursor-not-allowed bg-ocean-700 text-text-muted'
          }`}
        >
          {isValid ? 'Save Deck' : `Need ${DECK_SIZE - total} more cards`}
        </button>
      </div>
    </div>
  )
}
