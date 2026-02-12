import { create } from 'zustand'
import type { GameState, GameAction, GameEvent, PlayerId, Deck } from '@/engine/types'
import { createGame, processAction } from '@/engine'

type SelectionTarget =
  | { type: 'card'; instanceId: string; zone: 'hand' | 'character' | 'leader' | 'opponent' }
  | { type: 'don' }
  | { type: 'trash' }
  | null

interface GameStore {
  // Game state
  gameState: GameState | null
  events: GameEvent[]
  error: string | null

  // UI state
  selectedTarget: SelectionTarget
  donAttachCount: number
  viewingPlayer: PlayerId

  // Actions
  startNewGame: (deck1: Deck, deck2: Deck) => void
  dispatch: (action: GameAction, player: PlayerId) => void
  select: (target: SelectionTarget) => void
  clearSelection: () => void
  incrementDonAttach: () => void
  resetDonAttach: () => void
  switchView: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  events: [],
  error: null,
  selectedTarget: null,
  donAttachCount: 0,
  viewingPlayer: 'player1',

  startNewGame: (deck1, deck2) => {
    const state = createGame(deck1, deck2)
    set({
      gameState: state,
      events: [],
      error: null,
      selectedTarget: null,
      donAttachCount: 0,
      viewingPlayer: state.currentPlayer,
    })
  },

  dispatch: (action, player) => {
    const { gameState } = get()
    if (!gameState) return

    const result = processAction(gameState, action, player)
    set({
      gameState: result.state,
      events: [...get().events, ...result.events],
      error: result.error ?? null,
      selectedTarget: null,
      donAttachCount: 0,
    })
  },

  select: (target) => {
    const { donAttachCount, gameState } = get()

    // If in DON attach mode and clicking a card, attach DON
    if (donAttachCount > 0 && target?.type === 'card' && (target.zone === 'character' || target.zone === 'leader')) {
      if (gameState) {
        const result = processAction(
          gameState,
          { type: 'ATTACH_DON', count: donAttachCount, targetCardId: target.instanceId },
          gameState.currentPlayer,
        )
        set({
          gameState: result.state,
          events: [...get().events, ...result.events],
          error: result.error ?? null,
          selectedTarget: null,
          donAttachCount: 0,
        })
      }
      return
    }

    set({ selectedTarget: target })
  },

  clearSelection: () => set({ selectedTarget: null, donAttachCount: 0 }),

  incrementDonAttach: () => set((s) => ({ donAttachCount: s.donAttachCount + 1 })),

  resetDonAttach: () => set({ donAttachCount: 0, selectedTarget: null }),

  switchView: () => {
    const { gameState } = get()
    if (!gameState) return
    set({ viewingPlayer: gameState.currentPlayer })
  },
}))
