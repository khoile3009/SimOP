import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP16 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts; the rest are authored against the
 * printed text (API-dropped minus signs restored on opponent debuffs).
 * Deviations are documented in COVERAGE_NOTES_OP16.
 */
export const OP16_EFFECTS: Record<string, EffectDef[]> = {
  'OP16-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Monkey.D.Luffy' },
          min: 0,
          max: 1,
          prompt: 'Mode: Luffy gains Rush',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Rush', duration: 'turn' },
        { op: 'abortIfChosen', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeContains: 'Whitebeard Pirates',
            powerAtLeast: 8000,
          },
          min: 0,
          max: 1,
          prompt: 'Mode: 8000+ Whitebeard gains Rush',
        },
        { op: 'grantKeyword', ref: 'b2', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'OP16-002': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtLeast: 8000 },
          min: 0,
          max: 1,
          prompt: 'Reveal an 8000-power Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'OP16-003': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtLeast: 8000 },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Reveal 2 8000-power Characters?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -6000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -6000, duration: 'turn' },
      ],
    },
  ],
  'OP16-006': [
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
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 4000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP16-007': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtLeast: 8000 },
          min: 0,
          max: 1,
          prompt: 'Reveal an 8000-power Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
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
  'OP16-008': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'characters',
            basePowerAtMost: 10000,
            powerAtLeast: 10000,
          },
          min: 0,
          max: 1,
          prompt: 'Trash a 10000-power Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashFromField', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 8000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP16-009': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtLeast: 8000 },
          min: 0,
          max: 1,
          prompt: 'Trash an 8000-power Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP16-010': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtLeast: 8000 },
          min: 0,
          max: 1,
          prompt: 'Reveal an 8000-power Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
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
  'OP16-011': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtLeast: 8000 },
          min: 0,
          max: 1,
          prompt: 'Reveal an 8000-power Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        { op: 'draw', count: 1 },
      ],
    },
    {
      timing: 'whenAttacking',
      donRequired: 1,
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
  'OP16-012': [
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
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Red-Haired Pirates', minDonField: 10 } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Shanks' },
          min: 0,
          max: 1,
          prompt: 'Play Shanks',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP16-013': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 8000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP16-014': [
    {
      timing: 'guardKo',
      guardScope: 'removal',
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
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtLeast: 8000 },
          min: 0,
          max: 1,
          prompt: 'Trash an 8000-power Character to revive Marco?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'playSelf' },
      ],
    },
  ],
  'OP16-015': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtLeast: 8000 },
          min: 0,
          max: 1,
          prompt: 'Trash an 8000-power Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: 'Leader becomes 7000 power',
        },
        { op: 'setPower', ref: 'L', value: 7000, duration: 'turn' },
        { op: 'setPower', ref: 'self', value: 7000, duration: 'turn' },
      ],
    },
  ],
  'OP16-018': [
    {
      timing: 'guardKo',
      oncePerTurn: true,
      guard: { owner: 'self', zone: 'characters', typeIncludes: 'Red-Haired Pirates' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtLeast: 6000 },
          min: 0,
          max: 1,
          prompt: 'Trash a 6000+ Character to save it?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'target' },
        { op: 'trashCards', ref: 'pay' },
      ],
    },
  ],
  'OP16-019': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeContains: 'Whitebeard Pirates',
            powerAtLeast: 8000,
          },
          min: 0,
          max: 2,
          prompt: 'Play up to 2 from hand',
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
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'OP16-020': [
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
          bind: 'r',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtLeast: 8000 },
          min: 0,
          max: 1,
          prompt: 'Reveal an 8000-power Character',
        },
        { op: 'abortIfEmpty', ref: 'r' },
        { op: 'reveal', ref: 'r' },
        { op: 'draw', count: 1 },
      ],
    },
    {
      timing: 'counter',
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
  'OP16-021': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Whitebeard Pirates' },
      ops: [{ op: 'searchTop', count: 3, filter: {}, upTo: 1, to: 'hand' }],
    },
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 1,
          max: 1,
          prompt: 'Give DON!! to',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'b1' },
      ],
    },
  ],
  'OP16-022': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { allSelfCharsTyped: 'Impel Down' },
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
  'OP16-024': [
    {
      timing: 'onKo',
      condition: { opponentsTurn: true },
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
  'OP16-025': [
    {
      timing: 'whenAttacking',
      condition: { hasCharacterNamed: 'Antlerkov' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP16-026': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 3, filter: { typeIncludes: 'Impel Down' }, upTo: 1, to: 'hand' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP16-029': [
    {
      timing: 'whenAttacking',
      condition: { hasCharacterNamed: 'Bunkov' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP16-030': [
    {
      timing: 'onPlay',
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
    {
      timing: 'endOfTurn',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'characters',
            colorIncludes: 'Green',
            costAtMost: 5,
            rested: true,
          },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b2' },
      ],
    },
  ],
  'OP16-031': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Prisoner of Impel Down' },
          min: 0,
          max: 1,
          prompt: 'Play a Prisoner',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP16-032': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', nameNot: 'Monkey.D.Luffy' },
          min: 0,
          max: 1,
          prompt: 'Cannot be rested',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRest', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP16-033': [
    {
      timing: 'replaceKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Rest 2 DON!! to save Morley?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'rest', ref: 'pay' },
      ],
    },
  ],
  'OP16-034': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 3, filter: { typeIncludes: 'Impel Down' }, upTo: 1, to: 'hand' },
      ],
    },
  ],
  'OP16-035': [
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
          prompt: 'Give DON!! to Leader',
        },
        { op: 'giveRestedDon', upTo: 3, toRef: 'L' },
      ],
    },
  ],
  'OP16-036': [
    {
      timing: 'onPlay',
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
    { timing: 'whenAttacking', ops: [{ op: 'basePowerToOppLeader', duration: 'turn' }] },
  ],
  'OP16-037': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
      condition: { leaderTypeIncludes: 'Impel Down' },
    },
  ],
  'OP16-038': [
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
        { op: 'requireCond', cond: { minSelfCharsTypedAny: { types: ['Impel Down'], count: 5 } } },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set Leader active',
        },
        { op: 'setActive', ref: 'L' },
        {
          op: 'select',
          bind: 'cs',
          filter: { owner: 'self', zone: 'characters', rested: true },
          min: 0,
          max: 5,
          prompt: 'Set all Characters active',
        },
        { op: 'setActive', ref: 'cs' },
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
  'OP16-039': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Monkey.D.Luffy' },
          min: 0,
          max: 1,
          prompt: 'Grant Double Attack',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Double Attack', duration: 'turn' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Impel Down' } },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 3 },
          min: 0,
          max: 2,
          prompt: 'Rest up to 2',
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
          filter: { owner: 'opponent', zone: 'leader', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest their Leader',
        },
        { op: 'rest', ref: 'b3' },
      ],
    },
  ],
  'OP16-040': [
    {
      timing: 'main',
      condition: { hasCharacterNamed: 'Monkey.D.Luffy' },
      ops: [
        { op: 'requireCond', cond: { hasCharacterNamed: 'Mr.3(Galdino)' } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Will not refresh',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRefresh', duration: 'untilYourNextTurn' },
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
  'OP16-041': [
    {
      timing: 'onEvent',
      on: { kind: 'characterKoed', who: 'self' },
      donRequired: 1,
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Prisoner of Impel Down' },
          min: 0,
          max: 1,
          prompt: 'Play a Prisoner',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'charRemovedByEffect', who: 'opponent' },
      donRequired: 1,
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Prisoner of Impel Down' },
          min: 0,
          max: 1,
          prompt: 'Play a Prisoner',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP16-043': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP16-045': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', costAtLeast: 2 },
          min: 0,
          max: 1,
          prompt: 'Return a Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnToHand', ref: 'pay' },
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
  'OP16-047': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { minHandOpp: 8 },
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
  ],
  'OP16-048': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Impel Down' },
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Prisoner of Impel Down' },
          min: 0,
          max: 1,
          prompt: 'Play a Prisoner',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Prisoner of Impel Down' },
          min: 0,
          max: 1,
          prompt: 'Grant Blocker',
        },
        { op: 'grantKeyword', ref: 'b2', keyword: 'Blocker', duration: 'turn' },
      ],
    },
  ],
  'OP16-049': [
    { timing: 'activateMain', ops: [{ op: 'draw', count: 1 }], cost: { restSelf: true } },
  ],
  'OP16-050': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', costAtLeast: 2 },
          min: 0,
          max: 1,
          prompt: 'Return a Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnToHand', ref: 'pay' },
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
  'OP16-051': [
    { timing: 'onPlay', ops: [{ op: 'draw', count: 2 }], condition: { maxHandSelf: 5 } },
  ],
  'OP16-052': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 1,
          max: 1,
          prompt: 'Give DON!! to',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'b1' },
      ],
    },
  ],
  'OP16-053': [
    { timing: 'whenAttacking', ops: [{ op: 'draw', count: 1 }], condition: { maxHandSelf: 6 } },
  ],
  'OP16-054': [{ timing: 'onPlay', ops: [{ op: 'draw', count: 1 }] }],
  'OP16-055': [
    { timing: 'onPlay', ops: [{ op: 'draw', count: 1 }] },
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [{ op: 'basePowerToOppLeader', duration: 'turn' }],
    },
  ],
  'OP16-056': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'draw', count: 2 },
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
      ],
    },
  ],
  'OP16-057': [
    {
      timing: 'counter',
      condition: { minSelfCharsTypedAny: { types: ['Impel Down'], count: 2 } },
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
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'b2' },
      ],
    },
  ],
  'OP16-058': [
    {
      timing: 'main',
      condition: { minDonField: 10 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Prisoner of Impel Down' },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: 'Become 7000 power',
        },
        { op: 'setPower', ref: 'b1', value: 7000, duration: 'turn' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Buggy' },
          min: 0,
          max: 1,
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'OP16-059': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 7,
          exact: true,
          prompt: 'Rest 7 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', typeIncludes: 'Impel Down', powerAtMost: 6000 },
          upTo: 2,
          to: 'play',
        },
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
  'OP16-060': [
    {
      timing: 'activateMain',
      cost: { returnDon: 8 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', typeIncludes: 'Admiral' },
          min: 0,
          max: 3,
          prompt: 'Play up to 3 Admirals',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP16-063': [
    { timing: 'onPlay', ops: [{ op: 'addDon', count: 2, rested: true }] },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 1 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Cannot block',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'cannotBlock', duration: 'turn' },
      ],
    },
  ],
  'OP16-064': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Koby', typeIncludes: 'Navy' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP16-065': [
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
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -6000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -6000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restDon: 1 },
      condition: { leaderTypeIncludes: 'Navy' },
      ops: [{ op: 'addDon', count: 2, rested: false }],
    },
  ],
  'OP16-066': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Navy' },
      ops: [
        { op: 'addDon', count: 2, rested: true },
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
  'OP16-067': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 5, filter: { typeIncludes: 'Navy' }, upTo: 1, to: 'hand' },
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
  'OP16-068': [
    { timing: 'onPlay', ops: [{ op: 'addDon', count: 1, rested: false }] },
    {
      timing: 'whenAttacking',
      ops: [{ op: 'powerMod', ref: 'self', amount: 3000, duration: 'turn' }],
      condition: { leaderTypeIncludes: 'Donquixote Pirates' },
    },
  ],
  'OP16-069': [
    { timing: 'onPlay', ops: [{ op: 'addDon', count: 1, rested: false }] },
    { timing: 'whenAttacking', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'OP16-070': [
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
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Navy' } },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
  ],
  'OP16-071': [
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
        { op: 'addDon', count: 1, rested: true },
      ],
    },
    { timing: 'onKo', ops: [{ op: 'addDon', count: 1, rested: true }] },
  ],
  'OP16-072': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 5, filter: { typeIncludes: 'Impel Down' }, upTo: 1, to: 'hand' },
      ],
    },
  ],
  'OP16-073': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'addDon', count: 1, rested: false },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
    {
      timing: 'endOfTurn',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may return 2 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'returnDon', ref: 'b1' },
        { op: 'setActive', ref: 'self' },
        {
          op: 'grantKeyword',
          ref: 'self',
          keyword: 'Blocker',
          duration: 'untilTurn',
          untilTurnOffset: 1,
        },
      ],
    },
  ],
  'OP16-074': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'odon1',
          filter: { owner: 'opponent', zone: 'don', includeAttached: true },
          min: 1,
          max: 1,
          chooser: 'opponent',
          prompt: 'Return 1 of your DON!!',
        },
        { op: 'returnDon', ref: 'odon1' },
      ],
      condition: { leaderTypeIncludes: 'Impel Down' },
    },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'odon2',
          filter: { owner: 'opponent', zone: 'don', includeAttached: true },
          min: 4,
          max: 4,
          chooser: 'opponent',
          prompt: 'Return 4 of your DON!!',
        },
        { op: 'returnDon', ref: 'odon2' },
      ],
    },
  ],
  'OP16-075': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'addDon', count: 1, rested: false },
        { op: 'addDon', count: 1, rested: true },
      ],
      condition: { leaderTypeIncludes: 'Navy' },
    },
  ],
  'OP16-076': [
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
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Admiral' },
          min: 0,
          max: 3,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
    {
      timing: 'counter',
      condition: { hasCharacterTypeIncludes: 'Admiral' },
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
  'OP16-077': [
    {
      timing: 'main',
      ops: [
        { op: 'searchTop', count: 5, filter: { typeIncludes: 'Navy' }, upTo: 2, to: 'hand' },
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
  'OP16-078': [
    {
      timing: 'onPlay',
      ops: [{ op: 'searchTop', count: 5, filter: { typeIncludes: 'Navy' }, upTo: 1, to: 'hand' }],
    },
    {
      timing: 'activateMain',
      cost: { restDon: 1, restSelf: true },
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
  'OP16-080': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      oncePerTurn: true,
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
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Blackbeard Pirates' },
          min: 1,
          max: 1,
          prompt: 'Redirect the attack to',
        },
        { op: 'redirectAttack', ref: 't' },
      ],
    },
  ],
  'OP16-081': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { minSelfCharCost: 8 },
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
  'OP16-082': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Land of Wano' },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Land of Wano' },
          upTo: 1,
          to: 'hand',
          restTo: 'trash',
        },
      ],
    },
  ],
  'OP16-083': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtLeast: 8 },
          min: 0,
          max: 1,
          prompt: 'Trash an 8+ cost Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'OP16-084': [
    {
      timing: 'activateMain',
      condition: { selfCostAtLeast: 20, minDonField: 9 },
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Kouzuki Momonosuke', costIs: 9 },
          min: 0,
          max: 1,
          prompt: 'Play Momonosuke from trash',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP16-085': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Land of Wano',
            costAtMost: 6,
            nameNot: 'Kouzuki Momonosuke',
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP16-087': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Land of Wano' } },
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Kouzuki Momonosuke' },
          min: 0,
          max: 1,
          prompt: '+20 cost',
        },
        { op: 'costMod', ref: 'b1', amount: 20, duration: 'turn' },
      ],
    },
  ],
  'OP16-089': [
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -4 cost',
        },
        { op: 'costMod', ref: 'b2', amount: -4, duration: 'turn' },
      ],
    },
  ],
  'OP16-090': [
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
  'OP16-091': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Land of Wano' },
      ops: [
        {
          op: 'searchTop',
          count: 4,
          filter: { typeIncludes: 'Land of Wano', nameNot: 'Nami' },
          upTo: 1,
          to: 'hand',
          restTo: 'trash',
        },
      ],
    },
  ],
  'OP16-092': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtLeast: 8 },
          min: 0,
          max: 1,
          prompt: 'Trash an 8+ cost Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'OP16-093': [
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give DON!! to',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'b2' },
      ],
    },
  ],
  'OP16-094': [
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
          prompt: 'Trash 2 from your hand',
        },
        { op: 'trashCards', ref: 'b1' },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Land of Wano' },
          min: 1,
          max: 1,
          prompt: 'Give DON!! to',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'b2' },
      ],
    },
  ],
  'OP16-095': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            colorIncludes: 'Black',
            typeIncludes: 'Land of Wano',
          },
          min: 0,
          max: 1,
          prompt: 'Grant Unblockable',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Unblockable', duration: 'turn' },
      ],
    },
  ],
  'OP16-096': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Yamato', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Play Yamato from trash',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP16-097': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Land of Wano',
            costAtMost: 6,
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP16-098': [
    {
      timing: 'onPlay',
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
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'trash',
            nameIs: 'Yamato',
            colorIncludes: 'Black',
            costIs: 8,
          },
          min: 0,
          max: 1,
          prompt: 'Play Yamato from trash',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP16-099': [
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
        { op: 'millSelf', count: 5 },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Land of Wano',
            costAtMost: 6,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b1' },
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
  'OP16-100': [
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
        { op: 'requireCond', cond: { oppCharKoedThisTurn: true } },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', nameIs: 'Yamato', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set Leader active',
        },
        { op: 'setActive', ref: 'L' },
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
  'OP16-101': [
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
        { op: 'requireCond', cond: { minTrashSelf: 10 } },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Yamato' },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b3' },
      ],
    },
  ],
  'OP16-102': [
    {
      timing: 'onKo',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Fullalead' },
          min: 0,
          max: 1,
          prompt: 'Play Fullalead',
        },
        { op: 'playCards', ref: 'h' },
        { op: 'abortIfChosen', ref: 'h' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Fullalead' },
          min: 0,
          max: 1,
          prompt: 'Play Fullalead from trash',
        },
        { op: 'playCards', ref: 't' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'onKo' }] },
  ],
  'OP16-103': [
    {
      timing: 'onKo',
      condition: { opponentsTurn: true, leaderTypeIncludes: 'Blackbeard Pirates' },
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give -3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -3000, duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'onKo' }] },
  ],
  'OP16-104': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Copy its power',
        },
        { op: 'basePowerToRef', ref: 'b1', duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Blackbeard Pirates',
            costIs: 1,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP16-105': [
    {
      timing: 'trigger',
      condition: { maxLifeSelf: 1 },
      ops: [
        {
          op: 'select',
          bind: 'a',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Absalom', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Play Absalom',
        },
        { op: 'playCards', ref: 'a' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Dr. Hogback', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Play Dr. Hogback',
        },
        { op: 'playCards', ref: 'h' },
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Perona', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Play Perona',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'OP16-106': [
    {
      timing: 'onKo',
      condition: { leaderTypeIncludes: 'Blackbeard Pirates' },
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Become 7000 power',
        },
        { op: 'setPower', ref: 'b1', value: 7000, duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'onKo' }] },
  ],
  'OP16-107': [
    { timing: 'onKo', ops: [{ op: 'lifeTopToHand', count: 1, who: 'opponent' }] },
    {
      timing: 'trigger',
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
        { op: 'playSelf' },
      ],
    },
  ],
  'OP16-108': [
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
            typeIncludes: 'Blackbeard Pirates',
            costAtMost: 6,
          },
          min: 0,
          max: 1,
          prompt: 'Add to top of Life',
        },
        { op: 'trashToLife', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 2 }] },
  ],
  'OP16-109': [
    {
      timing: 'onKo',
      condition: { leaderTypeIncludes: 'Blackbeard Pirates' },
      ops: [
        { op: 'draw', count: 1 },
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
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'onKo' }] },
  ],
  'OP16-110': [
    {
      timing: 'onKo',
      ops: [
        { op: 'draw', count: 1 },
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
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'onKo' }] },
  ],
  'OP16-111': [{ timing: 'trigger', condition: { maxLifeSelf: 2 }, ops: [{ op: 'playSelf' }] }],
  'OP16-113': [
    {
      timing: 'trigger',
      condition: { leaderTypeIncludes: 'Kuja Pirates' },
      ops: [{ op: 'playSelf' }],
    },
  ],
  'OP16-114': [
    {
      timing: 'onKo',
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
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'onKo' }] },
  ],
  'OP16-115': [
    {
      timing: 'main',
      condition: { leaderTypeIncludes: 'Blackbeard Pirates' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', hasTrigger: true, nameNot: 'Black Vortex' },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Negate',
        },
        { op: 'grantFlag', ref: 'b2', flag: 'negated', duration: 'turn' },
      ],
    },
  ],
  'OP16-116': [
    {
      timing: 'main',
      condition: { minDonField: 10 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Marshall.D.Teach' },
          min: 0,
          max: 1,
          prompt: 'Play Teach',
        },
        { op: 'playCards', ref: 'b1' },
        { op: 'lifeTopToHand', count: 1, who: 'opponent' },
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
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'b2' },
      ],
    },
  ],
  'OP16-117': [
    {
      timing: 'main',
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 8 },
          min: 0,
          max: 1,
          prompt: 'Negate',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'negated', duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'trash', typeIncludes: 'Blackbeard Pirates' },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b2' },
      ],
    },
  ],
  'OP16-118': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeContains: 'Whitebeard Pirates', orNameIs: 'Monkey.D.Luffy' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeContains: 'Whitebeard Pirates', orNameIs: 'Monkey.D.Luffy' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP16-119': [
    { timing: 'onPlay', ops: [{ op: 'searchTop', count: 3, filter: {}, upTo: 1, to: 'life' }] },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Negate',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'negated', duration: 'turn' },
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
}

