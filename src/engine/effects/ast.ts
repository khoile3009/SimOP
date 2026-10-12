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
  /** Replacement provided by ANOTHER card: guards the controller's dying
   * characters (Sabo leader). Needs EffectDef.guard; ops see binding 'target'. */
  | 'guardKo'
  /** [End of Your Turn]: fires for the turn player's cards before the turn switch */
  | 'endOfTurn'
  /** Start-of-turn auto effects, queued as the Main Phase opens (OP11 Luffy leader) */
  | 'startOfTurn'
  /** On the attacker, after it wins a battle that K.O.'d a Character (Isuka) */
  | 'afterBattleKo'

/**
 * Engine events that 'onEvent' defs can subscribe to (socket 1). Emitted from
 * the engine's choke points; listeners on field cards are queued turn-player
 * first (CR 8-6-1).
 */
export type EngineEventKind =
  | 'eventActivated'
  /** A character was rested by an effect op; `player` is the op's controller */
  | 'restedByEffect'
  /** A character left the field through an effect op; `player` is the controller */
  | 'charRemovedByEffect'
  | 'characterKoed'
  | 'donAttached'
  | 'donReturned'
  | 'characterPlayed'
  /** A player's Life took damage; `player` is the DEALER, once per life card */
  | 'lifeDamageDealt'
  /** An attack was declared; `player` is the DEFENDER, source is the target card */
  | 'attacked'
  /** A card was drawn outside the Draw Phase (effect draws); once per draw op */
  | 'drawnExtra'
  /** A life card entered its owner's hand (damage or effect) */
  | 'lifeAddedToHand'
  /** A [Trigger] was activated */
  | 'triggerActivated'
  /** A [Blocker] was activated; `player` is the blocker's owner */
  | 'blockerActivated'
  /** A card went from a player's hand to the trash via an effect op; emitted
   * once per card; `player` is the hand's owner (Kuzan leader) */
  | 'handTrashed'
  /** A player's life count reached 0 (Enel) */
  | 'lifeZero'
  /** A card left a player's Life area (damage or effects); `player` is the life's owner */
  | 'lifeRemoved'

export interface EventQuery {
  kind: EngineEventKind
  /** Whose event, relative to the listener's controller */
  who: 'self' | 'opponent'
  /** characterPlayed only: the played card has a blank text box */
  noBaseEffect?: boolean
  /** characterPlayed only: the card was played from its owner's hand */
  fromHand?: boolean
  /** characterPlayed only: the played card's printed cost is at least this */
  minCost?: number
  /** characterPlayed only: the played card carries a [Trigger] (OP13 Bonney) */
  withTrigger?: boolean
  /** lifeDamageDealt: the damage came from THIS card's attack.
   * attacked: THIS card is the attack's target. */
  sourceIsSelf?: boolean
}

