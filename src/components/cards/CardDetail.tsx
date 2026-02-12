import type { CardData } from '@/engine/types'
import CardImage from './CardImage'

const COLOR_BADGES: Record<string, string> = {
  Red: 'bg-red-600',
  Green: 'bg-green-600',
  Blue: 'bg-blue-600',
  Purple: 'bg-purple-600',
  Black: 'bg-gray-700',
  Yellow: 'bg-yellow-500 text-black',
}

const RARITY_LABEL: Record<string, string> = {
  L: 'Leader',
  C: 'Common',
  UC: 'Uncommon',
  R: 'Rare',
  SR: 'Super Rare',
  SEC: 'Secret Rare',
  SP: 'Special',
}

interface CardDetailProps {
  card: CardData
  onClose: () => void
}

export default function CardDetail({ card, onClose }: CardDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="glass-panel mx-4 flex max-h-[90vh] w-full max-w-2xl gap-6 overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-56 shrink-0">
          <CardImage card={card} className="w-full" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold">{card.name}</h2>
            <button
              onClick={onClose}
              className="shrink-0 text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded bg-ocean-700 px-2 py-0.5">{card.id}</span>
            <span className="rounded bg-ocean-700 px-2 py-0.5">{card.cardType}</span>
            <span className="rounded bg-ocean-700 px-2 py-0.5">
              {RARITY_LABEL[card.rarity] || card.rarity}
            </span>
            {card.color.map((c) => (
              <span key={c} className={`rounded px-2 py-0.5 text-white ${COLOR_BADGES[c] || 'bg-gray-600'}`}>
                {c}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {card.cardType === 'Leader' && card.life !== null && (
              <Stat label="Life" value={card.life} />
            )}
            {card.cardType !== 'Leader' && <Stat label="Cost" value={card.cost} />}
            {card.power !== null && <Stat label="Power" value={card.power} />}
            {card.counter !== null && <Stat label="Counter" value={`+${card.counter}`} />}
          </div>

          {card.attribute.length > 0 && (
            <div className="text-sm">
              <span className="text-text-muted">Traits: </span>
              <span className="text-text-secondary">{card.attribute.join(' / ')}</span>
            </div>
          )}

          {card.effectText && (
            <div className="text-sm">
              <span className="mb-1 block text-text-muted">Effect</span>
              <p className="whitespace-pre-line text-text-secondary">{card.effectText}</p>
            </div>
          )}

          {card.triggerText && (
            <div className="text-sm">
              <span className="mb-1 block text-text-muted">Trigger</span>
              <p className="whitespace-pre-line text-text-secondary">{card.triggerText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded bg-ocean-800 px-3 py-1.5">
      <span className="text-text-muted">{label}: </span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
