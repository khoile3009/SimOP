import { useMemo, useState } from 'react'
import type { CardData, CardType, Deck } from '@/engine/types'
import { getCardsBySet } from '@/data/cardService'
import { getLeaderColors, getCardCount, canAddCard } from '@/stores/deckStore'
import CardImage from '@/components/cards/CardImage'
import CardDetail from '@/components/cards/CardDetail'

interface CardPoolProps {
  deck: Deck
  onAdd: (cardId: string) => void
}

export default function CardPool({ deck, onAdd }: CardPoolProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<CardType | ''>('')
  const [costFilter, setCostFilter] = useState<number | ''>('')
  const [inspecting, setInspecting] = useState<CardData | null>(null)

  const leaderColors = getLeaderColors(deck.leader)

  const poolCards = useMemo(() => {
    return getCardsBySet('OP01').filter((c) => {
      // Exclude leaders from pool
      if (c.cardType === 'Leader') return false
      // Color restriction
      if (!c.color.some((col) => leaderColors.includes(col))) return false
      // Search
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      // Type filter
      if (typeFilter && c.cardType !== typeFilter) return false
      // Cost filter
      if (costFilter !== '' && c.cost !== costFilter) return false
      return true
    })
  }, [leaderColors, search, typeFilter, costFilter])

  const TYPES: CardType[] = ['Character', 'Event', 'Stage']
  const COSTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-40 rounded bg-ocean-800 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-info-blue"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as CardType | '')}
          className="rounded bg-ocean-800 px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-info-blue"
        >
          <option value="">All Types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={costFilter === '' ? '' : String(costFilter)}
          onChange={(e) => setCostFilter(e.target.value === '' ? '' : Number(e.target.value))}
          className="rounded bg-ocean-800 px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-info-blue"
        >
          <option value="">Any Cost</option>
          {COSTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-text-muted">
          Showing {leaderColors.join('/')} cards
        </span>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
          {poolCards.map((card) => {
            const count = getCardCount(deck, card.id)
            const { ok } = canAddCard(deck, card)

            return (
              <div key={card.id} className="group relative">
                <button
                  onClick={() => onAdd(card.id)}
                  disabled={!ok}
                  className={`w-full overflow-hidden rounded transition-transform focus:outline-none focus:ring-2 focus:ring-info-blue ${
                    ok ? 'hover:scale-105' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <CardImage card={card} className="w-full" />
                </button>

                {/* Count badge */}
                {count > 0 && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-don-gold text-xs font-bold text-black">
                    {count}
                  </span>
                )}

                {/* Inspect button */}
                <button
                  onClick={() => setInspecting(card)}
                  className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-xs opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                >
                  ?
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {inspecting && <CardDetail card={inspecting} onClose={() => setInspecting(null)} />}
    </div>
  )
}
