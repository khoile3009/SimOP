import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP02 effect definitions as DSL data, keyed by card ID, transcribed from the
 * exact card texts in cards.json. Cards absent here are vanilla, keyword-only,
 * rules-layer entries (engine/rulesLayer.ts), or listed in COVERAGE_NOTES
 * below with the reason. Encoding conventions match op01/effects.ts.
 */
export const OP02_EFFECTS: Record<string, EffectDef[]> = {
  // ── Red ────────────────────────────────────────────────────────────────────

  // Whitebeard leader: end of your turn, take your top life into hand
  'OP02-001': [{ timing: 'endOfTurn', ops: [{ op: 'lifeTopToHand', count: 1 }] }],

  // Garp leader: whenever you give DON on your turn, -1 cost to an opponent character
  'OP02-002': [
    {
      timing: 'onEvent',
      on: { kind: 'donAttached', who: 'self' },
      condition: { yourTurn: true },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 7 }, min: 0, max: 1, prompt: "Give up to 1 of your opponent's Characters -1 cost this turn" },
        { op: 'costMod', ref: 't', amount: -1, duration: 'turn' },
      ],
    },
  ],

  // Whitebeard: leader +2000 until your next turn, but no life-to-hand this turn
  'OP02-004': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader' }, min: 0, max: 1, prompt: 'Up to 1 of your Leader gains +2000 until the start of your next turn' },
        { op: 'powerMod', ref: 'l', amount: 2000, duration: 'untilYourNextTurn' },
        { op: 'restrictSelf', restriction: 'noLifeToHand' },
      ],
    },
    {
      timing: 'whenAttacking',
      donRequired: 2,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 3000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 3000 power or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Curly.Dadan
  'OP02-005': [
    { timing: 'onPlay', ops: [{ op: 'searchTop', count: 5, filter: { cardType: 'Character', colorIncludes: 'Red', costIs: 1 }, upTo: 1, to: 'hand' }] },
  ],

  // Squard
  'OP02-009': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Whitebeard Pirates' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -4000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -4000, duration: 'turn' },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],

  // Dogura
  'OP02-010': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', colorIncludes: 'Red', costIs: 1, nameNot: 'Dogura' }, min: 0, max: 1, prompt: 'Play up to 1 red cost-1 Character other than Dogura' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Vista
  'OP02-011': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 3000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 3000 power or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Ace: -3000 to two, then Rush with a Whitebeard leader
  'OP02-013': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 2, prompt: 'Give up to 2 Characters -3000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -3000, duration: 'turn' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Whitebeard Pirates' } },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],

  // Makino
  'OP02-015': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', colorIncludes: 'Red', costIs: 1 }, min: 0, max: 1, prompt: 'Up to 1 of your red cost-1 Characters gains +3000 this turn' },
        { op: 'powerMod', ref: 't', amount: 3000, duration: 'turn' },
      ],
    },
  ],

  // Magura
  'OP02-016': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', colorIncludes: 'Red', costIs: 1 }, min: 0, max: 1, prompt: 'Up to 1 of your red cost-1 Characters gains +3000 this turn' },
        { op: 'powerMod', ref: 't', amount: 3000, duration: 'turn' },
      ],
    },
  ],

  // Masked Deuce
  'OP02-017': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 2000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 2000 power or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Marco: on K.O., trash a Whitebeard card to come back rested at low life
  'OP02-018': [
    {
      timing: 'onKo',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand', typeIncludes: 'Whitebeard Pirates' }, min: 0, max: 1, prompt: 'You may trash 1 {Whitebeard Pirates} card to play Marco from the trash rested' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
        { op: 'playSelf', rested: true },
      ],
    },
  ],

  // Seaquake
  'OP02-021': [
    {
      timing: 'main',
      condition: { leaderTypeIncludes: 'Whitebeard Pirates' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 3000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 3000 power or less' },
        { op: 'ko', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: 'Give up to 1 Leader or Character -3000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -3000, duration: 'turn' },
      ],
    },
  ],

  // Whitebeard Pirates (event)
  'OP02-022': [
    { timing: 'main', ops: [{ op: 'searchTop', count: 5, filter: { cardType: 'Character', typeIncludes: 'Whitebeard Pirates' }, upTo: 1, to: 'hand' }] },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],

  // You May Be a Fool...but I Still Love You
  'OP02-023': [
    {
      timing: 'main',
      condition: { maxLifeSelf: 3 },
      ops: [{ op: 'restrictSelf', restriction: 'noLifeToHand' }],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader' }, min: 0, max: 1, prompt: 'Up to 1 of your Leader gains +1000 this turn' },
        { op: 'powerMod', ref: 'l', amount: 1000, duration: 'turn' },
      ],
    },
  ],

  // Moby Dick (stage): aura lives in OP02_STATICS
  'OP02-024': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],

  // ── Green ──────────────────────────────────────────────────────────────────

  // Kin'emon leader: one-shot discount on a Land of Wano character
  'OP02-025': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { maxSelfCharacters: 1 },
      ops: [{ op: 'grantPlayDiscount', amount: 1, cardType: 'Character', typeIncludes: 'Land of Wano', minCost: 3 }],
    },
  ],

  // Sanji leader: playing a vanilla character readies up to 2 DON
  'OP02-026': [
    {
      timing: 'onEvent',
      on: { kind: 'characterPlayed', who: 'self', fromHand: true, noBaseEffect: true },
      oncePerTurn: true,
      condition: { maxSelfCharacters: 3 },
      ops: [
        { op: 'select', bind: 'd', filter: { owner: 'self', zone: 'don', rested: true }, min: 0, max: 2, prompt: 'Set up to 2 DON!! as active' },
        { op: 'setActive', ref: 'd' },
      ],
    },
  ],

  // Carrot
  'OP02-029': [
    {
      timing: 'endOfTurn',
      ops: [
        { op: 'select', bind: 'd', filter: { owner: 'self', zone: 'don', rested: true }, min: 0, max: 1, prompt: 'Set up to 1 DON!! as active' },
        { op: 'setActive', ref: 'd' },
      ],
    },
  ],

  // Kouzuki Oden
  'OP02-030': [
    { timing: 'activateMain', oncePerTurn: true, cost: { restDon: 3 }, ops: [{ op: 'setActive', ref: 'self' }] },
    {
      timing: 'onKo',
      ops: [{ op: 'searchDeck', filter: { cardType: 'Character', colorIncludes: 'Green', typeIncludes: 'Land of Wano', costIs: 3 }, upTo: 1, to: 'play' }],
    },
  ],

  // Shishilian
  'OP02-032': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 2, exact: true, prompt: 'You may rest 2 DON!!' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', typeIncludes: 'Minks', costAtMost: 5 }, min: 0, max: 1, prompt: 'Set up to 1 {Minks} Character with cost 5 or less as active' },
        { op: 'setActive', ref: 't' },
      ],
    },
  ],

  // Chopper
  'OP02-034': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 2, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 2 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // Law: bounce himself into a cost-3 play
  'OP02-035': [
    {
      timing: 'activateMain',
      cost: { restDon: 1 },
      ops: [
        { op: 'returnToHand', ref: 'self' },
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', costIs: 3 }, min: 0, max: 1, prompt: 'Play up to 1 Character with a cost of 3' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Nami (FILM searcher on both timings)
  'OP02-036': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 1, exact: true, prompt: 'You may rest 1 DON!!' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'searchTop', count: 3, filter: { typeIncludes: 'FILM', nameNot: 'Nami' }, upTo: 1, to: 'hand' },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 1, exact: true, prompt: 'You may rest 1 DON!!' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'searchTop', count: 3, filter: { typeIncludes: 'FILM', nameNot: 'Nami' }, upTo: 1, to: 'hand' },
      ],
    },
  ],

  // Nico Robin
  'OP02-037': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', typeIncludesAny: ['FILM', 'Straw Hat Crew'], costAtMost: 2 }, min: 0, max: 1, prompt: 'Play up to 1 {FILM} or {Straw Hat Crew} Character with cost 2 or less' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Brook
  'OP02-040': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', typeIncludesAny: ['FILM', 'Straw Hat Crew'], costAtMost: 3 }, min: 0, max: 1, prompt: 'Play up to 1 {FILM} or {Straw Hat Crew} Character with cost 3 or less' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Luffy
  'OP02-041': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', typeIncludesAny: ['FILM', 'Straw Hat Crew'], costAtMost: 4 }, min: 0, max: 1, prompt: 'Play up to 1 {FILM} or {Straw Hat Crew} Character with cost 4 or less' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Yamato (name-as-Oden lives in the rules layer)
  'OP02-042': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 6, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 6 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // Wanda
  'OP02-044': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', typeIncludes: 'Minks', nameNot: 'Wanda', costAtMost: 3 }, min: 0, max: 1, prompt: 'Play up to 1 {Minks} Character other than Wanda with cost 3 or less' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Three Sword Style Oni Giri
  'OP02-045': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+6000 power during this battle' },
        { op: 'powerMod', ref: 'b', amount: 6000, duration: 'battle' },
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 3, noBaseEffect: true }, min: 0, max: 1, prompt: 'Play up to 1 Character with cost 3 or less and no base effect' },
        { op: 'playCards', ref: 'p' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'leaderOrCharacters', costAtMost: 5, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Leader or Character with cost 5 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // Diable Jambe Venaison Shoot
  'OP02-046': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 4 }, min: 0, max: 1, prompt: 'K.O. up to 1 rested Character with cost 4 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 4, noBaseEffect: true }, min: 0, max: 1, prompt: 'Play up to 1 Character with cost 4 or less and no base effect' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Paradise Totsuka
  'OP02-047': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 4 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 3 }, min: 0, max: 1, prompt: 'K.O. up to 1 rested Character with cost 3 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Land of Wano (stage)
  'OP02-048': [
    {
      timing: 'activateMain',
      condition: { minHandSelf: 1 },
      cost: { restSelf: true },
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand', typeIncludes: 'Land of Wano' }, min: 1, max: 1, prompt: 'Trash 1 {Land of Wano} card' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 'd', filter: { owner: 'self', zone: 'don', rested: true }, min: 0, max: 1, prompt: 'Set up to 1 DON!! as active' },
        { op: 'setActive', ref: 'd' },
      ],
    },
  ],

  // ── Blue ───────────────────────────────────────────────────────────────────

  // Ivankov leader
  'OP02-049': [
    { timing: 'endOfTurn', condition: { maxHandSelf: 0, minDeckSelf: 1 }, ops: [{ op: 'draw', count: 2 }] },
  ],

  // Ivankov: draw to 3, then a free Impel Down play
  'OP02-051': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'drawTo', count: 3 },
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', colorIncludes: 'Blue', typeIncludes: 'Impel Down', costAtMost: 6 }, min: 0, max: 1, prompt: 'Play up to 1 blue {Impel Down} Character with cost 6 or less' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Cabaji
  'OP02-052': [
    {
      timing: 'onPlay',
      condition: { hasCharacterNamed: 'Mohji' },
      ops: [
        { op: 'draw', count: 2 },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Trash 1 card from your hand' },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],

  // Doflamingo
  'OP02-056': [
    { timing: 'onPlay', ops: [{ op: 'scryBottom', count: 3 }] },
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 }, min: 0, max: 1, prompt: "Place up to 1 Character with cost 1 or less at the bottom of the owner's deck" },
        { op: 'bottomDeckFromField', ref: 't' },
      ],
    },
  ],

  // Kuma
  'OP02-057': [
    { timing: 'onPlay', ops: [{ op: 'searchTop', count: 2, filter: { typeIncludes: 'The Seven Warlords of the Sea' }, upTo: 1, to: 'hand' }] },
  ],

  // Buggy
  'OP02-058': [
    { timing: 'onPlay', ops: [{ op: 'searchTop', count: 5, filter: { colorIncludes: 'Blue', typeIncludes: 'Impel Down', nameNot: 'Buggy' }, upTo: 1, to: 'hand' }] },
  ],

  // Boa Hancock
  'OP02-059': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'draw', count: 1 },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Trash 1 card from your hand' },
        { op: 'trashCards', ref: 't' },
        { op: 'select', bind: 'more', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 3, prompt: 'Trash up to 3 more cards from your hand' },
        { op: 'trashCards', ref: 'more' },
      ],
    },
  ],

  // Morley: cost-based blocker lock while hand is small
  'OP02-061': [
    {
      timing: 'whenAttacking',
      condition: { maxHandSelf: 1 },
      ops: [{ op: 'grantFlag', ref: 'self', flag: 'noBlockCostAtMost', value: 5, duration: 'battle' }],
    },
  ],

  // Luffy: trash 2 to bounce and gain Double Attack
  'OP02-062': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 2, exact: true, prompt: 'You may trash 2 cards from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 4 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Double Attack', duration: 'turn' },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 2, exact: true, prompt: 'You may trash 2 cards from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 4 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Double Attack', duration: 'turn' },
      ],
    },
  ],

  // Mr.1
  'OP02-063': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'trash', cardType: 'Event', colorIncludes: 'Blue', costIs: 1 }, min: 0, max: 1, prompt: 'Add up to 1 blue cost-1 Event from your trash to your hand' },
        { op: 'toHand', ref: 't' },
      ],
    },
  ],

  // Mr.2: bottom-decks the target, then himself at battle end
  'OP02-064': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 }, min: 0, max: 1, prompt: "Place up to 1 Character with cost 2 or less at the bottom of the owner's deck" },
        { op: 'bottomDeckFromField', ref: 't' },
        { op: 'grantFlag', ref: 'self', flag: 'bottomDeckAtBattleEnd', duration: 'battle' },
      ],
    },
  ],

  // Mr.3
  'OP02-065': [
    {
      timing: 'endOfTurn',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card to set Mr.3 as active' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'setActive', ref: 'self' },
      ],
    },
  ],

  // Impel Down All Stars
  'OP02-066': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 2, exact: true, prompt: 'You may trash 2 cards from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Impel Down' } },
        { op: 'draw', count: 2 },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 2 }] },
  ],

  // Arabesque Brick Fist
  'OP02-067': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 4 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],

  // Gum-Gum Rain
  'OP02-068': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+3000 power during this battle' },
        { op: 'powerMod', ref: 'b', amount: 3000, duration: 'battle' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 2 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
      ],
    },
  ],

  // DEATH WINK
  'OP02-069': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+6000 power during this battle' },
        { op: 'powerMod', ref: 'b', amount: 6000, duration: 'battle' },
        { op: 'drawTo', count: 2 },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 7 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 7 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
      ],
    },
  ],

  // New Kama Land (stage)
  'OP02-070': [
    {
      timing: 'activateMain',
      condition: { leaderNameIs: 'Emporio.Ivankov' },
      cost: { restSelf: true },
      ops: [
        { op: 'draw', count: 1 },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Trash 1 card from your hand' },
        { op: 'trashCards', ref: 't' },
        { op: 'select', bind: 'more', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 3, prompt: 'Trash up to 3 more cards from your hand' },
        { op: 'trashCards', ref: 'more' },
      ],
    },
  ],

  // ── Purple ─────────────────────────────────────────────────────────────────

  // Magellan leader: DON returning to the deck feeds his power
  'OP02-071': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      oncePerTurn: true,
      condition: { yourTurn: true },
      ops: [{ op: 'powerMod', ref: 'self', amount: 1000, duration: 'turn' }],
    },
  ],

  // Zephyr leader: DON!!-4 for a K.O. and +1000
  'OP02-072': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 4, exact: true, prompt: 'You may return 4 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 3 or less' },
        { op: 'ko', ref: 't' },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'turn' },
      ],
    },
  ],

  // Little Sadi
  'OP02-073': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', typeIncludes: 'Jailer Beast' }, min: 0, max: 1, prompt: 'Play up to 1 {Jailer Beast} Character from your hand' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Shiki
  'OP02-075': [
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'playSelf' },
      ],
    },
  ],

  // Shiryu
  'OP02-076': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 1 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Daifugo
  'OP02-078': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 2, exact: true, prompt: 'You may return 2 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', typeIncludes: 'SMILE', nameNot: 'Daifugo', costAtMost: 3 }, min: 0, max: 1, prompt: 'Play up to 1 {SMILE} Character other than Daifugo with cost 3 or less' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Douglas Bullet
  'OP02-079': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 4 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // Byrnndi World: DON!!-8 is the activation cost, paid up front
  'OP02-082': [
    {
      timing: 'activateMain',
      cost: { returnDon: 8 },
      ops: [{ op: 'powerMod', ref: 'self', amount: 792000, duration: 'turn' }],
    },
  ],

  // Hannyabal
  'OP02-083': [
    { timing: 'onPlay', ops: [{ op: 'searchTop', count: 5, filter: { colorIncludes: 'Purple', typeIncludes: 'Impel Down', nameNot: 'Hannyabal' }, upTo: 1, to: 'hand' }] },
  ],

  // Magellan: drains DON coming and going
  'OP02-085': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'oppReturnDon', count: 1 },
      ],
    },
    { timing: 'onKo', condition: { opponentsTurn: true }, ops: [{ op: 'oppReturnDon', count: 2 }] },
  ],

  // Minokoala
  'OP02-086': [
    { timing: 'onKo', condition: { leaderTypeIncludes: 'Impel Down' }, ops: [{ op: 'addDon', count: 1, rested: true }] },
  ],

  // Minotaur
  'OP02-087': [
    { timing: 'onKo', condition: { leaderTypeIncludes: 'Impel Down' }, ops: [{ op: 'addDon', count: 1, rested: true }] },
  ],

  // Judgment of Hell
  'OP02-089': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'leaderOrCharacters' }, min: 0, max: 2, prompt: 'Give up to 2 Leader or Characters -3000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -3000, duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'requireCond', cond: { minDonFieldOpp: 6 } },
        { op: 'oppReturnDon', count: 1 },
      ],
    },
  ],

  // Hydra
  'OP02-090': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -3000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -3000, duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'requireCond', cond: { minDonFieldOpp: 6 } },
        { op: 'oppReturnDon', count: 1 },
      ],
    },
  ],

  // Venom Road
  'OP02-091': [
    { timing: 'main', ops: [{ op: 'addDon', count: 1, rested: false }] },
    {
      timing: 'trigger',
      ops: [
        { op: 'requireCond', cond: { minDonFieldOpp: 6 } },
        { op: 'oppReturnDon', count: 1 },
      ],
    },
  ],

  // Impel Down (stage)
  'OP02-092': [
    {
      timing: 'activateMain',
      condition: { minHandSelf: 1 },
      cost: { restSelf: true },
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'searchTop', count: 3, filter: { typeIncludes: 'Impel Down' }, upTo: 1, to: 'hand' },
      ],
    },
  ],

  // Uta
  'OP02-120': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 2, exact: true, prompt: 'You may return 2 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'powerModAll', amount: 1000, duration: 'untilYourNextTurn', includeLeader: true },
      ],
    },
  ],

  // ── Black ──────────────────────────────────────────────────────────────────

  // Smoker leader
  'OP02-093': [
    {
      timing: 'activateMain',
      donRequired: 1,
      oncePerTurn: true,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -1 cost this turn' },
        { op: 'costMod', ref: 't', amount: -1, duration: 'turn' },
        { op: 'requireCond', cond: { anyCharacterCostAtMost: 0 } },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'turn' },
      ],
    },
  ],

  // Isuka: battle K.O.s stand her back up
  'OP02-094': [
    { timing: 'afterBattleKo', donRequired: 1, oncePerTurn: true, ops: [{ op: 'setActive', ref: 'self' }] },
  ],

  // Kuzan
  'OP02-096': [
    { timing: 'onPlay', ops: [{ op: 'draw', count: 1 }] },
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -4 cost this turn' },
        { op: 'costMod', ref: 't', amount: -4, duration: 'turn' },
      ],
    },
  ],

  // Koby
  'OP02-098': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 3 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Sakazuki
  'OP02-099': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 5 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Strawberry
  'OP02-101': [
    {
      timing: 'whenAttacking',
      condition: { anyCharacterCostAtMost: 0 },
      ops: [{ op: 'grantFlag', ref: 'self', flag: 'noBlockCostAtMost', value: 5, duration: 'battle' }],
    },
  ],

  // Smoker: effect-proof; +2000 into cost-0 boards (static half in OP02_STATICS)
  'OP02-102': [
    {
      timing: 'whenAttacking',
      condition: { anyCharacterCostAtMost: 0 },
      ops: [{ op: 'powerMod', ref: 'self', amount: 2000, duration: 'battle' }],
    },
  ],

  // Sengoku
  'OP02-103': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -2 cost this turn' },
        { op: 'costMod', ref: 't', amount: -2, duration: 'turn' },
      ],
    },
  ],

  'OP02-104': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],

  // Tashigi
  'OP02-105': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -3 cost this turn' },
        { op: 'costMod', ref: 't', amount: -3, duration: 'turn' },
      ],
    },
  ],

  // Tsuru
  'OP02-106': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -2 cost this turn' },
        { op: 'costMod', ref: 't', amount: -2, duration: 'turn' },
      ],
    },
  ],

  // Hina: blocking cages the attacker
  'OP02-110': [
    {
      timing: 'onBlock',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 }, min: 0, max: 1, prompt: 'Up to 1 Character with cost 6 or less cannot attack this turn' },
        { op: 'grantFlag', ref: 't', flag: 'cannotAttack', duration: 'turn' },
      ],
    },
  ],

  // Fullbody
  'OP02-111': [
    {
      timing: 'whenAttacking',
      condition: { hasCharacterNamed: 'Jango' },
      ops: [{ op: 'powerMod', ref: 'self', amount: 3000, duration: 'battle' }],
    },
  ],

  // Bell-mere
  'OP02-112': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -1 cost this turn' },
        { op: 'costMod', ref: 't', amount: -1, duration: 'turn' },
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: 'Up to 1 Leader or Character gains +1000 this turn' },
        { op: 'powerMod', ref: 'b', amount: 1000, duration: 'turn' },
      ],
    },
  ],

  // Helmeppo
  'OP02-113': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -2 cost this turn' },
        { op: 'costMod', ref: 't', amount: -2, duration: 'turn' },
        { op: 'requireCond', cond: { anyCharacterCostAtMost: 0 } },
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'battle' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],

  // Garp
  'OP02-115': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 0 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with a cost of 0' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Ice Age
  'OP02-117': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -5 cost this turn' },
        { op: 'costMod', ref: 't', amount: -5, duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 3 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Yasakani Sacred Jewel
  'OP02-118': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters' }, min: 0, max: 1, prompt: "Up to 1 of your Characters cannot be K.O.'d during this battle" },
        { op: 'grantFlag', ref: 't', flag: 'noBattleKo', duration: 'battle' },
        { op: 'grantFlag', ref: 't', flag: 'noEffectKo', duration: 'battle' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'stage', costAtMost: 3 }, min: 0, max: 1, prompt: 'K.O. up to 1 Stage with cost 3 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Meteor Volcano
  'OP02-119': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 1 or less' },
        { op: 'ko', ref: 't' },
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

  // Kuzan: the -5 aura lives in OP02_STATICS
  'OP02-121': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 0 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with a cost of 0' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP02_STATICS: Record<string, StaticDef[]> = {
  // Jozu: Rush at low life under a Whitebeard leader
  'OP02-008': [
    { donRequired: 1, condition: { maxLifeSelf: 2, leaderTypeIncludes: 'Whitebeard Pirates' }, target: { scope: 'self' }, keyword: 'Rush' },
  ],
  // Whitey Bay
  'OP02-014': [{ donRequired: 1, target: { scope: 'self' }, flag: 'canAttackActive' }],
  // Rakuyo
  'OP02-019': [
    { donRequired: 1, condition: { yourTurn: true }, target: { scope: 'myCharacters', typeIncludes: 'Whitebeard Pirates' }, power: 1000 },
  ],
  // Moby Dick: Whitebeard leader and WB characters +2000 at 1 life
  'OP02-024': [
    { condition: { yourTurn: true, maxLifeSelf: 1 }, target: { scope: 'myLeader', nameIs: 'Edward.Newgate' }, power: 2000 },
    { condition: { yourTurn: true, maxLifeSelf: 1 }, target: { scope: 'myCharacters', typeIncludes: 'Whitebeard Pirates' }, power: 2000 },
  ],
  // Inuarashi: untouchable while all DON are rested
  'OP02-027': [
    { condition: { allSelfDonRested: true }, target: { scope: 'self' }, flag: 'noOppEffectRemove' },
  ],
  // Toki: Blocker while you have an Oden
  'OP02-031': [
    { condition: { hasCharacterNamed: 'Kouzuki Oden' }, target: { scope: 'self' }, keyword: 'Blocker' },
  ],
  // Inazuma
  'OP02-050': [{ condition: { maxHandSelf: 1 }, target: { scope: 'self' }, power: 2000 }],
  // Saldeath: your Blugori block
  'OP02-074': [{ target: { scope: 'myCharacters', nameIs: 'Blugori' }, keyword: 'Blocker' }],
  // Onigumo: Banish into cost-0 boards
  'OP02-095': [
    { condition: { anyCharacterCostAtMost: 0 }, target: { scope: 'self' }, keyword: 'Banish' },
  ],
  // Jango: unkillable in battle with Fullbody around
  'OP02-100': [
    { condition: { hasCharacterNamed: 'Fullbody' }, target: { scope: 'self' }, flag: 'noBattleKo' },
  ],
  // Smoker: effect-proof
  'OP02-102': [{ target: { scope: 'self' }, flag: 'noEffectKo' }],
  // Borsalino: sturdier on their turn
  'OP02-114': [
    { condition: { opponentsTurn: true }, target: { scope: 'self' }, power: 1000, flag: 'noEffectKo' },
  ],
  // Kuzan: everything the opponent has costs 5 less
  'OP02-121': [
    { condition: { yourTurn: true }, target: { scope: 'oppCharacters' }, costMod: -5 },
  ],
}

