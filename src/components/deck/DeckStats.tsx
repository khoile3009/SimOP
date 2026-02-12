import { useMemo } from 'react'
import type { Deck } from '@/engine/types'
import { getCardById } from '@/data/cardService'

interface DeckStatsProps {
  deck: Deck
}

const CHART_W = 260
const CHART_H = 80
const PAD_X = 12
const PAD_TOP = 14
const PAD_BOTTOM = 14
const MAX_COST = 10
const BAR_COUNT = MAX_COST + 1
const GAP = 3

export default function DeckStats({ deck }: DeckStatsProps) {
  const stats = useMemo(() => {
    const costCurve: Record<number, number> = {}
    const typeCounts: Record<string, number> = {}
    let totalPower = 0
    let powerCards = 0

    for (const entry of deck.cards) {
      const card = getCardById(entry.cardId)
      if (!card) continue

      costCurve[card.cost] = (costCurve[card.cost] || 0) + entry.qty
      typeCounts[card.cardType] = (typeCounts[card.cardType] || 0) + entry.qty

      if (card.power) {
        totalPower += card.power * entry.qty
        powerCards += entry.qty
      }
    }

    const maxCount = Math.max(...Object.values(costCurve), 1)

    return {
      costCurve,
      typeCounts,
      maxCount,
      avgPower: powerCards ? Math.round(totalPower / powerCards) : 0,
    }
  }, [deck.cards])

  if (deck.cards.length === 0) return null

  const plotW = CHART_W - PAD_X * 2
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM
  const barW = (plotW - GAP * (BAR_COUNT - 1)) / BAR_COUNT
  const baseline = PAD_TOP + plotH

  return (
    <div className="glass-panel p-3">
      <h3 className="mb-1 text-xs font-semibold uppercase text-text-muted">Cost Curve</h3>

      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full"
        style={{ maxHeight: 120 }}
      >
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Bars */}
        {Array.from({ length: BAR_COUNT }, (_, cost) => {
          const count = stats.costCurve[cost] || 0
          const barH = count > 0 ? Math.max((count / stats.maxCount) * plotH, 3) : 0
          const x = PAD_X + cost * (barW + GAP)
          const y = baseline - barH

          return (
            <g key={cost}>
              {count > 0 && (
                <>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={2}
                    fill="url(#barGrad)"
                  />
                  <text
                    x={x + barW / 2}
                    y={y - 3}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={7}
                    fontWeight={600}
                  >
                    {count}
                  </text>
                </>
              )}
              <text
                x={x + barW / 2}
                y={baseline + 10}
                textAnchor="middle"
                fill="#64748b"
                fontSize={7}
              >
                {cost}
              </text>
            </g>
          )
        })}

        {/* Baseline */}
        <line
          x1={PAD_X}
          y1={baseline}
          x2={PAD_X + plotW}
          y2={baseline}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={0.5}
        />
      </svg>

      <div className="mt-1 flex gap-4 text-xs text-text-secondary">
        {Object.entries(stats.typeCounts).map(([type, count]) => (
          <span key={type}>
            {type}: <span className="font-medium text-text-primary">{count}</span>
          </span>
        ))}
        {stats.avgPower > 0 && (
          <span className="ml-auto">
            Avg Power: <span className="font-medium text-text-primary">{stats.avgPower}</span>
          </span>
        )}
      </div>
    </div>
  )
}
