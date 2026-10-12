import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP11 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts; the rest are authored against the
 * printed text (API-dropped minus signs restored on opponent debuffs).
 * Deviations are documented in COVERAGE_NOTES_OP11.
 */
export const OP11_EFFECTS: Record<string, EffectDef[]> = {
  'OP11-001': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      guard: { owner: 'self', zone: 'characters', typeIncludes: 'Navy', basePowerAtMost: 7000 },
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
  'OP11-002': [
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 0 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP11-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Navy', nameNot: 'Kujyaku' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'OP11-006': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', attributeIs: 'Special' },
          min: 0,
          max: 1,
          prompt: 'Give -5000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -5000, duration: 'turn' },
      ],
    },
  ],
  'OP11-007': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { leaderTypeIncludes: 'Navy' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Navy' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP11-008': [
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
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Navy' } },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -6000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -6000, duration: 'turn' },
      ],
    },
  ],
  'OP11-009': [
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
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP11-010': [
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
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'turn' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leader', typeIncludes: 'Navy' },
          min: 0,
          max: 1,
          prompt: 'Can attack active Characters',
        },
        { op: 'grantFlag', ref: 'b2', flag: 'canAttackActive', duration: 'turn' },
      ],
    },
  ],
  'OP11-012': [
    {
      timing: 'onEvent',
      on: { kind: 'eventActivated', who: 'opponent' },
      condition: { yourTurn: true },
      oncePerTurn: true,
      ops: [{ op: 'powerModAll', amount: 2000, duration: 'turn' }],
    },
  ],
  'OP11-013': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 2000 },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: 'Cannot block',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'cannotBlock', duration: 'turn' },
      ],
    },
  ],
  'OP11-014': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Navy' },
          min: 0,
          max: 1,
          prompt: 'Can attack active Characters',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'canAttackActive', duration: 'turn' },
      ],
    },
  ],
  'OP11-016': [
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
  'OP11-018': [
    {
      timing: 'main',
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 6000 },
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
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b3' },
      ],
    },
  ],
  'OP11-019': [
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
        { op: 'requireCond', cond: { oppCharPowerAtLeast: 6000 } },
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
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b3', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'OP11-020': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 2,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -2000, duration: 'turn' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Navy' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 1000, duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 4000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b3' },
      ],
    },
  ],
  'OP11-021': [
    {
      timing: 'endOfTurn',
      condition: { maxHandSelf: 6 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludesAny: ['Fish-Man', 'Merfolk'],
            rested: true,
          },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set DON!! active',
        },
        { op: 'setActive', ref: 'b2' },
      ],
    },
  ],
  'OP11-022': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restDon: 1 },
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        {
          op: 'select',
          bind: 'n',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Neptunian',
            costAtMostSelfDon: true,
          },
          min: 0,
          max: 1,
          prompt: 'Play a Neptunian',
        },
        { op: 'playCards', ref: 'n' },
        { op: 'abortIfChosen', ref: 'n' },
        {
          op: 'select',
          bind: 'm',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Megalo', costAtMostSelfDon: true },
          min: 0,
          max: 1,
          prompt: 'Play Megalo',
        },
        { op: 'playCards', ref: 'm' },
      ],
    },
  ],
  'OP11-023': [
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
  'OP11-024': [
    {
      timing: 'onKo',
      condition: { opponentsTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Trash 1 to deploy?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'pay2',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 1,
          max: 1,
          prompt: 'Rest 1 DON!!',
        },
        { op: 'rest', ref: 'pay2' },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludesAny: ['Fish-Man', 'Merfolk'],
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
  'OP11-025': [
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
          prompt: 'Rest 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'rest', ref: 'self' },
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
  'OP11-027': [
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
  'OP11-028': [
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
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3, rested: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP11-029': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP11-030': [
    {
      timing: 'activateMain',
      cost: { restDon: 1, restSelf: true },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludesAny: ['Neptunian', 'Fish-Man Island'] },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP11-031': [
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
      condition: { leaderTypeIncludesAny: ['Fish-Man', 'Merfolk'] },
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'characters', typeIncludesAny: ['Fish-Man', 'Merfolk'] },
          min: 0,
          max: 1,
          prompt: 'Can attack Characters this turn',
        },
        { op: 'grantFlag', ref: 'b2', flag: 'rushCharactersOnly', duration: 'turn' },
      ],
    },
  ],
  'OP11-034': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { leaderTypeIncludesAny: ['Fish-Man', 'Merfolk'] },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Cannot be rested',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRest', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP11-035': [
    {
      timing: 'onKo',
      condition: { opponentsTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Rest 1 DON!! to deploy?',
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
            typeIncludesAny: ['Fish-Man', 'Merfolk'],
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b2' },
      ],
    },
  ],
  'OP11-036': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Shirahoshi' },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Neptunian', orNameIs: 'Shirahoshi' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP11-037': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 4,
          filter: { typeIncludesAny: ['Neptunian', 'Fish-Man Island'], cardType: 'Character' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP11-038': [
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
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 5 },
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
          bind: 'b2',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'OP11-039': [
    {
      timing: 'counter',
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
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 3000, duration: 'battle' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 3 },
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
  'OP11-040': [
    {
      timing: 'startOfTurn',
      condition: { minDonField: 8 },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Straw Hat Crew' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP11-041': [
    {
      timing: 'onEvent',
      on: { kind: 'lifeRemoved', who: 'self' },
      condition: { yourTurn: true, maxHandSelf: 7 },
      oncePerTurn: true,
      ops: [{ op: 'draw', count: 1 }],
    },
    {
      timing: 'onEvent',
      on: { kind: 'lifeRemoved', who: 'opponent' },
      condition: { yourTurn: true, maxHandSelf: 7 },
      oncePerTurn: true,
      ops: [{ op: 'draw', count: 1 }],
    },
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      donRequired: 1,
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
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP11-042': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Firetank Pirates' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'OP11-043': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      oncePerTurn: true,
      condition: { allSelfCharsTypeContains: 'GERMA' },
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
        { op: 'millSelf', count: 2 },
      ],
    },
  ],
  'OP11-044': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          selectAll: true,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'GERMA 66' },
          min: 0,
          max: 5,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'OP11-047': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'The Vinsmoke Family' },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeContains: 'GERMA' },
          upTo: 1,
          to: 'hand',
          restTo: 'trash',
        },
      ],
    },
  ],
  'OP11-048': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 4,
          filter: { typeIncludesAny: ['Firetank Pirates', 'Straw Hat Crew'], costAtLeast: 2 },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP11-049': [
    { timing: 'onPlay', ops: [{ op: 'scryBottom', count: 3 }] },
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Carrot' },
          min: 0,
          max: 1,
          prompt: 'Trash Carrot?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashFromField', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'battle' },
      ],
    },
  ],
  'OP11-050': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Firetank Pirates' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Mode: bounce',
        },
        { op: 'returnToHand', ref: 'b2' },
        { op: 'abortIfChosen', ref: 'b2' },
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Mode: bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b3' },
      ],
    },
  ],
  'OP11-051': [
    {
      timing: 'onKo',
      condition: { opponentsTurn: true },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', typeIncludes: 'Straw Hat Crew', costAtMost: 5 },
          upTo: 1,
          to: 'play',
        },
      ],
    },
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', basePowerAtMost: 5000 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP11-054': [
    {
      timing: 'onPlay',
      condition: { leaderMulticolor: true },
      ops: [
        { op: 'draw', count: 3 },
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
  'OP11-056': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', baseCostIs: 1 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
    },
  ],
  'OP11-059': [
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
        { op: 'requireCond', cond: { maxHandSelf: 4 } },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'battle' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
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
  'OP11-060': [
    {
      timing: 'main',
      condition: { leaderMulticolor: true },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Straw Hat Crew', nameNot: "Let's Crash This Wedding!!!" },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP11-061': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
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
  'OP11-062': [
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
        { op: 'peekOppTop' },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'battle' },
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
        { op: 'peekOppTop' },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'battle' },
      ],
    },
  ],
  'OP11-063': [
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
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Impel Down' } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP11-066': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        { op: 'costGuessCheck' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
  ],
  'OP11-067': [
    {
      timing: 'endOfTurn',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Big Mom Pirates',
            costAtLeast: 3,
            rested: true,
          },
          min: 0,
          max: 2,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b1' },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
  ],
  'OP11-069': [
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Big Mom Pirates' } },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'OP11-070': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Big Mom Pirates', costAtLeast: 2 },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'activateMain', cost: { returnDon: 1, restSelf: true }, ops: [{ op: 'peekOppTop' }] },
  ],
  'OP11-071': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
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
        { op: 'costGuessCheck' },
        { op: 'draw', count: 1 },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'OP11-072': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 1, restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'trash' },
          min: 2,
          max: 2,
          chooser: 'opponent',
          prompt: 'Bottom-deck 2 from your trash',
        },
        { op: 'trashToDeckBottom', ref: 'b1' },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],
  'OP11-073': [
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
          max: 5,
          exact: true,
          prompt: 'Rest 5 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'costGuessCheck' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP11-074': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 1, restSelf: true },
      ops: [
        { op: 'costGuessCheck' },
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
  'OP11-075': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Nico Robin', minDonField: 7 },
      ops: [{ op: 'draw', count: 2 }],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'onPlay' }] },
  ],
  'OP11-076': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Impel Down' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Impel Down',
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
  'OP11-077': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      condition: { yourTurn: true },
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Big Mom Pirates' },
          min: 0,
          max: 1,
          prompt: '+2 cost',
        },
        { op: 'costMod', ref: 'b1', amount: 2, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP11-079': [
    {
      timing: 'counter',
      ops: [
        { op: 'costGuessCheck' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+5000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 5000, duration: 'battle' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP11-080': [
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
        { op: 'requireCond', cond: { leaderColorIncludes: 'Blue' } },
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
          min: 0,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'OP11-081': [
    {
      timing: 'main',
      ops: [
        { op: 'costGuessCheck' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 8 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'OP11-082': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Navy' } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Navy' },
          min: 0,
          max: 1,
          prompt: 'Can attack active Characters',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'canAttackActive', duration: 'turn' },
        { op: 'millSelf', count: 2 },
      ],
    },
  ],
  'OP11-083': [
    {
      timing: 'onPlay',
      ops: [
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
  'OP11-084': [
    { timing: 'onPlay', ops: [{ op: 'millSelf', count: 3 }] },
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Navy' },
          min: 0,
          max: 1,
          prompt: 'Can attack active Characters',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'canAttackActive', duration: 'turn' },
      ],
    },
  ],
  'OP11-085': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', typeIncludes: 'SMILE', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
      ],
    },
  ],
  'OP11-086': [
    {
      timing: 'onPlay',
      ops: [
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
          filter: { owner: 'self', zone: 'trash', nameIs: 'Caribou', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Play Caribou from trash',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP11-088': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self', sourceIsSelf: true },
      oncePerTurn: true,
      ops: [{ op: 'powerMod', ref: 'self', amount: 5000, duration: 'battle' }],
    },
  ],
  'OP11-091': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'trash', cardType: 'Event' },
          min: 3,
          max: 3,
          chooser: 'opponent',
          prompt: 'Bottom-deck 3 Events from your trash',
        },
        { op: 'trashToDeckBottom', ref: 'b1' },
      ],
    },
  ],
  'OP11-092': [
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
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'SWORD',
            costAtMost: 8,
            nameNot: 'Helmeppo',
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b1' },
        { op: 'grantFlag', ref: 'b1', flag: 'bottomDeckAtTurnEnd', duration: 'turn' },
      ],
    },
  ],
  'OP11-095': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash', typeIncludes: 'Navy' },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'Bottom-deck 3 Navy cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashToDeckBottom', ref: 'pay' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: 'Give DON!! to Leader',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'L' },
        { op: 'requireCond', cond: { anyCharacterCostAtLeast: 9 } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP11-097': [
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
        { op: 'requireCond', cond: { minTrashSelf: 10 } },
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'trash',
            colorIncludes: 'Black',
            cardType: 'Character',
            costAtMost: 3,
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b2' },
      ],
    },
  ],
  'OP11-098': [
    { timing: 'main', ops: [{ op: 'millSelf', count: 3 }] },
    {
      timing: 'trigger',
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
  ],
  'OP11-099': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { nameNot: "I'm Gonna Be a Navy Officer!!!", typeIncludes: 'Navy' },
          upTo: 1,
          to: 'hand',
          restTo: 'trash',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP11-100': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Shirahoshi' },
      ops: [
        { op: 'lifeFaceDown', count: 1 },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'OP11-101': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      guard: {
        owner: 'self',
        zone: 'characters',
        typeIncludes: 'Supernovas',
        nameNot: 'Capone"Gang"Bege',
      },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Add it to your Life instead?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'fieldToLife', ref: 'g' },
      ],
    },
  ],
  'OP11-102': [
    {
      timing: 'onEvent',
      on: { kind: 'eventActivated', who: 'opponent' },
      condition: { yourTurn: true, minLifeOpp: 2 },
      oncePerTurn: true,
      ops: [
        { op: 'trashLifeTop', owner: 'self', count: 1 },
        { op: 'trashLifeTop', owner: 'opponent', count: 1 },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'triggerActivated', who: 'opponent' },
      condition: { yourTurn: true, minLifeOpp: 2 },
      oncePerTurn: true,
      ops: [
        { op: 'trashLifeTop', owner: 'self', count: 1 },
        { op: 'trashLifeTop', owner: 'opponent', count: 1 },
      ],
    },
  ],
  'OP11-103': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { leaderNameIs: 'Shirahoshi' },
      ops: [
        { op: 'lifeFaceDown', count: 1 },
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
    },
  ],
  'OP11-104': [
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeFaceDown', count: 1 },
        {
          op: 'searchTop',
          count: 3,
          filter: { typeIncludes: 'Fish-Man Island' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP11-106': [
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP11-107': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { leaderNameIs: 'Shirahoshi' },
      ops: [
        { op: 'lifeFaceDown', count: 1 },
        { op: 'grantFlag', ref: 'self', flag: 'setActiveAtTurnEnd', duration: 'turn' },
      ],
    },
  ],
  'OP11-108': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Shirahoshi' },
      ops: [
        { op: 'lifeFaceDown', count: 1 },
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
  'OP11-109': [
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
      condition: { hasCharacterNamed: 'Camie' },
    },
  ],
  'OP11-110': [
    {
      timing: 'replaceKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'leaderOrCharacters',
            typeIncludes: 'Fish-Man Island',
            rested: false,
          },
          min: 0,
          max: 1,
          prompt: 'Rest to save Fukaboshi?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'rest', ref: 'pay' },
      ],
    },
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
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
  'OP11-114': [
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
        { op: 'requireCond', cond: { minTotalLife: 5 } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 5 },
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
          bind: 'b2',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'OP11-115': [
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
      condition: { leaderNameIs: 'Shirahoshi' },
    },
    {
      timing: 'trigger',
      ops: [
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
  ],
  'OP11-116': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Add to their Life',
        },
        {
          op: 'select',
          bind: 'b1b',
          filter: { owner: 'any', zone: 'characters', fromRef: 'b1' },
          min: 0,
          max: 1,
          prompt: 'Place at the BOTTOM of the Life stack? (decline = top)',
        },
        { op: 'fieldToLife', ref: 'b1b', bottom: true, faceUp: true },
        { op: 'fieldToLife', ref: 'b1', faceUp: true },
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
          prompt: 'Add to their Life',
        },
        {
          op: 'select',
          bind: 'b2b',
          filter: { owner: 'any', zone: 'characters', fromRef: 'b2' },
          min: 0,
          max: 1,
          prompt: 'Place at the BOTTOM of the Life stack? (decline = top)',
        },
        { op: 'fieldToLife', ref: 'b2b', bottom: true, faceUp: true },
        { op: 'fieldToLife', ref: 'b2', faceUp: true },
      ],
    },
  ],
  'OP11-117': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { leaderNameIs: 'Shirahoshi' },
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludesAny: ['Neptunian', 'Fish-Man', 'Merfolk'],
          },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'OP11-118': [
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'any', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b2' },
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give DON!! to',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'b3' },
      ],
    },
  ],
  'OP11-119': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Can attack active Characters',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'canAttackActive', duration: 'turn' },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Bottom-deck 2 from trash?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashToDeckBottom', ref: 'pay' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 1000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP11_STATICS: Record<string, StaticDef[]> = {
  'OP11-001': [
    { target: { scope: 'myCharacters', typeIncludes: 'SWORD' }, flag: 'rushCharactersOnly' },
  ],
  'OP11-005': [{ donRequired: 1, target: { scope: 'self' }, flag: 'noEffectKo' }],
  'OP11-022': [{ target: { scope: 'self' }, flag: 'cannotAttack' }],
  'OP11-023': [
    {
      condition: { leaderTypeIncludes: 'Fish-Man', maxLifeSelf: 3, minOppRestedAny: 5 },
      target: { scope: 'handSelf' },
      costMod: -3,
    },
  ],
  'OP11-027': [
    {
      condition: { leaderNameIs: 'Shirahoshi' },
      target: { scope: 'self' },
      flag: 'rushCharactersOnly',
    },
  ],
  'OP11-046': [
    {
      condition: { allSelfCharsTypeContains: 'GERMA' },
      target: { scope: 'self' },
      flag: 'noOppEffectKo',
    },
    { condition: { allSelfCharsTypeContains: 'GERMA' }, target: { scope: 'self' }, flag: 'noRest' },
  ],
  'OP11-057': [{ target: { scope: 'self' }, condition: { maxHandSelf: 4 }, keyword: 'Blocker' }],
  'OP11-058': [{ condition: { minHandSelf: 5 }, target: { scope: 'self' }, flag: 'cannotAttack' }],
  'OP11-065': [
    {
      condition: { hasOtherCharacterTyped: 'Big Mom Pirates' },
      target: { scope: 'self' },
      keyword: 'Blocker',
    },
  ],
  'OP11-073': [
    {
      condition: { leaderTypeIncludes: 'Big Mom Pirates' },
      target: { scope: 'self' },
      keyword: 'Rush',
    },
  ],
  'OP11-096': [
    {
      condition: { hasOtherCharacterTyped: 'Navy' },
      target: { scope: 'self' },
      keyword: 'Blocker',
    },
  ],
  'OP11-112': [
    {
      condition: { opponentsTurn: true, leaderNameIs: 'Shirahoshi' },
      target: { scope: 'self' },
      power: 4000,
    },
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP11: string[] = ['OP11-090']

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP11: Record<string, string> = {
  'OP11-005':
    'SIMPLIFIED: protected from ALL effect K.O.s (the Special-attribute source carve-out is not modeled)',
  'OP11-024': "SIMPLIFIED: revives on any K.O. during the opponent's turn (battle K.O.s included)",
  'OP11-034': 'SIMPLIFIED: the rest lock blocks effect rests from both sides',
  'OP11-035': "SIMPLIFIED: revives on any K.O. during the opponent's turn (battle K.O.s included)",
  'OP11-040': 'SIMPLIFIED: unchosen cards go to the deck bottom (text allows top or bottom)',
  'OP11-041': 'SIMPLIFIED: the two life-removal listeners carry separate once-per-turn marks',
  'OP11-051': "SIMPLIFIED: revives on any K.O. during the opponent's turn (battle K.O.s included)",
  'OP11-062':
    'SIMPLIFIED: the cost-guess engine: a guess only hits when the top card is already known via a peek',
  'OP11-066':
    'SIMPLIFIED: cost-guess hits only with a prior peek; the DON!! gain is gated behind the hit',
  'OP11-071': 'SIMPLIFIED: cost-guess hits only with a prior peek',
  'OP11-073': 'SIMPLIFIED: cost-guess hits only with a prior peek',
  'OP11-074': 'SIMPLIFIED: cost-guess hits only with a prior peek',
  'OP11-079': 'SIMPLIFIED: cost-guess hits only with a prior peek',
  'OP11-081': 'SIMPLIFIED: cost-guess hits only with a prior peek',
  'OP11-088':
    'SIMPLIFIED: fires only when Shu himself is attacked; the Slash-attribute check is not modeled',
  'OP11-091': 'SIMPLIFIED: the opponent picks the 3 Events; bottom order is not chosen',
  'OP11-102': 'SIMPLIFIED: the Event and Trigger listeners carry separate once-per-turn marks',
}
