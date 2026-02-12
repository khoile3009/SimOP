import type { Deck } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getTotalCards } from '@/stores/deckStore'
import { DECK_SIZE } from '@/engine/constants'

interface SavedDeckListProps {
  decks: Deck[]
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onNew: () => void
}

export default function SavedDeckList({ decks, onLoad, onDelete, onDuplicate, onNew }: SavedDeckListProps) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Decks</h2>
        <button
          onClick={onNew}
          className="rounded bg-action-green px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
        >
          + New Deck
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="glass-panel flex flex-1 flex-col items-center justify-center gap-3 p-8">
          <p className="text-text-muted">No decks yet.</p>
          <button
            onClick={onNew}
            className="rounded bg-info-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Create Your First Deck
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => {
            const leader = deck.leader ? getCardById(deck.leader) : null
            const total = getTotalCards(deck)
            const isComplete = total === DECK_SIZE

            return (
              <div key={deck.id} className="glass-panel flex flex-col p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{deck.name}</h3>
                    <p className="text-sm text-text-muted">
                      {leader ? leader.name : 'No leader'} &middot;{' '}
                      <span className={isComplete ? 'text-action-green' : 'text-don-gold'}>
                        {total}/{DECK_SIZE}
                      </span>
                    </p>
                  </div>
                  {leader && (
                    <div className="flex gap-1">
                      {leader.color.map((c) => (
                        <span
                          key={c}
                          className={`h-3 w-3 rounded-full ${COLOR_DOT[c] || 'bg-gray-500'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-auto flex gap-2 pt-2">
                  <button
                    onClick={() => onLoad(deck.id)}
                    className="flex-1 rounded bg-ocean-700 px-3 py-1.5 text-sm hover:bg-ocean-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDuplicate(deck.id)}
                    className="rounded bg-ocean-700 px-3 py-1.5 text-sm hover:bg-ocean-600"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => onDelete(deck.id)}
                    className="rounded bg-ocean-700 px-3 py-1.5 text-sm text-life-red hover:bg-ocean-600"
                  >
                    Del
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const COLOR_DOT: Record<string, string> = {
  Red: 'bg-red-500',
  Green: 'bg-green-500',
  Blue: 'bg-blue-500',
  Purple: 'bg-purple-500',
  Black: 'bg-gray-500',
  Yellow: 'bg-yellow-500',
}
