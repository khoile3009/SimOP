import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP05 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts; the rest are authored against the
 * printed text. Deviations are documented in COVERAGE_NOTES_OP05.
 */
export const OP05_EFFECTS: Record<string, EffectDef[]> = {
  'OP05-001': [
    {
      timing: 'guardKo',
      guard: { owner: 'self', zone: 'characters', powerAtLeast: 5000 },
      donRequired: 1,
      oncePerTurn: true,
      condition: { opponentsTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Save with -1000 power instead?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'powerMod', ref: 'g', amount: -1000, duration: 'turn' },
      ],
    },
  ],
  'OP05-002': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Revolutionary Army' },
          min: 0,
          max: 1,
          prompt: 'Trash 1 Revolutionary Army card',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeOrTrigger: 'Revolutionary Army' },
          min: 0,
          max: 3,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 3000, duration: 'turn' },
      ],
    },
  ],
  'OP05-004': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { selfPowerAtLeast: 7000 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Revolutionary Army',
            basePowerAtMost: 5000,
            nameNot: 'Emporio.Ivankov',
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP05-005': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give -1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -1000, duration: 'turn' },
      ],
      condition: { leaderTypeIncludes: 'Revolutionary Army' },
    },
    {
      timing: 'whenAttacking',
      condition: { selfPowerAtLeast: 7000 },
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give -1000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -1000, duration: 'turn' },
      ],
    },
  ],
  'OP05-006': [
    {
      timing: 'onPlay',
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
      condition: { leaderTypeIncludes: 'Revolutionary Army' },
    },
  ],
  'OP05-007': [
    {
      timing: 'onPlay',
      ops: [
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
  'OP05-008': [
    {
      timing: 'activateMain',
      donRequired: 1,
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
        { op: 'giveRestedDon', upTo: 2, toRef: 'b1' },
      ],
    },
  ],
  'OP05-009': [
    { timing: 'onPlay', condition: { leaderPowerAtMost: 0 }, ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP05-010': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 1000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP05-011': [
    {
      timing: 'onPlay',
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
    },
    { timing: 'trigger', condition: { leaderMulticolor: true }, ops: [{ op: 'playSelf' }] },
  ],
  'OP05-014': [
    {
      timing: 'whenAttacking',
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
      donRequired: 1,
    },
  ],
  'OP05-015': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Belo Betty', typeIncludes: 'Revolutionary Army' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP05-016': [
    {
      timing: 'whenAttacking',
      condition: { selfPowerAtLeast: 7000 },
      ops: [
        { op: 'grantFlag', ref: 'self', flag: 'noBlockCostAtMost', value: 99, duration: 'battle' },
      ],
    },
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
        { op: 'requireCond', cond: { leaderMulticolor: true } },
        { op: 'playSelf' },
      ],
    },
  ],
  'OP05-017': [
    {
      timing: 'whenAttacking',
      condition: { selfPowerAtLeast: 7000 },
      ops: [
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
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'b2' },
        { op: 'trashCards', ref: 'b2' },
        { op: 'requireCond', cond: { leaderMulticolor: true } },
        { op: 'playSelf' },
      ],
    },
  ],
  'OP05-018': [
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
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Revolutionary Army',
            basePowerAtMost: 5000,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Revolutionary Army',
            basePowerAtMost: 5000,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b3' },
      ],
    },
  ],
  'OP05-019': [
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
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
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
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP05-020': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 2000 },
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
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b3', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'OP05-021': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
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
          op: 'searchTop',
          count: 3,
          filter: { typeIncludes: 'Revolutionary Army' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP05-022': [
    { timing: 'endOfTurn', ops: [{ op: 'setActive', ref: 'self' }], condition: { maxHandSelf: 6 } },
  ],
  'OP05-023': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3, rested: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
      donRequired: 1,
    },
  ],
  'OP05-025': [
    {
      timing: 'activateMain',
      ops: [
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
      cost: { restSelf: true },
    },
  ],
  'OP05-026': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'characters',
            costAtLeast: 3,
            rested: false,
            excludeSelf: true,
          },
          min: 0,
          max: 1,
          prompt: 'Rest 1 Character (cost 3+)',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'setActive', ref: 'self' },
      ],
    },
  ],
  'OP05-027': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
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
  'OP05-028': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
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
  'OP05-029': [
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
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP05-030': [
    {
      timing: 'guardKo',
      guard: { owner: 'self', zone: 'characters', rested: true },
      condition: { opponentsTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Trash Rosinante to save it?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'trashFromField', ref: 'self' },
      ],
    },
  ],
  'OP05-031': [
    {
      timing: 'whenAttacking',
      oncePerTurn: true,
      condition: { minSelfRestedCharacters: 2 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', rested: true, costIs: 1 },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b1' },
      ],
    },
  ],
  'OP05-032': [
    {
      timing: 'endOfTurn',
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
        { op: 'setActive', ref: 'self' },
      ],
    },
    {
      timing: 'replaceKo',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'characters',
            costAtLeast: 3,
            rested: false,
            nameNot: 'Pica',
          },
          min: 0,
          max: 1,
          prompt: 'Rest a Character to save Pica?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'rest', ref: 'pay' },
      ],
    },
  ],
  'OP05-033': [
    {
      timing: 'activateMain',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Donquixote Pirates',
            costAtMost: 2,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
      cost: { restDon: 1, restSelf: true },
    },
  ],
  'OP05-034': [
    {
      timing: 'activateMain',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Donquixote Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
      cost: { restDon: 1, restSelf: true },
    },
  ],
  'OP05-036': [
    {
      timing: 'onBlock',
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
  'OP05-037': [
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
  'OP05-038': [
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
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 3,
          prompt: 'Set DON!! active',
        },
        { op: 'setActive', ref: 'b2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters', rested: false, costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b3' },
      ],
    },
  ],
  'OP05-039': [
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3, rested: true },
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5, rested: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b3' },
      ],
    },
  ],
  'OP05-040': [
    {
      timing: 'endOfTurn',
      condition: { minDonField: 10 },
      ops: [
        { op: 'removeAll', owner: 'both', dest: 'trash', costAtMost: 5, rested: true },
        { op: 'trashFromField', ref: 'self' },
      ],
    },
  ],
  'OP05-041': [
    {
      timing: 'activateMain',
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
        { op: 'draw', count: 1 },
      ],
      oncePerTurn: true,
    },
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -1 cost',
        },
        { op: 'costMod', ref: 'b2', amount: -1, duration: 'turn' },
      ],
    },
  ],
  'OP05-042': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Cannot attack',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'cannotAttack', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'OP05-043': [
    {
      timing: 'onPlay',
      condition: { leaderMulticolor: true },
      ops: [{ op: 'searchTop', count: 3, filter: {}, upTo: 1, to: 'hand' }],
    },
  ],
  'OP05-045': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
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
          filter: { owner: 'any', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
    },
  ],
  'OP05-046': [
    {
      timing: 'onKo',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Bottom-deck 1',
        },
        { op: 'bottomDeck', ref: 'b1' },
      ],
    },
  ],
  'OP05-047': [
    { timing: 'onBlock', condition: { maxHandSelf: 3 }, ops: [{ op: 'draw', count: 1 }] },
    { timing: 'onBlock', ops: [{ op: 'powerMod', ref: 'self', amount: 1000, duration: 'battle' }] },
  ],
  'OP05-048': [
    {
      timing: 'whenAttacking',
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
      donRequired: 1,
    },
  ],
  'OP05-049': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
      donRequired: 1,
    },
  ],
  'OP05-050': [
    { timing: 'onPlay', condition: { maxHandSelf: 5 }, ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP05-051': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
    },
  ],
  'OP05-053': [
    {
      timing: 'onEvent',
      on: { kind: 'drawnExtra', who: 'self' },
      condition: { yourTurn: true },
      oncePerTurn: true,
      ops: [{ op: 'powerMod', ref: 'self', amount: 2000, duration: 'turn' }],
    },
  ],
  'OP05-054': [
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
  'OP05-055': [{ timing: 'onPlay', ops: [{ op: 'scryBottom', count: 5 }] }],
  'OP05-056': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', excludeSelf: true },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck a Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'bottomDeckFromField', ref: 'pay' },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'OP05-057': [
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
          bind: 'b2',
          filter: { owner: 'any', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'any', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b3' },
      ],
    },
  ],
  'OP05-058': [
    {
      timing: 'main',
      ops: [
        { op: 'removeAll', owner: 'both', dest: 'deckBottom', costAtMost: 3 },
        { op: 'discardTo', count: 5, who: 'both' },
      ],
    },
    {
      timing: 'trigger',
      ops: [{ op: 'removeAll', owner: 'both', dest: 'deckBottom', costAtMost: 2 }],
    },
  ],
  'OP05-059': [
    { timing: 'main', condition: { leaderMulticolor: true }, ops: [{ op: 'draw', count: 1 }] },
    {
      timing: 'main',
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
    { timing: 'trigger', condition: { leaderMulticolor: true }, ops: [{ op: 'draw', count: 2 }] },
  ],
  'OP05-060': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { minLifeSelf: 1, donFieldZeroOrAtLeast: 3 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'OP05-061': [
    {
      timing: 'whenAttacking',
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
      donRequired: 1,
      condition: { minDonField: 8 },
    },
  ],
  'OP05-063': [
    {
      timing: 'onPlay',
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
      condition: { minDonField: 8 },
    },
  ],
  'OP05-064': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Killer', typeIncludes: 'Kid Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP05-067': [
    {
      timing: 'whenAttacking',
      ops: [{ op: 'addDon', count: 1, rested: false }],
      condition: { maxLifeSelf: 3 },
    },
  ],
  'OP05-068': [
    {
      timing: 'onPlay',
      condition: { minDonField: 8 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            colorIncludes: 'Purple',
            typeIncludes: 'Straw Hat Crew',
            powerAtMost: 6000,
            rested: true,
          },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b1' },
      ],
    },
  ],
  'OP05-069': [
    {
      timing: 'whenAttacking',
      condition: { oppMoreDon: true },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Heart Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP05-071': [
    {
      timing: 'whenAttacking',
      condition: { oppMoreDon: true },
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
  'OP05-072': [
    {
      timing: 'onPlay',
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
      ],
      condition: { minDonField: 8 },
    },
  ],
  'OP05-073': [
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
  'OP05-074': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      condition: { yourTurn: true },
      oncePerTurn: true,
      ops: [{ op: 'addDon', count: 1, rested: false }],
    },
  ],
  'OP05-075': [
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
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Baroque Works',
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
  'OP05-076': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeIncludesAny: ['Straw Hat Crew', 'Kid Pirates', 'Heart Pirates'] },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP05-077': [
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
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -5000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -5000, duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'OP05-078': [
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
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Kid Pirates' },
          min: 0,
          max: 1,
          prompt: '+5000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 5000, duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'OP05-079': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'trash' },
          min: 3,
          max: 3,
          chooser: 'opponent',
          prompt: 'Bottom-deck 3 from your trash',
        },
        { op: 'trashToDeckBottom', ref: 'b1' },
      ],
    },
  ],
  'OP05-080': [
    {
      timing: 'whenAttacking',
      oncePerTurn: true,
      condition: { minTrashSelf: 20 },
      ops: [
        { op: 'trashIntoDeckShuffle', count: 20 },
        { op: 'grantKeyword', ref: 'self', keyword: 'Double Attack', duration: 'battle' },
        { op: 'powerMod', ref: 'self', amount: 10000, duration: 'battle' },
      ],
    },
  ],
  'OP05-081': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
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
  ],
  'OP05-082': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { minTrashSelf: 2 },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash' },
          min: 2,
          max: 2,
          prompt: 'Bottom-deck 2 from trash',
        },
        { op: 'trashToDeckBottom', ref: 'pay' },
        { op: 'requireCond', cond: { minHandOpp: 6 } },
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
  'OP05-085': [{ timing: 'onPlay', ops: [{ op: 'millSelf', count: 1 }] }],
  'OP05-087': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', excludeSelf: true },
          min: 0,
          max: 1,
          prompt: 'K.O. 1 of your Characters?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'ko', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -5 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -5, duration: 'turn' },
      ],
    },
  ],
  'OP05-088': [
    {
      timing: 'activateMain',
      cost: { restDon: 1, restSelf: true },
      condition: { minTrashSelf: 2 },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash' },
          min: 2,
          max: 2,
          prompt: 'Bottom-deck 2 from trash',
        },
        { op: 'trashToDeckBottom', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            colorIncludes: 'Black',
            cardType: 'Character',
            costAtLeast: 3,
            costAtMost: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
      ],
    },
  ],
  'OP05-089': [
    {
      timing: 'activateMain',
      cost: { restDon: 1, restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', rested: false, excludeSelf: true },
          min: 1,
          max: 1,
          prompt: 'Rest 1 Character',
        },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            colorIncludes: 'Black',
            cardType: 'Character',
            costIs: 1,
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
      ],
    },
  ],
  'OP05-090': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Dressrosa' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Dressrosa' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP05-091': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            colorIncludes: 'Black',
            cardType: 'Character',
            costAtLeast: 3,
            costAtMost: 7,
            nameNot: 'Rebecca',
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'hand',
            colorIncludes: 'Black',
            cardType: 'Character',
            costAtMost: 3,
          },
          min: 0,
          max: 1,
          prompt: 'Play rested',
        },
        { op: 'playCards', ref: 'b2', rested: true },
      ],
    },
  ],
  'OP05-093': [
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 (cost 2-)',
        },
        { op: 'ko', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 (cost 1-)',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP05-094': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -3 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -3, duration: 'turn' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costIs: 0 },
          min: 0,
          max: 1,
          prompt: 'Will not refresh',
        },
        { op: 'grantFlag', ref: 'b2', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'b3' },
      ],
    },
  ],
  'OP05-095': [
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
        { op: 'requireCond', cond: { minTrashSelf: 15 } },
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
  'OP05-096': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Mode 1: K.O.',
        },
        { op: 'ko', ref: 'b1' },
        { op: 'abortIfChosen', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Mode 2: return to hand',
        },
        { op: 'returnToHand', ref: 'b2' },
        { op: 'abortIfChosen', ref: 'b2' },
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Mode 3: place onto Life',
        },
        {
          op: 'select',
          bind: 'b3b',
          filter: { owner: 'any', zone: 'characters', fromRef: 'b3' },
          min: 0,
          max: 1,
          prompt: 'Place at the BOTTOM of the Life stack? (decline = top)',
        },
        { op: 'fieldToLife', ref: 'b3b', bottom: true, faceUp: true },
        { op: 'fieldToLife', ref: 'b3', faceUp: true },
      ],
    },
    {
      timing: 'main',
      condition: { hasCharacterTypeIncludes: 'Celestial Dragons' },
      ops: [{ op: 'draw', count: 1 }],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b4',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'K.O.',
        },
        { op: 'ko', ref: 'b4' },
        { op: 'abortIfChosen', ref: 'b4' },
        {
          op: 'select',
          bind: 'b5',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b5' },
      ],
    },
  ],
  'OP05-098': [
    {
      timing: 'onEvent',
      on: { kind: 'lifeZero', who: 'self' },
      condition: { opponentsTurn: true },
      oncePerTurn: true,
      ops: [
        { op: 'deckTopToLife', count: 1 },
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
  'OP05-099': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', rested: false, nameIs: 'Amazon' },
          min: 0,
          max: 1,
          prompt: 'Rest Amazon?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'life' },
          min: 0,
          max: 1,
          chooser: 'opponent',
          prompt: 'Trash your top Life card?',
        },
        { op: 'lifeToTrash', ref: 'b1' },
        { op: 'abortIfChosen', ref: 'b1' },
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
  'OP05-100': [
    {
      timing: 'replaceKo',
      oncePerTurn: true,
      condition: { noCharacterNamedAnywhere: 'Monkey.D.Luffy', minLifeSelf: 1 },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life' },
          min: 0,
          max: 1,
          prompt: 'Trash your top Life card to save Enel?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'lifeToTrash', ref: 'pay' },
      ],
    },
  ],
  'OP05-101': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 5, filter: { nameIs: 'Holly' }, upTo: 1, to: 'hand' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Holly' },
          min: 0,
          max: 1,
          prompt: 'Play Holly',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP05-102': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMostOppLife: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP05-103': [
    {
      timing: 'onPlay',
      condition: { hasCharacterNamed: 'Hotori' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMostOppLife: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP05-104': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'stage' },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck your Stage?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'bottomDeckFromField', ref: 'pay' },
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
  'OP05-105': [
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
  'OP05-106': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Shura', typeIncludes: 'Sky Island' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP05-107': [
    {
      timing: 'onEvent',
      on: { kind: 'lifeAddedToHand', who: 'self' },
      condition: { yourTurn: true },
      oncePerTurn: true,
      ops: [{ op: 'powerMod', ref: 'self', amount: 2000, duration: 'turn' }],
    },
  ],
  'OP05-109': [
    {
      timing: 'onEvent',
      on: { kind: 'triggerActivated', who: 'self' },
      oncePerTurn: true,
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
  'OP05-111': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Kotori' },
          min: 0,
          max: 1,
          prompt: 'Play Kotori?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'playCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Place onto Life',
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
  ],
  'OP05-112': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Sky Island',
            costIs: 1,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP05-114': [
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
        { op: 'requireCond', cond: { maxLifeOpp: 2 } },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'battle' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMostOppLife: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP05-115': [
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
        { op: 'requireCond', cond: { maxLifeSelf: 1 } },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
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
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may trash 2',
        },
        { op: 'abortIfEmpty', ref: 'b3' },
        { op: 'trashCards', ref: 'b3' },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'OP05-116': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMostOppLife: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP05-117': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 5, filter: { typeIncludes: 'Sky Island' }, upTo: 1, to: 'hand' },
      ],
    },
  ],
  'OP05-118': [{ timing: 'onPlay', condition: { maxLifeOpp: 3 }, ops: [{ op: 'draw', count: 4 }] }],
  'OP05-119': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 10,
          exact: true,
          prompt: 'You may return 10 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'removeAll', owner: 'self', dest: 'deckBottom', excludeSelf: true },
        { op: 'extraTurn' },
      ],
    },
    {
      timing: 'activateMain',
      ops: [{ op: 'addDon', count: 1, rested: false }],
      oncePerTurn: true,
      cost: { restDon: 1 },
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP05_STATICS: Record<string, StaticDef[]> = {
  'OP05-003': [
    { condition: { otherCharPowerAtLeast: 7000 }, target: { scope: 'self' }, keyword: 'Rush' },
  ],
  'OP05-040': [
    {
      condition: { leaderNameIs: 'Donquixote Doflamingo' },
      target: { scope: 'myCharacters', costAtMost: 5 },
      flag: 'noRefresh',
    },
    {
      condition: { leaderNameIs: 'Donquixote Doflamingo' },
      target: { scope: 'oppCharacters', costAtMost: 5 },
      flag: 'noRefresh',
    },
  ],
  'OP05-062': [{ condition: { minDonField: 10 }, target: { scope: 'self' }, keyword: 'Blocker' }],
  'OP05-066': [
    { condition: { opponentsTurn: true, minDonField: 10 }, target: { scope: 'self' }, power: 1000 },
  ],
  'OP05-070': [
    { donRequired: 1, condition: { minDonField: 8 }, target: { scope: 'self' }, keyword: 'Rush' },
  ],
  'OP05-084': [
    {
      condition: { yourTurn: true, allSelfCharsTyped: 'Celestial Dragons' },
      target: { scope: 'oppCharacters' },
      costMod: -4,
    },
  ],
  'OP05-086': [{ condition: { minTrashSelf: 10 }, target: { scope: 'self' }, keyword: 'Blocker' }],
  'OP05-092': [
    {
      condition: { yourTurn: true, allSelfCharsTyped: 'Celestial Dragons' },
      target: { scope: 'oppCharacters' },
      costMod: -6,
    },
  ],
  'OP05-097': [
    {
      condition: { yourTurn: true },
      target: {
        scope: 'myHand',
        cardType: 'Character',
        typeIncludes: 'Celestial Dragons',
        costAtLeast: 2,
      },
      costMod: -1,
    },
  ],
  'OP05-101': [{ condition: { maxLifeSelf: 2 }, target: { scope: 'self' }, power: 1000 }],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP05: string[] = ['OP05-013', 'OP05-024', 'OP05-052', 'OP05-113']

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP05: Record<string, string> = {
  'OP05-001': 'SIMPLIFIED: once-per-turn is consumed when the save window opens, even if declined',
  'OP05-007':
    'SIMPLIFIED: K.O.s a single target with 4000 power or less (the 2-target total-power split is not modeled)',
  'OP05-032':
    'SIMPLIFIED: replacement once-per-turn is consumed when the window opens, even if declined',
  'OP05-040': 'SIMPLIFIED: the refresh-lock reads printed cost; the wipe K.O.s by effective cost',
  'OP05-043':
    'SIMPLIFIED: unchosen cards go to the deck bottom (text allows top or bottom in any order)',
  'OP05-055': 'SIMPLIFIED: scry models top-or-bottom as choosing a subset for the bottom',
  'OP05-058': 'SIMPLIFIED: hands trash from the newest cards down to 5 (no choice of which)',
  'OP05-060':
    'SIMPLIFIED: the 0-or-3+ DON!! check gates activation (officially checked after paying the life)',
  'OP05-079': 'SIMPLIFIED: the opponent picks the 3 cards; bottom order is not chosen',
  'OP05-080':
    'SIMPLIFIED: the 20-card payment is mandatory when available and returns the oldest 20 trash cards',
  'OP05-096': 'SIMPLIFIED: the trigger offers the K.O. first, then the bounce',
  'OP05-100':
    'SIMPLIFIED: replacement covers K.O. only (not bounces or bottom-decking); life payment is the top card',
}
