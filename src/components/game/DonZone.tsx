import type { GameCard } from '@/engine/types'

interface DonZoneProps {
  donArea: GameCard[]
  donDeckCount: number
  attachCount: number
  onClickPool: () => void
}

export default function DonZone({ donArea, donDeckCount, attachCount, onClickPool }: DonZoneProps) {
  const active = donArea.filter((d) => !d.isRested).length
  const total = donArea.length

  return (
    <button
      onClick={onClickPool}
      className="glass-panel flex items-center gap-2 px-3 py-1.5 hover:border-glass-border-hover"
    >
      <div className="flex gap-0.5">
        {donArea.map((d) => (
          <span
            key={d.instanceId}
            className={`text-xs ${d.isRested ? 'text-text-muted/30' : 'text-don-gold'}`}
          >
            ◆
          </span>
        ))}
      </div>
      <span className="text-xs tabular-nums text-text-secondary">
        {active}/{total} DON
      </span>
      {donDeckCount > 0 && (
        <span className="text-[10px] text-text-muted">({donDeckCount} left)</span>
      )}
      {attachCount > 0 && (
        <span className="ml-1 rounded bg-don-gold px-1.5 py-0.5 text-xs font-bold text-black">
          ◆ x{attachCount}
        </span>
      )}
    </button>
  )
}
