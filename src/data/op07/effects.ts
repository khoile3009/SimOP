import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP07 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts; the rest are authored against the
 * printed text. Deviations are documented in COVERAGE_NOTES_OP07.
 */
export const OP07_EFFECTS: Record<string, EffectDef[]> = {
  'OP07-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters' },
          min: 1,
          max: 1,
          prompt: 'Move DON!! to',
        },
        { op: 'moveAttachedDon', upTo: 2, toRef: 'b1' },
      ],
    },
  ],
  'OP07-002': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Set power to 0',
        },
        { op: 'setPower', ref: 'b1', value: 0, duration: 'turn' },
      ],
    },
  ],
  'OP07-003': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 2,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'OP07-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', powerAtMost: 2000 },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP07-005': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'OP07-006': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'leader', rested: false },
          min: 0,
          max: 1,
          prompt: 'Give your Leader -5000 power?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'powerMod', ref: 'pay', amount: -5000, duration: 'turn' },
        { op: 'draw', count: 1 },
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
  'OP07-008': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],
  'OP07-009': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', colorIncludes: 'Red', costIs: 1 },
          min: 0,
          max: 1,
          prompt: 'Grant Double Attack',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Double Attack', duration: 'turn' },
      ],
    },
  ],
  'OP07-010': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'battle' },
      ],
    },
  ],
  'OP07-011': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 2000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
      donRequired: 1,
    },
  ],
  'OP07-012': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -1000, duration: 'turn' },
      ],
    },
  ],
  'OP07-013': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Portgas.D.Ace' },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Event', colorIncludes: 'Red', orNameIs: 'Portgas.D.Ace' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP07-014': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Portgas.D.Ace' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP07-015': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 1,
          max: 1,
          prompt: 'Give DON!! to',
        },
        { op: 'giveRestedDon', upTo: 2, toRef: 'b1' },
      ],
    },
  ],
  'OP07-016': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b0',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Revolutionary Army' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b0', amount: 2000, duration: 'turn' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -1000, duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP07-017': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 3000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b3' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP07-018': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Revolutionary Army' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'counter' }] },
  ],
  'OP07-019': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may rest 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP07-020': [
    {
      timing: 'onKo',
      condition: { leaderTypeIncludes: 'Fish-Man' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludesAny: ['Fish-Man', 'Merfolk'],
            costAtMost: 3,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP07-021': [
    {
      timing: 'endOfTurn',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set DON!! active',
        },
        { op: 'setActive', ref: 'b1' },
      ],
    },
  ],
  'OP07-022': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Otama', typeIncludes: 'Land of Wano', colorIncludes: 'Green' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP07-024': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Koala', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest Koala?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Fish-Man', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Grant Blocker',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Blocker', duration: 'turn' },
      ],
    },
  ],
  'OP07-025': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Caribou', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Play Caribou rested',
        },
        { op: 'playCards', ref: 'b1', rested: true },
      ],
    },
  ],
  'OP07-026': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters', rested: true },
          min: 0,
          max: 1,
          prompt: 'Mode 1: Character stays rested',
        },
        { op: 'grantFlag', ref: 'c', flag: 'noRefresh', duration: 'untilYourNextTurn' },
        { op: 'abortIfChosen', ref: 'c' },
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'opponent', zone: 'don', rested: true },
          min: 0,
          max: 1,
          prompt: 'Mode 2: DON!! stays rested',
        },
        { op: 'grantFlag', ref: 'd', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'OP07-029': [
    {
      timing: 'replaceKo',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest an opponent Character to save Hawkins?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'rest', ref: 'pay' },
      ],
    },
  ],
  'OP07-031': [
    {
      timing: 'onEvent',
      on: { kind: 'restedByEffect', who: 'self' },
      condition: { yourTurn: true },
      oncePerTurn: true,
      ops: [
        { op: 'draw', count: 1 },
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
  'OP07-032': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
      condition: { leaderTypeIncludesAny: ['Fish-Man', 'Merfolk'] },
    },
  ],
  'OP07-034': [
    {
      timing: 'whenAttacking',
      condition: { minSelfCharacters: 3 },
      ops: [{ op: 'powerMod', ref: 'self', amount: 2000, duration: 'turn' }],
    },
  ],
  'OP07-035': [
    {
      timing: 'counter',
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
        { op: 'requireCond', cond: { minSelfCharacters: 3 } },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'battle' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4, rested: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP07-036': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 3000, duration: 'turn' },
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', costAtLeast: 3, rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest 1 of your Characters?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b3' },
      ],
    },
  ],
  'OP07-037': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'More Pizza!!', typeIncludes: 'Supernovas' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP07-038': [
    {
      timing: 'onEvent',
      on: { kind: 'charRemovedByEffect', who: 'self' },
      condition: { yourTurn: true, maxHandSelf: 5 },
      oncePerTurn: true,
      ops: [{ op: 'draw', count: 1 }],
    },
  ],
  'OP07-039': [{ timing: 'whenAttacking', donRequired: 1, ops: [{ op: 'scryBottom', count: 3 }] }],
  'OP07-040': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may rest 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'rest', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'any', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b2' },
      ],
    },
  ],
  'OP07-041': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: {
            nameNot: 'Gloriosa (Grandma Nyon)',
            typeIncludesAny: ['Amazon Lily', 'Kuja Pirates'],
          },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP07-042': [
    {
      timing: 'replaceKo',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      condition: { leaderTypeIncludes: 'The Seven Warlords of the Sea' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', nameNot: 'Gecko Moria' },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck a Character to save Moria?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'bottomDeckFromField', ref: 'pay' },
      ],
    },
  ],
  'OP07-043': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Boa Hancock' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP07-044': [{ timing: 'onPlay', ops: [{ op: 'draw', count: 1 }] }],
  'OP07-045': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            nameNot: 'Jinbe',
            typeIncludes: 'The Seven Warlords of the Sea',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP07-046': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'The Seven Warlords of the Sea' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP07-047': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'returnToHand', ref: 'self' },
        { op: 'requireCond', cond: { minHandOpp: 6 } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 1,
          max: 1,
          chooser: 'opponent',
          prompt: 'Bottom-deck 1 from your hand',
        },
        { op: 'bottomDeck', ref: 'b1' },
      ],
    },
  ],
  'OP07-048': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restDon: 2 },
      ops: [
        {
          op: 'revealTopMayPlay',
          filter: {
            cardType: 'Character',
            typeIncludes: 'The Seven Warlords of the Sea',
            costAtMost: 4,
          },
          rested: true,
        },
      ],
    },
  ],
  'OP07-049': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Edward Weevil', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Play Edward Weevil rested',
        },
        { op: 'playCards', ref: 'b1', rested: true },
      ],
    },
  ],
  'OP07-050': [
    {
      timing: 'onPlay',
      condition: { minSelfCharsTypedAny: { types: ['Amazon Lily', 'Kuja Pirates'], count: 2 } },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP07-051': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', nameNot: 'Monkey.D.Luffy' },
          min: 0,
          max: 1,
          prompt: 'Cannot attack',
        },
        {
          op: 'grantFlag',
          ref: 'b1',
          flag: 'cannotAttack',
          duration: 'untilTurn',
          untilTurnOffset: 1,
        },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'any', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b2' },
      ],
    },
  ],
  'OP07-052': [
    {
      timing: 'onPlay',
      condition: { minSelfCharsTypedAny: { types: ['Amazon Lily', 'Kuja Pirates'], count: 2 } },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
    },
  ],
  'OP07-053': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand' },
          min: 2,
          max: 2,
          prompt: 'Bottom-deck 2',
        },
        { op: 'bottomDeck', ref: 'b1' },
      ],
    },
  ],
  'OP07-054': [{ timing: 'onPlay', ops: [{ op: 'draw', count: 1 }] }],
  'OP07-055': [
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
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Return 1 of your Characters?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnToHand', ref: 'pay' },
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b3' },
      ],
    },
  ],
  'OP07-056': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', costAtLeast: 2 },
          min: 0,
          max: 1,
          prompt: 'Return 1 of your Characters?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnToHand', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 4000, duration: 'battle' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'hand' },
          min: 2,
          max: 2,
          prompt: 'Bottom-deck 2',
        },
        { op: 'bottomDeck', ref: 'b2' },
      ],
    },
  ],
  'OP07-057': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'leaderOrCharacters',
            typeIncludes: 'The Seven Warlords of the Sea',
          },
          min: 0,
          max: 1,
          prompt: '+2000 power, no blockers',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
        { op: 'grantFlag', ref: 'b1', flag: 'noBlockCostAtMost', value: 99, duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP07-058': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { leaderTypeIncludes: 'Kuja Pirates' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludesAny: ['Amazon Lily', 'Kuja Pirates'],
          },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP07-059': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'You may return 3 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'returnDon', ref: 'b1' },
        {
          op: 'requireCond',
          cond: { minSelfCharsTypedAny: { types: ['Foxy Pirates'], count: 3 } },
        },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'opponent', zone: 'leader', rested: true },
          min: 0,
          max: 1,
          prompt: 'Leader stays rested',
        },
        { op: 'grantFlag', ref: 'L', flag: 'noRefresh', duration: 'untilYourNextTurn' },
        {
          op: 'select',
          bind: 'C',
          filter: { owner: 'opponent', zone: 'characters', rested: true },
          min: 0,
          max: 1,
          prompt: 'Character stays rested',
        },
        { op: 'grantFlag', ref: 'C', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'OP07-060': [
    {
      timing: 'activateMain',
      ops: [{ op: 'addDon', count: 1, rested: true }],
      oncePerTurn: true,
      condition: { leaderTypeIncludes: 'Foxy Pirates' },
    },
  ],
  'OP07-061': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'returnDon', ref: 'b1' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'The Vinsmoke Family' } },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'OP07-062': [
    {
      timing: 'onPlay',
      condition: { oppAtLeastSelfDon: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'The Vinsmoke Family',
            costIs: 1,
          },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP07-063': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'returnDon', ref: 'b1' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Foxy Pirates' } },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Cannot attack',
        },
        {
          op: 'grantFlag',
          ref: 'b2',
          flag: 'cannotAttack',
          duration: 'untilTurn',
          untilTurnOffset: 1,
        },
      ],
    },
  ],
  'OP07-065': [
    {
      timing: 'onPlay',
      ops: [{ op: 'addDon', count: 1, rested: false }],
      condition: { leaderTypeIncludes: 'Foxy Pirates' },
    },
  ],
  'OP07-066': [
    {
      timing: 'onPlay',
      condition: { oppAtLeastSelfDon: true },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'OP07-068': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      condition: { oppAtLeastSelfDon: true },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'OP07-070': [
    {
      timing: 'onPlay',
      condition: { oppAtLeastSelfDon: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            typeIncludes: 'Foxy Pirates',
            cardTypeAny: ['Character', 'Stage'],
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP07-071': [
    { timing: 'activateMain', ops: [{ op: 'addDon', count: 1, rested: true }], oncePerTurn: true },
  ],
  'OP07-072': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'returnDon', ref: 'b1' },
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Foxy Pirates' },
          upTo: 1,
          to: 'hand',
        },
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'hand',
            colorIncludes: 'Purple',
            cardType: 'Character',
            basePowerAtMost: 4000,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP07-073': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 3 },
      condition: { minOppCharacters: 3 },
      ops: [{ op: 'setActive', ref: 'self' }],
    },
  ],
  'OP07-074': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Foxy Pirates' } },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
  ],
  'OP07-075': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'returnDon', ref: 'b1' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'opponent', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'L', amount: -2000, duration: 'turn' },
        {
          op: 'select',
          bind: 'C',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'C', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'OP07-076': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don' },
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
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 2000, duration: 'battle' },
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b3' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'OP07-077': [
    {
      timing: 'main',
      condition: { leaderTypeIncludesAny: ['Animal Kingdom Pirates', 'Big Mom Pirates'] },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludesAny: ['Animal Kingdom Pirates', 'Big Mom Pirates'] },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP07-078': [
    {
      timing: 'main',
      condition: { oppAtLeastSelfDon: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Foxy', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'OP07-079': [{ timing: 'whenAttacking', ops: [{ op: 'millSelf', count: 2 }] }],
  'OP07-080': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', typeContains: 'CP' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may bottom-deck 2 from your trash',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashToDeckBottom', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -3 cost',
        },
        { op: 'costMod', ref: 'b2', amount: -3, duration: 'turn' },
      ],
    },
  ],
  'OP07-082': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'millSelf', count: 2 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -1 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -1, duration: 'turn' },
      ],
    },
  ],
  'OP07-083': [
    {
      timing: 'activateMain',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash', typeIncludes: 'Thriller Bark Pirates' },
          min: 4,
          max: 4,
          prompt: 'Bottom-deck 4 from trash',
        },
        { op: 'trashToDeckBottom', ref: 'pay' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Banish', duration: 'turn' },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'OP07-085': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Trash 1 of your Characters?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashFromField', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP07-086': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'millSelf', count: 2 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -2 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -2, duration: 'turn' },
      ],
    },
  ],
  'OP07-088': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Rob Lucci' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP07-090': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 1,
          max: 1,
          chooser: 'opponent',
          prompt: 'Trash 1 from your hand',
        },
        { op: 'trashCards', ref: 'b1' },
        { op: 'draw', count: 1, who: 'opponent' },
      ],
    },
  ],
  'OP07-091': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Trash up to 1',
        },
        { op: 'trashFromField', ref: 't' },
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'trash', cardType: 'Character', costAtLeast: 4 },
          min: 0,
          max: 12,
          prompt: 'Bottom-deck any number',
        },
        { op: 'trashToDeckBottom', ref: 'p' },
        {
          op: 'powerModPerRef',
          ref: 'self',
          countRef: 'p',
          amountPer: 1000,
          per: 3,
          duration: 'turn',
        },
      ],
    },
  ],
  'OP07-092': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', typeContains: 'CP' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may bottom-deck 2 from your trash',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashToDeckBottom', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP07-093': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash' },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'Bottom-deck 3 from trash?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashToDeckBottom', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 1,
          max: 1,
          chooser: 'opponent',
          prompt: 'Trash 1 from your hand',
        },
        { op: 'trashCards', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'trash' },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck from their trash',
        },
        { op: 'trashToDeckBottom', ref: 'b2' },
      ],
    },
  ],
  'OP07-094': [
    {
      timing: 'counter',
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
        { op: 'requireCond', cond: { minTrashSelf: 10 } },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'characters', typeContains: 'CP' },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b3' },
      ],
    },
  ],
  'OP07-095': [
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
        { op: 'requireCond', cond: { minTrashSelf: 10 } },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'battle' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'OP07-096': [
    {
      timing: 'main',
      ops: [
        { op: 'draw', count: 1 },
        { op: 'requireCond', cond: { minTrashSelf: 10 } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -3 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -3, duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP07-097': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restDon: 1 },
      ops: [
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Egghead', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Play it',
        },
        { op: 'playCards', ref: 'h' },
        { op: 'abortIfChosen', ref: 'h' },
        {
          op: 'select',
          bind: 'h2',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Egghead', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Add to top of Life',
        },
        { op: 'handToLife', ref: 'h2' },
      ],
    },
  ],
  'OP07-098': [
    { timing: 'trigger', condition: { leaderNameIs: 'Vegapunk' }, ops: [{ op: 'playSelf' }] },
  ],
  'OP07-099': [
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Egghead' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP07-100': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand' },
          min: 2,
          max: 2,
          prompt: 'Trash 2',
        },
        { op: 'trashCards', ref: 'b1' },
      ],
      condition: { maxLifeSelf: 2 },
    },
    { timing: 'trigger', condition: { leaderNameIs: 'Vegapunk' }, ops: [{ op: 'playSelf' }] },
  ],
  'OP07-101': [
    { timing: 'trigger', condition: { leaderNameIs: 'Vegapunk' }, ops: [{ op: 'playSelf' }] },
  ],
  'OP07-102': [
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
        { op: 'selfToHand' },
      ],
    },
  ],
  'OP07-103': [
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Egghead' },
          min: 0,
          max: 1,
          prompt: 'Grant Blocker',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Blocker', duration: 'turn' },
        { op: 'selfToHand' },
      ],
    },
  ],
  'OP07-104': [
    {
      timing: 'trigger',
      ops: [{ op: 'draw', count: 2 }],
      condition: { leaderTypeIncludes: 'Egghead' },
    },
  ],
  'OP07-105': [
    {
      timing: 'onKo',
      condition: { maxLifeSelf: 2 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Egghead',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash rested',
        },
        { op: 'playCards', ref: 'b1', rested: true },
      ],
    },
    { timing: 'trigger', condition: { leaderNameIs: 'Vegapunk' }, ops: [{ op: 'playSelf' }] },
  ],
  'OP07-106': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
      donRequired: 1,
      condition: { maxLifeSelf: 1 },
    },
  ],
  'OP07-107': [
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 1 },
        { op: 'requireCond', cond: { maxLifeSelf: 1 } },
        { op: 'playSelf' },
      ],
    },
  ],
  'OP07-109': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
        { op: 'draw', count: 1 },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP07-110': [
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1 },
      ops: [
        {
          op: 'select',
          bind: 'lp',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 1,
          max: 1,
          prompt: 'Take a Life card (top or bottom) to hand',
        },
        { op: 'lifeToHand', ref: 'lp' },
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
    { timing: 'trigger', condition: { leaderNameIs: 'Vegapunk' }, ops: [{ op: 'playSelf' }] },
  ],
  'OP07-111': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Lilith', typeIncludes: 'Egghead' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', condition: { leaderNameIs: 'Vegapunk' }, ops: [{ op: 'playSelf' }] },
  ],
  'OP07-112': [
    {
      timing: 'whenAttacking',
      oncePerTurn: true,
      condition: { minLifeSelf: 1 },
      ops: [
        {
          op: 'select',
          bind: 'lp',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 1,
          max: 1,
          prompt: 'Take a Life card (top or bottom) to hand',
        },
        { op: 'lifeToHand', ref: 'lp' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
        { op: 'requireCond', cond: { maxLifeSelf: 1 } },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'OP07-113': [
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
      condition: { leaderTypeIncludes: 'Egghead' },
    },
  ],
  'OP07-114': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: {
            nameNot: "He Possesses the World's Most Brilliant Mind",
            typeIncludes: 'Egghead',
          },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP07-115': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 3000, duration: 'battle' },
      ],
      condition: { maxLifeSelf: 2 },
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Egghead',
            costAtMost: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP07-116': [
    {
      timing: 'main',
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
        { op: 'requireCond', cond: { maxLifeOpp: 2 } },
        {
          op: 'select',
          bind: 'r1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'r1' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 1000, duration: 'turn' },
        { op: 'requireCond', cond: { maxLifeOpp: 2 } },
        {
          op: 'select',
          bind: 'r2',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'r2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b3' },
      ],
    },
  ],
  'OP07-117': [
    {
      timing: 'endOfTurn',
      condition: { maxLifeSelf: 3 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Egghead',
            costAtMost: 5,
            rested: true,
          },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP07-118': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b3' },
        {
          op: 'select',
          bind: 'b4',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b4' },
      ],
    },
  ],
  'OP07-119': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'deckTopToLife', count: 1 },
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP07_STATICS: Record<string, StaticDef[]> = {
  'OP07-023': [{ condition: { minSelfRestedDon: 6 }, target: { scope: 'self' }, power: 1000 }],
  'OP07-029': [
    {
      condition: { leaderTypeIncludes: 'Supernovas' },
      target: { scope: 'self' },
      keyword: 'Blocker',
    },
  ],
  'OP07-030': [
    { condition: { hasCharacterNamed: 'Camie' }, target: { scope: 'self' }, keyword: 'Blocker' },
  ],
  'OP07-032': [{ target: { scope: 'self' }, flag: 'rushCharactersOnly' }],
  'OP07-033': [
    {
      condition: { minSelfCharacters: 3 },
      target: { scope: 'myCharacters', costAtMost: 3, nameNot: 'Monkey.D.Luffy' },
      flag: 'noOppEffectKo',
    },
  ],
  'OP07-064': [
    { condition: { oppDonAdvantageAtLeast: 2 }, target: { scope: 'handSelf' }, costMod: -3 },
  ],
  'OP07-069': [
    {
      condition: { oppAtLeastSelfDon: true },
      target: { scope: 'myCharactersOther', typeIncludes: 'Foxy Pirates', nameNot: 'Pickles' },
      flag: 'noOppEffectKo',
    },
  ],
  'OP07-071': [
    {
      condition: { opponentsTurn: true, leaderTypeIncludes: 'Foxy Pirates' },
      target: { scope: 'oppCharacters' },
      power: -1000,
    },
  ],
  'OP07-081': [
    {
      donRequired: 1,
      condition: { yourTurn: true },
      target: { scope: 'oppCharacters' },
      costMod: -1,
    },
  ],
  'OP07-087': [
    { condition: { yourTurn: true, oppCharCostAtMost: 0 }, target: { scope: 'self' }, power: 3000 },
  ],
  'OP07-097': [{ target: { scope: 'self' }, flag: 'cannotAttack' }],
  'OP07-098': [
    { target: { scope: 'self' }, condition: { lessLifeThanOpp: true }, flag: 'noBattleKo' },
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP07: string[] = ['OP07-084']

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP07: Record<string, string> = {
  'OP07-001':
    'SIMPLIFIED: the moved DON!! are taken leader-first (the exact source cards are not chosen)',
  'OP07-029':
    'SIMPLIFIED: the replacement covers opponent-effect K.O.s only (other removals go through)',
  'OP07-031': 'SIMPLIFIED: cost rests also count as "rested by your effect"',
  'OP07-042':
    'SIMPLIFIED: the replacement covers opponent-effect K.O.s only (other removals go through)',
  'OP07-048': 'SIMPLIFIED: an unplayed revealed card stays on top (text says bottom)',
  'OP07-053': 'SIMPLIFIED: both cards go to the bottom (text allows top or bottom)',
  'OP07-059':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP07-061':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP07-063':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP07-072':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP07-075':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP07-076':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP07-083':
    'SIMPLIFIED: with fewer than 4 Thriller Bark Pirates cards in the trash the cost clamps down',
  'OP07-090': 'SIMPLIFIED: the opponent hand reveal is not modeled',
  'OP07-097': 'SIMPLIFIED: play-or-life is offered as two selects; face-up life state not modeled',
}
