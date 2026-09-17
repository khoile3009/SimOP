import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP01 effect definitions as DSL data, keyed by card ID, transcribed from the
 * exact card texts in cards.json. Cards absent here are vanilla, keyword-only,
 * or listed in NOT_IMPLEMENTED below with the reason.
 *
 * Encoding conventions:
 * - "You may X: Y" optional costs = select (min 0) + abortIfEmpty + pay + Y.
 * - "DON!!-N" costs = all-or-nothing select over cost-area DON (exact) + returnDon.
 * - "(N)" activation costs on [Activate: Main] use EffectDef.cost (mandatory once
 *   the ability is activated); the same notation on other timings is an optional
 *   ops-encoded cost.
 */
export const OP01_EFFECTS: Record<string, EffectDef[]> = {
  // ── Red ────────────────────────────────────────────────────────────────────

  // Law leader: (2), once/turn: if 5 characters, return 1, then play a
  // different-colored cost<=5 character from hand
  'OP01-002': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restDon: 2 },
      condition: { minSelfCharacters: 5 },
      ops: [
        { op: 'select', bind: 'returned', filter: { owner: 'self', zone: 'characters' }, min: 1, max: 1, prompt: 'Return 1 of your Characters to hand' },
        { op: 'returnToHand', ref: 'returned' },
        { op: 'select', bind: 'played', filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 5, differentColorThanRef: 'returned' }, min: 0, max: 1, prompt: 'Play up to 1 Character of a different color' },
        { op: 'playCards', ref: 'played' },
      ],
    },
  ],

  // Luffy leader: (4), once/turn: set a Supernovas/Straw Hat cost<=5 char active, +1000
  'OP01-003': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restDon: 4 },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', rested: true, costAtMost: 5, typeIncludesAny: ['Supernovas', 'Straw Hat Crew'] }, min: 0, max: 1, prompt: 'Set up to 1 Character as active' },
        { op: 'setActive', ref: 't' },
        { op: 'powerMod', ref: 't', amount: 1000, duration: 'turn' },
      ],
    },
  ],

  // Uta: recover a red cost<=3 character from trash
  'OP01-005': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'trash', cardType: 'Character', colorIncludes: 'Red', costAtMost: 3, nameNot: 'Uta' }, min: 0, max: 1, prompt: 'Add up to 1 red Character from your trash to your hand' },
        { op: 'toHand', ref: 't' },
      ],
    },
  ],

  // Otama: -2000 to an opponent character this turn
  'OP01-006': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: "Give up to 1 of your opponent's Characters -2000 power" },
        { op: 'powerMod', ref: 't', amount: -2000, duration: 'turn' },
      ],
    },
  ],

  // Caribou: on K.O., K.O. an opponent character with 4000 power or less
  'OP01-007': [
    {
      timing: 'onKo',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 4000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 4000 power or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Cavendish: may take top life to hand to gain Rush this turn
  'OP01-008': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'life' }, min: 0, max: 1, prompt: 'You may add 1 Life card to your hand: gain [Rush]' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],

  'OP01-009': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],

  // Gordon: may bottom-deck a hand card to draw 1
  'OP01-011': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may place 1 card at the bottom of your deck: draw 1' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'bottomDeck', ref: 'pay' },
        { op: 'draw', count: 1 },
      ],
    },
  ],

  // Sanji: once/turn, take top life to hand for +2000 and up to 2 rested DON
  'OP01-013': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'life' }, min: 0, max: 1, prompt: 'You may add 1 Life card to your hand: +2000 and up to 2 rested DON!!' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'turn' },
        { op: 'giveRestedDon', upTo: 2 },
      ],
    },
  ],

  // Jinbe: [DON!! x1] on block, play a red cost<=2 character from hand
  'OP01-014': [
    {
      timing: 'onBlock',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand', cardType: 'Character', colorIncludes: 'Red', costAtMost: 2 }, min: 0, max: 1, prompt: 'Play up to 1 red Character with cost 2 or less' },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],

  // Chopper: when attacking, trash 1 from hand to recover a Straw Hat from trash
  'OP01-015': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'trash', cardType: 'Character', typeIncludes: 'Straw Hat Crew', costAtMost: 4, nameNot: 'Tony Tony.Chopper' }, min: 0, max: 1, prompt: 'Add up to 1 Straw Hat Crew Character from trash to hand' },
        { op: 'toHand', ref: 't' },
      ],
    },
  ],

  // Nami: search top 5 for a Straw Hat Crew card
  'OP01-016': [
    {
      timing: 'onPlay',
      ops: [{ op: 'searchTop', count: 5, filter: { typeIncludes: 'Straw Hat Crew', nameNot: 'Nami' }, upTo: 1, to: 'hand' }],
    },
  ],

  // Robin: when attacking, K.O. an opponent character with 3000 power or less
  'OP01-017': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 3000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 3000 power or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Hyogoro: rest self to give +2000 to a leader or character
  'OP01-020': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: 'Up to 1 of your Leader or Characters gains +2000 power' },
        { op: 'powerMod', ref: 't', amount: 2000, duration: 'turn' },
      ],
    },
  ],

  // Brook: when attacking, -2000 to up to 2 opponent characters
  'OP01-022': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 2, prompt: "Give up to 2 of your opponent's Characters -2000 power" },
        { op: 'powerMod', ref: 't', amount: -2000, duration: 'turn' },
      ],
    },
  ],

  // Luffy: once/turn, give self up to 2 rested DON (Strike protection: see NOT_IMPLEMENTED)
  'OP01-024': [
    { timing: 'activateMain', oncePerTurn: true, ops: [{ op: 'giveRestedDon', upTo: 2 }] },
  ],

  // Red Hawk
  'OP01-026': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+4000 power during this battle' },
        { op: 'powerMod', ref: 'b', amount: 4000, duration: 'battle' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 4000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 4000 power or less' },
        { op: 'ko', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: 'Give -10000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -10000, duration: 'turn' },
      ],
    },
  ],

  // Round Table
  'OP01-027': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give -10000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -10000, duration: 'turn' },
      ],
    },
  ],

  // Green Star Rafflesia
  'OP01-028': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: 'Give -2000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -2000, duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'counter' }] },
  ],

  // Radical Beam!!
  'OP01-029': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+2000 power during this battle' },
        { op: 'powerMod', ref: 't', amount: 2000, duration: 'battle' },
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
        { op: 'powerMod', ref: 't', amount: 2000, duration: 'battle' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+1000 power this turn' },
        { op: 'powerMod', ref: 't', amount: 1000, duration: 'turn' },
      ],
    },
  ],

  // In Two Years!!
  'OP01-030': [
    { timing: 'main', ops: [{ op: 'searchTop', count: 5, filter: { cardType: 'Character', typeIncludes: 'Straw Hat Crew' }, upTo: 1, to: 'hand' }] },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],

  // ── Green ──────────────────────────────────────────────────────────────────

  // Oden leader: once/turn, trash a Land of Wano card to ready 2 DON
  'OP01-031': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand', typeIncludes: 'Land of Wano' }, min: 0, max: 1, prompt: 'You can trash 1 {Land of Wano} card: set up to 2 DON!! active' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 'd', filter: { owner: 'self', zone: 'don', rested: true }, min: 0, max: 2, prompt: 'Set up to 2 DON!! as active' },
        { op: 'setActive', ref: 'd' },
      ],
    },
  ],

  // Izo
  'OP01-033': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 4 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // Dog Storm
  'OP01-034': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      ops: [
        { op: 'select', bind: 'd', filter: { owner: 'self', zone: 'don', rested: true }, min: 0, max: 1, prompt: 'Set up to 1 DON!! as active' },
        { op: 'setActive', ref: 'd' },
      ],
    },
  ],

  // Okiku
  'OP01-035': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      oncePerTurn: true,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 5 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  'OP01-037': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],

  // Kanjuro: attack-KO on rested cost<=2; on K.O. opponent picks a discard from your hand
  'OP01-038': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 2 }, min: 0, max: 1, prompt: 'K.O. up to 1 rested Character with cost 2 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
    {
      timing: 'onKo',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, chooser: 'opponent', prompt: 'Opponent chooses a card from your hand to trash' },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],

  // Killer
  'OP01-039': [
    { timing: 'onBlock', donRequired: 1, condition: { minSelfCharacters: 3 }, ops: [{ op: 'draw', count: 1 }] },
  ],

  // Kin'emon
  'OP01-040': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Kozuki Oden' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand', cardType: 'Character', typeIncludes: 'The Akazaya Nine', costAtMost: 3 }, min: 0, max: 1, prompt: 'Play up to 1 {The Akazaya Nine} Character with cost 3 or less' },
        { op: 'playCards', ref: 't' },
      ],
    },
    {
      timing: 'whenAttacking',
      donRequired: 1,
      oncePerTurn: true,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', rested: true, typeIncludes: 'The Akazaya Nine', costAtMost: 3 }, min: 0, max: 1, prompt: 'Set up to 1 {The Akazaya Nine} Character as active' },
        { op: 'setActive', ref: 't' },
      ],
    },
  ],

  // Momonosuke
  'OP01-041': [
    {
      timing: 'activateMain',
      cost: { restDon: 1, restSelf: true },
      ops: [{ op: 'searchTop', count: 5, filter: { typeIncludes: 'Land of Wano' }, upTo: 1, to: 'hand' }],
    },
  ],

  // Komurasaki: optional (3) to ready a Land of Wano character
  'OP01-042': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Kozuki Oden' },
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 3, exact: true, prompt: 'You may rest 3 DON!!' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', rested: true, typeIncludes: 'Land of Wano', costAtMost: 3 }, min: 0, max: 1, prompt: 'Set up to 1 {Land of Wano} Character as active' },
        { op: 'setActive', ref: 't' },
      ],
    },
  ],

  // Shachi / Penguin pair
  'OP01-044': [
    {
      timing: 'onPlay',
      condition: { lacksCharacterNamed: 'Penguin' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand', nameIs: 'Penguin' }, min: 0, max: 1, prompt: 'Play up to 1 [Penguin] from your hand' },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],
  'OP01-050': [
    {
      timing: 'onPlay',
      condition: { lacksCharacterNamed: 'Shachi' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand', nameIs: 'Shachi' }, min: 0, max: 1, prompt: 'Play up to 1 [Shachi] from your hand' },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],

  // Denjiro
  'OP01-046': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      condition: { leaderNameIs: 'Kozuki Oden' },
      ops: [
        { op: 'select', bind: 'd', filter: { owner: 'self', zone: 'don', rested: true }, min: 0, max: 2, prompt: 'Set up to 2 DON!! as active' },
        { op: 'setActive', ref: 'd' },
      ],
    },
  ],

  // Law: may bounce own character to play a cost<=3 from hand
  'OP01-047': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'characters' }, min: 0, max: 1, prompt: 'You may return 1 of your Characters to hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnToHand', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 3 }, min: 0, max: 1, prompt: 'Play up to 1 Character with cost 3 or less' },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],

  // Nekomamushi
  'OP01-048': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 3 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // Bepo
  'OP01-049': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand', cardType: 'Character', typeIncludes: 'Heart Pirates', nameNot: 'Bepo', costAtMost: 4 }, min: 0, max: 1, prompt: 'Play up to 1 {Heart Pirates} card with cost 4 or less' },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],

  // Kid: taunt while rested (static below) + once/turn rest-self play
  'OP01-051': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restSelf: true },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 3 }, min: 0, max: 1, prompt: 'Play up to 1 Character with cost 3 or less' },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],

  // Raizo
  'OP01-052': [
    { timing: 'whenAttacking', oncePerTurn: true, condition: { minSelfRestedCharacters: 2 }, ops: [{ op: 'draw', count: 1 }] },
  ],

  // X.Drake
  'OP01-054': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 4 }, min: 0, max: 1, prompt: 'K.O. up to 1 rested Character with cost 4 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // You Can Be My Samurai!!!
  'OP01-055': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'characters', rested: false }, min: 0, max: 2, exact: true, prompt: 'You may rest 2 of your Characters: draw 2' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'draw', count: 2 },
      ],
    },
  ],

  // Demon Face
  'OP01-056': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 5 }, min: 0, max: 2, prompt: 'K.O. up to 2 rested Characters with cost 5 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Paradise Waterfall
  'OP01-057': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+2000 power during this battle' },
        { op: 'powerMod', ref: 'b', amount: 2000, duration: 'battle' },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', rested: true }, min: 0, max: 1, prompt: 'Set up to 1 of your Characters as active' },
        { op: 'setActive', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 4 }, min: 0, max: 1, prompt: 'K.O. up to 1 rested Character with cost 4 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Punk Gibson
  'OP01-058': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+4000 power during this battle' },
        { op: 'powerMod', ref: 'b', amount: 4000, duration: 'battle' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 4 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Rest up to 1 Character' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // Beben!!
  'OP01-059': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand', typeIncludes: 'Land of Wano' }, min: 0, max: 1, prompt: 'You may trash 1 {Land of Wano} card' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', rested: true, typeIncludes: 'Land of Wano', costAtMost: 3 }, min: 0, max: 1, prompt: 'Set up to 1 {Land of Wano} Character as active' },
        { op: 'setActive', ref: 't' },
      ],
    },
  ],

  // ── Blue ───────────────────────────────────────────────────────────────────

  // Doflamingo leader: optional (1) to reveal top and maybe play a Warlord rested
  'OP01-060': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 1, exact: true, prompt: 'You may rest 1 DON!!' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'revealTopMayPlay', filter: { cardType: 'Character', typeIncludes: 'The Seven Warlords of the Sea', costAtMost: 4 }, rested: true },
      ],
    },
  ],

  // Alvida
  'OP01-064': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 3 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
      ],
    },
  ],

  // Caesar: on K.O., play a Smiley from deck
  'OP01-069': [
    { timing: 'onKo', ops: [{ op: 'searchDeckByName', name: 'Smiley', upTo: 1, to: 'play' }] },
  ],

  // Mihawk / Jinbe: bottom-deck opponent characters (rules allow any character;
  // own-side targets are never useful, so only the opponent's are offered)
  'OP01-070': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 7 }, min: 0, max: 1, prompt: 'Place up to 1 Character with cost 7 or less at the bottom of its owner deck' },
        { op: 'bottomDeckFromField', ref: 't' },
      ],
    },
  ],
  'OP01-071': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: 'Place up to 1 Character with cost 3 or less at the bottom of its owner deck' },
        { op: 'bottomDeckFromField', ref: 't' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],

  // Bartholomew Kuma: on K.O., play a Pacifista from hand
  'OP01-074': [
    {
      timing: 'onKo',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand', nameIs: 'Pacifista', costAtMost: 4 }, min: 0, max: 1, prompt: 'Play up to 1 [Pacifista] with cost 4 or less from your hand' },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],

  // Doflamingo / Perona: look at top 5, reorder (simplified: chosen subset to bottom)
  'OP01-073': [{ timing: 'onPlay', ops: [{ op: 'scryBottom', count: 5 }] }],
  'OP01-077': [{ timing: 'onPlay', ops: [{ op: 'scryBottom', count: 5 }] }],

  // Boa Hancock: dual timing draw
  'OP01-078': [
    { timing: 'whenAttacking', donRequired: 1, condition: { maxHandSelf: 5 }, ops: [{ op: 'draw', count: 1 }] },
    { timing: 'onBlock', donRequired: 1, condition: { maxHandSelf: 5 }, ops: [{ op: 'draw', count: 1 }] },
  ],

  // Ms. All Sunday
  'OP01-079': [
    {
      timing: 'onKo',
      condition: { leaderTypeIncludes: 'Baroque Works' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'trash', cardType: 'Event' }, min: 0, max: 1, prompt: 'Add up to 1 Event from your trash to your hand' },
        { op: 'toHand', ref: 't' },
      ],
    },
  ],

  'OP01-080': [{ timing: 'onKo', ops: [{ op: 'draw', count: 1 }] }],
  'OP01-082': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],

  // Bon Kurei
  'OP01-084': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [{ op: 'searchTop', count: 5, filter: { cardType: 'Event', typeIncludes: 'Baroque Works' }, upTo: 1, to: 'hand' }],
    },
  ],

  // Mr.3: attack lock until the end of the opponent's next turn
  'OP01-085': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Baroque Works' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: 'Select up to 1 Character: it cannot attack until the end of your opponent next turn' },
        { op: 'grantFlag', ref: 't', flag: 'cannotAttack', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],

  // Overheat
  'OP01-086': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+4000 power during this battle' },
        { op: 'powerMod', ref: 'b', amount: 4000, duration: 'battle' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 3 }, min: 0, max: 1, prompt: "Return up to 1 active Character with cost 3 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: "Return up to 1 card with cost 4 or less to its owner's hand" },
        { op: 'returnToHand', ref: 't' },
      ],
    },
  ],

  // Officer Agents
  'OP01-087': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand', cardType: 'Character', typeIncludes: 'Baroque Works', costAtMost: 3 }, min: 0, max: 1, prompt: 'Play up to 1 {Baroque Works} Character with cost 3 or less' },
        { op: 'playCards', ref: 't' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'counter' }] },
  ],

  // Desert Spada
  'OP01-088': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+2000 power during this battle' },
        { op: 'powerMod', ref: 'b', amount: 2000, duration: 'battle' },
        { op: 'scryBottom', count: 3 },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 2 },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Trash 1 card from your hand' },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],

  // Crescent Cutlass
  'OP01-089': [
    {
      timing: 'counter',
      condition: { leaderTypeIncludes: 'The Seven Warlords of the Sea' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 5 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
      ],
    },
  ],

  // Baroque Works
  'OP01-090': [
    { timing: 'main', ops: [{ op: 'searchTop', count: 5, filter: { typeIncludes: 'Baroque Works', nameNot: 'Baroque Works' }, upTo: 1, to: 'hand' }] },
  ],

  // ── Purple ─────────────────────────────────────────────────────────────────

  // Ulti
  'OP01-093': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 1, exact: true, prompt: 'You may rest 1 DON!!' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
  ],

  // Kaido: DON!!-6 board wipe
  'OP01-094': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Animal Kingdom Pirates' },
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 6, exact: true, prompt: 'You may return 6 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'koAll', owner: 'both', excludeSelf: true },
      ],
    },
  ],

  // Kyoshirou
  'OP01-095': [
    { timing: 'onPlay', condition: { minDonField: 8 }, ops: [{ op: 'draw', count: 1 }] },
  ],

  // King: DON!!-2 double KO
  'OP01-096': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 2, exact: true, prompt: 'You may return 2 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't1', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 3 or less' },
        { op: 'ko', ref: 't1' },
        { op: 'select', bind: 't2', filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 2 or less' },
        { op: 'ko', ref: 't2' },
      ],
    },
  ],

  // Queen: DON!!-1 for Rush + debuff
  'OP01-097': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -2000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -2000, duration: 'turn' },
      ],
    },
  ],

  // Orochi
  'OP01-098': [
    { timing: 'onPlay', ops: [{ op: 'searchDeckByName', name: 'Artificial Devil Fruit SMILE', upTo: 1, to: 'hand' }] },
  ],

  // Sasaki
  'OP01-101': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
  ],

  // Jack: DON!!-1 opponent discards
  'OP01-102': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'hand' }, min: 0, max: 1, chooser: 'opponent', prompt: 'Opponent trashes up to 1 card from their hand' },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],

  'OP01-104': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],

  // Basil Hawkins
  'OP01-106': [
    { timing: 'onPlay', ops: [{ op: 'addDon', count: 1, rested: true }] },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],

  // Kamazo: on K.O., DON!!-1 to K.O. a cost<=5
  'OP01-108': [
    {
      timing: 'onKo',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 5 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Black Maria
  'OP01-111': [
    {
      timing: 'onBlock',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'turn' },
      ],
    },
  ],

  // Page One: DON!!-1, may attack active characters this turn
  'OP01-112': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'grantFlag', ref: 'self', flag: 'canAttackActive', duration: 'turn' },
      ],
    },
  ],

  'OP01-113': [{ timing: 'onKo', ops: [{ op: 'addDon', count: 1, rested: true }] }],

  // X.Drake: DON!!-1 opponent discards
  'OP01-114': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'hand' }, min: 0, max: 1, chooser: 'opponent', prompt: 'Opponent trashes up to 1 card from their hand' },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],

  // Elephant Marchoo
  'OP01-115': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 2 or less' },
        { op: 'ko', ref: 't' },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],

  // Artificial Devil Fruit SMILE
  'OP01-116': [
    { timing: 'main', ops: [{ op: 'searchTop', count: 5, filter: { cardType: 'Character', typeIncludes: 'SMILE', costAtMost: 3 }, upTo: 1, to: 'play' }] },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],

  // Sheep's Horn
  'OP01-117': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 6 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // Ulti-Mortar
  'OP01-118': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 2, exact: true, prompt: 'You may return 2 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+2000 power during this battle' },
        { op: 'powerMod', ref: 'b', amount: 2000, duration: 'battle' },
        { op: 'draw', count: 1 },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],

  // Thunder Bagua
  'OP01-119': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+4000 power during this battle' },
        { op: 'powerMod', ref: 'b', amount: 4000, duration: 'battle' },
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],

  // Shanks: blocker lock while attacking
  'OP01-120': [
    {
      timing: 'whenAttacking',
      ops: [{ op: 'grantFlag', ref: 'self', flag: 'noBlockPowerAtMost', value: 2000, duration: 'battle' }],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP01_STATICS: Record<string, StaticDef[]> = {
  // Zoro leader: [DON!! x1] [Your Turn] all your characters +1000
  'OP01-001': [
    { donRequired: 1, condition: { yourTurn: true }, target: { scope: 'myCharacters' }, power: 1000 },
  ],
  // Bartolomeo: [DON!! x2] [Opponent's Turn] +3000
  'OP01-019': [
    { donRequired: 2, condition: { opponentsTurn: true }, target: { scope: 'self' }, power: 3000 },
  ],
  // Franky: [DON!! x1] may attack active characters
  'OP01-021': [{ donRequired: 1, target: { scope: 'self' }, flag: 'canAttackActive' }],
  // Ashura Doji: [DON!! x1] +2000 while opponent has 2+ rested characters
  'OP01-032': [
    { donRequired: 1, condition: { minOppRestedCharacters: 2 }, target: { scope: 'self' }, power: 2000 },
  ],
  // Kid: taunt while rested on the opponent's turn
  'OP01-051': [
    { donRequired: 1, condition: { opponentsTurn: true, selfRested: true }, target: { scope: 'self' }, flag: 'taunt' },
  ],
  // Moria: Double Attack with a big hand on your turn
  'OP01-068': [
    { condition: { yourTurn: true, minHandSelf: 5 }, target: { scope: 'self' }, keyword: 'Double Attack' },
  ],
  // Smiley: +1000 per card in hand on your turn
  'OP01-072': [
    { donRequired: 1, condition: { yourTurn: true }, target: { scope: 'self' }, powerPer: { handCards: true, amount: 1000 } },
  ],
  // Mr.1: +1000 per 2 Events in trash (Baroque Works leader)
  'OP01-083': [
    { donRequired: 1, condition: { yourTurn: true, leaderTypeIncludes: 'Baroque Works' }, target: { scope: 'self' }, powerPer: { trashEventsPer2: true, amount: 1000 } },
  ],
  // King leader: opponent characters -1000 at 10 DON
  'OP01-091': [
    { condition: { yourTurn: true, minDonField: 10 }, target: { scope: 'oppCharacters' }, power: -1000 },
  ],
  // Semimaru: other Kurozumi Clan characters can't be K.O.'d in battle
  'OP01-099': [
    { target: { scope: 'myCharactersOther', typeIncludes: 'Kurozumi Clan', nameNot: 'Kurozumi Semimaru' }, flag: 'noBattleKo' },
  ],
  // Who's.Who: +1000 at 8+ DON on your turn
  'OP01-109': [
    { donRequired: 1, condition: { yourTurn: true, minDonField: 8 }, target: { scope: 'self' }, power: 1000 },
  ],
}

/**
 * Cards whose printed text is fully handled by the keyword parser alone
 * (engine/keywords.ts) - no effect defs or statics needed.
 */
export const KEYWORD_ONLY: string[] = ['OP01-025', 'OP01-100']

/**
 * The coverage ledger for the ingestion pipeline: every card whose text is not
 * (or not fully) automated, with the engine machinery that blocks it. The
 * coverage test enforces that any card with effect/trigger text appears in
 * OP01_EFFECTS, OP01_STATICS, KEYWORD_ONLY, or here - so nothing silently
 * falls through as sets are ingested.
 *
 * Prefix meanings: MISSING = no automation at all; PARTIAL = works with the
 * named clause inert; SIMPLIFIED = automated with a documented deviation.
 */
export const COVERAGE_NOTES: Record<string, string> = {
  'OP01-004':
    'MISSING: "Draw 1 when your opponent activates an Event" - event-driven trigger needs the Phase B event pipeline',
  'OP01-061':
    'MISSING: "when your opponent\'s Character is K.O.\'d, add 1 DON" - event-driven trigger needs the Phase B event pipeline',
  'OP01-062':
    'MISSING: "when you activate an Event, you may draw" - event-driven trigger needs the Phase B event pipeline (plus a per-turn leader-effect flag)',
  'OP01-063':
    'MISSING: peek at opponent hand card, gate on its card type, move Life to deck bottom - needs revealed-hand state and a life-to-deck op',
  'OP01-105':
    'MISSING: "opponent reveals 2 hand cards" - pure reveal has no effect without revealed-hand state',
  'OP01-067':
    'PARTIAL: [Banish] works; "blue Events in your hand -1 cost" needs cost modifiers applied to cards in hand',
  'OP01-024':
    'PARTIAL: the activated ability works; "cannot be K.O.\'d in battle by <Strike>" needs battle-attribute data, which cards.json does not carry (its attribute field holds the type list)',
  'OP01-075':
    'PARTIAL: [Blocker] works; "any number of this card in your deck" needs the rules-layer deck validator',
  'OP01-121':
    'PARTIAL: [Double Attack]/[Banish] work; "also treat this card\'s name as [Kozuki Oden]" needs names-as-sets identity in the rules layer',
  'OP01-073': 'SIMPLIFIED: "top or bottom in any order" implemented as choose-a-subset-for-bottom (order preserved)',
  'OP01-077': 'SIMPLIFIED: "top or bottom in any order" implemented as choose-a-subset-for-bottom (order preserved)',
  'OP01-088': 'SIMPLIFIED: counter half reorders via choose-a-subset-for-bottom (order preserved)',
  'OP01-070': 'SIMPLIFIED: "up to 1 Character" may target either side per rules; only opponent targets are offered',
  'OP01-071': 'SIMPLIFIED: "up to 1 Character" may target either side per rules; only opponent targets are offered',
  'OP01-086': 'SIMPLIFIED: bounce targets restricted to opponent side (rules allow either)',
}
