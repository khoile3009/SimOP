import type { GameState, GameCard, Modifier, PlayerId } from './types'
import { DON_PER_TURN, DON_FIRST_TURN } from './constants'
import { deckOutWinner, getCardRules } from './rulesLayer'
import { hasFlag } from './effects/statics'
import { createGameCard } from './gameSetup'

function stripModifiers(card: GameCard, keep: (m: Modifier) => boolean): GameCard {
  if (card.modifiers.length === 0) return card
  const modifiers = card.modifiers.filter(keep)
  return modifiers.length === card.modifiers.length ? card : { ...card, modifiers }
}

/** Remove modifiers matching the predicate from every card on both fields. */
export function expireModifiers(state: GameState, expired: (m: Modifier) => boolean): GameState {
  const keep = (m: Modifier) => !expired(m)
  const players = { ...state.players }
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = players[pid]
    players[pid] = {
      ...p,
      leader: stripModifiers(p.leader, keep),
      characters: p.characters.map((c) => stripModifiers(c, keep)),
      stage: p.stage ? stripModifiers(p.stage, keep) : null,
      donArea: p.donArea.map((d) => stripModifiers(d, keep)),
    }
  }
  return { ...state, players }
}

function isFirstPlayerFirstTurn(state: GameState): boolean {
  return state.turnNumber === 1
}

/** Execute Refresh Phase: return given DON, then set all rested cards active */
export function executeRefresh(state: GameState): GameState {
  const playerId = state.currentPlayer

  // Skip refresh on very first turn of the game (turn 1)
  if (state.turnNumber === 1) {
    return { ...state, phase: 'DRAW' }
  }

  // "Until the start of your next turn" effects end here (CR 6-2-1)
  const expired = expireModifiers(
    state,
    (m) => m.duration === 'untilYourNextTurn' && m.expiresFor === playerId,
  )
  const player = expired.players[playerId]

  // Given DON returns to the cost area rested (CR 6-2-3), then everything is
  // set active (CR 6-2-4). Returning here rather than at End Phase keeps DON
  // attached through the opponent's turn, which [DON!! xN] [Opponent's Turn]
  // conditions depend on.
  const givenDon =
    player.leader.attachedDon + player.characters.reduce((s, c) => s + c.attachedDon, 0)
  const returned: GameCard[] = []
  for (let i = 0; i < givenDon; i++) {
    returned.push({ ...createGameCard('DON', playerId), isRested: true })
  }

  return {
    ...expired,
    phase: 'DRAW',
    players: {
      ...expired.players,
      [playerId]: {
        ...player,
        leader: {
          ...player.leader,
          isRested: hasFlag(expired, player.leader, 'noRefresh') ? player.leader.isRested : false,
          attachedDon: 0,
        },
        // 'noRefresh' (Doflamingo): flagged cards stay rested through this Refresh
        characters: player.characters.map((c) => ({
          ...c,
          isRested: hasFlag(expired, c, 'noRefresh') ? c.isRested : false,
          attachedDon: 0,
        })),
        // A 'noRefresh' flag modifier keeps a DON!! rested through this Refresh
        // (Bonney, Foxy); DON never carry auras, so modifiers alone decide
        donArea: [...player.donArea, ...returned].map((d) =>
          d.modifiers.some((m) => m.kind === 'flag' && m.flag === 'noRefresh')
            ? d
            : { ...d, isRested: false },
        ),
        stage: player.stage ? { ...player.stage, isRested: false } : null,
      },
    },
  }
}

/** Execute Draw Phase: draw 1 card */
export function executeDraw(state: GameState): GameState {
  const playerId = state.currentPlayer
  const player = state.players[playerId]

  // First player skips draw on turn 1
  if (isFirstPlayerFirstTurn(state)) {
    return { ...state, phase: 'DON' }
  }

  // Deck-out: drawing from an empty deck decides the game (usually a loss;
  // the rules layer can invert it - Nami's win condition). OP15 Brook defers
  // the loss to the End Phase: the draw simply whiffs.
  if (player.deck.length === 0) {
    if (getCardRules(player.leader.cardId)?.deckOutAtTurnEnd) {
      return { ...state, phase: 'DON' }
    }
    return { ...state, winner: deckOutWinner(player.leader.cardId, playerId) }
  }

  const newDeck = [...player.deck]
  const drawn = newDeck.shift()!
  const newHand = [...player.hand, drawn]

  return {
    ...state,
    phase: 'DON',
    players: {
      ...state.players,
      [playerId]: { ...player, deck: newDeck, hand: newHand },
    },
  }
}

