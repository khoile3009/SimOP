import { create } from 'zustand'
import type { Deck, CardData, Color } from '@/engine/types'
import { DECK_SIZE, MAX_CARD_COPIES } from '@/engine/constants'
import { getCardById } from '@/data/cardService'
import { generateId } from '@/utils/id'

interface DeckStore {
  // Current deck being edited
  deck: Deck | null
  // All saved decks
  savedDecks: Deck[]

  // Actions
  newDeck: () => void
  setLeader: (leaderId: string) => void
  addCard: (cardId: string) => boolean
  removeCard: (cardId: string) => void
  setDeckName: (name: string) => void
  saveDeck: () => void
  loadDeck: (id: string) => void
  deleteDeck: (id: string) => void
  duplicateDeck: (id: string) => void
  closeDeck: () => void
  loadSavedDecks: () => void
}

const STORAGE_KEY = 'simpiece-decks'

function loadFromStorage(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(decks: Deck[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
}

export function getLeaderColors(leaderId: string): Color[] {
  const leader = getCardById(leaderId)
  return leader ? leader.color : []
}

export function getCardCount(deck: Deck, cardId: string): number {
  const entry = deck.cards.find((c) => c.cardId === cardId)
  return entry ? entry.qty : 0
}

export function getTotalCards(deck: Deck): number {
  return deck.cards.reduce((sum, c) => sum + c.qty, 0)
}

export function canAddCard(deck: Deck, card: CardData): { ok: boolean; reason?: string } {
  if (!deck.leader) return { ok: false, reason: 'Select a leader first' }

  // Color restriction: card must share at least one color with leader
  const leaderColors = getLeaderColors(deck.leader)
  if (!card.color.some((c) => leaderColors.includes(c))) {
    return { ok: false, reason: `Card must be ${leaderColors.join('/')}` }
  }

  // Cannot add leaders to deck
  if (card.cardType === 'Leader') return { ok: false, reason: 'Leaders cannot be in deck' }

  // Max copies
  const currentCount = getCardCount(deck, card.id)
  if (currentCount >= MAX_CARD_COPIES) {
    return { ok: false, reason: `Max ${MAX_CARD_COPIES} copies` }
  }

  // Deck size
  if (getTotalCards(deck) >= DECK_SIZE) {
    return { ok: false, reason: `Deck is full (${DECK_SIZE} cards)` }
  }

  return { ok: true }
}

export const useDeckStore = create<DeckStore>((set, get) => ({
  deck: null,
  savedDecks: loadFromStorage(),

  newDeck: () => {
    set({
      deck: {
        id: generateId(),
        name: 'New Deck',
        leader: '',
        cards: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    })
  },

  setLeader: (leaderId) => {
    const { deck } = get()
    if (!deck) return
    set({
      deck: {
        ...deck,
        leader: leaderId,
        cards: [], // Reset cards when changing leader
        updatedAt: Date.now(),
      },
    })
  },

  addCard: (cardId) => {
    const { deck } = get()
    if (!deck) return false

    const card = getCardById(cardId)
    if (!card) return false

    const check = canAddCard(deck, card)
    if (!check.ok) return false

    const existing = deck.cards.find((c) => c.cardId === cardId)
    const newCards = existing
      ? deck.cards.map((c) => (c.cardId === cardId ? { ...c, qty: c.qty + 1 } : c))
      : [...deck.cards, { cardId, qty: 1 }]

    set({ deck: { ...deck, cards: newCards, updatedAt: Date.now() } })
    return true
  },

  removeCard: (cardId) => {
    const { deck } = get()
    if (!deck) return

    const existing = deck.cards.find((c) => c.cardId === cardId)
    if (!existing) return

    const newCards =
      existing.qty <= 1
        ? deck.cards.filter((c) => c.cardId !== cardId)
        : deck.cards.map((c) => (c.cardId === cardId ? { ...c, qty: c.qty - 1 } : c))

    set({ deck: { ...deck, cards: newCards, updatedAt: Date.now() } })
  },

  setDeckName: (name) => {
    const { deck } = get()
    if (!deck) return
    set({ deck: { ...deck, name, updatedAt: Date.now() } })
  },

  saveDeck: () => {
    const { deck, savedDecks } = get()
    if (!deck) return

    const updated = { ...deck, updatedAt: Date.now() }
    const existing = savedDecks.findIndex((d) => d.id === deck.id)
    const newDecks = existing >= 0
      ? savedDecks.map((d) => (d.id === deck.id ? updated : d))
      : [...savedDecks, updated]

    saveToStorage(newDecks)
    set({ deck: updated, savedDecks: newDecks })
  },

  loadDeck: (id) => {
    const { savedDecks } = get()
    const found = savedDecks.find((d) => d.id === id)
    if (found) set({ deck: { ...found } })
  },

  deleteDeck: (id) => {
    const { savedDecks, deck } = get()
    const newDecks = savedDecks.filter((d) => d.id !== id)
    saveToStorage(newDecks)
    set({
      savedDecks: newDecks,
      deck: deck?.id === id ? null : deck,
    })
  },

  duplicateDeck: (id) => {
    const { savedDecks } = get()
    const source = savedDecks.find((d) => d.id === id)
    if (!source) return

    const copy: Deck = {
      ...source,
      id: generateId(),
      name: `${source.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const newDecks = [...savedDecks, copy]
    saveToStorage(newDecks)
    set({ savedDecks: newDecks, deck: copy })
  },

  closeDeck: () => set({ deck: null }),

  loadSavedDecks: () => set({ savedDecks: loadFromStorage() }),
}))