/**
 * Cards whose printed text is fully handled by the keyword parser
 * (engine/keywords.ts) and/or the rules-layer registry (engine/rulesLayer.ts).
 */
export const KEYWORD_ONLY_OP02: string[] = ['OP02-012', 'OP02-038', 'OP02-081', 'OP02-108']

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP02: Record<string, string> = {
  'OP02-072': 'SIMPLIFIED: DON!!-4 pays from the cost area only (attached DON need the class picker)',
  'OP02-075': 'SIMPLIFIED: DON!!-1 pays from the cost area only',
  'OP02-076': 'SIMPLIFIED: DON!!-1 pays from the cost area only',
  'OP02-078': 'SIMPLIFIED: DON!!-2 pays from the cost area only',
  'OP02-079': 'SIMPLIFIED: DON!!-1 pays from the cost area only',
  'OP02-082': 'SIMPLIFIED: DON!!-8 pays from the cost area only',
  'OP02-085': 'SIMPLIFIED: DON!!-1 pays from the cost area only; forced opponent returns take cost-area DON, rested first',
  'OP02-089': 'SIMPLIFIED: DON!!-1 pays from the cost area only',
  'OP02-090': 'SIMPLIFIED: DON!!-1 pays from the cost area only',
  'OP02-120': 'SIMPLIFIED: DON!!-2 pays from the cost area only',
  'OP02-056': 'SIMPLIFIED: "top or bottom in any order" implemented as choose-a-subset-for-bottom (order preserved)',
  'OP02-057': 'SIMPLIFIED: revealed leftovers go to the bottom ("top or bottom" not offered)',
  'OP02-062': 'SIMPLIFIED: "return up to 1 Character" targets the opponent side only (rules allow either)',
  'OP02-064': 'SIMPLIFIED: "place up to 1 Character" targets the opponent side only (rules allow either)',
  'OP02-067': 'SIMPLIFIED: bounce targets restricted to the opponent side (rules allow either)',
  'OP02-068': 'SIMPLIFIED: trigger bounce targets the opponent side only (rules allow either)',
  'OP02-069': 'SIMPLIFIED: trigger bounce targets the opponent side only (rules allow either)',
  'OP02-066': 'SIMPLIFIED: "draw up to 2" always draws 2',
  'OP02-026': 'SIMPLIFIED: "3 or less Characters" is checked after the played Character lands',
  'OP02-002': 'SIMPLIFIED: fires on ATTACH_DON actions and effect-given DON (each attach action once, whatever its count)',
}