/** Predicates over game state, evaluated from the effect controller's seat. */
export interface Cond {
  /** Passes when ANY branch passes ("If your Leader is [A] or has the {B} type") */
  anyOf?: Cond[]
  /** You have a Character of this type at this effective cost or more; contains = substring type match */
  charTypedCostAtLeast?: { type: string; cost: number; contains?: boolean }
  /** Negation of charTypedCostAtLeast ("if you have no {X} Characters with a cost of 8 or more") */
  lacksCharTypedCostAtLeast?: { type: string; cost: number; contains?: boolean }
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
  /** Substring match over the leader's type list ("Leader's type includes 'CP'") */
  leaderTypeContains?: string
  maxDeckSelf?: number
  /** Cards in your trash ("if you have 15 or more cards in your trash") */
  minTrashSelf?: number
  maxTrashSelf?: number
  /** ACTIVE DON!! in your cost area */
  minActiveDonSelf?: number
  /** Life cards + hand cards combined (OP04 Doflamingo leader) */
  maxLifePlusHandSelf?: number
  /** You have a Character with this effective cost or more / no such Character */
  minSelfCharCost?: number
  lacksSelfCharCost?: number
  /** Both players' life counts combined */
  maxTotalLife?: number
  /** Your leader is active (unrested) */
  leaderActive?: boolean
  /** Your leader card has 2+ colors */
  leaderMulticolor?: boolean
  /** The SOURCE card's current effective power is at least this */
  selfPowerAtLeast?: number
  /** Your leader's current effective power is at most this */
  leaderPowerAtMost?: number
  /** You have a character with this type */
  hasCharacterTypeIncludes?: string
  /** Every character you control carries this type (Celestial Dragons) */
  allSelfCharsTyped?: string
  maxDonField?: number
  /** No character with this name on EITHER field (Enel's Luffy clause) */
  noCharacterNamedAnywhere?: string
  /** A character with this name OTHER than the effect's source (Kung Fu Jugon) */
  hasOtherCharacterNamed?: string
  lessLifeThanOpp?: boolean
  minLifeOpp?: number
  minHandOpp?: number
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
  minLifeSelf?: number
  minDeckSelf?: number
  hasCharacterNamed?: string
  lacksCharacterNamed?: string
  /** A character you control OTHER than the source has at least this power (Inazuma) */
  otherCharPowerAtLeast?: number
  /** DON!! on your field is exactly 0 OR at least this many (OP05 Luffy leader) */
  donFieldZeroOrAtLeast?: number
  /** The opponent has more DON!! on their field than you */
  oppMoreDon?: boolean
  /** The opponent has at least as many DON!! on their field as you (GERMA) */
  oppAtLeastSelfDon?: boolean
  /** The opponent has at least this many MORE DON!! than you (Cosette) */
  oppDonAdvantageAtLeast?: number
  maxLifeOpp?: number
  /** The opponent has a Leader or Character with at least this PRINTED power */
  oppBasePowerAtLeast?: number
  /** The opponent has a Character with at least this effective power */
  oppCharPowerAtLeast?: number
  /** Your rested cards across leader, characters, stage and DON!! */
  minSelfRestedAny?: number
  /** A character you control OTHER than the source has this type (Raki) */
  hasOtherCharacterTyped?: string
  /** Rested DON!! in your cost area (Caribou) */
  minSelfRestedDon?: number
  /** Your leader has ANY of these types */
  leaderTypeIncludesAny?: string[]
  /** At least `count` of your characters carry any of `types` (Kuja, Foxy) */
  minSelfCharsTypedAny?: { types: string[]; count: number }
  minOppCharacters?: number
  /** The opponent's rested cards across leader, characters, stage and DON!! */
  minOppRestedAny?: number
  /** The source card is active (unrested) - Pekoms */
  selfActive?: boolean
  /** The source character entered the field this turn (black Kaido) */
  selfPlayedThisTurn?: boolean
  /** No OTHER character you control carries this name (Black Maria) */
  lacksOtherCharacterNamed?: string
  /** Your trash holds at least one card of EACH name (Chessmarimo) */
  trashContainsNames?: string[]
  /** A character you control carries ANY of these names (Cabaji) */
  hasCharacterNamedAny?: string[]
  /** TRUE when you control FEWER than `count` characters of cost >= `cost` (Buggy 10) */
  fewerSelfCharsCostAtLeast?: { cost: number; count: number }
  /** The opponent's hand exceeds yours by at least this many (Teach) */
  handDisadvantageAtLeast?: number
  /** Your leader's current effective power is at least this (Wire) */
  leaderPowerAtLeast?: number
  /** The opponent has at least `count` characters of printed power >= `power` */
  minOppCharsBasePowerAtLeast?: { power: number; count: number }
  /** Either player's life count is 0 (Roger) */
  anyPlayerLifeZero?: boolean
  /** The combined effective cost of your characters is at least this (Law leader) */
  minSelfCharsTotalCost?: number
  /** You control a character with this type and at least this power (Sugar leader) */
  charTypedPowerAtLeast?: { type: string; power: number }
  /** ANY character on either field has at least this effective cost (Rebecca) */
  anyCharacterCostAtLeast?: number
  /** The opponent has at least this many MORE characters than you (Liberation) */
  charDisadvantageAtLeast?: number
  /** Your life count is at most the opponent's (X.Drake) */
  atMostLifeOfOpp?: boolean
  /** At least `count` of your RESTED characters carry `type` (green Nami) */
  minSelfRestedCharsTyped?: { type: string; count: number }
  /** Every character you control has a type CONTAINING this substring (GERMA) */
  allSelfCharsTypeContains?: string
  /** Your leader's printed colors include this color (Gear Two) */
  leaderColorIncludes?: string
  /** Both players' life counts combined are at least this (Red Hawk) */
  minTotalLife?: number
  /** At least `count` of your characters have effective cost >= `cost` (Koala leader) */
  minSelfCharsCostAtLeast?: { cost: number; count: number }
  /** Your leader's battle attribute (Zoro's Slash support) */
  leaderAttributeIs?: string
  /** Total DON!! given to your leader and characters (Gyukimaru) */
  minSelfGivenDon?: number
  /** At least this many Event cards in your trash (OP12 purple Sanji) */
  minTrashEventsSelf?: number
  /** ACTIVE DON!! in your cost area is at most this (OP13 Luffy leader) */
  maxActiveDonSelf?: number
  /** The source card's own effective cost is at least this (OP16 Momonosuke) */
  selfCostAtLeast?: number
  /** One of the opponent's characters was K.O.'d this turn (OP16 Yamato) */
  oppCharKoedThisTurn?: boolean
  /** The OPPONENT has a character with this effective cost or less (Baskerville) */
  oppCharCostAtMost?: number
}

