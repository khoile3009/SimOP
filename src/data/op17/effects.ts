import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP17 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts; the rest are authored against the
 * printed text (API-dropped minus signs restored on opponent debuffs).
 * Deviations are documented in COVERAGE_NOTES_OP17.
 */
export const OP17_EFFECTS: Record<string, EffectDef[]> = {
  'OP17-001': [
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
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'OP17-003': [
    {
      timing: 'onPlay',
      condition: {
        anyOf: [{ leaderNameIs: 'Edward.Newgate' }, { leaderTypeIncludes: 'Land of Wano' }],
      },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true },
          min: 0,
          max: 1,
          prompt: 'Give -6000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -6000, duration: 'turn' },
      ],
    },
  ],
  'OP17-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Land of Wano' },
          min: 0,
          max: 1,
          prompt: 'Mode: Land of Wano gains Rush',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Rush', duration: 'turn' },
        { op: 'abortIfChosen', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'characters', typeContains: 'Whitebeard Pirates' },
          min: 0,
          max: 1,
          prompt: 'Mode: Whitebeard gains Rush',
        },
        { op: 'grantKeyword', ref: 'b2', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'OP17-005': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: 'Leader becomes 8000 power',
        },
        { op: 'setPower', ref: 'L', value: 8000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP17-007': [
    {
      timing: 'onPlay',
      condition: {
        anyOf: [{ leaderNameIs: 'Edward.Newgate' }, { leaderTypeIncludes: 'Land of Wano' }],
      },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Land of Wano',
            typeContains: 'Whitebeard Pirates',
            basePowerAtMost: 6000,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP17-008': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', nameIs: 'Edward.Newgate' },
          min: 0,
          max: 1,
          prompt: 'Leader becomes 8000 power',
        },
        { op: 'setPower', ref: 'L', value: 8000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP17-009': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 2000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP17-010': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { oppCharPowerAtLeast: 10000, lacksOtherCharacterNamed: 'Fossa' },
      ops: [
        {
          op: 'grantKeyword',
          ref: 'self',
          keyword: 'Blocker',
          duration: 'untilTurn',
          untilTurnOffset: 1,
        },
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP17-011': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -4000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -4000, duration: 'turn' },
      ],
      donRequired: 2,
    },
  ],
  'OP17-012': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', typeContains: 'Whitebeard Pirates', costIs: 1 },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP17-013': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Edward.Newgate' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true },
          min: 0,
          max: 1,
          prompt: 'Give -6000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -6000, duration: 'turn' },
      ],
    },
  ],
  'OP17-014': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 2000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Whitey Bay' },
          min: 0,
          max: 1,
          prompt: 'Trash Whitey Bay?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashFromField', ref: 'pay' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'L', amount: 1000, duration: 'battle' },
      ],
    },
  ],
  'OP17-015': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guard: { owner: 'self', zone: 'characters', nameNot: 'Marco' },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'K.O. Marco to save it?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'ko', ref: 'self' },
      ],
    },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeContains: 'Whitebeard Pirates' },
          min: 0,
          max: 1,
          prompt: 'Trash a Whitebeard card to revive Marco?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'playSelf' },
      ],
    },
  ],
  'OP17-016': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 2000 },
          min: 0,
          max: 2,
          prompt: 'K.O. up to 2',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP17-017': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeContains: 'Whitebeard Pirates' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'battle' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'OP17-018': [
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
          filter: { owner: 'opponent', zone: 'stage' },
          min: 0,
          max: 1,
          prompt: 'K.O. their Stage',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'requireCond',
          cond: { charTypedPowerAtLeast: { type: 'Whitebeard Pirates', power: 8000 } },
        },
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
  'OP17-019': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Whitebeard Pirates' },
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
          bind: 'b1',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'OP17-020': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restDon: 1 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true },
          min: 0,
          max: 1,
          prompt: 'Will not refresh',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'OP17-021': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guard: { owner: 'self', zone: 'characters', typeContains: 'Red-Haired Pirates' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest a DON!! to save it?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'target' },
        { op: 'rest', ref: 'pay' },
      ],
    },
  ],
  'OP17-022': [
    {
      timing: 'onPlay',
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
        { op: 'restAll', owner: 'opponent' },
      ],
    },
  ],
  'OP17-023': [
    {
      timing: 'guardKo',
      condition: { selfRested: false },
      guard: {
        owner: 'self',
        zone: 'characters',
        typeIncludesAny: ['East Blue', 'Straw Hat Crew'],
        nameNot: 'Nami',
      },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Rest Nami to save it?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'rest', ref: 'self' },
      ],
    },
  ],
  'OP17-024': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP17-025': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6, rested: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', nameIs: 'Shanks' },
          min: 1,
          max: 1,
          prompt: 'Give DON!! to Leader',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'L' },
      ],
    },
  ],
  'OP17-026': [
    {
      timing: 'whenAttacking',
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
      condition: { leaderTypeIncludes: 'Red-Haired Pirates' },
    },
    { timing: 'onKo', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP17-027': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 2,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
      condition: { leaderTypeIncludes: 'Red-Haired Pirates' },
    },
  ],
  'OP17-028': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6, rested: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP17-029': [
    {
      timing: 'onPlay',
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 2 },
          min: 0,
          max: 2,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b2' },
      ],
    },
  ],
  'OP17-030': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Rest 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
    {
      timing: 'activateMain',
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
      oncePerTurn: true,
      condition: { maxHandSelf: 5 },
    },
  ],
  'OP17-031': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 8 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
    {
      timing: 'endOfTurn',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeContains: 'Red-Haired Pirates',
            rested: true,
          },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b2' },
      ],
    },
  ],
  'OP17-032': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeContains: 'Red-Haired Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP17-033': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeContains: 'Red-Haired Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Lucky.Roux' },
          min: 0,
          max: 1,
          prompt: 'Trash Lucky.Roux?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashFromField', ref: 'pay' },
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
  'OP17-034': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { oppCharPowerAtLeast: 0 },
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
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', typeIncludes: 'Red-Haired Pirates' },
          min: 0,
          max: 1,
          prompt: 'Leader becomes 6000 power',
        },
        { op: 'setPower', ref: 'L', value: 6000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP17-036': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 6,
          exact: true,
          prompt: 'Rest 6 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b0',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b0' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6, rested: true },
          min: 0,
          max: 2,
          prompt: 'K.O. up to 2',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Shanks' },
          min: 0,
          max: 1,
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'OP17-037': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeContains: 'Red-Haired Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Rest 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
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
    },
  ],
  'OP17-038': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 4,
          exact: true,
          prompt: 'Rest 4 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
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
          bind: 'h',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'h' },
        { op: 'trashCards', ref: 'h' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'OP17-039': [
    {
      timing: 'whenAttacking',
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
        { op: 'revealTopCond', filter: { typeContains: 'Rocks Pirates' } },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'OP17-040': [
    { timing: 'onPlay', ops: [{ op: 'draw', count: 1 }] },
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      oncePerTurn: true,
      condition: { leaderTypeContains: 'Rocks Pirates' },
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
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'L', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'OP17-041': [
    {
      timing: 'onPlay',
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
        { op: 'removeAll', owner: 'opponent', dest: 'deckBottom', costAtMost: 1 },
      ],
    },
  ],
  'OP17-042': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeContains: 'Rocks Pirates' },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'Reveal 3 Rocks cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
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
  'OP17-043': [
    {
      timing: 'replaceKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Trash 2 to save Ganzui?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'trashCards', ref: 'pay' },
      ],
    },
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: 'Leader becomes 6000 power',
        },
        { op: 'setPower', ref: 'L', value: 6000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP17-044': [
    {
      timing: 'activateMain',
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
      cost: { restSelf: true },
    },
  ],
  'OP17-045': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guard: { owner: 'self', zone: 'characters', nameNot: 'Kyo' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Trash 2 to save it?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'target' },
        { op: 'trashCards', ref: 'pay' },
      ],
    },
    { timing: 'onPlay', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP17-046': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
    },
  ],
  'OP17-047': [
    {
      timing: 'endOfTurn',
      condition: { maxHandSelf: 2 },
      ops: [
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
  'OP17-048': [
    {
      timing: 'whenAttacking',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeContains: 'Rocks Pirates' },
          min: 0,
          max: 1,
          prompt: 'Trash a Rocks card?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
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
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay2',
          filter: { owner: 'self', zone: 'hand', typeContains: 'Rocks Pirates' },
          min: 0,
          max: 1,
          prompt: 'Trash a Rocks card?',
        },
        { op: 'abortIfEmpty', ref: 'pay2' },
        { op: 'trashCards', ref: 'pay2' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -3000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -3000, duration: 'turn' },
      ],
    },
  ],
  'OP17-049': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'm',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 0,
          max: 2,
          exact: true,
          chooser: 'opponent',
          prompt: 'Trash 2 (or decline: they draw 2)',
        },
        { op: 'trashCards', ref: 'm' },
        { op: 'abortIfChosen', ref: 'm' },
        { op: 'draw', count: 2 },
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
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'battle' },
      ],
    },
  ],
  'OP17-050': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'scryBottom', count: 2 },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'OP17-052': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            colorIncludes: 'Blue',
            cardType: 'Event',
            costIs: 0,
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
      ],
    },
  ],
  'OP17-053': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 2,
          max: 2,
          chooser: 'opponent',
          prompt: 'Bottom-deck 2 from your hand',
        },
        { op: 'bottomDeck', ref: 'b1' },
      ],
    },
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
        { op: 'powerMod', ref: 'self', amount: 3000, duration: 'turn' },
      ],
      oncePerTurn: true,
    },
  ],
  'OP17-054': [
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
      timing: 'activateMain',
      cost: { restDon: 3, restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
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
  'OP17-055': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Rest 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Rocks.D.Xebec' },
          min: 0,
          max: 1,
          prompt: 'Grant Unblockable',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Unblockable', duration: 'turn' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeContains: 'Rocks Pirates' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 2000, duration: 'battle' },
      ],
    },
  ],
  'OP17-056': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 5,
          exact: true,
          prompt: 'Rest 5 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeContains: 'Rocks Pirates' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 2000, duration: 'battle' },
      ],
    },
  ],
  'OP17-057': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'stage', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest Fullalead?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'pay2',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'pay2' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeContains: 'Rocks Pirates' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'battle' },
      ],
    },
  ],
  'OP17-058': [
    {
      timing: 'whenAttacking',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
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
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -2000, duration: 'turn' },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay2',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay2' },
        { op: 'returnDon', ref: 'pay2' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'OP17-059': [
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
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 2,
          prompt: 'K.O. up to 2',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP17-060': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Animal Kingdom Pirates' },
      ops: [
        { op: 'addDon', count: 1, rested: false },
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
  ],
  'OP17-061': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Animal Kingdom Pirates' } },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'self', zone: 'hand', nameIs: 'King' },
          min: 0,
          max: 1,
          prompt: 'Play King',
        },
        { op: 'playCards', ref: 'k' },
        { op: 'abortIfChosen', ref: 'k' },
        {
          op: 'select',
          bind: 'q',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Queen' },
          min: 0,
          max: 1,
          prompt: 'Play Queen',
        },
        { op: 'playCards', ref: 'q' },
        { op: 'abortIfChosen', ref: 'q' },
        {
          op: 'select',
          bind: 'j',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Jack' },
          min: 0,
          max: 1,
          prompt: 'Play Jack',
        },
        { op: 'playCards', ref: 'j' },
      ],
    },
  ],
  'OP17-062': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      condition: { yourTurn: true },
      oncePerTurn: true,
      ops: [
        { op: 'addDon', count: 1, rested: false },
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
  'OP17-063': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 1 },
      condition: { selfPlayedThisTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Negate and K.O.',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'negated', duration: 'turn' },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP17-064': [
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
  'OP17-065': [
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
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 2,
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
  'OP17-066': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'requireCond', cond: { anyCharacterCostAtLeast: 10 } },
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
  'OP17-067': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'requireCond', cond: { anyCharacterCostAtLeast: 10 } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP17-068': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may trash 2',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Animal Kingdom Pirates' } },
        { op: 'addDon', count: 2, rested: true },
      ],
    },
  ],
  'OP17-069': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Animal Kingdom Pirates' } },
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
  'OP17-071': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 2,
          prompt: 'K.O. up to 2',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP17-072': [
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
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'battle' },
      ],
    },
  ],
  'OP17-073': [
    {
      timing: 'onPlay',
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
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Animal Kingdom Pirates' } },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'OP17-074': [{ timing: 'onPlay', ops: [{ op: 'addDon', count: 1, rested: true }] }],
  'OP17-075': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Return 2 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
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
      ],
    },
  ],
  'OP17-076': [
    {
      timing: 'counter',
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
          bind: 'pay2',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay2' },
        { op: 'returnDon', ref: 'pay2' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'OP17-077': [
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
          bind: 'pay2',
          filter: { owner: 'self', zone: 'hand' },
          min: 2,
          max: 2,
          prompt: 'Trash 2',
        },
        { op: 'trashCards', ref: 'pay2' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Animal Kingdom Pirates' } },
        { op: 'addDon', count: 3, rested: true },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'pay3',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay3' },
        { op: 'returnDon', ref: 'pay3' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'OP17-078': [
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
          bind: 'pay2',
          filter: { owner: 'self', zone: 'hand' },
          min: 2,
          max: 2,
          prompt: 'Trash 2',
        },
        { op: 'trashCards', ref: 'pay2' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Animal Kingdom Pirates' } },
        { op: 'addDon', count: 3, rested: true },
      ],
    },
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
      ],
    },
  ],
  'OP17-080': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeIncludes: 'Elbaph' },
          upTo: 1,
          to: 'hand',
          restTo: 'trash',
        },
      ],
    },
  ],
  'OP17-081': [
    {
      timing: 'onPlay',
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
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            costAtMost: 8,
            nameNot: 'Gerd',
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
      ],
    },
  ],
  'OP17-082': [
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
    },
  ],
  'OP17-084': [
    {
      timing: 'onPlay',
      condition: { anyCharacterCostAtLeast: 12 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Grant Unblockable',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Unblockable', duration: 'turn' },
      ],
    },
  ],
  'OP17-085': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Elbaph' },
      ops: [
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Brogy', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Play Brogy',
        },
        { op: 'playCards', ref: 'h' },
        { op: 'abortIfChosen', ref: 'h' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Brogy', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Play Brogy from trash',
        },
        { op: 'playCards', ref: 't' },
      ],
    },
    { timing: 'onPlay', ops: [{ op: 'restrictSelf', restriction: 'noPlayCharacters' }] },
  ],
  'OP17-086': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Elbaph' },
          min: 0,
          max: 1,
          prompt: 'Trash an Elbaph card?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'OP17-087': [
    {
      timing: 'onPlay',
      condition: { anyCharacterCostAtLeast: 12 },
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
  'OP17-089': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeIncludes: 'Elbaph' },
          upTo: 1,
          to: 'hand',
          restTo: 'trash',
        },
      ],
    },
  ],
  'OP17-090': [
    {
      timing: 'onPlay',
      condition: { anyCharacterCostAtLeast: 12 },
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
  'OP17-091': [
    {
      timing: 'onPlay',
      condition: { anyCharacterCostAtLeast: 12 },
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
      ],
    },
  ],
  'OP17-092': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Elbaph' },
      ops: [
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Dorry', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Play Dorry',
        },
        { op: 'playCards', ref: 'h' },
        { op: 'abortIfChosen', ref: 'h' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Dorry', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Play Dorry from trash',
        },
        { op: 'playCards', ref: 't' },
      ],
    },
    { timing: 'onPlay', ops: [{ op: 'restrictSelf', restriction: 'noPlayCharacters' }] },
  ],
  'OP17-093': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', cardType: 'Character', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP17-095': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guard: { owner: 'self', zone: 'characters', nameNot: 'Roronoa Zoro' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash' },
          min: 3,
          max: 3,
          prompt: 'Bottom-deck 3 from trash to save it?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'target' },
        { op: 'trashToDeckBottom', ref: 'pay' },
      ],
    },
  ],
  'OP17-096': [
    {
      timing: 'counter',
      condition: { anyCharacterCostAtLeast: 12 },
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
          bind: 'b2',
          filter: { owner: 'self', zone: 'trash', typeIncludes: 'Elbaph' },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b2' },
      ],
    },
  ],
  'OP17-097': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: 'Give -1 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -1, duration: 'turn' },
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
  'OP17-098': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 6,
          exact: true,
          prompt: 'Rest 6 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'requireCond', cond: { anyCharacterCostAtLeast: 12 } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 2,
          prompt: 'K.O. up to 2',
        },
        { op: 'ko', ref: 'b1' },
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
  'OP17-099': [
    {
      timing: 'whenAttacking',
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
          bind: 'm',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 0,
          max: 1,
          chooser: 'opponent',
          prompt: 'Trash 1 (or decline: Linlin trashes and ramps)',
        },
        { op: 'trashCards', ref: 'm' },
        { op: 'abortIfChosen', ref: 'm' },
        {
          op: 'select',
          bind: 'my',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'my' },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'OP17-101': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
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
    {
      timing: 'trigger',
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
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP17-102': [
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
            basePowerAtMost: 4000,
            nameNot: 'Charlotte Oven',
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP17-103': [
    {
      timing: 'onPlay',
      condition: { yourTurn: true, leaderTypeIncludes: 'Big Mom Pirates' },
      ops: [
        { op: 'deckTopToLife', count: 1 },
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
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP17-104': [
    {
      timing: 'onPlay',
      condition: { yourTurn: true, leaderTypeIncludes: 'Big Mom Pirates' },
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
        { op: 'deckTopToLife', count: 1 },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP17-105': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', hasTrigger: true },
          min: 0,
          max: 1,
          prompt: 'Trash a Trigger card?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', hasTrigger: true },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP17-106': [
    {
      timing: 'onPlay',
      condition: { yourTurn: true },
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
        { op: 'deckTopToLife', count: 1 },
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
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP17-107': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],
  'OP17-108': [
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6, rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest up to 1',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP17-109': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', hasTrigger: true },
          min: 0,
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        { op: 'draw', count: 3 },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Big Mom Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP17-110': [
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
            typeIncludes: 'Big Mom Pirates',
            costAtMost: 6,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
      condition: { yourTurn: true },
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP17-111': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', hasTrigger: true },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Reveal 2 Trigger cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 2,
          prompt: 'K.O. up to 2',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP17-112': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'm',
          filter: { owner: 'opponent', zone: 'life' },
          min: 0,
          max: 1,
          prompt: 'Mode: opponent takes their top Life',
        },
        { op: 'lifeToHand', ref: 'm' },
        { op: 'abortIfChosen', ref: 'm' },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'OP17-113': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeIncludes: 'Big Mom Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP17-114': [
    {
      timing: 'onPlay',
      condition: { yourTurn: true },
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
        { op: 'draw', count: 1 },
        { op: 'deckTopToLife', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 2,
          prompt: 'Give -3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -3000, duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP17-115': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', nameIs: 'Charlotte Linlin' },
          min: 0,
          max: 1,
          prompt: 'Grant Unblockable',
        },
        { op: 'grantKeyword', ref: 'L', keyword: 'Unblockable', duration: 'turn' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Charlotte Linlin' },
          min: 0,
          max: 1,
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'OP17-116': [
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
          filter: { owner: 'opponent', zone: 'stage' },
          min: 0,
          max: 1,
          prompt: 'K.O. their Stage',
        },
        { op: 'ko', ref: 'b1' },
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
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'OP17-117': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Charlotte Linlin' },
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
          bind: 'x',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 0,
          max: 3,
          exact: true,
          chooser: 'opponent',
          prompt: "Trash 3 (or a Character is K.O.'d)",
        },
        { op: 'trashCards', ref: 'x' },
        { op: 'abortIfChosen', ref: 'x' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP17-118': [
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
            typeContains: 'Rocks Pirates',
            costAtMost: 5,
            cardTypeAny: ['Character', 'Stage'],
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand (cost 5-)',
        },
        { op: 'playCards', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'hand',
            typeContains: 'Rocks Pirates',
            costAtMost: 4,
            cardTypeAny: ['Character', 'Stage'],
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand (cost 4-)',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP17-119': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP17_STATICS: Record<string, StaticDef[]> = {
  'OP17-002': [{ target: { scope: 'self' }, condition: { opponentsTurn: true }, power: 3000 }],
  'OP17-003': [{ target: { scope: 'self' }, flag: 'rushCharactersOnly' }],
  'OP17-005': [
    { condition: { oppCharPowerAtLeast: 10000 }, target: { scope: 'handSelf' }, costMod: -4 },
  ],
  'OP17-009': [{ target: { scope: 'self' }, condition: { opponentsTurn: true }, power: 3000 }],
  'OP17-013': [
    { condition: { oppCharPowerAtLeast: 10000 }, target: { scope: 'handSelf' }, costMod: -2 },
  ],
  'OP17-027': [{ target: { scope: 'self' }, flag: 'rushCharactersOnly' }],
  'OP17-044': [
    {
      condition: { leaderTypeContains: 'Rocks Pirates', selfRested: true },
      target: { scope: 'self' },
      flag: 'taunt',
    },
  ],
  'OP17-048': [{ target: { scope: 'self' }, flag: 'rushCharactersOnly' }],
  'OP17-069': [{ target: { scope: 'self' }, flag: 'rushCharactersOnly' }],
  'OP17-079': [{ target: { scope: 'myCharacters', costAtLeast: 12 }, keyword: 'Blocker' }],
  'OP17-080': [
    { condition: { anyCharacterCostAtLeast: 12 }, target: { scope: 'self' }, power: 3000 },
  ],
  'OP17-081': [
    { condition: { leaderTypeIncludes: 'Elbaph' }, target: { scope: 'self' }, costMod: 12 },
  ],
  'OP17-082': [
    { condition: { anyCharacterCostAtLeast: 12 }, target: { scope: 'self' }, power: 3000 },
  ],
  'OP17-083': [
    { condition: { anyCharacterCostAtLeast: 12 }, target: { scope: 'self' }, keyword: 'Blocker' },
    { condition: { anyCharacterCostAtLeast: 12 }, target: { scope: 'self' }, power: 3000 },
  ],
  'OP17-085': [{ target: { scope: 'self' }, costMod: 12 }],
  'OP17-087': [
    { condition: { anyCharacterCostAtLeast: 12 }, target: { scope: 'self' }, power: 3000 },
  ],
  'OP17-089': [{ target: { scope: 'self' }, costMod: 12 }],
  'OP17-090': [
    { condition: { anyCharacterCostAtLeast: 12 }, target: { scope: 'self' }, power: 3000 },
  ],
  'OP17-091': [
    { condition: { anyCharacterCostAtLeast: 12 }, target: { scope: 'self' }, power: 3000 },
  ],
  'OP17-092': [{ target: { scope: 'self' }, costMod: 12 }],
  'OP17-093': [
    { condition: { anyCharacterCostAtLeast: 12 }, target: { scope: 'self' }, keyword: 'Rush' },
  ],
  'OP17-094': [
    { condition: { leaderTypeIncludes: 'Elbaph' }, target: { scope: 'self' }, costMod: 12 },
  ],
  'OP17-095': [
    { condition: { anyCharacterCostAtLeast: 12 }, target: { scope: 'self' }, power: 3000 },
  ],
  'OP17-112': [
    {
      condition: { yourTurn: true },
      target: { scope: 'myCharacters', hasTrigger: true, basePowerIs: 4000 },
      power: 4000,
    },
  ],
  'OP17-119': [
    { target: { scope: 'self' }, costMod: 12 },
    { condition: { opponentsTurn: true }, target: { scope: 'self' }, power: 3000 },
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP17: string[] = []

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP17: Record<string, string> = {
  'OP17-005': 'SIMPLIFIED: the monocolored-leader qualifier on the power set is not checked',
  'OP17-015': 'SIMPLIFIED: the guard covers opponent-effect removals; the revival can chain',
  'OP17-018': 'SIMPLIFIED: the counter checks a Whitebeard character at 8000+, not two',
  'OP17-020':
    'SIMPLIFIED: the either-or activation cost always rests a DON!! (the hand-trash mode is dropped)',
  'OP17-021': 'SIMPLIFIED: the save cost rests a DON!! (text allows any of your cards)',
  'OP17-023': 'SIMPLIFIED: the guard covers K.O.s only',
  'OP17-034':
    'SIMPLIFIED: the opponent-leader 6000-power check reads any opponent character presence',
  'OP17-038': 'SIMPLIFIED: the rest-4-cards payment rests DON!! only',
  'OP17-039': 'SIMPLIFIED: a missed reveal leaves the card on top, publicly known',
  'OP17-040':
    'SIMPLIFIED: fires when the leader is attacked (the leader-attacking half is not an engine event)',
  'OP17-043': 'SIMPLIFIED: the save covers K.O.s only (text covers any removal)',
  'OP17-045': 'SIMPLIFIED: the guard covers opponent-effect K.O.s only',
  'OP17-049':
    'SIMPLIFIED: the opponent chooses by trashing 2 or declining (which hands Linlin the draw)',
  'OP17-050':
    'SIMPLIFIED: both looked-at cards go to the bottom (text allows reordering onto the top)',
  'OP17-063': 'SIMPLIFIED: the hand-counter aura on counterless Characters is not modeled',
  'OP17-085': 'SIMPLIFIED: the character play lock lands after Brogy; hand first, then trash',
  'OP17-092': 'SIMPLIFIED: the character play lock lands after Dorry; hand first, then trash',
  'OP17-095': 'SIMPLIFIED: the guard covers opponent-effect K.O.s only',
  'OP17-099':
    "SIMPLIFIED: the opponent chooses by trashing 1 or declining, which triggers Linlin's trash-and-ramp",
  'OP17-112': 'SIMPLIFIED: the power set reads as a +4000 aura on 4000-base Trigger characters',
  'OP17-117': 'SIMPLIFIED: the opponent pays exactly 3 or declines into the K.O.',
  'OP17-118':
    'SIMPLIFIED: the counter aura is not modeled; the two plays are capped at cost 5 and 4 to bound the printed total of 9',
  'OP17-119': 'SIMPLIFIED: K.O.s a single target of cost 4 or less (total-cost sweep not modeled)',
}
