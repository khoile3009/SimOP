import type { CardType, Color } from '@/engine/types'

export interface Filters {
  search: string
  color: Color | ''
  cardType: CardType | ''
  cost: number | ''
}

const COLORS: Color[] = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow']
const CARD_TYPES: CardType[] = ['Leader', 'Character', 'Event', 'Stage']
const COSTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface FilterBarProps {
  filters: Filters
  onChange: (filters: Filters) => void
  totalResults: number
}

export default function FilterBar({ filters, onChange, totalResults }: FilterBarProps) {
  const update = (partial: Partial<Filters>) => onChange({ ...filters, ...partial })

  return (
    <div className="glass-panel flex flex-wrap items-center gap-3 p-3">
      <input
        type="text"
        placeholder="Search cards..."
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        className="w-48 rounded bg-ocean-800 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-info-blue"
      />

      <Select
        value={filters.color}
        onChange={(v) => update({ color: v as Color | '' })}
        placeholder="All Colors"
        options={COLORS}
      />

      <Select
        value={filters.cardType}
        onChange={(v) => update({ cardType: v as CardType | '' })}
        placeholder="All Types"
        options={CARD_TYPES}
      />

      <Select
        value={filters.cost === '' ? '' : String(filters.cost)}
        onChange={(v) => update({ cost: v === '' ? '' : Number(v) })}
        placeholder="Any Cost"
        options={COSTS.map(String)}
      />

      {(filters.search || filters.color || filters.cardType || filters.cost !== '') && (
        <button
          onClick={() => onChange({ search: '', color: '', cardType: '', cost: '' })}
          className="text-sm text-text-muted hover:text-text-primary"
        >
          Clear
        </button>
      )}

      <span className="ml-auto text-sm text-text-muted">{totalResults} cards</span>
    </div>
  )
}

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded bg-ocean-800 px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-info-blue"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}
