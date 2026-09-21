import type { ModifierDuration } from '../types'

/**
 * Card-effect DSL. Effects are data, not code: cards are added by registering
 * definitions, agents can introspect them, and the engine interprets them.
 */

export type EffectTiming =
  | 'onPlay'
  | 'whenAttacking'
  | 'onBlock'
  | 'onKo'
  | 'trigger'
  | 'main'
  | 'counter'
  | 'activateMain'
  /** Auto effect listening for an engine event; requires EffectDef.on */
  | 'onEvent'
  /** Replacement: runs INSTEAD of this card's K.O. (two-phase event window) */
  | 'replaceKo'
  /** [End of Your Turn]: fires for the turn player's cards before the turn switch */
  | 'endOfTurn'
  /** On the attacker, after it wins a battle that K.O.'d a Character (Isuka) */
  | 'afterBattleKo'

/**
 * Engine events that 'onEvent' defs can subscribe to (socket 1). Emitted from
 * the engine's choke points; listeners on field cards are queued turn-player
 * first (CR 8-6-1).
 */
export type EngineEventKind =
  | 'eventActivated'
  | 'characterKoed'
  | 'donAttached'
  | 'donReturned'
  | 'characterPlayed'

export interface EventQuery {
  kind: EngineEventKind
  /** Whose event, relative to the listener's controller */
  who: 'self' | 'opponent'
  /** characterPlayed only: the played card has a blank text box */
  noBaseEffect?: boolean
  /** characterPlayed only: the card was played from its owner's hand */
  fromHand?: boolean
}

/** Predicates over game state, evaluated from the effect controller's seat. */
export interface Cond {
  yourTurn?: boolean
  opponentsTurn?: boolean
  /** The source card itself is rested (e.g. Kid's taunt) */
  selfRested?: boolean
  leaderNameIs?: string
  leaderTypeIncludes?: string
  /** ANY character on either field has this effective cost or less ("a Character with a cost of 0") */
  anyCharacterCostAtMost?: number
  /** Every DON!! in your cost area is rested (Inuarashi) */
  allSelfDonRested?: boolean
  maxSelfCharacters?: number
  minSelfCharacters?: number
  minSelfRestedCharacters?: number
  minOppRestedCharacters?: number
  minHandSelf?: number
  maxHandSelf?: number
  /** DON!! cards on your field: cost area + attached (CR "on your field") */
  minDonField?: number
  /** DON!! on the OPPONENT's field (purple trigger punishes) */
  minDonFieldOpp?: number
  maxLifeSelf?: number
  minDeckSelf?: number
  hasCharacterNamed?: string
  lacksCharacterNamed?: string
}

/** Instance selection filter, for `select` (live zones). */
export interface SelectFilter {
  owner: 'self' | 'opponent'
  zone: 'characters' | 'leaderOrCharacters' | 'leader' | 'hand' | 'trash' | 'don' | 'life' | 'stage'
  /** Effective cost for field zones (cost modifiers apply); printed cost elsewhere */
  costAtMost?: number
  /** Exact cost ("with a cost of 1"); effective on field, printed elsewhere */
  costIs?: number
  /** The card's text box is blank ("with no base effect") */
  noBaseEffect?: boolean
  /** Effective power (base + DON + modifiers + auras) at selection time */
  powerAtMost?: number
  rested?: boolean
  cardType?: 'Character' | 'Event' | 'Stage'
  typeIncludes?: string
  typeIncludesAny?: string[]
  colorIncludes?: string
  nameIs?: string
  nameNot?: string
  /** Option must share no color with the card bound under this name (Law leader) */
  differentColorThanRef?: string
}

/** Printed-data filter, for deck reveals/searches. */
export interface CardDataFilter {
  cardType?: 'Character' | 'Event' | 'Stage'
  costAtMost?: number
  costIs?: number
  typeIncludes?: string
  colorIncludes?: string
  nameIs?: string
  nameNot?: string
}

export type FlagName =
  | 'canAttackActive' // may attack active characters
  | 'cannotAttack'
  | 'taunt' // opponent may only attack this card
  | 'noBattleKo' // cannot be K.O.'d in battle
  | 'noBlockPowerAtMost' // on an attacker: blockers with power <= value can't block
  // Cannot be K.O.'d in battle by attackers with this battle attribute
  | 'noBattleKoBySlash'
  | 'noBattleKoByStrike'
  | 'noBattleKoByRanged'
  | 'noBattleKoBySpecial'
  | 'noBattleKoByWisdom'
  | 'noEffectKo' // cannot be K.O.'d by effects
  | 'noOppEffectRemove' // opponent effects cannot remove this card from the field
  | 'noBlockCostAtMost' // on an attacker: blockers with cost <= value can't block
  | 'bottomDeckAtBattleEnd' // this card goes to the deck bottom when the battle ends

