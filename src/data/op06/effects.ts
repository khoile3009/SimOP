import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP06 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts; the rest are authored against the
 * printed text. Deviations are documented in COVERAGE_NOTES_OP06.
 */
export const OP06_EFFECTS: Record<string, EffectDef[]> = {
  'OP06-001': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'FILM' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -2000, duration: 'turn' },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
  ],
  'OP06-003': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { cardType: 'Character', typeIncludes: 'Revolutionary Army', powerAtMost: 5000 },
          upTo: 1,
          to: 'play',
        },
      ],
    },
  ],
  'OP06-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Lily Carnation' },
          min: 0,
          max: 1,
          prompt: 'Play Lily Carnation',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP06-006': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'untilYourNextTurn' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'FILM' },
          min: 1,
          max: 1,
          prompt: 'Trash at end of turn',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'trashAtTurnEnd', duration: 'turn' },
      ],
    },
  ],
  'OP06-007': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 10000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP06-009': [
    {
      timing: 'whenAttacking',
      oncePerTurn: true,
      ops: [{ op: 'basePowerToOppLeader', duration: 'untilYourNextTurn' }],
    },
    {
      timing: 'onBlock',
      oncePerTurn: true,
      ops: [{ op: 'basePowerToOppLeader', duration: 'untilYourNextTurn' }],
    },
  ],
  'OP06-011': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Uta', rested: false },
          min: 1,
          max: 1,
          prompt: 'Rest 1 Uta card',
        },
        { op: 'rest', ref: 'pay' },
        { op: 'powerMod', ref: 'self', amount: 5000, duration: 'turn' },
      ],
    },
  ],
  'OP06-013': [
    {
      timing: 'onPlay',
      ops: [{ op: 'searchTop', count: 3, filter: { typeIncludes: 'FILM' }, upTo: 1, to: 'hand' }],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'onPlay' }] },
  ],
  'OP06-014': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'FILM' },
          min: 0,
          max: 10,
          prompt: 'Trash any number of FILM cards',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'trashCards', ref: 't' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 1,
          max: 1,
          prompt: '+1000 power per card',
        },
        { op: 'powerModPerRef', ref: 'b1', countRef: 't', amountPer: 1000, duration: 'battle' },
      ],
    },
  ],
  'OP06-015': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', powerAtLeast: 6000 },
          min: 1,
          max: 1,
          prompt: 'Trash 1 Character (6000+)',
        },
        { op: 'trashFromField', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'FILM',
            powerAtLeast: 2000,
            powerAtMost: 5000,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash rested',
        },
        { op: 'playCards', ref: 'b1', rested: true },
      ],
    },
  ],
  'OP06-016': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'bottomDeckFromField', ref: 'self' },
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
  'OP06-017': [
    {
      timing: 'main',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 3000, duration: 'turn' },
      ],
    },
    {
      timing: 'counter',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 3000, duration: 'turn' },
      ],
    },
  ],
  'OP06-018': [
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
        { op: 'requireCond', cond: { oppCharPowerAtLeast: 7000 } },
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
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 5000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b3' },
      ],
    },
  ],
  'OP06-019': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 5000 },
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
  'OP06-020': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        { op: 'restrictSelf', restriction: 'noLifeToHand' },
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'opponent', zone: 'don', rested: false },
          min: 0,
          max: 1,
          prompt: 'Mode 1: rest a DON!!',
        },
        { op: 'rest', ref: 'd' },
        { op: 'abortIfChosen', ref: 'd' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Mode 2: rest a Character',
        },
        { op: 'rest', ref: 'c' },
      ],
    },
  ],
  'OP06-021': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Mode 1: rest',
        },
        { op: 'rest', ref: 'b1' },
        { op: 'abortIfChosen', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Mode 2: -1 cost',
        },
        { op: 'costMod', ref: 'b2', amount: -1, duration: 'turn' },
      ],
    },
  ],
  'OP06-022': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { maxLifeOpp: 3 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters' },
          min: 1,
          max: 1,
          prompt: 'Give DON!! to',
        },
        { op: 'giveRestedDon', upTo: 2, toRef: 'b1' },
      ],
    },
  ],
  'OP06-023': [
    {
      timing: 'onPlay',
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
          filter: { owner: 'opponent', zone: 'leader', rested: true },
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
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b2' },
      ],
    },
  ],
  'OP06-024': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'New Fish-Man Pirates' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Fish-Man',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],
  'OP06-025': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 4,
          filter: { nameNot: 'Camie', typeIncludesAny: ['Fish-Man', 'Merfolk'] },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP06-026': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            attributeIs: 'Slash',
            costAtMost: 4,
            rested: true,
          },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b1' },
        { op: 'restrictSelf', restriction: 'noLeaderAttack' },
      ],
    },
  ],
  'OP06-027': [
    {
      timing: 'onKo',
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
    },
  ],
  'OP06-028': [
    {
      timing: 'whenAttacking',
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
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'turn' },
        { op: 'lifeTopToHand', count: 1 },
      ],
      donRequired: 1,
      condition: { leaderTypeIncludes: 'New Fish-Man Pirates' },
    },
  ],
  'OP06-029': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'setActive', ref: 'self' },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'turn' },
        { op: 'lifeTopToHand', count: 1 },
      ],
      donRequired: 1,
      oncePerTurn: true,
      condition: { leaderTypeIncludes: 'New Fish-Man Pirates' },
    },
  ],
  'OP06-030': [
    {
      timing: 'whenAttacking',
      condition: { leaderTypeIncludes: 'New Fish-Man Pirates' },
      ops: [
        { op: 'grantFlag', ref: 'self', flag: 'noBattleKo', duration: 'untilYourNextTurn' },
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'untilYourNextTurn' },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],
  'OP06-031': [
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
  'OP06-033': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Fish-Man' },
          min: 0,
          max: 1,
          prompt: 'Trash a Fish-Man card',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP06-034': [
    {
      timing: 'activateMain',
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
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'turn' },
        { op: 'lifeTopToHand', count: 1 },
      ],
      oncePerTurn: true,
    },
  ],
  'OP06-035': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 2,
          prompt: 'Rest up to 2',
        },
        { op: 'rest', ref: 'b1' },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],
  'OP06-036': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4, rested: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    {
      timing: 'onKo',
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
  'OP06-038': [
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
        { op: 'requireCond', cond: { minSelfRestedAny: 8 } },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'battle' },
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
  'OP06-039': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Mode 1: rest',
        },
        { op: 'rest', ref: 'b1' },
        { op: 'abortIfChosen', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Mode 2: K.O.',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP06-040': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3, rested: true },
          min: 0,
          max: 2,
          prompt: 'K.O. up to 2',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP06-041': [
    { timing: 'onPlay', ops: [{ op: 'restAll', owner: 'opponent' }] },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP06-042': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      condition: { yourTurn: true },
      oncePerTurn: true,
      ops: [{ op: 'draw', count: 1 }],
    },
  ],
  'OP06-043': [
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
        {
          op: 'select',
          bind: 'pay2',
          filter: { owner: 'any', zone: 'characters', costAtMost: 2 },
          min: 1,
          max: 1,
          prompt: 'Bottom-deck a Character',
        },
        { op: 'bottomDeckFromField', ref: 'pay2' },
        { op: 'powerMod', ref: 'self', amount: 3000, duration: 'turn' },
      ],
    },
  ],
  'OP06-044': [
    {
      timing: 'onEvent',
      on: { kind: 'eventActivated', who: 'opponent' },
      condition: { yourTurn: true },
      oncePerTurn: true,
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
  'OP06-045': [
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
  'OP06-046': [
    {
      timing: 'onPlay',
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
  'OP06-047': [
    { timing: 'onPlay', ops: [{ op: 'shuffleHandIntoDeckDraw', who: 'opponent', draw: 5 }] },
  ],
  'OP06-048': [
    {
      timing: 'onEvent',
      on: { kind: 'eventActivated', who: 'opponent' },
      condition: { yourTurn: true, leaderTypeIncludes: 'East Blue' },
      ops: [{ op: 'millSelf', count: 4 }],
    },
  ],
  'OP06-050': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Tashigi', typeIncludes: 'Navy' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP06-051': [
    {
      timing: 'onPlay',
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 1,
          max: 1,
          chooser: 'opponent',
          prompt: 'Return 1 of your Characters to hand',
        },
        { op: 'returnToHand', ref: 'b2' },
      ],
    },
  ],
  'OP06-053': [
    {
      timing: 'onKo',
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
  'OP06-055': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      condition: { maxHandSelf: 4 },
      ops: [
        { op: 'grantFlag', ref: 'self', flag: 'noBlockCostAtMost', value: 99, duration: 'battle' },
      ],
    },
  ],
  'OP06-056': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck (cost 2-)',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck (cost 1-)',
        },
        { op: 'bottomDeckFromField', ref: 'b2' },
      ],
    },
  ],
  'OP06-057': [
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
        { op: 'revealTopMayPlay', filter: { cardType: 'Character', costIs: 2 } },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', costIs: 2 },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP06-058': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 2,
          prompt: 'Bottom-deck up to 2',
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
          filter: { owner: 'any', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b2' },
      ],
    },
  ],
  'OP06-059': [
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
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'turn' },
        { op: 'draw', count: 1 },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'scryBottom', count: 5 }] },
  ],
  'OP06-060': [
    {
      timing: 'activateMain',
      cost: { returnDon: 1 },
      condition: { leaderTypeIncludes: 'GERMA 66' },
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Vinsmoke Ichiji', costIs: 7 },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'h' },
        { op: 'abortIfChosen', ref: 'h' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Vinsmoke Ichiji', costIs: 7 },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],
  'OP06-061': [
    {
      timing: 'onPlay',
      condition: { oppAtLeastSelfDon: true },
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
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'OP06-062': [
    {
      timing: 'onPlay',
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
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may trash 2',
        },
        { op: 'abortIfEmpty', ref: 'b2' },
        { op: 'trashCards', ref: 'b2' },
        {
          op: 'select',
          bind: 'b3',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'GERMA 66',
            basePowerAtMost: 4000,
          },
          min: 0,
          max: 4,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b3' },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 1 },
      ops: [
        {
          op: 'select',
          bind: 'b4',
          filter: { owner: 'opponent', zone: 'don', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest a DON!!',
        },
        { op: 'rest', ref: 'b4' },
      ],
    },
  ],
  'OP06-063': [
    {
      timing: 'onPlay',
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
        { op: 'requireCond', cond: { oppAtLeastSelfDon: true } },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'The Vinsmoke Family',
            basePowerAtMost: 4000,
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
      ],
    },
  ],
  'OP06-064': [
    {
      timing: 'activateMain',
      cost: { returnDon: 1 },
      condition: { leaderTypeIncludes: 'GERMA 66' },
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Vinsmoke Niji', costIs: 5 },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'h' },
        { op: 'abortIfChosen', ref: 'h' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Vinsmoke Niji', costIs: 5 },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],
  'OP06-065': [
    {
      timing: 'onPlay',
      condition: { oppAtLeastSelfDon: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Mode 1: K.O.',
        },
        { op: 'ko', ref: 'b1' },
        { op: 'abortIfChosen', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Mode 2: return to hand',
        },
        { op: 'returnToHand', ref: 'b2' },
      ],
    },
  ],
  'OP06-066': [
    {
      timing: 'activateMain',
      cost: { returnDon: 1 },
      condition: { leaderTypeIncludes: 'GERMA 66' },
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Vinsmoke Yonji', costIs: 4 },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'h' },
        { op: 'abortIfChosen', ref: 'h' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Vinsmoke Yonji', costIs: 4 },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],
  'OP06-068': [
    {
      timing: 'activateMain',
      cost: { returnDon: 1 },
      condition: { leaderTypeIncludes: 'GERMA 66' },
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Vinsmoke Reiju', costIs: 4 },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'h' },
        { op: 'abortIfChosen', ref: 'h' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Vinsmoke Reiju', costIs: 4 },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],
  'OP06-069': [
    {
      timing: 'onPlay',
      condition: { oppAtLeastSelfDon: true, maxHandSelf: 5 },
      ops: [{ op: 'draw', count: 2 }],
    },
  ],
  'OP06-071': [
    {
      timing: 'onPlay',
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
        { op: 'requireCond', cond: { leaderTypeIncludes: 'FILM' } },
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'FILM',
            costAtMost: 4,
          },
          min: 0,
          max: 2,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b2' },
      ],
    },
  ],
  'OP06-073': [
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
      condition: { minDonField: 8 },
    },
  ],
  'OP06-074': [
    {
      timing: 'onPlay',
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
          prompt: 'Negate',
        },
        { op: 'grantFlag', ref: 'b2', flag: 'negated', duration: 'turn' },
        { op: 'requireRefPowerAtMost', ref: 'b2', max: 5000 },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP06-075': [
    {
      timing: 'onPlay',
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
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 2 },
          min: 0,
          max: 2,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b2' },
      ],
    },
  ],
  'OP06-076': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      condition: { yourTurn: true },
      oncePerTurn: true,
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
  'OP06-077': [
    {
      timing: 'main',
      condition: { oppAtLeastSelfDon: true },
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
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b2' },
      ],
    },
  ],
  'OP06-078': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'GERMA 66', typeContains: 'GERMA' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP06-079': [
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
        { op: 'searchTop', count: 3, filter: { typeContains: 'GERMA' }, upTo: 1, to: 'hand' },
      ],
    },
  ],
  'OP06-080': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may rest 2 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'd' },
        { op: 'rest', ref: 'd' },
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
        { op: 'millSelf', count: 2 },
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
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 't' },
      ],
    },
  ],
  'OP06-081': [
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
          prompt: 'Bottom-deck 2 from trash?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashToDeckBottom', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP06-082': [
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
      condition: { leaderTypeIncludes: 'Thriller Bark Pirates' },
    },
    {
      timing: 'onKo',
      ops: [
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'hand' },
          min: 2,
          max: 2,
          prompt: 'Trash 2',
        },
        { op: 'trashCards', ref: 'b2' },
      ],
      condition: { leaderTypeIncludes: 'Thriller Bark Pirates' },
    },
  ],
  'OP06-083': [
    {
      timing: 'activateMain',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Thriller Bark Pirates',
            excludeSelf: true,
          },
          min: 1,
          max: 1,
          prompt: 'K.O. 1 Thriller Bark Pirates Character',
        },
        { op: 'ko', ref: 'pay' },
        { op: 'grantFlag', ref: 'self', flag: 'negated', duration: 'turn' },
      ],
    },
  ],
  'OP06-084': [
    {
      timing: 'onKo',
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
  'OP06-086': [
    {
      timing: 'onPlay',
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'trash', cardType: 'Character', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Play from trash rested',
        },
        { op: 'playCards', ref: 'b2', rested: true },
      ],
    },
  ],
  'OP06-089': [
    { timing: 'onPlay', ops: [{ op: 'millSelf', count: 3 }] },
    { timing: 'onKo', ops: [{ op: 'millSelf', count: 3 }] },
  ],
  'OP06-090': [
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
          prompt: 'Bottom-deck 2 from trash?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashToDeckBottom', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            typeIncludes: 'Thriller Bark Pirates',
            nameNot: 'Dr. Hogback',
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
      ],
    },
  ],
  'OP06-091': [
    {
      timing: 'onPlay',
      ops: [{ op: 'millSelf', count: 5 }],
      condition: { leaderTypeIncludes: 'Thriller Bark Pirates' },
    },
  ],
  'OP06-092': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Mode 1: trash',
        },
        { op: 'trashFromField', ref: 'b1' },
        { op: 'abortIfChosen', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'trash' },
          min: 3,
          max: 3,
          chooser: 'opponent',
          prompt: 'Bottom-deck 3 from your trash',
        },
        { op: 'trashToDeckBottom', ref: 'b2' },
      ],
    },
  ],
  'OP06-093': [
    {
      timing: 'onPlay',
      condition: { minHandOpp: 5 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Mode A: -3 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -3, duration: 'turn' },
        { op: 'abortIfChosen', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 1,
          max: 1,
          chooser: 'opponent',
          prompt: 'Trash 1 from your hand',
        },
        { op: 'trashCards', ref: 'b2' },
      ],
    },
  ],
  'OP06-095': [
    {
      timing: 'main',
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
        {
          op: 'select',
          bind: 'k',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 2,
          },
          min: 0,
          max: 5,
          prompt: 'K.O. any number',
        },
        { op: 'ko', ref: 'k' },
        { op: 'powerModPerRef', ref: 'b1', countRef: 'k', amountPer: 1000, duration: 'turn' },
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
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 1000, duration: 'turn' },
        {
          op: 'select',
          bind: 'k2',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 2,
          },
          min: 0,
          max: 5,
          prompt: 'K.O. any number',
        },
        { op: 'ko', ref: 'k2' },
        { op: 'powerModPerRef', ref: 'b2', countRef: 'k2', amountPer: 1000, duration: 'turn' },
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
  'OP06-096': [
    {
      timing: 'counter',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        { op: 'grantFlagAll', flag: 'noBattleKo', duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'counter' }] },
  ],
  'OP06-097': [
    {
      timing: 'main',
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
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP06-098': [
    {
      timing: 'activateMain',
      cost: { restDon: 1, restSelf: true },
      condition: { leaderTypeIncludes: 'Thriller Bark Pirates' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 2,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash rested',
        },
        { op: 'playCards', ref: 'b1', rested: true },
      ],
    },
  ],
  'OP06-099': [
    {
      timing: 'onPlay',
      ops: [{ op: 'scryLifeTops', prompt: 'You may move a top Life card to the bottom' }],
    },
  ],
  'OP06-100': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
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
          filter: { owner: 'opponent', zone: 'characters', costAtMostOppLife: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    { timing: 'trigger', condition: { maxLifeOpp: 3 }, ops: [{ op: 'playSelf' }] },
  ],
  'OP06-101': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Grant Banish',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Banish', duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
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
  'OP06-102': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'stage', costIs: 1 },
          min: 1,
          max: 1,
          prompt: 'Bottom-deck your Stage',
        },
        { op: 'bottomDeckFromField', ref: 'pay' },
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
  'OP06-103': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may trash 2',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', powerAtMost: 0 },
          min: 0,
          max: 1,
          prompt: 'Add to Life',
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
  'OP06-104': [
    { timing: 'onKo', condition: { maxLifeOpp: 3 }, ops: [{ op: 'deckTopToLife', count: 1 }] },
    { timing: 'trigger', condition: { maxLifeOpp: 3 }, ops: [{ op: 'playSelf' }] },
  ],
  'OP06-106': [
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Add to top of Life',
        },
        { op: 'handToLife', ref: 'b1' },
      ],
    },
  ],
  'OP06-107': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Land of Wano',
            nameNot: 'Kouzuki Momonosuke',
          },
          min: 0,
          max: 1,
          prompt: 'Add to Life',
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
  'OP06-108': [
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Land of Wano' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP06-109': [{ timing: 'trigger', condition: { maxLifeOpp: 3 }, ops: [{ op: 'playSelf' }] }],
  'OP06-110': [{ timing: 'trigger', condition: { maxLifeOpp: 3 }, ops: [{ op: 'playSelf' }] }],
  'OP06-111': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'stage', costIs: 1 },
          min: 1,
          max: 1,
          prompt: 'Bottom-deck your Stage',
        },
        { op: 'bottomDeckFromField', ref: 'pay' },
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
    { timing: 'trigger', condition: { maxLifeSelf: 2 }, ops: [{ op: 'playSelf' }] },
  ],
  'OP06-112': [
    {
      timing: 'whenAttacking',
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
          filter: { owner: 'opponent', zone: 'don', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest a DON!!',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
    { timing: 'trigger', condition: { maxLifeOpp: 3 }, ops: [{ op: 'playSelf' }] },
  ],
  'OP06-114': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'stage', costIs: 1 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck your Stage?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'bottomDeckFromField', ref: 'pay' },
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Shandian Warrior', orNameIs: 'Upper Yard' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP06-115': [
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
      condition: { maxLifeSelf: 0 },
      ops: [
        { op: 'deckTopToLife', count: 1 },
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
  'OP06-116': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Mode 1: K.O.',
        },
        { op: 'ko', ref: 'b1' },
        { op: 'abortIfChosen', ref: 'b1' },
        { op: 'requireCond', cond: { minLifeOpp: 1, maxLifeOpp: 1 } },
        { op: 'dealDamage', count: 1 },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP06-117': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Enel', rested: false },
          min: 1,
          max: 1,
          prompt: 'Rest 1 Enel card',
        },
        { op: 'rest', ref: 'pay' },
        { op: 'removeAll', owner: 'opponent', dest: 'trash', costAtMost: 2 },
      ],
    },
  ],
  'OP06-118': [
    {
      timing: 'whenAttacking',
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
      oncePerTurn: true,
    },
    {
      timing: 'activateMain',
      ops: [{ op: 'setActive', ref: 'self' }],
      oncePerTurn: true,
      cost: { restDon: 2 },
    },
  ],
  'OP06-119': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'revealTopMayPlay',
          filter: { cardType: 'Character', costAtMost: 9, nameNot: 'Sanji' },
        },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP06_STATICS: Record<string, StaticDef[]> = {
  'OP06-002': [
    { condition: { selfPowerAtLeast: 7000 }, target: { scope: 'self' }, keyword: 'Banish' },
  ],
  'OP06-010': [
    { condition: { leaderTypeIncludes: 'FILM' }, target: { scope: 'self' }, keyword: 'Blocker' },
  ],
  'OP06-012': [
    { condition: { oppBasePowerAtLeast: 6000 }, target: { scope: 'self' }, flag: 'noBattleKo' },
  ],
  'OP06-052': [
    {
      target: { scope: 'self' },
      donRequired: 1,
      condition: { maxHandSelf: 4 },
      flag: 'noBattleKo',
    },
  ],
  'OP06-054': [{ target: { scope: 'self' }, condition: { maxHandSelf: 4 }, keyword: 'Blocker' }],
  'OP06-067': [{ condition: { oppAtLeastSelfDon: true }, target: { scope: 'self' }, power: 1000 }],
  'OP06-072': [
    {
      condition: { leaderTypeIncludes: 'GERMA 66', oppDonAdvantageAtLeast: 2 },
      target: { scope: 'self' },
      keyword: 'Blocker',
    },
  ],
  'OP06-083': [{ target: { scope: 'self' }, flag: 'cannotAttack' }],
  'OP06-085': [
    {
      donRequired: 2,
      condition: { yourTurn: true },
      target: { scope: 'self' },
      powerPer: { trashPer5: true, amount: 1000 },
    },
  ],
  'OP06-088': [
    {
      condition: { leaderTypeIncludes: 'Dressrosa', leaderActive: true },
      target: { scope: 'self' },
      power: 2000,
    },
  ],
  'OP06-109': [
    { donRequired: 2, condition: { maxLifeOpp: 3 }, target: { scope: 'self' }, flag: 'noEffectKo' },
  ],
  'OP06-110': [{ target: { scope: 'self' }, donRequired: 2, flag: 'canAttackActive' }],
  'OP06-113': [
    {
      condition: { hasOtherCharacterTyped: 'Shandian Warrior' },
      target: { scope: 'self' },
      keyword: 'Blocker',
    },
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP06: string[] = ['OP06-032', 'OP06-087']

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP06: Record<string, string> = {
  'OP06-009':
    'SIMPLIFIED: the shared once-per-turn is tracked per timing (attack and block each mark their own)',
  'OP06-035':
    'SIMPLIFIED: rests up to 2 Characters only (the Characters-or-DON mixed total is not modeled)',
  'OP06-048':
    'SIMPLIFIED: fires on opponent Events only (Blocker activation is not an engine event) and the mill is mandatory',
  'OP06-051': 'SIMPLIFIED: trashing exactly 2 is all-or-nothing',
  'OP06-057': 'SIMPLIFIED: an unplayed revealed card stays on top (text allows top or bottom)',
  'OP06-062': 'SIMPLIFIED: the different-names rule on the mass play is not enforced',
  'OP06-074': 'SIMPLIFIED: negation covers printed keywords, statics and effect defs',
  'OP06-086':
    'SIMPLIFIED: the cost-4 pick plays active and the cost-2 pick plays rested (text lets you choose which)',
  'OP06-092': 'SIMPLIFIED: the opponent picks the 3 trash cards; bottom order is not chosen',
  'OP06-093':
    'SIMPLIFIED: modes are offered cost-mod first; declining it makes the hand trash mandatory',
  'OP06-099': 'SIMPLIFIED: the life scry moves a top card to the bottom (the look is not modeled)',
  'OP06-102': 'SIMPLIFIED: the Stage cost pays with your own cost-1 Stage only',
  'OP06-111': 'SIMPLIFIED: the Stage cost pays with your own cost-1 Stage only',
  'OP06-115': "SIMPLIFIED: the trigger's life add is mandatory when at 0 Life",
  'OP06-116':
    'SIMPLIFIED: modes are offered K.O. first; the damage mode is reachable only by declining it',
  'OP06-119': 'SIMPLIFIED: an unplayed revealed card stays on top (text says bottom)',
}
