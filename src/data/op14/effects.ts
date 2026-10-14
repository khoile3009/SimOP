import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP14 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts; the rest are authored against the
 * printed text (API-dropped minus signs restored on opponent debuffs).
 * Deviations are documented in COVERAGE_NOTES_OP14.
 */
export const OP14_EFFECTS: Record<string, EffectDef[]> = {
  'OP14-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 's',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludesAny: ['Supernovas', 'Heart Pirates'],
          },
          min: 2,
          max: 2,
          prompt: 'Select 2 to swap base power',
        },
        { op: 'swapBasePower', ref: 's', duration: 'turn' },
      ],
    },
  ],
  'OP14-002': [
    {
      timing: 'whenAttacking',
      condition: { selfPowerAtLeast: 5000 },
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 3000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP14-005': [
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
          prompt: 'Give 1 rested DON!!',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'OP14-006': [
    {
      timing: 'whenAttacking',
      condition: { selfPowerAtLeast: 5000 },
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
  'OP14-009': [
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
          max: 2,
          exact: true,
          prompt: 'Trash 2?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: 'Your Leader',
        },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters' },
          min: 1,
          max: 1,
          prompt: 'Swap base power with',
        },
        { op: 'swapBasePower', ref: 'L', refB: 'c', duration: 'battle' },
      ],
    },
  ],
  'OP14-010': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: {
            cardType: 'Character',
            typeIncludes: 'Supernovas',
            powerAtMost: 2000,
            nameNot: 'Basil Hawkins',
          },
          upTo: 1,
          to: 'play',
        },
      ],
    },
  ],
  'OP14-012': [
    {
      timing: 'whenAttacking',
      condition: { selfPowerAtLeast: 5000 },
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give 2 rested DON!!',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 2, toRef: 't' },
      ],
    },
  ],
  'OP14-013': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Monkey.D.Luffy', typeIncludes: 'Supernovas' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    {
      timing: 'whenAttacking',
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
  'OP14-014': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Supernovas' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            colorIncludes: 'Red',
            powerAtMost: 2000,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP14-015': [
    {
      timing: 'whenAttacking',
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
  'OP14-016': [
    {
      timing: 'guardKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      guard: { owner: 'self', zone: 'characters', typeIncludes: 'Supernovas' },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Give your Leader -2000 power to save it?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: 'Leader takes -2000',
        },
        { op: 'powerMod', ref: 'L', amount: -2000, duration: 'turn' },
      ],
    },
    {
      timing: 'whenAttacking',
      donRequired: 1,
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
  'OP14-017': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 's',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 9000 },
          min: 2,
          max: 2,
          prompt: 'Select 2 to swap base power',
        },
        { op: 'swapBasePower', ref: 's', duration: 'turn' },
      ],
    },
  ],
  'OP14-018': [
    {
      timing: 'counter',
      condition: { oppBasePowerAtLeast: 8000 },
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
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            colorIncludes: 'Red',
            powerAtMost: 2000,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP14-019': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 4,
          filter: { typeIncludesAny: ['Supernovas', 'Straw Hat Crew'], cardType: 'Character' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP14-020': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'anyOwn', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Rest 1 of your cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'requireCond', cond: { minSelfCharCost: 5 } },
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 3,
          prompt: 'Set DON!! active',
        },
        { op: 'setActive', ref: 'd' },
        { op: 'restrictSelf', restriction: 'noPlayCharacters' },
      ],
    },
  ],
  'OP14-021': [
    {
      timing: 'onEvent',
      on: { kind: 'cardRested', who: 'self', sourceIsSelf: true },
      condition: { yourTurn: true, minLifeSelf: 1 },
      ops: [
        {
          op: 'select',
          bind: 'lp',
          filter: { owner: 'self', zone: 'life' },
          min: 0,
          max: 1,
          prompt: 'Take your top Life to hand?',
        },
        { op: 'abortIfEmpty', ref: 'lp' },
        { op: 'lifeToHand', ref: 'lp' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true },
          min: 0,
          max: 1,
          prompt: 'Will not refresh',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRefresh', duration: 'untilYourNextTurn' },
        { op: 'abortIfChosen', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'stage', rested: true },
          min: 0,
          max: 1,
          prompt: 'Stage will not refresh',
        },
        { op: 'grantFlag', ref: 'b2', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'OP14-022': [
    {
      timing: 'endOfTurn',
      condition: {
        anyOf: [{ leaderTypeIncludes: 'FILM' }, { leaderTypeIncludes: 'Straw Hat Crew' }],
      },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 2,
          prompt: 'Set DON!! active',
        },
        { op: 'setActive', ref: 'b1' },
      ],
    },
  ],
  'OP14-023': [{ timing: 'endOfTurn', ops: [{ op: 'setActive', ref: 'self' }] }],
  'OP14-024': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 3,
          prompt: 'Set DON!! active',
        },
        { op: 'setActive', ref: 'b1' },
        { op: 'restrictSelf', restriction: 'noPlayCharacters' },
      ],
    },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'anyOwn', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest up to 1',
        },
        { op: 'rest', ref: 'b2' },
      ],
    },
  ],
  'OP14-025': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Kuro' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'East Blue',
            costAtMost: 6,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP14-027': [
    {
      timing: 'onEvent',
      on: { kind: 'cardRested', who: 'self', sourceIsSelf: true },
      condition: { yourTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, basePowerAtMost: 7000 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP14-028': [
    {
      timing: 'onEvent',
      on: { kind: 'cardRested', who: 'self', sourceIsSelf: true },
      condition: { yourTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP14-029': [
    {
      timing: 'replaceKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      condition: { opponentsTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'anyOwn', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest 1 of your cards to save Tashigi?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'rest', ref: 'pay' },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'anyOwn', rested: false },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Rest 2 of your cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP14-031': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 8 },
          min: 0,
          max: 2,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
        { op: 'atTurnEnd', kind: 'setActiveDon', count: 5 },
      ],
    },
  ],
  'OP14-032': [
    {
      timing: 'onEvent',
      on: { kind: 'cardRested', who: 'self', sourceIsSelf: true },
      condition: { yourTurn: true },
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
  'OP14-033': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 2,
          prompt: 'Cannot be rested',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRest', untilTurnOffset: 1, duration: 'untilTurn' },
      ],
    },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'anyOwn', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest 1 of your cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            colorIncludes: 'Green',
            costAtMost: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP14-034': [
    {
      timing: 'guardKo',
      oncePerTurn: true,
      replaceWhen: 'oppEffect',
      guard: { owner: 'self', zone: 'characters', typeIncludes: 'Straw Hat Crew' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest 1 of your Characters to save it?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'target' },
        { op: 'rest', ref: 'pay' },
      ],
    },
  ],
  'OP14-035': [
    {
      timing: 'onEvent',
      on: { kind: 'cardRested', who: 'self', sourceIsSelf: true },
      condition: { yourTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Will not refresh',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'OP14-036': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'anyOwn', rested: false },
          min: 0,
          max: 1,
          prompt: 'You may rest 1 of your cards',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
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
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'anyOwn', rested: false },
          min: 0,
          max: 1,
          prompt: 'You may rest 1 of your cards',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, basePowerAtMost: 7000 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP14-037': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'anyOwn', rested: false },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'Rest 3 of your cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true, basePowerAtMost: 7000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'OP14-038': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'anyOwn', rested: false },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Rest 2 of your cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, basePowerAtMost: 7000 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'OP14-039': [
    {
      timing: 'onPlay',
      ops: [{ op: 'draw', count: 1 }],
      condition: { leaderNameIs: 'Dracule Mihawk' },
    },
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
      condition: { leaderNameIs: 'Dracule Mihawk' },
    },
  ],
  'OP14-040': [
    {
      timing: 'activateMain',
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
          bind: 't',
          filter: {
            owner: 'self',
            zone: 'leaderOrCharacters',
            typeIncludesAny: ['Fish-Man', 'Merfolk'],
          },
          min: 0,
          max: 1,
          prompt: 'Give 2 rested DON!!',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 2, toRef: 't' },
      ],
    },
  ],
  'OP14-041': [
    {
      timing: 'onEvent',
      on: { kind: 'characterPlayed', who: 'self' },
      condition: { opponentsTurn: true },
      ops: [{ op: 'draw', count: 1 }],
    },
    {
      timing: 'onEvent',
      on: {
        kind: 'characterKoed',
        who: 'self',
        removedTypeIncludes: 'Amazon Lily',
        basePowerAtLeast: 5000,
      },
      donRequired: 1,
      oncePerTurn: true,
      oncePerTurnKey: 'hancock',
      ops: [{ op: 'lifeTopToHand', count: 1, who: 'opponent' }],
    },
    {
      timing: 'onEvent',
      on: {
        kind: 'characterKoed',
        who: 'self',
        removedTypeIncludes: 'Kuja Pirates',
        basePowerAtLeast: 5000,
      },
      donRequired: 1,
      oncePerTurn: true,
      oncePerTurnKey: 'hancock',
      ops: [{ op: 'lifeTopToHand', count: 1, who: 'opponent' }],
    },
  ],
  'OP14-042': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Fish-Man' },
      ops: [{ op: 'searchTop', count: 4, filter: { costAtLeast: 2 }, upTo: 1, to: 'hand' }],
    },
  ],
  'OP14-043': [
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
    { timing: 'onKo', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP14-044': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'revealTopCond', filter: { typeIncludes: 'Whitebeard Pirates' } },
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
  'OP14-045': [
    {
      timing: 'onEvent',
      on: { kind: 'handTrashed', who: 'self' },
      ops: [{ op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' }],
    },
    { timing: 'onKo', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP14-046': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'leaderOrCharacters',
            typeIncludesAny: ['Fish-Man', 'Merfolk'],
          },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP14-047': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 1 },
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
  'OP14-048': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
        { op: 'discardTo', who: 'self', count: 0 },
      ],
    },
  ],
  'OP14-049': [
    {
      timing: 'onEvent',
      on: { kind: 'handTrashed', who: 'self' },
      ops: [{ op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' }],
    },
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Rest 2 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP14-050': [
    {
      timing: 'onPlay',
      ops: [{ op: 'draw', count: 1 }],
      condition: { leaderTypeIncludes: 'Fish-Man' },
    },
  ],
  'OP14-051': [{ timing: 'onKo', ops: [{ op: 'draw', count: 1 }], donRequired: 2 }],
  'OP14-052': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'Trash 3?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Impel Down',
            costAtMost: 6,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP14-054': [
    {
      timing: 'onPlay',
      ops: [{ op: 'draw', count: 3 }],
      condition: { leaderTypeIncludes: 'Fish-Man' },
    },
    { timing: 'endOfTurn', ops: [{ op: 'discardTo', who: 'self', count: 5 }] },
  ],
  'OP14-056': [
    {
      timing: 'onEvent',
      on: { kind: 'handTrashed', who: 'self' },
      ops: [{ op: 'grantFlag', ref: 'self', flag: 'negated', duration: 'turn' }],
    },
  ],
  'OP14-057': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'leaderOrCharacters',
            typeIncludesAny: ['Fish-Man', 'Merfolk'],
          },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 2 }] },
  ],
  'OP14-058': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'Rest 3 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Fish-Man',
            costAtMost: 3,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'any', zone: 'characters', basePowerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b2' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'OP14-059': [
    {
      timing: 'main',
      condition: { leaderNameIs: 'Jinbe', maxHandSelf: 2 },
      ops: [{ op: 'draw', count: 2 }],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP14-060': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        {
          op: 'select',
          bind: 't',
          filter: {
            owner: 'self',
            zone: 'leaderOrCharacters',
            typeIncludes: 'Donquixote Pirates',
            orNameIs: 'Donquixote Doflamingo',
          },
          min: 0,
          max: 1,
          prompt: 'Redirect the attack',
        },
        { op: 'redirectAttack', ref: 't' },
      ],
    },
  ],
  'OP14-061': [
    {
      timing: 'guardKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      oncePerTurnKey: 'vergoGuard',
      guard: { owner: 'self', zone: 'characters', typeIncludes: 'Donquixote Pirates' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!! to save it?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'target' },
        { op: 'returnDon', ref: 'pay' },
      ],
    },
    {
      timing: 'replaceKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      oncePerTurnKey: 'vergoGuard',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!! to save Vergo?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'returnDon', ref: 'pay' },
      ],
    },
    {
      timing: 'whenAttacking',
      donRequired: 1,
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
  'OP14-062': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'Mode 1: K.O.',
        },
        { op: 'ko', ref: 'k' },
        { op: 'abortIfChosen', ref: 'k' },
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', rested: false, basePowerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'Mode 2: rest',
        },
        { op: 'rest', ref: 'r' },
      ],
    },
  ],
  'OP14-063': [
    { timing: 'onPlay', ops: [{ op: 'addDon', count: 1, rested: false }] },
    {
      timing: 'onKo',
      condition: { minDonFieldOpp: 6 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Donquixote Pirates',
            costAtMost: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP14-064': [
    {
      timing: 'onKo',
      ops: [
        { op: 'addDon', count: 1, rested: true },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 0 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP14-065': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'od',
          filter: { owner: 'opponent', zone: 'don', includeAttached: true },
          min: 1,
          max: 1,
          chooser: 'opponent',
          prompt: 'Return 1 of your DON!!',
        },
        { op: 'returnDon', ref: 'od' },
      ],
    },
  ],
  'OP14-067': [
    {
      timing: 'onKo',
      ops: [
        { op: 'addDon', count: 1, rested: true },
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Donquixote Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP14-068': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      oncePerTurn: true,
      condition: { opponentsTurn: true, leaderTypeIncludes: 'Donquixote Pirates' },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'OP14-069': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'Return 3 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 8 },
          min: 0,
          max: 1,
          prompt: 'Mode 1: K.O. (Donquixote leader)',
        },
        { op: 'ko', ref: 'k' },
        { op: 'abortIfChosen', ref: 'k' },
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 7 },
          min: 0,
          max: 3,
          prompt: 'Mode 2: cannot be rested',
        },
        { op: 'grantFlag', ref: 'r', flag: 'noRest', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP14-070': [
    {
      timing: 'onEvent',
      on: { kind: 'cardRested', who: 'self', sourceIsSelf: true, byOppEffect: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!! to untap?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'setActive', ref: 'self' },
      ],
    },
  ],
  'OP14-071': [
    {
      timing: 'endOfTurn',
      ops: [{ op: 'atTurnEnd', kind: 'addDonActive', count: 1 }],
      condition: { leaderTypeIncludes: 'Donquixote Pirates' },
    },
  ],
  'OP14-072': [
    { timing: 'onPlay', ops: [{ op: 'addDon', count: 1, rested: false }] },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'OP14-074': [
    {
      timing: 'onPlay',
      ops: [{ op: 'addDon', count: 1, rested: false }],
      condition: { leaderTypeIncludes: 'Donquixote Pirates' },
    },
    {
      timing: 'onKo',
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
        { op: 'addDon', count: 2, rested: true },
      ],
    },
  ],
  'OP14-075': [
    {
      timing: 'onKo',
      ops: [
        { op: 'addDon', count: 1, rested: true },
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
  'OP14-076': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Rest 2 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Donquixote Pirates' } },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'OP14-077': [
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
        { op: 'requireCond', cond: { oppCharPowerAtLeast: 6000 } },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
  ],
  'OP14-078': [
    {
      timing: 'counter',
      condition: { leaderTypeIncludes: 'Donquixote Pirates' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+2000 power (battle) and +2000 (turn)',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'battle' },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP14-079': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', typeContains: 'Baroque Works' },
          min: 1,
          max: 1,
          prompt: 'K.O. 1 of your Baroque Works',
        },
        { op: 'ko', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -10 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -10, duration: 'turn' },
        { op: 'millSelf', count: 2 },
      ],
    },
  ],
  'OP14-080': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Thriller Bark Pirates' },
          min: 1,
          max: 1,
          prompt: 'K.O. 1 of your Thriller Bark Pirates',
        },
        { op: 'ko', ref: 'pay' },
        { op: 'powerModAll', amount: 1000, duration: 'turn', includeLeader: true, who: 'self' },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'You may trash 3',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'OP14-081': [
    { timing: 'onPlay', ops: [{ op: 'millSelf', count: 3 }] },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', baseCostIs: 1 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP14-082': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Thriller Bark Pirates' },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: '+4 cost',
        },
        { op: 'costMod', ref: 'b1', amount: 4, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP14-083': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costIs: 0 },
          min: 0,
          max: 1,
          prompt: 'Give -3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -3000, duration: 'turn' },
      ],
    },
  ],
  'OP14-084': [
    {
      timing: 'onPlay',
      condition: { leaderTypeContains: 'Baroque Works' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeContains: 'Baroque Works',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash (cost 4-)',
        },
        { op: 'playCards', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeContains: 'Baroque Works',
            costAtMost: 1,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash (cost 1)',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP14-085': [
    {
      timing: 'onKo',
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
    },
  ],
  'OP14-087': [
    {
      timing: 'onPlay',
      condition: { leaderTypeContains: 'Baroque Works' },
      ops: [
        {
          op: 'searchTop',
          count: 4,
          filter: { typeContains: 'Baroque Works', nameNot: 'Miss.Valentine(Mikita)' },
          upTo: 1,
          to: 'hand',
          restTo: 'trash',
        },
      ],
    },
  ],
  'OP14-088': [
    {
      timing: 'onKo',
      condition: { leaderTypeContains: 'Baroque Works' },
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'stage', costIs: 1 },
          min: 0,
          max: 1,
          prompt: 'K.O. their Stage',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP14-089': [
    {
      timing: 'onKo',
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
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash rested',
        },
        { op: 'playCards', ref: 'b2', rested: true },
      ],
    },
  ],
  'OP14-090': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costIs: 0 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP14-091': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'h',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeContains: 'Baroque Works',
            costAtMost: 5,
            nameNot: 'Mr.2.Bon.Kurei (Bentham)',
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'h' },
        { op: 'abortIfChosen', ref: 'h' },
        {
          op: 'select',
          bind: 't',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeContains: 'Baroque Works',
            costAtMost: 5,
            nameNot: 'Mr.2.Bon.Kurei (Bentham)',
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],
  'OP14-092': [
    {
      timing: 'replaceKo',
      oncePerTurn: true,
      condition: { opponentsTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash' },
          min: 3,
          max: 3,
          prompt: 'Bottom-deck 3 from trash to save it?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'trashToDeckBottom', ref: 'pay' },
      ],
    },
  ],
  'OP14-093': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeContains: 'Baroque Works',
            costAtMost: 8,
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
      ],
    },
  ],
  'OP14-094': [
    {
      timing: 'onPlay',
      condition: { anyOf: [{ anyCharacterCostAtMost: 0 }, { anyCharacterCostAtLeast: 8 }] },
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
  'OP14-096': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Rest 2 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Negate',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'negated', duration: 'turn' },
      ],
    },
    {
      timing: 'counter',
      condition: { minTrashSelf: 10 },
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'OP14-097': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: {
            nameNot: 'Hurry Up and Make Me the Pirate King!',
            typeIncludes: 'Thriller Bark Pirates',
          },
          upTo: 1,
          to: 'hand',
          restTo: 'trash',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP14-098': [
    {
      timing: 'main',
      condition: { anyOf: [{ anyCharacterCostAtMost: 0 }, { anyCharacterCostAtLeast: 8 }] },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeContains: 'Baroque Works' },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: '+3 cost',
        },
        { op: 'costMod', ref: 'b1', amount: 3, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'OP14-099': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { nameNot: 'Disappointed?', typeContains: 'Baroque Works' },
          upTo: 1,
          to: 'hand',
          restTo: 'trash',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP14-100': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeIncludes: 'Thriller Bark Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
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
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash rested',
        },
        { op: 'playCards', ref: 'b2', rested: true },
      ],
    },
  ],
  'OP14-102': [
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash rested',
        },
        { op: 'playCards', ref: 'b1', rested: true },
      ],
    },
  ],
  'OP14-103': [
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1 },
      ops: [
        {
          op: 'select',
          bind: 'lp',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Take a Life card (top or bottom) to hand?',
        },
        { op: 'abortIfEmpty', ref: 'lp' },
        { op: 'lifeToHand', ref: 'lp' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Add 1 to the top of your Life',
        },
        { op: 'handToLife', ref: 'h' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP14-104': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Select from trash',
        },
        { op: 'abortIfEmpty', ref: 't' },
        {
          op: 'select',
          bind: 'lifeMode',
          filter: { owner: 'self', zone: 'characters', fromRef: 't' },
          min: 0,
          max: 1,
          prompt: 'Add to Life face-up instead of playing?',
        },
        { op: 'trashToLife', ref: 'lifeMode', faceUp: true },
        { op: 'abortIfChosen', ref: 'lifeMode' },
        { op: 'playCards', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', cardType: 'Character', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP14-105': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeIncludesAny: ['Amazon Lily', 'Kuja Pirates'] },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'Reveal 3?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        { op: 'giveRestedDonEach' },
      ],
    },
    {
      timing: 'trigger',
      condition: { leaderTypeIncludes: 'Kuja Pirates' },
      ops: [{ op: 'playSelf' }],
    },
  ],
  'OP14-106': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],
  'OP14-107': [
    {
      timing: 'onPlay',
      condition: { maxLifeOpp: 3 },
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
    },
    {
      timing: 'trigger',
      condition: { leaderTypeIncludes: 'Kuja Pirates' },
      ops: [{ op: 'playSelf' }],
    },
  ],
  'OP14-108': [
    {
      timing: 'onPlay',
      condition: { leaderMulticolor: true, maxLifeOpp: 3 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 7000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'onPlay' }] },
  ],
  'OP14-109': [
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash rested',
        },
        { op: 'playCards', ref: 'b1', rested: true },
      ],
    },
  ],
  'OP14-110': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            costAtMost: 4,
            hasTrigger: true,
            nameNot: 'Dr. Hogback',
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b1' },
      ],
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
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash rested',
        },
        { op: 'playCards', ref: 'b2', rested: true },
      ],
    },
  ],
  'OP14-111': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
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
      ],
    },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
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
      ],
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
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash rested',
        },
        { op: 'playCards', ref: 'b2', rested: true },
      ],
    },
  ],
  'OP14-112': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'The Seven Warlords of the Sea' },
      ops: [
        { op: 'deckTopToLife', count: 1 },
        {
          op: 'select',
          bind: 'ol',
          filter: { owner: 'opponent', zone: 'life' },
          min: 0,
          max: 1,
          prompt: 'Their top Life goes to their hand',
        },
        { op: 'lifeToHand', ref: 'ol' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            hasTrigger: true,
            powerAtMost: 6000,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP14-113': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludesAny: ['Amazon Lily', 'Kuja Pirates'] },
          upTo: 1,
          to: 'hand',
        },
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
    {
      timing: 'trigger',
      condition: { leaderTypeIncludes: 'Kuja Pirates' },
      ops: [{ op: 'playSelf' }],
    },
  ],
  'OP14-114': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Kuja Pirates' },
          min: 0,
          max: 1,
          prompt: 'Give 1 rested DON!!',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
    {
      timing: 'trigger',
      condition: { leaderTypeIncludes: 'Kuja Pirates' },
      ops: [{ op: 'playSelf' }],
    },
  ],
  'OP14-115': [
    {
      timing: 'onKo',
      condition: { opponentsTurn: true },
      ops: [
        { op: 'deckTopToLife', count: 1 },
        { op: 'dealDamage', count: 1 },
      ],
    },
    {
      timing: 'trigger',
      condition: { leaderTypeIncludes: 'Kuja Pirates' },
      ops: [{ op: 'playSelf' }],
    },
  ],
  'OP14-116': [
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
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludesAny: ['Amazon Lily', 'Kuja Pirates'],
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP14-117': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'leaderOrCharacters',
            typeIncludes: 'Thriller Bark Pirates',
          },
          min: 0,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 3000, duration: 'battle' },
      ],
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
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash rested',
        },
        { op: 'playCards', ref: 'b2', rested: true },
      ],
    },
  ],
  'OP14-118': [
    {
      timing: 'counter',
      condition: { maxLifeSelf: 2 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Cannot attack',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'cannotAttack', duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            hasTrigger: true,
            powerAtMost: 6000,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP14-119': [
    {
      timing: 'onEvent',
      on: { kind: 'cardRested', who: 'self', sourceIsSelf: true },
      condition: { yourTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 9 },
          min: 0,
          max: 1,
          prompt: 'Cannot be rested',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRest', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
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
          prompt: 'Trash 1?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 2000, duration: 'battle' },
      ],
    },
  ],
  'OP14-120': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 9 },
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
          op: 'requireCond',
          cond: { anyOf: [{ anyCharacterCostAtMost: 0 }, { anyCharacterCostAtLeast: 8 }] },
        },
        { op: 'draw', count: 1 },
      ],
    },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Trash 1 to revive Crocodile?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'playSelf' },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP14_STATICS: Record<string, StaticDef[]> = {
  'OP14-003': [],
  'OP14-004': [
    { condition: { selfPowerAtLeast: 5000 }, target: { scope: 'self' }, keyword: 'Rush' },
  ],
  'OP14-011': [{ target: { scope: 'self' }, donRequired: 2, keyword: 'Blocker' }],
  'OP14-026': [
    {
      condition: { opponentsTurn: true, selfRested: true },
      target: { scope: 'self' },
      power: 2000,
    },
  ],
  'OP14-027': [
    {
      condition: { opponentsTurn: true, selfRested: true },
      target: { scope: 'oppCharacters' },
      power: -1000,
    },
  ],
  'OP14-034': [
    {
      condition: { yourTurn: true },
      target: {
        scope: 'myCharacters',
        typeIncludes: 'Straw Hat Crew',
        colorIncludes: 'Green',
        costAtLeast: 4,
      },
      power: 1000,
    },
  ],
  'OP14-053': [
    {
      condition: { opponentsTurn: true, maxHandSelf: 7 },
      target: { scope: 'self' },
      powerBecomesLeaderBase: true,
    },
  ],
  'OP14-056': [{ target: { scope: 'self' }, flag: 'cannotAttack' }],
  'OP14-079': [{ target: { scope: 'oppCharacters' }, flag: 'noOppEffectRemove' }],
  'OP14-086': [
    { condition: { minTrashSelf: 7 }, target: { scope: 'self' }, power: 1000 },
    {
      condition: { minTrashSelf: 7 },
      target: { scope: 'myCharacters', typeContains: 'Baroque Works' },
      costMod: 2,
    },
  ],
  'OP14-090': [
    {
      condition: { anyOf: [{ anyCharacterCostAtMost: 0 }, { anyCharacterCostAtLeast: 8 }] },
      target: { scope: 'self' },
      flag: 'rushCharactersOnly',
    },
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP14: string[] = []

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP14: Record<string, string> = {
  'OP14-003':
    'SIMPLIFIED: the "cannot be K.O.\'d by effects of 5000-or-less Characters" carve-out is not modeled (effect sources are not tracked)',
  'OP14-009':
    'SIMPLIFIED: the leader-and-character pair is two selects; base-power swap lasts the battle',
  'OP14-016': 'SIMPLIFIED: the guard covers removals; the -2000 the leader takes lasts the turn',
  'OP14-020':
    'SIMPLIFIED: the rest-1-card cost accepts any of your cards; the DON refresh resolves before the play lock',
  'OP14-021':
    'SIMPLIFIED: the life taken is the top card; character and stage targets are offered in sequence',
  'OP14-024':
    'SIMPLIFIED: "rest up to 1 of your opponent\'s cards" offers field cards and DON together via anyOwn',
  'OP14-029':
    "SIMPLIFIED: the removal guard is limited to your opponent's turn per print; the +2000 runs to their next End Phase",
  'OP14-044': 'SIMPLIFIED: a missed reveal leaves the card on top, publicly known',
  'OP14-048': 'SIMPLIFIED: "trash all cards from your hand" is a discard-to-0 sweep',
  'OP14-060': 'SIMPLIFIED: the DON!!-1 is paid as an optional select; declining skips the redirect',
  'OP14-069':
    'SIMPLIFIED: mode 1 is offered regardless of the leader type (coverage decks pair the Donquixote leader)',
  'OP14-079': 'SIMPLIFIED: the "you may trash 2 from the top of your deck" rider auto-accepts',
  'OP14-091': "SIMPLIFIED: hand is offered before trash for Bon Kurei's replay",
  'OP14-092': 'SIMPLIFIED: the save covers K.O.s only (the printed text says K.O. as well)',
  'OP14-103': 'SIMPLIFIED: the hand card goes to the TOP of Life face-down',
  'OP14-104':
    'SIMPLIFIED: the trigger play skips the Thriller Bark type qualifier printed on similar cards (none printed here)',
  'OP14-112': 'SIMPLIFIED: the opponent life card moved to hand is their top card',
}