export type EffectOp =
  | { op: 'draw'; count: number }
  | {
      op: 'select'
      bind: string
      filter: SelectFilter
      min: number
      max: number
      /** Only subset sizes min and max are legal (all-or-nothing costs) */
      exact?: boolean
      /** Who makes the choice; defaults to the effect controller */
      chooser?: 'controller' | 'opponent'
      prompt: string
    }
  /** Skip the rest of this effect when a binding is empty - "You may X: Y" costs */
  | { op: 'abortIfEmpty'; ref: string }
  /** Skip the rest of this effect when the condition fails - "Then, if ..." */
  | { op: 'requireCond'; cond: Cond }
  | { op: 'powerMod'; ref: string; amount: number; duration: ModifierDuration }
  | { op: 'grantKeyword'; ref: string; keyword: string; duration: ModifierDuration }
  | {
      op: 'grantFlag'
      ref: string
      flag: FlagName
      value?: number
      duration: ModifierDuration
      /** For duration 'untilTurn': expires at the End Phase of turn + offset */
      untilTurnOffset?: number
    }
  | { op: 'ko'; ref: string }
  | { op: 'koAll'; owner: 'opponent' | 'both'; excludeSelf?: boolean }
  /** Field to trash WITHOUT a K.O. (rule processing / costs; no [On K.O.]) */
  | { op: 'trashFromField'; ref: string }
  | { op: 'rest'; ref: string }
  | { op: 'setActive'; ref: string }
  | { op: 'bottomDeck'; ref: string } // from controller's hand
  | { op: 'bottomDeckFromField'; ref: string } // to the owner's deck
  | { op: 'returnToHand'; ref: string } // from field to the owner's hand
  | { op: 'toHand'; ref: string } // from the controller's trash
  | { op: 'trashCards'; ref: string } // from a hand (whichever hand holds them)
  | { op: 'lifeToHand'; ref: string } // bound via select zone 'life'
  | { op: 'playCards'; ref: string; rested?: boolean } // free play from hand/deck/trash
  | { op: 'playSelf'; rested?: boolean } // play the source card from the trash
  /** Look at top N; choose up to `upTo` matching to hand or play; rest to bottom */
  | { op: 'searchTop'; count: number; filter: CardDataFilter; upTo: number; to: 'hand' | 'play' }
  /** Look at top N; chosen subset goes to the bottom (order kept), rest stays on top */
  | { op: 'scryBottom'; count: number }
  /** Reveal matching cards from the whole deck; chosen to hand or play; shuffle */
  | { op: 'searchDeckByName'; name: string; upTo: number; to?: 'hand' | 'play' }
  /** Same, but filtered by printed data instead of a name (Oden's [On K.O.]) */
  | { op: 'searchDeck'; filter: CardDataFilter; upTo: number; to: 'hand' | 'play' }
  /** Reveal top card; if it matches, may play it; otherwise it stays on top */
  | { op: 'revealTopMayPlay'; filter: CardDataFilter; rested?: boolean }
  | { op: 'addDon'; count: number; rested: boolean } // from DON!! deck to cost area
  | { op: 'giveRestedDon'; upTo: number } // rested cost-area DON onto the source card
  | { op: 'returnDon'; ref: string } // bound cost-area DON back to the DON!! deck
  /** Run this same card's def of another timing (trigger: "Activate this card's [Main]") */
  | { op: 'activateTiming'; timing: 'main' | 'counter' }
  /** Mark bound hand cards as revealed (public knowledge until they move zones) */
  | { op: 'reveal'; ref: string }
  /** Field-cost delta on bound cards (Black's -N cost effects) */
  | { op: 'costMod'; ref: string; amount: number; duration: ModifierDuration }
  /** Power delta on the controller's whole field at once (Uta) */
  | { op: 'powerModAll'; amount: number; duration: ModifierDuration; includeLeader?: boolean }
  /** Draw until the controller's hand holds `count` cards (never discards) */
  | { op: 'drawTo'; count: number }
  /** The controller's TOP life card(s) to hand, no choice (Whitebeard, Squard) */
  | { op: 'lifeTopToHand'; count: number }
  /** The opponent returns DON from their cost area to their DON!! deck (rested first) */
  | { op: 'oppReturnDon'; count: number }
  /** Turn-scoped restriction on the controller (cleared at end of turn) */
  | { op: 'restrictSelf'; restriction: 'noLifeToHand' }
  /** One-shot play-cost discount for the controller this turn (Kin'emon) */
  | { op: 'grantPlayDiscount'; amount: number; cardType?: 'Character' | 'Event' | 'Stage'; typeIncludes?: string; minCost?: number }
  /** Skip the rest of the effect unless every bound card has this printed type */
  | { op: 'requireRefIs'; ref: string; cardType: 'Character' | 'Event' | 'Stage' }
  /** Move bound life cards to the bottom of their owner's deck */
  | { op: 'lifeToDeckBottom'; ref: string }

export interface EffectDef {
  timing: EffectTiming
  /** For timing 'onEvent': which engine event this def listens for */
  on?: EventQuery
  /** [DON!! xN]: needs at least N DON attached to the source card */
  donRequired?: number
  oncePerTurn?: boolean
  condition?: Cond
  /** Mandatory activation cost, paid on activation ([Activate: Main] only).
   * returnDon is DON!!-X: that many cost-area DON go back to the DON!! deck. */
  cost?: { restDon?: number; restSelf?: boolean; returnDon?: number }
  ops: EffectOp[]
}

/**
 * Continuous effects (auras): applied at read time by powerCalc/keywords/flags,
 * never queued. Active while the source is on the field, its DON requirement is
 * met, and its condition holds.
 */
export interface StaticDef {
  donRequired?: number
  condition?: Cond
  target: {
    /** 'myHand' scopes cost modifiers to the controller's hand cards */
    scope: 'self' | 'myLeader' | 'myCharacters' | 'myCharactersOther' | 'oppCharacters' | 'myHand'
    typeIncludes?: string
    nameIs?: string
    nameNot?: string
    cardType?: 'Character' | 'Event' | 'Stage'
    colorIncludes?: string
  }
  power?: number
  /** Scaling auras: value per matching count, added to `power` */
  powerPer?: { handCards?: boolean; trashEventsPer2?: boolean; amount: number }
  keyword?: string
  flag?: FlagName
  flagValue?: number
  /** Cost delta for matching cards (scope 'myHand'); applied at read time, floor 0 */
  costMod?: number
}
