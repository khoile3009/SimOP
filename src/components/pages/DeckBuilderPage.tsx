import { useDeckStore } from '@/stores/deckStore'
import LeaderPicker from '@/components/deck/LeaderPicker'
import CardPool from '@/components/deck/CardPool'
import DeckList from '@/components/deck/DeckList'
import DeckStats from '@/components/deck/DeckStats'
import SavedDeckList from '@/components/deck/SavedDeckList'
import PageShell from '@/components/common/PageShell'
import Button from '@/components/common/Button'

export default function DeckBuilderPage() {
  const {
    deck,
    savedDecks,
    newDeck,
    setLeader,
    addCard,
    removeCard,
    setDeckName,
    saveDeck,
    loadDeck,
    deleteDeck,
    duplicateDeck,
    closeDeck,
  } = useDeckStore()

  // No deck open: show saved deck list
  if (!deck) {
    return (
      <PageShell title="Deck Builder" subtitle="Build and manage 50-card decks.">
        <SavedDeckList
          decks={savedDecks}
          onLoad={loadDeck}
          onDelete={deleteDeck}
          onDuplicate={duplicateDeck}
          onNew={newDeck}
        />
      </PageShell>
    )
  }

  // Deck open but no leader: show leader picker
  if (!deck.leader) {
    return (
      <PageShell
        title="Choose a Leader"
        actions={
          <Button variant="ghost" onClick={closeDeck}>
            ← Back to decks
          </Button>
        }
        wide
      >
        <LeaderPicker onSelect={setLeader} />
      </PageShell>
    )
  }

  // Full deck editor: card pool + deck list
  return (
    <PageShell
      title="Deck Editor"
      actions={
        <Button variant="ghost" onClick={closeDeck}>
          ← Back to decks
        </Button>
      }
      wide
    >
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Card pool - left side */}
        <div className="flex flex-[2] flex-col overflow-hidden">
          <CardPool deck={deck} onAdd={addCard} />
        </div>

        {/* Deck list + stats - right side */}
        <div className="flex w-80 shrink-0 flex-col gap-3">
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
    </PageShell>
  )
}
