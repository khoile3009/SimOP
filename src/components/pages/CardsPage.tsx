import { useMemo, useState } from 'react'
import type { CardData } from '@/engine/types'
import PageShell from '@/components/common/PageShell'
import { getAllCards } from '@/data/cardService'
import { useIncrementalList } from '@/hooks/useIncrementalList'
import FilterBar, { type Filters } from '@/components/cards/FilterBar'
import CardGrid from '@/components/cards/CardGrid'
import CardDetail from '@/components/cards/CardDetail'

const initialFilters: Filters = { search: '', color: '', cardType: '', cost: '', set: '' }

export default function CardsPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [selected, setSelected] = useState<CardData | null>(null)

  const allCards = useMemo(() => getAllCards(), [])

  const filtered = useMemo(() => {
    return allCards.filter((c) => {
      if (filters.search && !c.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      if (filters.set && !c.id.startsWith(`${filters.set}-`)) return false
      if (filters.color && !c.color.includes(filters.color)) return false
      if (filters.cardType && c.cardType !== filters.cardType) return false
      if (filters.cost !== '' && c.cost !== filters.cost) return false
      return true
    })
  }, [allCards, filters])

  const { visible, hasMore, sentinelRef } = useIncrementalList(filtered, 72)

  return (
    <PageShell title="Card Library" subtitle="Every card in the pool, with full rules text.">
      <FilterBar filters={filters} onChange={setFilters} totalResults={filtered.length} />

      <div className="flex-1 overflow-y-auto">
        <CardGrid cards={visible} onSelect={setSelected} />
        {hasMore && <div ref={sentinelRef} className="h-8" />}
      </div>

      {selected && <CardDetail card={selected} onClose={() => setSelected(null)} />}
    </PageShell>
  )
}
