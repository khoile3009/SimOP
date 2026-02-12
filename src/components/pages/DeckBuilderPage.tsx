import { Link } from 'react-router-dom'
import { useDeckStore } from '@/stores/deckStore'
import LeaderPicker from '@/components/deck/LeaderPicker'
import CardPool from '@/components/deck/CardPool'
import DeckList from '@/components/deck/DeckList'
import DeckStats from '@/components/deck/DeckStats'
import SavedDeckList from '@/components/deck/SavedDeckList'

export default function DeckBuilderPage() {
  const { deck, savedDecks, newDeck, setLeader, addCard, removeCard, setDeckName, saveDeck, loadDeck, deleteDeck, duplicateDeck, closeDeck } = useDeckStore()

  // No deck open: show saved deck list
  if (!deck) {
    return (
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-6 flex items-center gap-4">
          <Link to="/" className="text-text-secondary hover:text-text-primary">
            &larr; Home
          </Link>
          <h1 className="text-2xl font-bold">Deck Builder</h1>
        </div>
        <SavedDeckList
          decks={savedDecks}
          onLoad={loadDeck}
          onDelete={deleteDeck}
          onDuplicate={duplicateDeck}
          onNew={newDeck}
        />
      </div>
    )
  }

  // Deck open but no leader: show leader picker
  if (!deck.leader) {
    return (
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-6 flex items-center gap-4">
          <button onClick={closeDeck} className="text-text-secondary hover:text-text-primary">
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold">Choose Leader</h1>
        </div>
        <LeaderPicker onSelect={setLeader} />
      </div>
    )
  }

  // Full deck editor: card pool + deck list
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <button onClick={closeDeck} className="text-text-secondary hover:text-text-primary">
          &larr; Back
        </button>
        <h1 className="text-xl font-bold">Deck Builder</h1>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Card pool - left side */}
        <div className="flex flex-[2] flex-col overflow-hidden">
          <CardPool deck={deck} onAdd={addCard} />
        </div>

        {/* Deck list + stats - right side */}
        <div className="flex w-72 shrink-0 flex-col gap-3">
          <DeckList
            deck={deck}
            onRemove={removeCard}
            onNameChange={setDeckName}
            onSave={saveDeck}
            onChangeLeader={() => setLeader('')}
          />
          <DeckStats deck={deck} />
        </div>
      </div>
    </div>
  )
}