/** Continuous effects (auras), applied at read time. */
export const OP16_STATICS: Record<string, StaticDef[]> = {
  'OP16-003': [
    { condition: { yourTurn: true }, target: { scope: 'myLeader' }, keyword: 'Double Attack' },
    { condition: { yourTurn: true }, target: { scope: 'myLeader' }, power: 2000 },
  ],
  'OP16-005': [
    {
      condition: { charTypedPowerAtLeast: { type: 'Whitebeard Pirates', power: 8000 } },
      target: { scope: 'handSelf' },
      costMod: -3,
    },
  ],
  'OP16-015': [
    {
      condition: { leaderNameIs: 'Portgas.D.Ace', minDonField: 6 },
      target: { scope: 'handSelf' },
      costMod: -2,
    },
  ],
  'OP16-017': [
    {
      condition: {
        lacksCharTypedCostAtLeast: { type: 'Whitebeard Pirates', cost: 8, contains: true },
      },
      target: { scope: 'self' },
      power: -4000,
    },
  ],
  'OP16-027': [{ donRequired: 1, target: { scope: 'self' }, power: 2000 }],
  'OP16-034': [
    {
      donRequired: 1,
      condition: { yourTurn: true },
      target: { scope: 'self' },
      powerPer: { perUniqueCharNames: true, amount: 1000 },
    },
  ],
  'OP16-054': [
    {
      donRequired: 1,
      condition: { yourTurn: true, minHandSelf: 5 },
      target: { scope: 'self' },
      power: 3000,
    },
  ],
  'OP16-080': [
    { condition: { opponentsTurn: true }, target: { scope: 'myCharacters' }, costMod: 1 },
  ],
  'OP16-089': [{ target: { scope: 'self' }, flag: 'rushCharactersOnly' }],
  'OP16-113': [{ condition: { maxLifeSelf: 2 }, target: { scope: 'self' }, keyword: 'Blocker' }],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP16: string[] = ['OP16-042', 'OP16-044', 'OP16-088']

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP16: Record<string, string> = {
  'OP16-001':
    'SIMPLIFIED: the two Rush targets are offered as a modal; declining Luffy rolls to the Whitebeard pick',
  'OP16-008':
    'SIMPLIFIED: the 10000-power trash cost matches exact printed power via a floor+cap pair',
  'OP16-015': 'SIMPLIFIED: both power sets read as set-to-7000 of effective power',
  'OP16-019': "SIMPLIFIED: 8000-power is read from the hand card's printed power",
  'OP16-033': 'SIMPLIFIED: the save cost rests 2 DON!! (text allows any 2 of your cards)',
  'OP16-038':
    'SIMPLIFIED: the 5-different-names check counts Impel Down Characters without name dedup',
  'OP16-041':
    'SIMPLIFIED: two removal listeners with separate once-per-turn marks; the Impel Down type check is not modeled',
  'OP16-058': 'SIMPLIFIED: the power set reads effective power',
  'OP16-059': 'SIMPLIFIED: both plays enter active',
  'OP16-060':
    'SIMPLIFIED: the 8-DON payment takes rested first; the different-names rule is not enforced',
  'OP16-079':
    'SIMPLIFIED: the from-trash Rush grant is not modeled as a leader listener (black Yamato plays grant it themselves where printed)',
  'OP16-082': 'SIMPLIFIED: the unchosen searched cards are trashed per print',
  'OP16-104': "SIMPLIFIED: power copy reads the target's effective power",
  'OP16-118':
    'SIMPLIFIED: the +2000 counter aura on 8000-power hand cards is not modeled (counter values are static)',
}
