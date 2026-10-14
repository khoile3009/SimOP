import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * EB01 (Memorial Collection) effect definitions as DSL data, keyed by card ID.
 * Compiled entries were drafted by scripts/compile-effects.ts and reviewed; the
 * rest are authored against the printed text. Deviations are documented in
 * COVERAGE_NOTES_EB01.
 */
export const EB01_EFFECTS: Record<string, EffectDef[]> = {
  'EB01-001': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      condition: { charTypedCostAtLeast: { type: 'Land of Wano', cost: 5 } },
      ops: [{ op: 'powerMod', ref: 'self', amount: 1000, duration: 'untilYourNextTurn' }],
    },
  ],
  'EB01-002': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to your Leader or a Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'attackDeclared', who: 'opponent' },
      oncePerTurn: true,
      condition: { leaderTypeIncludesAny: ['Land of Wano', 'Whitebeard Pirates'] },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Trash 1 card: give -2000 power?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 't', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'EB01-003': [
    {
      timing: 'whenAttacking',
      condition: { maxLifeOpp: 2 },
      ops: [{ op: 'powerMod', ref: 'self', amount: 2000, duration: 'turn' }],
    },
  ],
  'EB01-004': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', rested: false },
          min: 0,
          max: 1,
          prompt: 'Pay: your active Leader gets -5000 power?',
        },
        { op: 'abortIfEmpty', ref: 'L' },
        { op: 'powerMod', ref: 'L', amount: -5000, duration: 'turn' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -3000 power',
        },
        { op: 'powerMod', ref: 'c', amount: -3000, duration: 'turn' },
      ],
    },
  ],
  'EB01-006': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -3000, duration: 'turn' },
      ],
    },
  ],
  'EB01-007': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to your Leader or a Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'EB01-008': [
    {
      timing: 'replaceKo',
      replaceWhen: 'effect',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', cardTypeAny: ['Event', 'Stage'] },
          min: 0,
          max: 1,
          prompt: 'Trash an Event or Stage instead?',
        },
        { op: 'trashCards', ref: 'p' },
        { op: 'abortIfChosen', ref: 'p' },
        { op: 'koSelfNoReplace' },
      ],
    },
  ],
  'EB01-009': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', typeIncludes: 'Animal', costAtMost: 3 },
          upTo: 1,
          to: 'play',
        },
      ],
    },
  ],
  'EB01-010': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with 6000 base power or less',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'k2',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 5000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with 5000 base power or less',
        },
        { op: 'ko', ref: 'k2' },
      ],
    },
  ],
  'EB01-011': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: {
            owner: 'self',
            zone: 'characters',
            basePowerAtLeast: 1000,
            basePowerAtMost: 1000,
          },
          min: 1,
          max: 1,
          prompt: 'Place 1 of your 1000-base-power Characters at the deck bottom',
        },
        { op: 'bottomDeckFromField', ref: 'c' },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'EB01-012': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Supernovas', lacksOtherCharacterNamed: 'Cavendish' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 2,
          prompt: 'Set up to 2 DON!! active',
        },
        { op: 'setActive', ref: 'b1' },
      ],
    },
    {
      timing: 'whenAttacking',
      condition: { leaderTypeIncludes: 'Supernovas', lacksOtherCharacterNamed: 'Cavendish' },
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 2,
          prompt: 'Set up to 2 DON!! active',
        },
        { op: 'setActive', ref: 'b2' },
      ],
    },
  ],
  'EB01-013': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Land of Wano',
            costAtMost: 5,
            nameNot: 'Kouzuki Hiyori',
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 other Land of Wano Character with a cost of 5 or less',
        },
        { op: 'playCards', ref: 'p' },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'EB01-015': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'EB01-016': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1, rested: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'EB01-019': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 4000, duration: 'battle' },
        {
          op: 'searchTop',
          count: 3,
          filter: { cardType: 'Character', typeIncludes: 'Donquixote Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'EB01-020': [
    {
      timing: 'main',
      condition: { leaderTypeIncludes: 'Supernovas' },
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'self', zone: 'characters' },
          min: 1,
          max: 1,
          prompt: 'Return 1 of your Characters to hand',
        },
        { op: 'returnToHand', ref: 'r' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            costAtMost: 2,
            differentColorThanRef: 'r',
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 cost-2 Character of a different color',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'EB01-021': [
    {
      timing: 'endOfTurn',
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Impel Down', costAtLeast: 2 },
          min: 0,
          max: 1,
          prompt: 'Return an Impel Down Character to hand: add 1 active DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'r' },
        { op: 'returnToHand', ref: 'r' },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'EB01-022': [
    { timing: 'endOfTurn', condition: { maxHandSelf: 2 }, ops: [{ op: 'draw', count: 2 }] },
  ],
  'EB01-023': [{ timing: 'onPlay', ops: [{ op: 'draw', count: 1 }] }],
  'EB01-026': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      condition: { maxHandSelf: 1 },
      ops: [
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'any', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Return up to 1 Character with a cost of 3 or less to hand',
        },
        { op: 'returnToHand', ref: 'b' },
      ],
    },
  ],
  'EB01-027': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'b1' },
      ],
    },
  ],
  'EB01-028': [
    {
      timing: 'counter',
      condition: { leaderTypeIncludes: 'Impel Down' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'battle' },
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          chooser: 'opponent',
          min: 1,
          max: 1,
          prompt: 'Return 1 of your active Characters to hand',
        },
        { op: 'returnToHand', ref: 'r' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'any', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck up to 1 Character with a cost of 3 or less',
        },
        { op: 'bottomDeckFromField', ref: 'b2' },
      ],
    },
  ],
  'EB01-029': [
    {
      timing: 'counter',
      ops: [
        { op: 'revealTopCond', filter: { costAtLeast: 4 } },
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Return up to 1 of your Characters to hand',
        },
        { op: 'returnToHand', ref: 'b' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 8 },
          min: 0,
          max: 1,
          prompt: 'Return up to 1 Character with a cost of 8 or less to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'EB01-030': [
    {
      timing: 'activateMain',
      ops: [
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Place 1 card from your hand at the deck bottom',
        },
        { op: 'bottomDeck', ref: 'h' },
        { op: 'bottomDeckFromField', ref: 'self' },
        { op: 'draw', count: 2 },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'EB01-031': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Water Seven' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'returnDon', ref: 'b1' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'trash', cardType: 'Character', costAtMost: 4 },
          min: 0,
          max: 2,
          prompt: 'Add up to 2 Characters with a cost of 4 or less to hand',
        },
        { op: 'toHand', ref: 't' },
      ],
    },
  ],
  'EB01-033': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Water Seven' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'returnDon', ref: 'b1' },
        {
          op: 'select',
          bind: 'p1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Water Seven',
            costIs: 5,
            nameNot: 'Blueno',
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand (skip to play from trash)',
        },
        { op: 'playCards', ref: 'p1' },
        { op: 'abortIfChosen', ref: 'p1' },
        {
          op: 'select',
          bind: 'p2',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Water Seven',
            costIs: 5,
            nameNot: 'Blueno',
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'p2' },
      ],
    },
  ],
  'EB01-034': [
    {
      timing: 'onEvent',
      on: { kind: 'attackDeclared', who: 'opponent' },
      oncePerTurn: true,
      condition: { leaderTypeContains: 'Baroque Works' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!: add 1 active DON!! from your DON!! deck?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'EB01-035': [
    {
      timing: 'onPlay',
      condition: { leaderTypeContains: 'Baroque Works' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b2' },
        { op: 'returnDon', ref: 'b2' },
        { op: 'playSelf' },
      ],
    },
  ],
  'EB01-036': [
    {
      timing: 'onKo',
      condition: { leaderTypeIncludes: 'Impel Down' },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'EB01-037': [
    {
      timing: 'onEvent',
      on: { kind: 'attackDeclared', who: 'opponent' },
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!: K.O. a cost-2-or-less Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'EB01-038': [
    {
      timing: 'counter',
      condition: { leaderTypeContains: 'Baroque Works' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'returnDon', ref: 'b1' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters' },
          min: 1,
          max: 1,
          prompt: 'Redirect the attack to which Character?',
        },
        { op: 'redirectAttack', ref: 'c' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b2' },
        { op: 'returnDon', ref: 'b2' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'EB01-039': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'returnDon', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 8 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'EB01-040': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', costIs: 0 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with a cost of 0',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'EB01-042': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Dressrosa',
            costAtMost: 3,
            nameNot: 'Scarlet',
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 other Dressrosa Character with a cost of 3 or less, rested',
        },
        { op: 'playCards', ref: 'p', rested: true },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -2 cost',
        },
        { op: 'costMod', ref: 'c', amount: -2, duration: 'turn' },
      ],
    },
  ],
  'EB01-043': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', typeContains: 'CP' },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'You may bottom-deck 3 CP cards from your trash',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashToDeckBottom', ref: 'b1' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeContains: 'CP',
            costAtMost: 4,
            nameNot: 'Spandine',
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 other CP Character with a cost of 4 or less, rested',
        },
        { op: 'playCards', ref: 'p', rested: true },
      ],
    },
  ],
  'EB01-044': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 's',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Spandam' },
          min: 0,
          max: 1,
          prompt: '+3000 power this turn',
        },
        { op: 'powerMod', ref: 's', amount: 3000, duration: 'turn' },
      ],
    },
  ],
  'EB01-045': [
    {
      timing: 'onPlay',
      condition: { oppCharCostAtMost: 0 },
      ops: [{ op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' }],
    },
  ],
  'EB01-046': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -1 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -1, duration: 'turn' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costIs: 0 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -1 cost',
        },
        { op: 'costMod', ref: 'b3', amount: -1, duration: 'turn' },
        {
          op: 'select',
          bind: 'b4',
          filter: { owner: 'opponent', zone: 'characters', costIs: 0 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b4' },
      ],
    },
  ],
  'EB01-047': [
    {
      timing: 'onEvent',
      on: { kind: 'characterKoed', who: 'self', anyPlayer: true },
      oncePerTurn: true,
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],
  'EB01-048': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -4 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -4, duration: 'turn' },
      ],
    },
  ],
  'EB01-049': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'EB01-050': [
    {
      timing: 'counter',
      condition: { minTrashSelf: 30 },
      ops: [{ op: 'deckTopToLife', count: 1 }],
    },
  ],
  'EB01-051': [
    {
      timing: 'main',
      ops: [
        { op: 'millSelf', count: 2 },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with a cost of 5 or less',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'EB01-052': [
    {
      timing: 'onPlay',
      ops: [{ op: 'scryLifeTops', prompt: 'Reorder a Life top (mode A, approximated)' }],
    },
  ],
  'EB01-053': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: "Place up to 1 Character on top of your opponent's Life, face-up",
        },
        { op: 'fieldToLife', ref: 'c', faceUp: true },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters' },
          min: 0,
          max: 2,
          prompt: 'Give -3000 power to up to 2 Leader or Characters',
        },
        { op: 'powerMod', ref: 't', amount: -3000, duration: 'turn' },
      ],
    },
  ],
  'EB01-054': [
    {
      timing: 'onPlay',
      condition: { maxLifeOpp: 1 },
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with a cost of 3 or less',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'EB01-056': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add the top or bottom Life card to hand: draw 1?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'lifeToHand', ref: 'g' },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'EB01-057': [
    {
      timing: 'onKo',
      koCause: 'oppEffect',
      ops: [{ op: 'deckTopToLife', count: 1 }],
    },
  ],
  'EB01-059': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
        { op: 'trashLifeDownTo', count: 1 },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', costAtMostTotalLife: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with cost at most the total Life count',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'EB01-060': [
    {
      timing: 'main',
      ops: [
        { op: 'trashLifeDownTo', count: 1 },
        {
          op: 'select',
          bind: 'p1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Enel', costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Play [Enel] from hand (skip to play from trash)',
        },
        { op: 'playCards', ref: 'p1' },
        { op: 'abortIfChosen', ref: 'p1' },
        {
          op: 'select',
          bind: 'p2',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Enel', costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Play [Enel] from trash',
        },
        { op: 'playCards', ref: 'p2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'b1' },
      ],
    },
  ],
  'EB01-061': [
    { timing: 'onPlay', ops: [{ op: 'addDon', count: 1, rested: false }] },
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: "Copy this Character's power as your base power",
        },
        { op: 'abortIfEmpty', ref: 'c' },
        { op: 'basePowerToRef', ref: 'c', duration: 'turn' },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const EB01_STATICS: Record<string, StaticDef[]> = {
  // Oden leader: counter-less Land of Wano Characters counter for +1000
  'EB01-001': [
    {
      target: {
        scope: 'myHand',
        cardType: 'Character',
        typeIncludes: 'Land of Wano',
        noCounter: true,
      },
      counterSet: 1000,
    },
  ],
  'EB01-014': [
    {
      target: { scope: 'self' },
      donRequired: 1,
      condition: { yourTurn: true },
      powerPer: { selfRestedDonPerN: 3, amount: 1000 },
    },
  ],
  'EB01-024': [
    {
      target: { scope: 'myCharacters', typeIncludes: 'SMILE' },
      condition: { maxHandSelf: 4 },
      power: 1000,
    },
  ],
  'EB01-027': [
    {
      target: { scope: 'self' },
      condition: { leaderTypeContains: 'Baroque Works' },
      powerPer: { trashEventsPer2: true, amount: 1000 },
    },
  ],
  'EB01-058': [
    {
      target: { scope: 'self' },
      donRequired: 1,
      condition: { yourTurn: true, maxLifeSelf: 2 },
      power: 2000,
    },
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_EB01: string[] = ['EB01-017']

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_EB01: Record<string, string> = {
  'EB01-029':
    'SIMPLIFIED: the revealed card stays on top (publicly known) instead of moving to the deck bottom.',
  'EB01-051':
    'SIMPLIFIED: the optional deck-top trash is mandatory (playing the Event is the opt-in).',
  'EB01-052':
    "SIMPLIFIED: mode A only, via the Life-top scry (the full reorder of the opponent's Life and the turn-all-face-down mode are not modeled).",
  'EB01-053':
    "SIMPLIFIED: the Character always goes to the TOP of the opponent's Life (the printed text offers top or bottom).",
  'EB01-059':
    'SIMPLIFIED: ops reordered - the Life self-trash resolves after the K.O. as printed; identical.',
  'EB01-060':
    'SIMPLIFIED: the Life self-trash resolves before the play (the hand/trash branch uses the choose-one fallthrough).',
}
