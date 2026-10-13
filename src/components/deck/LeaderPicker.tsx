import { useMemo, useState } from 'react'
import type { CardData } from '@/engine/types'
import { getAllLeaders } from '@/data/cardService'
import { SET_MODULES } from '@/data/sets'
import CardImage from '@/components/cards/CardImage'
import { useIncrementalList } from '@/hooks/useIncrementalList'

interface LeaderPickerProps {
  onSelect: (leaderId: string) => void
}

const COLORS = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow']

interface Tooltip {
  card: CardData
  /** Viewport coordinates, so the tooltip never affects document layout */
  x: number
  y: number
}

export default function LeaderPicker({ onSelect }: LeaderPickerProps) {
  const [setFilter, setSetFilter] = useState('')
  const [colorFilter, setColorFilter] = useState('')
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  const leaders = useMemo(() => getAllLeaders(), [])
  const filtered = useMemo(
    () =>
      leaders.filter((l) => {
        if (setFilter && !l.id.startsWith(`${setFilter}-`)) return false
        if (colorFilter && !l.color.some((c) => c === colorFilter)) return false
        return true
      }),
    [leaders, setFilter, colorFilter],
  )
  const { visible, hasMore, sentinelRef } = useIncrementalList(filtered, 48)

  const showTooltip = (card: CardData, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const panelWidth = 320
    const fitsRight = rect.right + 12 + panelWidth < window.innerWidth
    setTooltip({
      card,
      x: fitsRight ? rect.right + 12 : Math.max(8, rect.left - 12 - panelWidth),
      y: Math.min(Math.max(8, rect.top), window.innerHeight - 180),
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold">Choose Your Leader</h2>
        <span className="text-sm text-text-muted">
          Your deck's color is determined by your leader.
        </span>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={setFilter}
            onChange={(e) => setSetFilter(e.target.value)}
            className="rounded bg-ocean-800 px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-info-blue"
          >
            <option value="">All Sets</option>
            {SET_MODULES.map((m) => (
              <option key={m.code} value={m.code}>
                {m.code}
              </option>
            ))}
          </select>
          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="rounded bg-ocean-800 px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-info-blue"
          >
            <option value="">All Colors</option>
            {COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="text-sm text-text-muted">{filtered.length} leaders</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" onScroll={() => setTooltip(null)}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
          {visible.map((leader) => (
            <button
              key={leader.id}
              onClick={() => onSelect(leader.id)}
              onMouseEnter={(e) => showTooltip(leader, e.currentTarget)}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(e) => showTooltip(leader, e.currentTarget)}
              onBlur={() => setTooltip(null)}
              className="overflow-hidden rounded transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-info-blue"
            >
              <CardImage card={leader} className="w-full" />
            </button>
          ))}
        </div>
        {hasMore && <div ref={sentinelRef} className="h-8" />}
      </div>

      {/* Fixed overlay: hover details never push the grid around */}
      {tooltip && (
        <div
          className="glass-panel pointer-events-none fixed z-50 w-80 p-4 text-sm shadow-xl"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-semibold">
            {tooltip.card.name}
            <span className="ml-2 text-xs font-normal text-text-muted">{tooltip.card.id}</span>
          </p>
          <p className="text-text-muted">
            {tooltip.card.color.join('/')} &middot; Life: {tooltip.card.life} &middot; Power:{' '}
            {tooltip.card.power}
          </p>
          {tooltip.card.effectText && (
            <p className="mt-2 text-text-secondary">{tooltip.card.effectText}</p>
          )}
        </div>
      )}
    </div>
  )
}
