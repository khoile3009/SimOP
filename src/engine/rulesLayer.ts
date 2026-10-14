import { getCardById } from '@/data/cardService'
import { REPRINTS } from './effects/registry'
import { SET_MODULES } from '@/data/sets'
import { MAX_CARD_COPIES } from './constants'

const battleAttributes: Record<string, string> = Object.assign(
  {},
  ...SET_MODULES.map((s) => s.battleAttributes),
)

/**
 * Rules-layer registry: per-card overrides of the game's own rules, as opposed
 * to card effects. Cards can change deck-building constraints ("any number of
 * this card"), carry extra names ("also treat this card's name as ..."), and
 * later entries can host win/loss replacements and resource config.
 */

export interface CardRules {
  /** 'any' lifts the 4-copy deck limit (OP01-075 Pacifista) */
  deckCopyLimit?: 'any'
  /** Names this card carries in addition to its printed one (OP01-121 Yamato) */
  extraNames?: string[]
  /** On a LEADER: decking out is a WIN instead of a loss (OP03-040 Nami) */
  deckOutWins?: boolean
  playsCharactersRested?: boolean
  /** On a LEADER: deck may not include cards with printed cost >= this (Rayleigh) */
  deckCostLimitBelow?: number
  /** This card cannot be played from hand/deck/trash by effect ops (OP12 Zoro) */
  notPlayableByEffects?: boolean
  /** On a LEADER: one DON!! from each DON!! Phase attaches to the leader (Roger) */
  donPhaseGivesLeaderDon?: number
  /** On a LEADER: deck may not include EVENTS with printed cost >= this (Imu) */
  deckEventCostLimitBelow?: number
  /** On a LEADER: at game start, play one Stage of this type from the deck (Imu) */
  startsWithStageType?: string
  /** On a LEADER: the DON!! deck holds this many cards instead of 10 (OP15 Enel) */
  donDeckSize?: number
  /** On a LEADER: an empty deck loses at the END of that turn, not on the draw (OP15 Brook) */
  deckOutAtTurnEnd?: boolean
  /** On a LEADER: face-up Life taken as damage goes to the deck bottom, not the hand (ST13 Luffy) */
  faceUpLifeToDeckBottom?: boolean
}

export const CARD_RULES: Record<string, CardRules> = {
  // OP15-058 Enel leader: six-card DON!! deck
  'OP15-058': { donDeckSize: 6 },
  // OP15-022 Brook leader: decking out loses at the End Phase, not on the draw
  'OP15-022': { deckOutAtTurnEnd: true },
  // OP16-042 Prisoner of Impel Down: any number of copies allowed
  'OP16-042': { deckCopyLimit: 'any' },
  // OP13-003 Roger leader: a DON!! from each DON!! Phase goes to the leader
  'OP13-003': { donPhaseGivesLeaderDon: 1 },
  // OP13-079 Imu: no cost-2+ Events in the deck; opens with a Mary Geoise Stage
  'OP13-079': { deckEventCostLimitBelow: 2, startsWithStageType: 'Mary Geoise' },
  // OP12-001 Rayleigh leader: no cards of cost 5+ in the deck
  'OP12-001': { deckCostLimitBelow: 5 },
  // OP12-036 Zoro: "This card in your hand cannot be played by effects"
  'OP12-036': { notPlayableByEffects: true },
  // OP09-022 Lim: "Your Character cards are played rested"
  'OP09-022': { playsCharactersRested: true },
  // OP08-072 Biscuit Warrior: "you may have any number of this card in your deck"
  'OP08-072': { deckCopyLimit: 'any' },
  'OP01-075': { deckCopyLimit: 'any' },
  // Both official romanizations, so cross-set name references resolve
  'OP01-121': { extraNames: ['Kozuki Oden', 'Kouzuki Oden'] },
  'OP02-042': { extraNames: ['Kouzuki Oden', 'Kozuki Oden'] },
  'OP03-122': { extraNames: ['Usopp'] }, // Sogeking
  'EB02-016': { extraNames: ['Tony Tony.Chopper'] }, // Chopperman
  'EB02-024': { extraNames: ['Usopp'] }, // Sogeking
  'EB04-038': { extraNames: ['Trafalgar Law', 'Donquixote Rosinante'] }, // Rosinante & Law
  'ST30-001': { extraNames: ['Monkey.D.Luffy', 'Portgas.D.Ace'] }, // Luffy & Ace
  'ST12-001': { extraNames: ['Roronoa Zoro', 'Sanji'] }, // Zoro & Sanji
  // ST13-003 Luffy leader: face-up Life taken as damage goes to the deck bottom
  'ST13-003': { faceUpLifeToDeckBottom: true },
  'OP03-040': { deckOutWins: true }, // Nami leader: mill yourself to victory
}

/** Who wins when `playerId` must draw from an empty deck (CR loss, unless the
 * rules layer inverts it - Nami's win-condition replacement). */
export function getCardRules(cardId: string): CardRules | undefined {
  return CARD_RULES[REPRINTS[cardId] ?? cardId]
}

export function deckOutWinner(leaderCardId: string, playerId: 'player1' | 'player2') {
  const inverted = CARD_RULES[leaderCardId]?.deckOutWins === true
  const opponent = playerId === 'player1' ? 'player2' : 'player1'
  return inverted ? playerId : opponent
}

export function deckCopyLimit(cardId: string): number {
  return CARD_RULES[cardId]?.deckCopyLimit === 'any' ? Infinity : MAX_CARD_COPIES
}

/** Name checks must go through here, never `data.name === x`: names are sets. */
export function cardHasName(cardId: string, name: string): boolean {
  if (getCardById(cardId)?.name === name) return true
  return CARD_RULES[cardId]?.extraNames?.includes(name) ?? false
}

/**
 * Battle attribute (<Slash>/<Strike>/<Ranged>/<Special>/<Wisdom>). Sourced
 * separately because cards.json's `attribute` field holds the TYPE list.
 */
export function getBattleAttribute(cardId: string): string | null {
  return battleAttributes[cardId] ?? null
}