/** Instance selection filter, for `select` (live zones). */
export interface SelectFilter {
  /** 'any': the printed target names no side ("up to 1 Character") - both fields are legal */
  owner: 'self' | 'opponent' | 'any'
  /** Options are the cards already bound under this ref ("place it at the bottom instead?" re-picks) */
  fromRef?: string
  /** Life zone only: both the top and bottom cards are options ("from the top or bottom of your Life") */
  lifeEnds?: boolean
  zone:
    | 'characters'
    | 'leaderOrCharacters'
    | 'leader'
    | 'hand'
    | 'trash'
    | 'don'
    | 'life'
    | 'stage'
    | 'leaderOrStage'
    | 'guarded'
  /** Effective cost for field zones (cost modifiers apply); printed cost elsewhere */
  costAtMost?: number
  /** Exact cost ("with a cost of 1"); effective on field, printed elsewhere */
  costIs?: number
  /** Cost at most the TOTAL of both players' life counts (OP04 yellow) */
  costAtMostTotalLife?: boolean
  /** Cost at most the OPPONENT's life count (OP05 yellow) */
  costAtMostOppLife?: boolean
  /** Cost at most YOUR life count (Opera) */
  costAtMostSelfLife?: boolean
  /** Cost at most the DON!! on YOUR field (Kalgara) */
  costAtMostSelfDon?: boolean
  /** Cost at most the DON!! on the OPPONENT's field (Katakuri chain) */
  costAtMostOppDon?: boolean
  /** PRINTED power cap ("5000 base power or less") */
  basePowerAtMost?: number
  /** PRINTED cost cap ("with a base cost of 4 or less") - ignores cost modifiers */
  baseCostAtMost?: number
  /** Exact PRINTED cost ("with a base cost of 1") - ignores cost modifiers */
  baseCostIs?: number
  /** The card's text box is blank ("with no base effect") */
  noBaseEffect?: boolean
  /** Effective power (base + DON + modifiers + auras) at selection time */
  powerAtMost?: number
  rested?: boolean
  cardType?: 'Character' | 'Event' | 'Stage'
  /** Any of these card types ("Event or Stage cards") */
  cardTypeAny?: Array<'Character' | 'Event' | 'Stage'>
  /** Effective power at selection time; printed-power floor for costs like Teach's */
  powerAtLeast?: number
  /** The card has a [Trigger] ("a Character card with a [Trigger]") */
  hasTrigger?: boolean
  /** The card currently has this keyword (printed or granted) */
  hasKeywordIs?: string
  /** Battle attribute ("your <Slash> attribute Characters") */
  attributeIs?: string
  costAtLeast?: number
  /** Has this type OR carries a [Trigger] (Belo Betty) */
  typeOrTrigger?: string
  /** Exclude the effect's own source card ("other than this Character") */
  excludeSelf?: boolean
  typeIncludes?: string
  typeIncludesAny?: string[]
  /** Substring over type names ("a type including 'CP'" matches CP6/CP7/CP9) */
  typeContains?: string
  colorIncludes?: string
  nameIs?: string
  nameNot?: string
  /** Matches when the card carries this name even if the type filters miss ("[Rosinante] and {Heart Pirates} types") */
  orNameIs?: string
  /** Option must share no color with the card bound under this name (Law leader) */
  differentColorThanRef?: string
}

