import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CardData } from '@/engine/types'
import { getAllCards } from '@/data/cardService'
import FilterBar, { type Filters } from '@/components/cards/FilterBar'
import CardGrid from '@/components/cards/CardGrid'
import CardDetail from '@/components/cards/CardDetail'

const initialFilters: Filters = { search: '', color: '', cardType: '', cost: '' }

export default function CardsPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [selected, setSelected] = useState<CardData | null>(null)

  const allCards = useMemo(() => getAllCards(), [])

  const filtered = useMemo(() => {
    return allCards.filter((c) => {
      if (filters.search && !c.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      if (filters.color && !c.color.includes(filters.color)) return false
      if (filters.cardType && c.cardType !== filters.cardType) return false
      if (filters.cost !== '' && c.cost !== filters.cost) return false
      return true
    })
  }, [allCards, filters])

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-text-secondary hover:text-text-primary">
          &larr; Home
        </Link>
        <h1 className="text-2xl font-bold">Card Library</h1>
      </div>

      <FilterBar filters={filters} onChange={setFilters} totalResults={filtered.length} />

      <div className="flex-1 overflow-y-auto">
        <CardGrid cards={filtered} onSelect={setSelected} />
      </div>

      {selected && <CardDetail card={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
