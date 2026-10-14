import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * EB02 (Anime 25th) effect definitions as DSL data, keyed by card ID. Compiled
 * entries were drafted by scripts/compile-effects.ts and reviewed; the rest are
 * authored against the printed text. Deviations are in COVERAGE_NOTES_EB02.
 */
export const EB02_EFFECTS: Record<string, EffectDef[]> = {
  'EB02-002': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Revolutionary Army',
            nameNot: 'Sabo',
          },
          min: 0,
          max: 1,
          prompt: '+2000 power this turn',
        },
        { op: 'powerMod', ref: 't', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'EB02-003': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Straw Hat Crew' },
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
  'EB02-006': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: {
        anyOf: [{ leaderTypeIncludes: 'Land of Wano' }, { leaderNameIs: 'Portgas.D.Ace' }],
      },
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to your Leader',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'L' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'EB02-007': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 3,
          prompt: 'Up to 3 of your Leader/Characters gain +1000 power',
        },
        { op: 'powerMod', ref: 't', amount: 1000, duration: 'turn' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 3000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 4000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'EB02-008': [
    {
      timing: 'main',
      ops: [{ op: 'searchTop', count: 4, filter: { costAtLeast: 4 }, upTo: 1, to: 'hand' }],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'EB02-009': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Straw Hat Crew' },
          min: 0,
          max: 1,
          prompt: 'Move up to 1 given DON!! onto a Straw Hat Crew Character',
        },
        { op: 'moveAttachedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'EB02-010': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restDon: 2 },
      condition: { allSelfCharsTyped: 'Straw Hat Crew' },
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 2,
          prompt: 'Set up to 2 DON!! active',
        },
        { op: 'setActive', ref: 'd' },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'EB02-011': [
    {
      timing: 'onPlay',
      condition: {
        anyOf: [{ leaderTypeIncludes: 'Fish-Man' }, { leaderTypeIncludes: 'East Blue' }],
      },
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to your Leader',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'L' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: "Cannot be rested until the end of your opponent's next turn",
        },
        { op: 'grantFlag', ref: 'c', flag: 'noRest', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'EB02-013': [
    {
      timing: 'onPlay',
      condition: { minDonField: 3 },
      ops: [
        { op: 'searchTop', count: 7, filter: { nameIs: 'Zou' }, upTo: 1, to: 'hand' },
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Zou' },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 [Zou]',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB02-014': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Gaimon' },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 [Gaimon]',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB02-015': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', rested: true },
          min: 0,
          max: 1,
          prompt: 'A rested Character skips the next Refresh Phase',
        },
        { op: 'grantFlag', ref: 'r', flag: 'noRefresh', duration: 'untilTurn', untilTurnOffset: 1 },
        { op: 'atTurnEnd', kind: 'setActiveDon', count: 1 },
      ],
    },
  ],
  'EB02-016': [
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
            typeIncludes: 'Animal',
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
  'EB02-017': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Nami', typeIncludes: 'Straw Hat Crew' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'EB02-018': [
    {
      timing: 'onPlay',
      condition: { lacksOtherCharacterNamed: 'Buggy' },
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: 'Your Leader gains [Double Attack] this turn',
        },
        { op: 'grantKeyword', ref: 'L', keyword: 'Double Attack', duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'EB02-019': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Straw Hat Crew' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'EB02-020': [
    {
      timing: 'main',
      ops: [{ op: 'searchTop', count: 4, filter: { costAtLeast: 4 }, upTo: 1, to: 'hand' }],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'EB02-021': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Straw Hat Crew' },
          min: 0,
          max: 1,
          prompt: '+6000 power (skips your next Refresh Phase)',
        },
        { op: 'powerMod', ref: 't', amount: 6000, duration: 'turn' },
        { op: 'grantFlag', ref: 't', flag: 'noRefresh', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'EB02-022': [
    {
      timing: 'onPlay',
      condition: { maxSelfCharsPoweredAtLeast: { power: 5000, count: 2 } },
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            powerAtMost: 6000,
            noBaseEffect: true,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Character with 6000 power or less and no base effect',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB02-023': [
    {
      timing: 'onEvent',
      on: { kind: 'charRemovedByEffect', who: 'self', byOwnEffect: true },
      oncePerTurn: true,
      condition: { yourTurn: true },
      ops: [{ op: 'scryBottom', count: 3 }],
    },
  ],
  'EB02-024': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'hand' },
          min: 2,
          max: 2,
          prompt: 'Place 2 cards at the deck bottom',
        },
        { op: 'bottomDeck', ref: 'b' },
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'any', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Return up to 1 Character with a cost of 1 or less to hand',
        },
        { op: 'returnToHand', ref: 'r' },
      ],
    },
  ],
  'EB02-025': [
    {
      timing: 'activateMain',
      cost: { restDon: 1, restSelf: true },
      condition: { leaderNameIs: 'Donquixote Rosinante' },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', costAtMost: 2 },
          upTo: 1,
          to: 'play',
          playRested: true,
        },
      ],
    },
  ],
  'EB02-026': [
    {
      timing: 'onPlay',
      condition: { leaderMulticolor: true, maxHandSelf: 5 },
      ops: [{ op: 'draw', count: 2 }],
    },
  ],
  'EB02-027': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 1000 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
    },
  ],
  'EB02-028': [
    {
      timing: 'onPlay',
      condition: { leaderTypeContains: 'Whitebeard Pirates' },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', costIs: 2 },
          upTo: 1,
          to: 'hand',
        },
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', costIs: 2 },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 cost-2 Character, rested',
        },
        { op: 'playCards', ref: 'p', rested: true },
      ],
    },
  ],
  'EB02-030': [
    {
      timing: 'counter',
      ops: [{ op: 'grantFlagAll', flag: 'noBattleKo', duration: 'turn' }],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'EB02-031': [
    {
      timing: 'main',
      ops: [{ op: 'searchTop', count: 4, filter: { costAtLeast: 4 }, upTo: 1, to: 'hand' }],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'EB02-032': [
    {
      timing: 'onPlay',
      condition: { minDonField: 3 },
      ops: [
        { op: 'searchTop', count: 7, filter: { nameIs: 'Galley-La Company' }, upTo: 1, to: 'hand' },
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Galley-La Company' },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 [Galley-La Company]',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB02-035': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self', minCount: 2 },
      oncePerTurn: true,
      condition: { yourTurn: true },
      ops: [{ op: 'addDon', count: 1, rested: false }],
    },
    {
      timing: 'onPlay',
      condition: { oppAtLeastSelfDon: true },
      ops: [{ op: 'draw', count: 1 }],
    },
  ],
  'EB02-036': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Rest 1 DON!! to look at your top 3?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'searchTop',
          count: 3,
          filter: { typeIncludes: 'Straw Hat Crew' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'EB02-037': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Straw Hat Crew', oppAtLeastSelfDon: true },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
    {
      timing: 'whenAttacking',
      condition: { leaderTypeIncludes: 'Straw Hat Crew', oppAtLeastSelfDon: true },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'EB02-038': [
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
            typeIncludes: 'Impel Down',
            costAtMost: 2,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'EB02-039': [
    {
      timing: 'main',
      condition: { oppAtLeastSelfDon: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            typeIncludes: 'GERMA 66',
            cardType: 'Character',
            powerAtMost: 4000,
          },
          min: 0,
          max: 1,
          prompt: 'You may trash 1 GERMA 66 Character',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            powerAtLeast: 5000,
            powerAtMost: 7000,
            sameNameAsRef: 'b1',
          },
          min: 0,
          max: 1,
          prompt: 'Play the 5000-7000 power version from your trash',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB02-040': [
    {
      timing: 'main',
      ops: [{ op: 'searchTop', count: 4, filter: { costAtLeast: 4 }, upTo: 1, to: 'hand' }],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'EB02-041': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Straw Hat Crew' },
      ops: [{ op: 'draw', count: 1 }],
    },
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { oppAtLeastSelfDon: true },
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Straw Hat Crew' },
          min: 0,
          max: 1,
          prompt: "+2 cost until the end of your opponent's next turn",
        },
        { op: 'costMod', ref: 't', amount: 2, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'EB02-044': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Navy',
            colorIncludes: 'Black',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 black Navy Character from your trash, rested',
        },
        { op: 'playCards', ref: 'p', rested: true },
      ],
    },
  ],
  'EB02-045': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Bottom-deck 2 trash cards to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashToDeckBottom', ref: 'pay' },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'EB02-046': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'millSelf', count: 2 },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -1 cost',
        },
        { op: 'costMod', ref: 'c', amount: -1, duration: 'turn' },
      ],
    },
  ],
  'EB02-047': [
    {
      timing: 'activateMain',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1 card from your hand',
        },
        { op: 'trashCards', ref: 'pay' },
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeContains: 'CP',
            costAtMost: 5,
            nameNot: 'Blueno',
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 other CP Character with a cost of 5 or less from your trash',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB02-048': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Laboon' },
          min: 0,
          max: 1,
          prompt: 'Add up to 1 [Laboon] to hand',
        },
        { op: 'toHand', ref: 't' },
      ],
    },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Laboon', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 [Laboon] with a cost of 4 or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB02-049': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: 'Give up to 2 rested DON!! to your Leader',
        },
        { op: 'giveRestedDon', upTo: 2, toRef: 'L' },
      ],
    },
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { leaderNameIs: 'Monkey.D.Garp' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'EB02-050': [
    {
      timing: 'main',
      ops: [{ op: 'searchTop', count: 4, filter: { costAtLeast: 4 }, upTo: 1, to: 'hand' }],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'EB02-051': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Mode A: K.O. a cost-2-or-less Character (skip for -4 cost)',
        },
        { op: 'ko', ref: 'k' },
        { op: 'abortIfChosen', ref: 'k' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -4 cost',
        },
        { op: 'costMod', ref: 'c', amount: -4, duration: 'turn' },
      ],
    },
  ],
  'EB02-052': [
    {
      timing: 'whenAttacking',
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
        { op: 'requireCond', cond: { maxLifeSelf: 1 } },
        { op: 'deckTopToLife', count: 1 },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'EB02-053': [
    {
      timing: 'onPlay',
      ops: [{ op: 'scryLifeTops', prompt: 'Look at a Life top; move it to the bottom?' }],
    },
    {
      timing: 'onKo',
      ops: [{ op: 'scryLifeTops', prompt: 'Look at a Life top; move it to the bottom?' }],
    },
  ],
  'EB02-054': [
    {
      timing: 'onPlay',
      condition: { maxLifeSelf: 2 },
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
  'EB02-055': [
    {
      timing: 'trigger',
      condition: {
        anyOf: [{ leaderTypeIncludes: 'Fish-Man' }, { leaderTypeIncludes: 'Merfolk' }],
        maxLifeSelf: 2,
      },
      ops: [{ op: 'playSelf' }],
    },
  ],
  'EB02-056': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: {
            cardType: 'Character',
            typeIncludes: 'Scientist',
            costAtMost: 5,
            nameNot: 'Vegapunk',
          },
          upTo: 1,
          to: 'play',
        },
        { op: 'requireCond', cond: { maxOppCharacters: 2 } },
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
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'EB02-057': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add the top or bottom Life card to hand to activate?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'lifeToHand', ref: 'g' },
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
  ],
  'EB02-058': [
    {
      timing: 'main',
      ops: [{ op: 'searchTop', count: 4, filter: { costAtLeast: 4 }, upTo: 1, to: 'hand' }],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'EB02-059': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'battle' },
        { op: 'requireCond', cond: { maxLifeSelf: 1 } },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            costAtMost: 5,
            colorIncludes: 'Yellow',
            typeIncludes: 'Straw Hat Crew',
            orNameIs: 'Sanji',
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 yellow Straw Hat Crew Character or [Sanji]',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB02-060': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Straw Hat Crew' },
          min: 0,
          max: 1,
          prompt: "+1000 power until the end of your opponent's next turn",
        },
        { op: 'powerMod', ref: 't', amount: 1000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'EB02-061': [
    {
      timing: 'whenAttacking',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Return 2 active DON!! to set this Character active?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'setActive', ref: 'self' },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const EB02_STATICS: Record<string, StaticDef[]> = {
  'EB02-003': [
    { target: { scope: 'self' }, donRequired: 2, condition: { opponentsTurn: true }, power: 2000 },
  ],
  // Fake Straw Hat Crew: +2000 on your turn, -2000 (sign-dropped) on theirs
  'EB02-005': [
    { target: { scope: 'self' }, condition: { yourTurn: true }, power: 2000 },
    { target: { scope: 'self' }, condition: { opponentsTurn: true }, power: -2000 },
  ],
  'EB02-012': [
    {
      target: { scope: 'self' },
      condition: { hasCharacterNamed: 'Sarfunkel' },
      keyword: 'Blocker',
    },
  ],
  'EB02-019': [
    { target: { scope: 'self' }, condition: { minOppCharacters: 2 }, flag: 'rushCharactersOnly' },
  ],
  'EB02-033': [
    { target: { scope: 'self' }, condition: { hasStageNamed: 'Merry Go' }, keyword: 'Blocker' },
  ],
  'EB02-052': [
    { target: { scope: 'self' }, condition: { leaderTypeIncludes: 'Sky Island' }, keyword: 'Rush' },
  ],
  'EB02-061': [
    {
      target: { scope: 'self' },
      condition: { leaderMulticolor: true, minDonFieldOpp: 5 },
      keyword: 'Rush',
    },
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_EB02: string[] = []

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_EB02: Record<string, string> = {
  'EB02-023':
    "SIMPLIFIED: the listener fires on ANY of your removal effects on a Character (destination and ownership are not narrowed to 'opponent's Character to hand').",
  'EB02-030':
    'SIMPLIFIED: the battle-K.O. guard is a flat noBattleKo for the turn; the trash-1-card-per-save payment is waived (events cannot host guardKo windows).',
  'EB02-045':
    "SIMPLIFIED: mode A (draw 1) only; the 'opponent trashes 1 if they hold 5+' mode is not offered.",
  'EB02-053':
    'SIMPLIFIED: the Life peek is the shared Life-top scry (top card may move to the bottom).',
  'EB02-057':
    "SIMPLIFIED: the Character always goes to the TOP of the opponent's Life (printed offers top or bottom).",
}