/** Printed-data filter, for deck reveals/searches. */
export interface CardDataFilter {
  cardType?: 'Character' | 'Event' | 'Stage'
  costAtMost?: number
  costAtLeast?: number
  powerAtMost?: number
  typeIncludesAny?: string[]
  costIs?: number
  powerAtLeast?: number
  nameIsAny?: string[]
  typeIncludes?: string
  typeContains?: string
  colorIncludes?: string
  nameIs?: string
  nameNot?: string
  /** Matches when the card carries this name even if other filters miss ("[Sanji] or {BMP} type") */
  orNameIs?: string
  /** Alternate arm: matches when this whole filter matches ("red Event or cost-3+ Character") */
  orMatch?: CardDataFilter
  /** Matches when the card carries this type even if other filters miss (Izo) */
  orTypeIncludes?: string
  /** The card has a [Trigger] */
  hasTrigger?: boolean
  /** The card's battle attribute (Slash searches) */
  attributeIs?: string
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
  | 'noLeaderAttackTurnPlayed' // cannot attack a Leader the turn it was played (Curiel)
  | 'trashAtTurnEnd' // this card is trashed when the turn ends (Thatch)
  | 'bounceAtTurnEnd' // this card returns to its owner's hand when the turn ends
  | 'noRefresh' // does not become active in its owner's next Refresh Phase
  | 'bottomDecksBattledFoe' // value = max cost: the character this card battles goes to the deck bottom
  | 'rushCharactersOnly' // may attack CHARACTERS (not leaders) the turn it was played
  | 'negated' // the card's own effects (printed keywords, statics, defs) are off
  | 'noOppEffectKo' // cannot be K.O.'d by OPPONENT effects (own effects still can)
  | 'noOnPlay' // on a LEADER: this player's [On Play] effects are negated (Teach)
  | 'noBattleKoByLeader' // cannot be K.O.'d in battle when the attacker is a Leader
  | 'cannotBlock' // this character cannot activate [Blocker]
  | 'noRest' // cannot be rested by effect ops (Hatchan's lock, GERMA Yonji)
  | 'bottomDeckAtTurnEnd' // this card goes to the owner's deck bottom when the turn ends
  | 'setActiveAtTurnEnd' // this card is set active when the turn ends (Topknot Neptunian)
  | 'activeAfterCharBattle' // on an attacker: sets active after battling a CHARACTER (Zoro leader)
  | 'noAttackCharsCostAtMost' // cannot attack characters with cost <= value (Zoro leader rider)

export type EffectOp =
  | { op: 'draw'; count: number; who?: 'self' | 'opponent' }
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
      /** Bind every matching card with no prompt ("all of your opponent's Characters") */
      selectAll?: boolean
      prompt: string
    }
  /** Skip the rest of this effect when a binding is empty - "You may X: Y" costs */
  | { op: 'abortIfEmpty'; ref: string }
  /** Skip the rest when a binding is NON-empty - encodes "choose one" second modes */
  | { op: 'abortIfChosen'; ref: string }
  /** Trash the top N cards of the controller's deck (mill; never a loss) */
  | { op: 'millSelf'; count: number }
  /** Move the top card(s) of the controller's deck onto the TOP of their Life */
  | { op: 'deckTopToLife'; count: number }
  /** Trash the top card(s) of a player's Life */
  | { op: 'trashLifeTop'; owner: 'self' | 'opponent'; count: number }
  /** Move a bound field character to the TOP of its owner's Life (Katakuri) */
  | { op: 'fieldToLife'; ref: string; faceUp?: boolean; bottom?: boolean }
  /** Move bound cards from the controller's trash to their deck bottom */
  | { op: 'trashToDeckBottom'; ref: string }
  /** Return the oldest N trash cards to the deck and shuffle (Elizabello's cost) */
  | { op: 'trashIntoDeckShuffle'; count: number }
  /** Move bound hand cards to the TOP of the controller's Life (face-down) */
  | { op: 'handToLife'; ref: string; faceUp?: boolean }
  /** Reveal the deck top; if it matches, power-mod self; revealed card to the bottom */
  | {
      op: 'revealTopCheck'
      filter: CardDataFilter
      amount: number
      duration: ModifierDuration
      keyword?: string
    }
  /** Shuffle a player's whole hand into their deck, then draw (their hand size, or `draw`) */
  | { op: 'shuffleHandIntoDeckDraw'; who?: 'self' | 'opponent'; draw?: number }
  /** Self base power becomes the attacking card's current power (delta modifier) */
  | { op: 'basePowerToAttacker'; duration: ModifierDuration }
  /** Self base power becomes the opponent's leader's current power (Shuraiya) */
  | { op: 'basePowerToOppLeader'; duration: ModifierDuration }
  /** Self base power becomes a bound card's current power (Catarina Devon) */
  | { op: 'basePowerToRef'; ref: string; duration: ModifierDuration }
  /** Redirect the current attack to a bound card of the defender's (OP16 Teach) */
  | { op: 'redirectAttack'; ref: string }
  /** Move bound TRASH cards to the top of the controller's Life, face-up (Shiryu) */
  | { op: 'trashToLife'; ref: string }
  /** Rest every character a player controls (The Ark Noah) */
  | { op: 'restAll'; owner: 'self' | 'opponent' }
  /** Deal damage to the opponent's Life (triggers are SIMPLIFIED away) */
  | { op: 'dealDamage'; count: number }
  /** Skip the rest unless every bound card's effective power is at most `max` */
  | { op: 'requireRefPowerAtMost'; ref: string; max: number }
  /** Skip the rest unless every bound card's effective cost is at most `max` */
  | { op: 'requireRefCostAtMost'; ref: string; max: number }
  /** Mill as many cards as another binding's size (Murder at the Steam Bath) */
  | { op: 'millPerRef'; countRef: string }
  /** The controller wins the game outright (Roger) */
  | { op: 'winGame' }
  /** Grant a flag to the controller's whole field at once */
  | {
      op: 'grantFlagAll'
      flag: FlagName
      value?: number
      duration: ModifierDuration
      includeLeader?: boolean
      untilTurnOffset?: number
    }
  /** Final K.O. of the source, bypassing its own replacement window (declined optional replacements) */
  | { op: 'koSelfNoReplace' }
  /** guardKo resolution: if the choice binding is empty, finally K.O. the
   * target and stop; otherwise continue into the guard's payment ops */
  | { op: 'guardResolve'; choiceRef: string; targetRef: string }
  /** Move a bound LIFE card to its owner's trash (Enel's self-pay) */
  | { op: 'lifeToTrash'; ref: string }
  /** Take an extra turn after this one (Gear 5) */
  | { op: 'extraTurn' }
  /** Mass removal with filters; dest 'trash' performs K.O.s */
  | {
      op: 'removeAll'
      owner: 'self' | 'opponent' | 'both'
      dest: 'trash' | 'deckBottom'
      costAtMost?: number
      rested?: boolean
      excludeSelf?: boolean
    }
  /** Both players trash down to `count` hand cards (from the end; approximation) */
  | { op: 'discardTo'; count: number; who: 'both' | 'self' | 'opponent' }
  /** Skip the rest of this effect when the condition fails - "Then, if ..." */
  | { op: 'requireCond'; cond: Cond }
  | {
      op: 'powerMod'
      ref: string
      amount: number
      duration: ModifierDuration
      untilTurnOffset?: number
    }
  /** Power mod scaled by another binding's size (Ace: +1000 per trashed card) */
  | {
      op: 'powerModPerRef'
      ref: string
      countRef: string
      amountPer: number
      duration: ModifierDuration
      /** Scale by floor(count / per) instead of the raw count */
      per?: number
    }
  /** Katakuri-style life scry, simplified: may move the top card of either
   * player's Life to the bottom of that stack (the "look" is not modeled) */
  | { op: 'scryLifeTops'; prompt: string }
  | {
      op: 'grantKeyword'
      ref: string
      keyword: string
      duration: ModifierDuration
      untilTurnOffset?: number
    }
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
  | { op: 'playCards'; ref: string; rested?: boolean; who?: 'opponent' } // free play from hand/deck/trash
  | { op: 'playSelf'; rested?: boolean } // play the source card from the trash
  /** Look at top N; choose up to `upTo` matching to hand/play/trash; rest to bottom (or trash) */
  | {
      op: 'searchTop'
      count: number
      filter: CardDataFilter
      upTo: number
      to: 'hand' | 'play' | 'trash' | 'life'
      restTo?: 'bottom' | 'trash'
      playRested?: boolean
    }
  /** Look at top N; chosen subset goes to the bottom (order kept), rest stays on top */
  | { op: 'scryBottom'; count: number }
  /** Reveal matching cards from the whole deck; chosen to hand or play; shuffle */
  | { op: 'searchDeckByName'; name: string; upTo: number; to?: 'hand' | 'play' }
  /** Same, but filtered by printed data instead of a name (Oden's [On K.O.]) */
  | { op: 'searchDeck'; filter: CardDataFilter; upTo: number; to: 'hand' | 'play' }
  /** Reveal top card; if it matches, may play it; otherwise it stays on top */
  | { op: 'revealTopMayPlay'; filter: CardDataFilter; rested?: boolean; keyword?: string }
  /** Reveal the TOP LIFE card; if it matches, play it (Law leader) */
  | { op: 'revealLifeTopMayPlay'; filter: CardDataFilter }
  | { op: 'addDon'; count: number; rested: boolean; who?: 'self' | 'opponent' } // from DON!! deck to cost area
  /** Rested cost-area DON onto the source card, or onto a bound card via toRef */
  | { op: 'giveRestedDon'; upTo: number; toRef?: string; fromActive?: boolean }
  /** Move DON already given to your other cards onto the bound card (Dragon) */
  | { op: 'moveAttachedDon'; upTo: number; toRef: string }
  /** Set a bound card's power to a fixed value via a delta modifier (Ain) */
  | {
      op: 'setPower'
      ref: string
      value: number
      duration: ModifierDuration
      untilTurnOffset?: number
    }
  /** Move the source card from the trash to its owner's hand (trigger tails) */
  | { op: 'selfToHand' }
  /** Turn the top `count` face-down Life cards face-up; aborts if fewer exist */
  | { op: 'lifeFaceUp'; count: number }
  /** Turn face-up Life cards face-down ('all' never aborts; a count aborts short) */
  | { op: 'lifeFaceDown'; count: number | 'all' }
  /** Trash the deck top; if it matches, the bound card gains power (Blackbeard) */
  | {
      op: 'millTopCheck'
      filter: CardDataFilter
      ref: string
      amount: number
      duration: ModifierDuration
    }
  /** Look at the opponent's deck top: it becomes known (revealed) to you (Katakuri) */
  | { op: 'peekOppTop' }
  /** "Choose a cost and reveal the opponent's top card": hits only when the top
   * is already known via peekOppTop; the reveal makes it public either way */
  | { op: 'costGuessCheck' }
  /** Reveal your own deck top; abort the frame unless it matches (Xebec leader).
   * The card stays on top, publicly known. */
  | { op: 'revealTopCond'; filter: CardDataFilter }
  | { op: 'returnDon'; ref: string } // bound cost-area DON back to the DON!! deck
  /** Run this same card's def of another timing (trigger: "Activate this card's [Main]") */
  | { op: 'activateTiming'; timing: 'main' | 'counter' | 'onPlay' | 'onKo' }
  /** Mark bound hand cards as revealed (public knowledge until they move zones) */
  | { op: 'reveal'; ref: string }
  /** Field-cost delta on bound cards (Black's -N cost effects) */
  | {
      op: 'costMod'
      ref: string
      amount: number
      duration: ModifierDuration
      untilTurnOffset?: number
    }
  /** Power delta on the controller's whole field at once (Uta) */
  | {
      op: 'powerModAll'
      amount: number
      duration: ModifierDuration
      includeLeader?: boolean
      who?: 'self' | 'opponent'
    }
  /** Draw until the controller's hand holds `count` cards (never discards) */
  | { op: 'drawTo'; count: number }
  /** The controller's TOP life card(s) to hand, no choice (Whitebeard, Squard) */
  | { op: 'lifeTopToHand'; count: number; who?: 'self' | 'opponent' }
  /** Activate a bound EVENT card from the controller's hand for free (Sanji leader) */
  | { op: 'activateEventFromHand'; ref: string }
  /** The opponent returns DON from their cost area to their DON!! deck (rested first) */
  | { op: 'oppReturnDon'; count: number }
  /** Turn-scoped restriction on the controller (cleared at end of turn) */
  | {
      op: 'restrictSelf'
      restriction:
        | 'noLifeToHand'
        | 'noLeaderAttack'
        | 'donEqualize'
        | 'noEffectDraw'
        | 'noPlayCharCost7Plus'
        | 'noPlayCharCost5Plus'
        | 'noPlayFromHand'
        | 'noPlayCharacters'
    }
  /** One-shot play-cost discount for the controller this turn (Kin'emon) */
  | {
      op: 'grantPlayDiscount'
      amount: number
      cardType?: 'Character' | 'Event' | 'Stage'
      typeIncludes?: string
      minCost?: number
      nameIs?: string
    }
  /** Skip the rest of the effect unless every bound card has this printed type */
  | { op: 'requireRefIs'; ref: string; cardType: 'Character' | 'Event' | 'Stage' }
  /** Move bound life cards to the bottom of their owner's deck */
  | { op: 'lifeToDeckBottom'; ref: string }