/** Execute DON Phase: move DON from DON deck to cost area */
export function executeDon(state: GameState): GameState {
  const playerId = state.currentPlayer
  const player = state.players[playerId]

  const donCount = isFirstPlayerFirstTurn(state) ? DON_FIRST_TURN : DON_PER_TURN
  const available = Math.min(donCount, player.donDeck.length)

  const newDonDeck = [...player.donDeck]
  const moved = newDonDeck.splice(0, available)
  // Roger leader (OP13-003): one freshly placed DON!! attaches to the leader -
  // but only while any DON!! is already on the field
  const hadDonOnField =
    player.donArea.length > 0 ||
    player.leader.attachedDon > 0 ||
    player.characters.some((c) => c.attachedDon > 0)
  const attach = hadDonOnField
    ? Math.min(getCardRules(player.leader.cardId)?.donPhaseGivesLeaderDon ?? 0, moved.length)
    : 0
  const newDonArea = [...player.donArea, ...moved.slice(attach)]

  return {
    ...state,
    phase: 'MAIN',
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        donDeck: newDonDeck,
        donArea: newDonArea,
        leader: { ...player.leader, attachedDon: player.leader.attachedDon + attach },
      },
    },
  }
}

/** Execute End Phase: clear per-turn markers and expire turn-scoped modifiers.
 * DON is deliberately untouched: given DON stays attached and unspent cost-area
 * DON stays active through the opponent's turn (CR 6-2-3/6-2-4 handle both at
 * the owner's next Refresh) - that active DON is what pays [Counter] events on
 * defense. */
export function executeEndPhase(state: GameState): GameState {
  const playerId = state.currentPlayer
  const player = state.players[playerId]

  const newLeader = { ...player.leader, activatedThisTurn: [] }
  const newCharacters = player.characters.map((c) => ({ ...c, activatedThisTurn: [] }))
  const newStage = player.stage ? { ...player.stage, activatedThisTurn: [] } : null

  // An earned extra turn (Gear 5) keeps the same player; it is a full turn
  // with its own Refresh/Draw/DON phases
  const takesExtra = state.extraTurnFor === playerId
  const nextPlayer: PlayerId = takesExtra
    ? playerId
    : playerId === 'player1'
      ? 'player2'
      : 'player1'

  const switched: GameState = {
    ...state,
    phase: 'REFRESH',
    currentPlayer: nextPlayer,
    extraTurnFor: takesExtra ? null : state.extraTurnFor,
    turnNumber: state.turnNumber + 1,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        leader: newLeader,
        characters: newCharacters,
        stage: newStage,
      },
    },
  }

  // OP15 Brook: a player whose rules defer deck-out loses at the end of the
  // turn in which their deck is (still) empty - checked for BOTH players
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const pl = switched.players[pid]
    if (pl.deck.length === 0 && getCardRules(pl.leader.cardId)?.deckOutAtTurnEnd) {
      return { ...switched, winner: deckOutWinner(pl.leader.cardId, pid) }
    }
  }

  // "During this turn" effects on both fields end with the turn (CR 6-6-1-2).
  // Battle-duration mods are also swept as a safety net (a trigger can create one
  // outside any battle), and 'untilTurn' mods whose turn has passed expire here.
  return expireModifiers(
    switched,
    (m) =>
      m.duration === 'turn' ||
      m.duration === 'battle' ||
      (m.duration === 'untilTurn' && (m.untilTurn ?? 0) < switched.turnNumber),
  )
}

/** Auto-advance through non-interactive phases (Refresh → Draw → DON → MAIN) */
export function autoAdvancePhases(state: GameState): GameState {
  let current = state
  while (current.phase !== 'MAIN' && current.phase !== 'SETUP' && !current.winner) {
    switch (current.phase) {
      case 'REFRESH':
        current = executeRefresh(current)
        break
      case 'DRAW':
        current = executeDraw(current)
        break
      case 'DON':
        current = executeDon(current)
        break
      case 'END':
        current = executeEndPhase(current)
        break
      default:
        return current
    }
  }
  return current
}

export function getOpponent(playerId: PlayerId): PlayerId {
  return playerId === 'player1' ? 'player2' : 'player1'
}
