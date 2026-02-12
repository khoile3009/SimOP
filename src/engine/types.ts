// ─── Card Data (matches OPTCG API response) ────────────────────────────────

export type CardType = 'Leader' | 'Character' | 'Event' | 'Stage'
export type Color = 'Red' | 'Green' | 'Blue' | 'Purple' | 'Black' | 'Yellow'
export type Rarity = 'L' | 'C' | 'UC' | 'R' | 'SR' | 'SEC' | 'SP'

export interface CardData {
  id: string // "OP01-001"
  name: string
  cardType: CardType
  color: Color[]
  cost: number
  power: number | null
  counter: number | null
  life: number | null // Leaders only
  attribute: string[]
  effectText: string
  triggerText: string | null
  rarity: Rarity
  set: string // "OP01"
  imageUrl: string
}

// ─── Game State ─────────────────────────────────────────────────────────────

export type PlayerId = 'player1' | 'player2'

export type GamePhase = 'SETUP' | 'REFRESH' | 'DRAW' | 'DON' | 'MAIN' | 'END'

export type BattleStep = 'ATTACK' | 'BLOCK' | 'COUNTER' | 'DAMAGE'

export interface GameCard {
  instanceId: string
  cardId: string // Reference to CardData.id
  ownerId: PlayerId
  isRested: boolean
  powerModifier: number
  attachedDon: number
  activatedThisTurn: string[]
  turnPlayed: number
}

export interface PlayerState {
  leader: GameCard
  lifeCards: GameCard[]
  hand: GameCard[]
  characters: GameCard[] // Max 5
  donDeck: GameCard[]
  donArea: GameCard[] // Cost area
  deck: GameCard[]
  trash: GameCard[]
  stage: GameCard | null
}

export interface BattleState {
  attackerId: string
  attackerPlayer: PlayerId
  originalTargetId: string
  currentTargetId: string
  defenderPlayer: PlayerId
  step: BattleStep
  counterCardsUsed: string[]
  attackerPowerBonus: number
  defenderPowerBonus: number
}

export interface GameState {
  id: string
  players: Record<PlayerId, PlayerState>
  currentPlayer: PlayerId
  phase: GamePhase
  turnNumber: number
  battle: BattleState | null
  effectQueue: QueuedEffect[]
  pendingTrigger: TriggerState | null
  actionHistory: GameAction[]
  winner: PlayerId | null
  setupComplete: boolean
  mulliganState: Record<PlayerId, 'pending' | 'accepted' | 'declined'>
}

export interface TriggerState {
  cardInstanceId: string
  playerId: PlayerId
}

export interface QueuedEffect {
  sourceCardId: string
  trigger: string
  playerId: PlayerId
}

// ─── Game Actions (Command Pattern) ────────────────────────────────────────

export type GameAction =
  | { type: 'PLAY_CARD'; cardInstanceId: string }
  | { type: 'ATTACH_DON'; count: number; targetCardId: string }
  | { type: 'DECLARE_ATTACK'; attackerId: string; targetId: string }
  | { type: 'ACTIVATE_BLOCKER'; blockerId: string }
  | { type: 'DECLINE_BLOCK' }
  | { type: 'USE_COUNTER'; cardInstanceIds: string[] }
  | { type: 'PASS_COUNTER' }
  | { type: 'ACTIVATE_TRIGGER'; accept: boolean }
  | { type: 'ADVANCE_PHASE' }
  | { type: 'END_TURN' }
  | { type: 'MULLIGAN'; accept: boolean }
  | { type: 'CHOOSE_CHARACTER_TO_TRASH'; cardInstanceId: string }
  | { type: 'ACTIVATE_EFFECT'; cardInstanceId: string; effectId: string }

// ─── Game Result ────────────────────────────────────────────────────────────

export interface GameEvent {
  type: string
  playerId: PlayerId
  description: string
}

export interface GameResult {
  state: GameState
  events: GameEvent[]
  error?: string
}

// ─── Deck ───────────────────────────────────────────────────────────────────

export interface Deck {
  id: string
  name: string
  leader: string // CardData.id
  cards: { cardId: string; qty: number }[]
  createdAt: number
  updatedAt: number
}
