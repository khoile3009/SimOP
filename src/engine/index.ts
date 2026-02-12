export type {
  CardData,
  CardType,
  Color,
  Rarity,
  GameState,
  GameAction,
  GameResult,
  GameEvent,
  GameCard,
  PlayerState,
  BattleState,
  PlayerId,
  GamePhase,
  BattleStep,
  Deck,
} from './types'

export {
  MAX_CHARACTERS,
  DECK_SIZE,
  DON_DECK_SIZE,
  MAX_CARD_COPIES,
  STARTING_HAND_SIZE,
  DON_PER_TURN,
  DON_FIRST_TURN,
  DON_POWER_BONUS,
} from './constants'

export { createGame } from './gameSetup'
export { processAction } from './processor'
export { validateAction } from './rules'
export { getEffectivePower, getBattlePower } from './powerCalc'
export { autoAdvancePhases, getOpponent } from './turnManager'
export { resolveDamage } from './battleManager'
