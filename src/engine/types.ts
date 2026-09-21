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

export type ModifierDuration = 'turn' | 'battle' | 'untilYourNextTurn' | 'untilTurn' | 'permanent'

export interface Modifier {
  kind: 'power' | 'keyword' | 'flag' | 'cost'
  value: number // power/cost delta; flag value (e.g. the power threshold of a blocker lock); 0 otherwise
  keyword?: string
  flag?: string
  duration: ModifierDuration
  sourceCardId: string
  /** For 'untilYourNextTurn': expires when this player's Refresh Phase runs */
  expiresFor?: PlayerId
  /** For 'untilTurn': expires in the End Phase of this turn number */
  untilTurn?: number
}

export interface GameCard {
  instanceId: string
  cardId: string // Reference to CardData.id
  ownerId: PlayerId
  isRested: boolean
  modifiers: Modifier[]
  attachedDon: number
  activatedThisTurn: string[]
  turnPlayed: number
  /** In a hidden zone (hand): this card is public knowledge (reveals, bounces, life hits) */
  revealed?: boolean
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
  /** Resolution stack of in-progress effects; top frame runs until done or paused on a choice */
  stack: EffectFrame[]
  /** A choice demanded by the top effect frame; blocks all other actions until resolved */
  pendingChoice: PendingChoice | null
  pendingTrigger: TriggerState | null
  pendingDamage: PendingDamage | null
  /** [End of Your Turn] effects are resolving; the turn switch completes when they finish */
  pendingEndTurn?: boolean
  /** Per-player restrictions that expire at end of turn (e.g. 'noLifeToHand') */
  turnFlags: Record<PlayerId, string[]>
  /** One-shot cost discounts for playing matching cards this turn (Kin'emon) */
  playDiscounts: Record<PlayerId, PlayDiscount[]>
  actionHistory: GameAction[]
  winner: PlayerId | null
  setupComplete: boolean
  mulliganState: Record<PlayerId, 'pending' | 'accepted' | 'declined'>
}

export interface PlayDiscount {
  amount: number
  cardType?: CardType
  typeIncludes?: string
  minCost?: number
}

export interface TriggerState {
  cardInstanceId: string
  playerId: PlayerId
}

/** Damage left over when a [Trigger] suspends damage processing (CR 8-6-2-1),
 * e.g. the second hit of [Double Attack]; resumes once the trigger settles. */
export interface PendingDamage {
  playerId: PlayerId
  count: number
  banish: boolean
}

export interface EffectFrame {
  sourceInstanceId: string
  sourceCardId: string
  controller: PlayerId
  /** Index into the effect's op list (see engine/effects/ast.ts) */
  pc: number
  /** Which registered EffectDef on the source card is running */
  timing: string
  defIndex: number
  bindings: Record<string, string[]>
}

export interface PendingChoice {
  playerId: PlayerId
  prompt: string
  options: string[] // instanceIds
  min: number
  max: number
  /** All-or-nothing choices (e.g. paying a DON!!-X cost): only sizes min and max are legal */
  exact?: boolean
  bind: string
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
  | { type: 'ACTIVATE_EFFECT'; cardInstanceId: string; effectId: string }
  | { type: 'PLAY_COUNTER_EVENT'; cardInstanceId: string }
  | { type: 'CHOOSE'; instanceIds: string[] }

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