export interface EffectDef {
  timing: EffectTiming
  /** For timings 'replaceKo'/'guardKo': 'oppEffect' narrows the window to
   * opponent-effect K.O.s, 'effect' to any non-battle K.O.; default any K.O. */
  replaceWhen?: 'any' | 'oppEffect' | 'effect' | 'battle'
  /** For timing 'onEvent': which engine event this def listens for */
  on?: EventQuery
  /** [DON!! xN]: needs at least N DON attached to the source card */
  donRequired?: number
  oncePerTurn?: boolean
  condition?: Cond
  /** Mandatory activation cost, paid on activation ([Activate: Main] only).
   * returnDon is DON!!-X: that many cost-area DON go back to the DON!! deck. */
  cost?: { restDon?: number; restSelf?: boolean; returnDon?: number }
  /** For timing 'guardKo': which dying characters this card may save */
  guard?: SelectFilter
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
    /** 'myHand' scopes cost modifiers to the controller's hand cards;
     * 'handSelf' is a static the card carries while IN HAND, discounting
     * only itself (OP07 Sanji) */
    scope:
      | 'self'
      | 'myLeader'
      | 'myCharacters'
      | 'myCharactersOther'
      | 'oppCharacters'
      | 'myHand'
      | 'handSelf'
    typeIncludes?: string
    typeIncludesAny?: string[]
    nameIs?: string
    nameNot?: string
    cardType?: 'Character' | 'Event' | 'Stage'
    colorIncludes?: string
    /** PRINTED cost bounds on the targets */
    costAtLeast?: number
    costAtMost?: number
    costIs?: number
    /** Only active (unrested) targets */
    activeOnly?: boolean
    /** Only targets carrying a [Trigger] (OP17 Linlin) */
    hasTrigger?: boolean
    /** Only targets with exactly this printed power */
    basePowerIs?: number
  }
  power?: number
  /** Scaling auras: value per matching count, added to `power` */
  powerPer?: {
    handCards?: boolean
    trashEventsPer2?: boolean
    trashEventsPerN?: number
    trashPer5?: boolean
    trashPerN?: number
    /** +amount per distinct card name among your characters (OP16 Luffy) */
    perUniqueCharNames?: boolean
    amount: number
  }
  keyword?: string
  flag?: FlagName
  flagValue?: number
  /** Cost delta for matching cards (scope 'myHand'); applied at read time, floor 0 */
  costMod?: number
}
