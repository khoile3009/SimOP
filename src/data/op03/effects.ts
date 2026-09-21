import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP03 effect definitions as DSL data, keyed by card ID, transcribed from the
 * exact card texts in cards.json (two API-truncated texts verified against
 * limitless: OP03-013 Marco's [On K.O.], OP03-042 Usopp's Pirate Crew).
 * Encoding conventions match op01/effects.ts.
 */
export const OP03_EFFECTS: Record<string, EffectDef[]> = {
  // ── Red ────────────────────────────────────────────────────────────────────

  // Ace leader: pitch Events/Stages for +1000 each, attacking or attacked
  'OP03-001': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand', cardTypeAny: ['Event', 'Stage'] }, min: 0, max: 9, prompt: 'Trash any number of Event or Stage cards: +1000 power each this battle' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'powerModPerRef', ref: 'self', countRef: 'pay', amountPer: 1000, duration: 'battle' },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self', sourceIsSelf: true },
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand', cardTypeAny: ['Event', 'Stage'] }, min: 0, max: 9, prompt: 'Trash any number of Event or Stage cards: +1000 power each this battle' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'powerModPerRef', ref: 'self', countRef: 'pay', amountPer: 1000, duration: 'battle' },
      ],
    },
  ],

  // Adio
  'OP03-002': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [{ op: 'grantFlag', ref: 'self', flag: 'noBlockPowerAtMost', value: 2000, duration: 'battle' }],
    },
  ],

  // Izo
  'OP03-003': [
    { timing: 'onPlay', ops: [{ op: 'searchTop', count: 5, filter: { typeIncludes: 'Whitebeard Pirates', nameNot: 'Izo' }, upTo: 1, to: 'hand' }] },
  ],

  // Thatch: pump now, gone at end of turn
  'OP03-005': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'turn' },
        { op: 'grantFlag', ref: 'self', flag: 'trashAtTurnEnd', duration: 'turn' },
      ],
    },
  ],

  // Buggy (red): Slash-proof static lives in OP03_STATICS
  'OP03-008': [
    { timing: 'onPlay', ops: [{ op: 'searchTop', count: 5, filter: { cardType: 'Event', colorIncludes: 'Red' }, upTo: 1, to: 'hand' }] },
  ],

  // Haruta: aim a rested DON at any of your field cards
  'OP03-009': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 1, max: 1, prompt: 'Give up to 1 rested DON!! to your Leader or a Character' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],

  // Blamenco
  'OP03-011': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -2000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -2000, duration: 'turn' },
      ],
    },
  ],

  // Teach: feed a big red body for a card
  'OP03-012': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'characters', colorIncludes: 'Red', powerAtLeast: 4000 }, min: 0, max: 1, prompt: 'You may trash 1 of your red Characters with 4000+ power' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashFromField', ref: 'pay' },
        { op: 'draw', count: 1 },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'battle' },
      ],
    },
  ],

  // Marco: pitch an Event to rise from the trash rested
  'OP03-013': [
    {
      timing: 'onPlay',
      condition: { yourTurn: true },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 3000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 3000 power or less' },
        { op: 'ko', ref: 't' },
      ],
    },
    {
      timing: 'onKo',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand', cardType: 'Event' }, min: 0, max: 1, prompt: 'You may trash 1 Event to play Marco from the trash rested' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'playSelf', rested: true },
      ],
    },
  ],

  // Garp
  'OP03-014': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', colorIncludes: 'Red', costIs: 1 }, min: 0, max: 1, prompt: 'Play up to 1 red cost-1 Character from your hand' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Flame Emperor
  'OP03-016': [
    {
      timing: 'main',
      condition: { leaderNameIs: 'Portgas.D.Ace' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 8000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 8000 power or less' },
        { op: 'ko', ref: 't' },
        { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader' }, min: 1, max: 1, prompt: 'Your Leader gains [Double Attack] and +3000 power this turn' },
        { op: 'powerMod', ref: 'l', amount: 3000, duration: 'turn' },
        { op: 'grantKeyword', ref: 'l', keyword: 'Double Attack', duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 6000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 6000 power or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Cross Fire (Main or Counter)
  'OP03-017': [
    {
      timing: 'main',
      condition: { leaderTypeIncludes: 'Whitebeard Pirates' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -4000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -4000, duration: 'turn' },
      ],
    },
    {
      timing: 'counter',
      condition: { leaderTypeIncludes: 'Whitebeard Pirates' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -4000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -4000, duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],

  // Fire Fist
  'OP03-018': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand', cardType: 'Event' }, min: 0, max: 1, prompt: 'You may trash 1 Event from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 'a', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 5000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 5000 power or less' },
        { op: 'ko', ref: 'a' },
        { op: 'select', bind: 'b', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 4000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 4000 power or less' },
        { op: 'ko', ref: 'b' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', powerAtMost: 5000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 5000 power or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Fiery Doll
  'OP03-019': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader' }, min: 1, max: 1, prompt: 'Your Leader gains +4000 power this turn' },
        { op: 'powerMod', ref: 'l', amount: 4000, duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: 'Give up to 1 Leader or Character -10000 power this turn' },
        { op: 'powerMod', ref: 't', amount: -10000, duration: 'turn' },
      ],
    },
  ],

  // Striker (stage)
  'OP03-020': [
    {
      timing: 'activateMain',
      condition: { leaderNameIs: 'Portgas.D.Ace' },
      cost: { restDon: 2, restSelf: true },
      ops: [{ op: 'searchTop', count: 5, filter: { cardType: 'Event' }, upTo: 1, to: 'hand' }],
    },
  ],

  // ── Green ──────────────────────────────────────────────────────────────────

  // Kuro leader
  'OP03-021': [
    {
      timing: 'activateMain',
      cost: { restDon: 3 },
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'characters', typeIncludes: 'East Blue', rested: false }, min: 0, max: 2, exact: true, prompt: 'Rest 2 of your {East Blue} Characters' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'setActive', ref: 'self' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 5 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // Arlong leader: rest 1 DON to drop a Trigger character
  'OP03-022': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 1, exact: true, prompt: 'You may rest 1 DON!!' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 4, hasTrigger: true }, min: 0, max: 1, prompt: 'Play up to 1 Character with cost 4 or less and a [Trigger]' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Gin
  'OP03-024': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'East Blue' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4, rested: false }, min: 0, max: 2, prompt: 'Rest up to 2 Characters with cost 4 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // Krieg (Double Attack static lives in OP03_STATICS)
  'OP03-025': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 4 }, min: 0, max: 2, prompt: 'K.O. up to 2 rested Characters with cost 4 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Kuroobi
  'OP03-026': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'East Blue' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character' },
        { op: 'rest', ref: 't' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],

  // Sham
  'OP03-027': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'East Blue' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 2, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 2 or less' },
        { op: 'rest', ref: 't' },
        { op: 'requireCond', cond: { lacksCharacterNamed: 'Buchi' } },
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', nameIs: 'Buchi' }, min: 0, max: 1, prompt: 'Play up to 1 [Buchi] from your hand' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Jango: choose one - ready an East Blue card, or rest himself and an enemy
  'OP03-028': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'm1', filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'East Blue', costAtMost: 6, rested: true }, min: 0, max: 1, prompt: 'Mode 1: set an {East Blue} Leader or Character with cost 6 or less as active (choose none for mode 2: rest Jango and an enemy)' },
        { op: 'setActive', ref: 'm1' },
        { op: 'abortIfChosen', ref: 'm1' },
        { op: 'rest', ref: 'self' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 of your opponent\'s Characters' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // Chew
  'OP03-029': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 4 }, min: 0, max: 1, prompt: 'K.O. up to 1 rested Character with cost 4 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],

  // Nami (green)
  'OP03-030': [
    { timing: 'onPlay', ops: [{ op: 'searchTop', count: 5, filter: { colorIncludes: 'Green', typeIncludes: 'East Blue', nameNot: 'Nami' }, upTo: 1, to: 'hand' }] },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],

  // Hatchan
  'OP03-033': [
    { timing: 'trigger', condition: { leaderTypeIncludes: 'East Blue' }, ops: [{ op: 'playSelf' }] },
  ],

  // Buchi
  'OP03-034': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 2 }, min: 0, max: 1, prompt: 'K.O. up to 1 rested Character with cost 2 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Out-of-the-Bag
  'OP03-036': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'characters', typeIncludes: 'East Blue', rested: false }, min: 0, max: 1, prompt: 'You may rest 1 of your {East Blue} Characters' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Kuro', rested: true }, min: 0, max: 1, prompt: 'Set up to 1 of your [Kuro] cards as active' },
        { op: 'setActive', ref: 't' },
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

  // Tooth Attack
  'OP03-037': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'characters', typeIncludes: 'East Blue', rested: false }, min: 0, max: 1, prompt: 'You may rest 1 of your {East Blue} Characters' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 3 }, min: 0, max: 1, prompt: 'K.O. up to 1 rested Character with cost 3 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 4, hasTrigger: true }, min: 0, max: 1, prompt: 'Play up to 1 Character with cost 4 or less and a [Trigger]' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Deathly Poison Gas Bomb MH5
  'OP03-038': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 2, rested: false }, min: 0, max: 2, prompt: 'Rest up to 2 Characters with cost 2 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 5 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // One, Two, Jango
  'OP03-039': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 1, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 1 or less' },
        { op: 'rest', ref: 't' },
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'characters' }, min: 0, max: 1, prompt: 'Up to 1 of your Characters gains +1000 this turn' },
        { op: 'powerMod', ref: 'b', amount: 1000, duration: 'turn' },
      ],
    },
  ],

  // ── Blue (Nami mill) ───────────────────────────────────────────────────────

  // Nami leader: deck-out wins live in the rules layer; the DON!! x1 mill here
  'OP03-040': [
    {
      timing: 'onEvent',
      on: { kind: 'lifeDamageDealt', who: 'self', sourceIsSelf: true },
      donRequired: 1,
      ops: [{ op: 'millSelf', count: 1 }],
    },
  ],

  // Usopp (Rush printed)
  'OP03-041': [
    {
      timing: 'onEvent',
      on: { kind: 'lifeDamageDealt', who: 'self', sourceIsSelf: true },
      donRequired: 1,
      ops: [{ op: 'millSelf', count: 7 }],
    },
  ],

  // Usopp's Pirate Crew
  'OP03-042': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'trash', colorIncludes: 'Blue', nameIs: 'Usopp' }, min: 0, max: 1, prompt: 'Add up to 1 blue [Usopp] from your trash to your hand' },
        { op: 'toHand', ref: 't' },
      ],
    },
  ],

  // Gaimon
  'OP03-043': [
    {
      timing: 'onEvent',
      on: { kind: 'lifeDamageDealt', who: 'self' },
      ops: [
        { op: 'millSelf', count: 3 },
        { op: 'trashFromField', ref: 'self' },
      ],
    },
  ],

  // Kaya
  'OP03-044': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 2 },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand' }, min: 2, max: 2, prompt: 'Trash 2 cards from your hand' },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],

  // Zeff
  'OP03-047': [
    {
      timing: 'onEvent',
      on: { kind: 'lifeDamageDealt', who: 'self', sourceIsSelf: true },
      donRequired: 1,
      ops: [{ op: 'millSelf', count: 7 }],
    },
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 3 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
        { op: 'millSelf', count: 2 },
      ],
    },
  ],

  // Nojiko
  'OP03-048': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Nami' },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 5 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
      ],
    },
  ],

  // Patty
  'OP03-049': [
    {
      timing: 'onPlay',
      condition: { maxDeckSelf: 20 },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 3 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
      ],
    },
  ],

  // Boodle
  'OP03-050': [{ timing: 'onKo', ops: [{ op: 'millSelf', count: 1 }] }],

  // Bell-mere
  'OP03-051': [
    {
      timing: 'onEvent',
      on: { kind: 'lifeDamageDealt', who: 'self', sourceIsSelf: true },
      donRequired: 1,
      ops: [{ op: 'millSelf', count: 7 }],
    },
    { timing: 'onKo', ops: [{ op: 'millSelf', count: 3 }] },
  ],

  // Usopp's Rubber Band of Doom!!!
  'OP03-054': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+2000 power during this battle' },
        { op: 'powerMod', ref: 'b', amount: 2000, duration: 'battle' },
        { op: 'millSelf', count: 1 },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }, { op: 'millSelf', count: 1 }] },
  ],

  // Gum-Gum Giant Gavel
  'OP03-055': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader' }, min: 0, max: 1, prompt: 'Up to 1 of your Leader gains +4000 power this battle' },
        { op: 'powerMod', ref: 'l', amount: 4000, duration: 'battle' },
        { op: 'millSelf', count: 2 },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 4 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
      ],
    },
  ],

  // Sanji's Pilaf
  'OP03-056': [
    { timing: 'main', ops: [{ op: 'draw', count: 2 }] },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],

  // Three Thousand Worlds
  'OP03-057': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 }, min: 0, max: 1, prompt: "Place up to 1 Character with cost 5 or less at the bottom of the owner's deck" },
        { op: 'bottomDeckFromField', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: "Place up to 1 Character with cost 3 or less at the bottom of the owner's deck" },
        { op: 'bottomDeckFromField', ref: 't' },
      ],
    },
  ],

  // Sogeking (also named Usopp via the rules layer)
  'OP03-122': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 6 or less to the owner's hand" },
        { op: 'returnToHand', ref: 't' },
        { op: 'draw', count: 2 },
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand' }, min: 2, max: 2, prompt: 'Trash 2 cards from your hand' },
        { op: 'trashCards', ref: 'p' },
      ],
    },
  ],

  // ── Purple ─────────────────────────────────────────────────────────────────

  // Iceburg leader (cannot-attack static lives in OP03_STATICS)
  'OP03-058': [
    {
      timing: 'activateMain',
      cost: { returnDon: 1, restSelf: true },
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', typeIncludes: 'Galley-La Company', costAtMost: 5 }, min: 0, max: 1, prompt: 'Play up to 1 {Galley-La Company} Character with cost 5 or less' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Kaku
  'OP03-059': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Banish', duration: 'battle' },
      ],
    },
  ],

  // Kalifa (purple)
  'OP03-060': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'draw', count: 2 },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Trash 1 card from your hand' },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],

  // Kokoro
  'OP03-062': [
    { timing: 'onPlay', ops: [{ op: 'searchTop', count: 5, filter: { typeIncludes: 'Water Seven', nameNot: 'Kokoro' }, upTo: 1, to: 'hand' }] },
  ],

  // Zambai
  'OP03-063': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Water Seven' } },
        { op: 'draw', count: 1 },
      ],
    },
  ],

  // Tilestone
  'OP03-064': [
    { timing: 'onKo', condition: { leaderTypeIncludes: 'Galley-La Company' }, ops: [{ op: 'addDon', count: 1, rested: true }] },
  ],

  // Paulie
  'OP03-066': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 2, exact: true, prompt: 'You may rest 2 DON!!' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'addDon', count: 1, rested: false },
        { op: 'requireCond', cond: { minDonField: 8 } },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 4 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Peepley Lulu
  'OP03-067': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      condition: { leaderTypeIncludes: 'Galley-La Company' },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],

  // Minozebra (Banish printed)
  'OP03-068': [
    { timing: 'onKo', condition: { leaderTypeIncludes: 'Impel Down' }, ops: [{ op: 'addDon', count: 1, rested: true }] },
  ],

  // Minorhinoceros
  'OP03-069': [
    {
      timing: 'onKo',
      condition: { leaderTypeIncludes: 'Impel Down' },
      ops: [
        { op: 'draw', count: 2 },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Trash 1 card from your hand' },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],

  // Luffy (purple)
  'OP03-070': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand', cardType: 'Character', costIs: 5 }, min: 1, max: 1, prompt: 'Trash 1 cost-5 Character from your hand' },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'trashCards', ref: 't' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],

  // Rob Lucci (purple)
  'OP03-071': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 5 or less' },
        { op: 'rest', ref: 't' },
      ],
    },
  ],

  // Gum-Gum Jet Gatling
  'OP03-072': [
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
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],

  // Hull Dismantler Slash
  'OP03-073': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Water Seven' } },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 2 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],

  // Top Knot
  'OP03-074': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: "Place up to 1 Character with cost 4 or less at the bottom of the owner's deck" },
        { op: 'bottomDeckFromField', ref: 't' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],

  // Galley-La Company (stage)
  'OP03-075': [
    {
      timing: 'activateMain',
      condition: { leaderNameIs: 'Iceburg' },
      cost: { restSelf: true },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],

  // ── Black ──────────────────────────────────────────────────────────────────

  // Rob Lucci leader
  'OP03-076': [
    {
      timing: 'onEvent',
      on: { kind: 'characterKoed', who: 'opponent' },
      oncePerTurn: true,
      condition: { yourTurn: true },
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 2, exact: true, prompt: 'You may trash 2 cards to set this Leader active' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'setActive', ref: 'self' },
      ],
    },
  ],

  // Issho (the -3 cost aura lives in OP03_STATICS)
  'OP03-078': [
    {
      timing: 'onPlay',
      condition: { minHandOpp: 6 },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'hand' }, min: 2, max: 2, chooser: 'opponent', prompt: 'Your opponent trashes 2 cards from their hand' },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],

  // Kaku (black)
  'OP03-080': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'trash', typeContains: 'CP' }, min: 0, max: 2, exact: true, prompt: 'You may place 2 {CP} cards from your trash at the bottom of your deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashToDeckBottom', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 3 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Kalifa (black)
  'OP03-081': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 2 },
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand' }, min: 2, max: 2, prompt: 'Trash 2 cards from your hand' },
        { op: 'trashCards', ref: 'p' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -2 cost this turn' },
        { op: 'costMod', ref: 't', amount: -2, duration: 'turn' },
      ],
    },
  ],

  // Corgy
  'OP03-083': [
    { timing: 'onPlay', ops: [{ op: 'searchTop', count: 5, filter: {}, upTo: 2, to: 'trash' }] },
  ],

  // Spandam
  'OP03-086': [
    {
      timing: 'onPlay',
      condition: { leaderTypeContains: 'CP' },
      ops: [{ op: 'searchTop', count: 3, filter: { typeContains: 'CP', nameNot: 'Spandam' }, upTo: 1, to: 'hand', restTo: 'trash' }],
    },
  ],

  // Brannew
  'OP03-089': [
    { timing: 'onPlay', ops: [{ op: 'searchTop', count: 3, filter: { typeIncludes: 'Navy', nameNot: 'Brannew' }, upTo: 1, to: 'hand', restTo: 'trash' }] },
  ],

  // Blueno (the DON-gated Blocker lives in OP03_STATICS)
  'OP03-090': [
    {
      timing: 'onKo',
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'trash', cardType: 'Character', typeContains: 'CP', costAtMost: 4 }, min: 0, max: 1, prompt: 'Play up to 1 {CP} Character with cost 4 or less from your trash rested' },
        { op: 'playCards', ref: 'p', rested: true },
      ],
    },
  ],

  // Helmeppo
  'OP03-091': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', noBaseEffect: true }, min: 0, max: 1, prompt: "Set up to 1 vanilla Character's cost to 0 this turn" },
        { op: 'costMod', ref: 't', amount: -10, duration: 'turn' },
      ],
    },
  ],

  // Rob Lucci (black 6c)
  'OP03-092': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'trash', typeContains: 'CP' }, min: 0, max: 2, exact: true, prompt: 'You may place 2 {CP} cards from your trash at the bottom of your deck' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashToDeckBottom', ref: 'pay' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],

  // Wanze
  'OP03-093': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'requireCond', cond: { leaderTypeContains: 'CP' } },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 1 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Air Door
  'OP03-094': [
    {
      timing: 'main',
      condition: { leaderTypeContains: 'CP' },
      ops: [{ op: 'searchTop', count: 5, filter: { cardType: 'Character', typeContains: 'CP', costAtMost: 5 }, upTo: 1, to: 'play', restTo: 'trash' }],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'trash', cardType: 'Character', colorIncludes: 'Black', costAtMost: 3 }, min: 0, max: 1, prompt: 'Play up to 1 black Character with cost 3 or less from your trash' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Soap Sheep
  'OP03-095': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 2, prompt: 'Give up to 2 Characters -2 cost this turn' },
        { op: 'costMod', ref: 't', amount: -2, duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'hand' }, min: 1, max: 1, chooser: 'opponent', prompt: 'Your opponent trashes 1 card from their hand' },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],

  // Tempest Kick Sky Slicer: a cost-0 character, or a cheap stage
  'OP03-096': [
    {
      timing: 'main',
      ops: [
        { op: 'select', bind: 'a', filter: { owner: 'opponent', zone: 'characters', costAtMost: 0 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with a cost of 0 (choose none to target a Stage instead)' },
        { op: 'ko', ref: 'a' },
        { op: 'abortIfChosen', ref: 'a' },
        { op: 'select', bind: 'b', filter: { owner: 'opponent', zone: 'stage', costAtMost: 3 }, min: 0, max: 1, prompt: 'K.O. up to 1 Stage with cost 3 or less' },
        { op: 'ko', ref: 'b' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 2 }] },
  ],

  // Six King Pistol
  'OP03-097': [
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
        { op: 'draw', count: 1 },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 1 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Enies Lobby (stage)
  'OP03-098': [
    {
      timing: 'activateMain',
      condition: { leaderTypeContains: 'CP' },
      cost: { restSelf: true },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -2 cost this turn' },
        { op: 'costMod', ref: 't', amount: -2, duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],

  // ── Yellow (Big Mom life engine) ───────────────────────────────────────────

  // Linlin leader: refill life from the deck top at 1 life
  'OP03-077': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      condition: { maxLifeSelf: 1 },
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 2, exact: true, prompt: 'You may rest 2 DON!!' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Trash 1 card from your hand' },
        { op: 'abortIfEmpty', ref: 'p' },
        { op: 'trashCards', ref: 'p' },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],

  // Katakuri leader: trigger control on either life stack
  'OP03-099': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'scryLifeTops', prompt: "You may move the top card of either player's Life to the bottom of that stack" },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'battle' },
      ],
    },
  ],

  // Kingbaum
  'OP03-100': [
    {
      timing: 'trigger',
      condition: { minLifeSelf: 1 },
      ops: [{ op: 'trashLifeTop', owner: 'self', count: 1 }, { op: 'playSelf' }],
    },
  ],

  // Sanji (yellow)
  'OP03-102': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],

  // Shirley
  'OP03-104': [
    {
      timing: 'onPlay',
      ops: [{ op: 'scryLifeTops', prompt: "You may move the top card of either player's Life to the bottom of that stack" }],
    },
  ],

  // Charlotte Oven
  'OP03-105': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand', hasTrigger: true }, min: 0, max: 1, prompt: 'You may trash 1 card with a [Trigger] from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'powerMod', ref: 'self', amount: 3000, duration: 'battle' },
      ],
    },
  ],

  // Charlotte Cracker (statics carry the buff)
  'OP03-108': [
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card to play this card' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'playSelf' },
      ],
    },
  ],

  // Charlotte Chiffon
  'OP03-109': [
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'trashLifeTop', owner: 'self', count: 1 },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],

  // Charlotte Smoothie
  'OP03-110': [
    {
      timing: 'whenAttacking',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'battle' },
      ],
    },
  ],

  // Charlotte Pudding
  'OP03-112': [
    {
      timing: 'onPlay',
      ops: [{ op: 'searchTop', count: 4, filter: { typeIncludes: 'Big Mom Pirates', orNameIs: 'Sanji', nameNot: 'Charlotte Pudding' }, upTo: 1, to: 'hand' }],
    },
  ],

  // Charlotte Perospero
  'OP03-113': [
    { timing: 'onKo', ops: [{ op: 'searchTop', count: 3, filter: { typeIncludes: 'Big Mom Pirates' }, upTo: 1, to: 'hand' }] },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 1, prompt: 'You may trash 1 card to play this card' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'playSelf' },
      ],
    },
  ],

  // Charlotte Linlin (10c): life goes up for you, down for them
  'OP03-114': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Big Mom Pirates' },
      ops: [
        { op: 'deckTopToLife', count: 1 },
        { op: 'trashLifeTop', owner: 'opponent', count: 1 },
      ],
    },
  ],

  // Streusen
  'OP03-115': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand', hasTrigger: true }, min: 0, max: 1, prompt: 'You may trash 1 card with a [Trigger] from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 1 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Shirahoshi
  'OP03-116': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 3 },
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand' }, min: 2, max: 2, prompt: 'Trash 2 cards from your hand' },
        { op: 'trashCards', ref: 'p' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],

  // Napoleon
  'OP03-117': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Charlotte Linlin' }, min: 0, max: 1, prompt: 'Up to 1 of your [Charlotte Linlin] cards gains +1000 until the start of your next turn' },
        { op: 'powerMod', ref: 't', amount: 1000, duration: 'untilYourNextTurn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],

  // Ikoku Sovereignty
  'OP03-118': [
    {
      timing: 'counter',
      ops: [
        { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+5000 power during this battle' },
        { op: 'powerMod', ref: 'b', amount: 5000, duration: 'battle' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 0, max: 2, exact: true, prompt: 'You may trash 2 cards from your hand' },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],

  // Buzz Cut Mochi
  'OP03-119': [
    {
      timing: 'main',
      condition: { lessLifeThanOpp: true },
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 4 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 4, hasTrigger: true }, min: 0, max: 1, prompt: 'Play up to 1 Character with cost 4 or less and a [Trigger]' },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],

  // Tropical Torment
  'OP03-120': [
    {
      timing: 'main',
      condition: { minLifeOpp: 4 },
      ops: [{ op: 'trashLifeTop', owner: 'opponent', count: 1 }],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],

  // Thunder Bolt
  'OP03-121': [
    {
      timing: 'main',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'trashLifeTop', owner: 'self', count: 1 },
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 5 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 5 or less' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],

  // Charlotte Katakuri (8c): tuck a body into its owner's life
  'OP03-123': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 8 }, min: 0, max: 1, prompt: "Add up to 1 Character with cost 8 or less to the top of the owner's Life" },
        { op: 'fieldToLife', ref: 't' },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP03_STATICS: Record<string, StaticDef[]> = {
  // Curiel: Rush, but never into the Leader on arrival turn
  'OP03-004': [
    { target: { scope: 'self' }, flag: 'noLeaderAttackTurnPlayed' },
    { donRequired: 1, target: { scope: 'self' }, keyword: 'Rush' },
  ],
  // Buggy x2: Slash-proof
  'OP03-008': [{ target: { scope: 'self' }, flag: 'noBattleKoBySlash' }],
  'OP03-032': [{ target: { scope: 'self' }, flag: 'noBattleKoBySlash' }],
  // Krieg
  'OP03-025': [{ donRequired: 1, target: { scope: 'self' }, keyword: 'Double Attack' }],
  // Carne
  'OP03-045': [
    { condition: { opponentsTurn: true, maxDeckSelf: 20 }, target: { scope: 'self' }, power: 3000 },
  ],
  // Yosaku & Johnny
  'OP03-053': [
    { donRequired: 1, condition: { maxDeckSelf: 20 }, target: { scope: 'self' }, power: 2000 },
  ],
  // Iceburg leader sits back
  'OP03-058': [{ target: { scope: 'self' }, flag: 'cannotAttack' }],
  // Issho: the whole enemy board costs less
  'OP03-078': [
    { donRequired: 1, condition: { yourTurn: true }, target: { scope: 'oppCharacters' }, costMod: -3 },
  ],
  // Vergo
  'OP03-079': [{ donRequired: 1, target: { scope: 'self' }, flag: 'noBattleKo' }],
  // Fukurou
  'OP03-088': [{ target: { scope: 'self' }, flag: 'noEffectKo' }],
  // Blueno: DON-gated Blocker
  'OP03-090': [{ donRequired: 1, target: { scope: 'self' }, keyword: 'Blocker' }],
  // Charlotte Cracker: racing from behind
  'OP03-108': [
    { donRequired: 1, condition: { lessLifeThanOpp: true }, target: { scope: 'self' }, keyword: 'Double Attack' },
    { donRequired: 1, condition: { lessLifeThanOpp: true }, target: { scope: 'self' }, power: 1000 },
  ],
}

/**
 * Cards whose printed text is fully handled by the keyword parser
 * (engine/keywords.ts) and/or the rules-layer registry (engine/rulesLayer.ts).
 */
export const KEYWORD_ONLY_OP03: string[] = [
  'OP03-010',
  'OP03-015',
  'OP03-031',
  'OP03-065',
  'OP03-107',
]

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP03: Record<string, string> = {
  'OP03-058': 'SIMPLIFIED: DON!!-1 pays from the cost area only (attached DON need the class picker)',
  'OP03-059': 'SIMPLIFIED: DON!!-1 pays from the cost area only',
  'OP03-060': 'SIMPLIFIED: DON!!-1 pays from the cost area only',
  'OP03-063': 'SIMPLIFIED: DON!!-1 pays from the cost area only',
  'OP03-070': 'SIMPLIFIED: DON!!-1 pays from the cost area only',
  'OP03-071': 'SIMPLIFIED: DON!!-1 pays from the cost area only',
  'OP03-073': 'SIMPLIFIED: DON!!-1 pays from the cost area only',
  'OP03-074': 'SIMPLIFIED: DON!!-1 pays from the cost area only',
  'OP03-099': 'SIMPLIFIED: the life scry is "may move either top card to the bottom, unseen" - the look itself is not modeled',
  'OP03-104': 'SIMPLIFIED: the life scry is "may move either top card to the bottom, unseen" - the look itself is not modeled',
  'OP03-100': 'SIMPLIFIED: the life-trash cost takes the top card ("top or bottom" not offered); "you may" auto-accepts',
  'OP03-102': 'SIMPLIFIED: life-to-hand takes the top card ("top or bottom" not offered); "you may" auto-accepts',
  'OP03-109': 'SIMPLIFIED: the life-trash cost takes the top card ("top or bottom" not offered); "you may" auto-accepts',
  'OP03-110': 'SIMPLIFIED: life-to-hand takes the top card ("top or bottom" not offered); "you may" auto-accepts',
  'OP03-123': 'SIMPLIFIED: targets the opponent side only (rules allow either), always to the TOP of the life stack, face-up not modeled',
  'OP03-040': 'SIMPLIFIED: the mill ("you may trash 1") auto-accepts - it is the deck\'s whole plan',
  'OP03-041': 'SIMPLIFIED: the mill auto-accepts',
  'OP03-043': 'SIMPLIFIED: the mill + self-trash auto-accepts',
  'OP03-047': 'SIMPLIFIED: mills auto-accept; the [On Play] bounce targets the opponent side only (rules allow either)',
  'OP03-049': 'SIMPLIFIED: bounce targets the opponent side only (rules allow either)',
  'OP03-051': 'SIMPLIFIED: mills auto-accept',
  'OP03-050': 'SIMPLIFIED: the mill auto-accepts',
  'OP03-054': 'SIMPLIFIED: mills auto-accept',
  'OP03-055': 'SIMPLIFIED: mills auto-accept; trigger bounce targets the opponent side only',
  'OP03-057': 'SIMPLIFIED: bottom-deck targets the opponent side only (rules allow either)',
  'OP03-091': 'SIMPLIFIED: "set cost to 0" is encoded as -10 cost (floor 0); a future +cost effect could differ',
  'OP03-122': 'SIMPLIFIED: bounce targets the opponent side only (rules allow either)',
  'OP03-013': 'NOTE: [On K.O.] text is truncated in the API dump; transcribed from the official card via limitless',
  'OP03-042': 'NOTE: card text is corrupted in the API dump ("blue [Usopp"); transcribed as "add up to 1 blue [Usopp] from your trash"',
}
