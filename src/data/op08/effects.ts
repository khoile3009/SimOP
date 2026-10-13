import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP08 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts; the rest are authored against the
 * printed text (several API texts drop minus signs on power/cost debuffs - the
 * authored amounts restore them). Deviations are in COVERAGE_NOTES_OP08.
 */
export const OP08_EFFECTS: Record<string, EffectDef[]> = {
  'OP08-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludesAny: ['Animal', 'Drum Kingdom'],
          },
          min: 0,
          max: 3,
          prompt: 'Give 1 DON!! each',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'b1' },
      ],
    },
  ],
  'OP08-002': [
    {
      timing: 'activateMain',
      donRequired: 1,
      oncePerTurn: true,
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Bottom-deck 1',
        },
        { op: 'bottomDeck', ref: 'pay' },
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
  'OP08-004': [
    {
      timing: 'onPlay',
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
      condition: { hasCharacterNamed: 'Chess' },
    },
  ],
  'OP08-005': [
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
        { op: 'requireCond', cond: { lacksCharacterNamed: 'Kuromarimo' } },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Kuromarimo' },
          min: 0,
          max: 1,
          prompt: 'Play Kuromarimo',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP08-007': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', typeIncludes: 'Animal', powerAtMost: 4000 },
          upTo: 1,
          to: 'play',
          playRested: true,
        },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', typeIncludes: 'Animal', powerAtMost: 4000 },
          upTo: 1,
          to: 'play',
          playRested: true,
        },
      ],
    },
  ],
  'OP08-008': [
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
    {
      timing: 'activateMain',
      donRequired: 1,
      oncePerTurn: true,
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'OP08-010': [
    {
      timing: 'activateMain',
      donRequired: 1,
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Animal', excludeSelf: true },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'OP08-012': [
    {
      timing: 'whenAttacking',
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
      donRequired: 2,
      condition: { leaderTypeIncludes: 'Drum Kingdom' },
    },
  ],
  'OP08-014': [
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
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
      donRequired: 1,
    },
  ],
  'OP08-015': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 4,
          filter: {
            nameNot: 'Dr.Kureha',
            typeIncludes: 'Drum Kingdom',
            orNameIs: 'Tony Tony.Chopper',
          },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP08-016': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { leaderNameIs: 'Tony Tony.Chopper' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Tony Tony.Chopper' },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP08-017': [
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
          filter: { owner: 'opponent', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give -1000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -1000, duration: 'turn' },
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
  'OP08-018': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 3,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'turn' },
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
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give -3000 power',
        },
        { op: 'powerMod', ref: 'b3', amount: -3000, duration: 'turn' },
      ],
    },
  ],
  'OP08-019': [
    {
      timing: 'main',
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 3000, duration: 'turn' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -3000 power',
        },
        { op: 'powerMod', ref: 'b3', amount: -3000, duration: 'turn' },
        {
          op: 'select',
          bind: 'b4',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b4', amount: 3000, duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b5',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 5000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b5' },
      ],
    },
  ],
  'OP08-021': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { hasCharacterTypeIncludes: 'Minks' },
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
    },
  ],
  'OP08-022': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Minks' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 5 },
          min: 0,
          max: 2,
          prompt: 'Will not refresh',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'OP08-023': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Will not refresh',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Will not refresh',
        },
        { op: 'grantFlag', ref: 'b2', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'OP08-024': [
    {
      timing: 'whenAttacking',
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
  'OP08-025': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Will not refresh',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'OP08-026': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Will not refresh',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'OP08-028': [
    {
      timing: 'onPlay',
      condition: { minOppRestedAny: 7 },
      ops: [{ op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' }],
    },
  ],
  'OP08-030': [
    {
      timing: 'onKo',
      ops: [
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
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Mode 2: K.O.',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'OP08-031': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Minks',
            costAtMost: 2,
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
  'OP08-032': [
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
      cost: { restSelf: true },
      condition: { leaderTypeIncludes: 'Minks' },
    },
  ],
  'OP08-033': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2, rested: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
      condition: { leaderTypeIncludes: 'Minks' },
    },
  ],
  'OP08-034': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Wanda', typeIncludes: 'Minks' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP08-036': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 7 },
          min: 0,
          max: 5,
          selectAll: true,
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
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b2' },
      ],
    },
  ],
  'OP08-037': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', rested: false, typeIncludes: 'Minks' },
          min: 0,
          max: 1,
          prompt: 'You may rest 1',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'rest', ref: 'b1' },
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
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP08-038': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', rested: false },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Rest 2 of your Characters?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'grantFlagAll', flag: 'noOppEffectKo', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
    {
      timing: 'trigger',
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
  'OP08-039': [
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
      cost: { restSelf: true },
      condition: { leaderTypeIncludes: 'Minks' },
    },
    {
      timing: 'endOfTurn',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Minks', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b2' },
      ],
    },
  ],
  'OP08-040': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeContains: 'Whitebeard Pirates' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Reveal 2 Whitebeard cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        { op: 'requireCond', cond: { leaderTypeContains: 'Whitebeard Pirates' } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP08-041': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'returnToHand', ref: 'self' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Kuja Pirates' } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
    },
  ],
  'OP08-042': [
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
  'OP08-043': [
    {
      timing: 'onPlay',
      condition: { leaderTypeContains: 'Whitebeard Pirates', maxLifeSelf: 2 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 5,
          selectAll: true,
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
  'OP08-044': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeContains: 'Whitebeard Pirates' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Reveal 2 Whitebeard cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP08-045': [
    { timing: 'replaceKo', ops: [{ op: 'koSelfNoReplace' }, { op: 'draw', count: 1 }] },
    {
      timing: 'replaceKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      ops: [{ op: 'koSelfNoReplace' }, { op: 'draw', count: 1 }],
    },
  ],
  'OP08-046': [
    {
      timing: 'onEvent',
      on: { kind: 'charRemovedByEffect', who: 'self' },
      condition: { yourTurn: true, minHandOpp: 5 },
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
        { op: 'rest', ref: 'self' },
      ],
    },
  ],
  'OP08-047': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', excludeSelf: true },
          min: 0,
          max: 1,
          prompt: 'Return 1 of your Characters?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnToHand', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP08-049': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'revealTopCheck',
          filter: { typeContains: 'Whitebeard Pirates' },
          amount: 0,
          duration: 'turn',
          keyword: 'Rush',
        },
      ],
    },
  ],
  'OP08-050': [
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
  'OP08-051': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Edward Weevil' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP08-052': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'revealTopMayPlay',
          filter: { cardType: 'Character', typeContains: 'Whitebeard Pirates', costAtMost: 4 },
        },
      ],
    },
  ],
  'OP08-053': [
    {
      timing: 'main',
      condition: { leaderTypeContains: 'Whitebeard Pirates' },
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeContains: 'Whitebeard Pirates', orNameIs: 'Monkey.D.Luffy' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP08-054': [
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
          op: 'revealTopMayPlay',
          filter: { cardType: 'Character', typeContains: 'Whitebeard Pirates', costAtMost: 3 },
        },
      ],
    },
  ],
  'OP08-055': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeContains: 'Whitebeard Pirates' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Reveal 2 Whitebeard cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
    },
  ],
  'OP08-056': [
    {
      timing: 'onEvent',
      on: {
        kind: 'charRemovedByEffect',
        who: 'self',
        anyPlayer: true,
        removedOwn: true,
        removedTypeContains: 'Whitebeard Pirates',
      },
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
          prompt: 'Bottom-deck 1',
        },
        { op: 'bottomDeck', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP08-057': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 2 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Mode: -2 cost (decline to draw)',
        },
        { op: 'costMod', ref: 'b1', amount: -2, duration: 'turn' },
        { op: 'abortIfChosen', ref: 'b1' },
        { op: 'requireCond', cond: { maxHandSelf: 5 } },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'OP08-058': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'lifeFaceUp', count: 2 },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
  ],
  'OP08-059': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'requireCond',
          cond: { leaderTypeIncludes: 'Animal Kingdom Pirates', minDonField: 10 },
        },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'King', costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Play King',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP08-060': [
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
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'requireCond', cond: { minDonFieldOpp: 5 } },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'OP08-061': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP08-062': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Big Mom Pirates' } },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            nameIs: 'Charlotte Katakuri',
            costAtLeast: 3,
            costAtMostOppDon: true,
          },
          min: 0,
          max: 1,
          prompt: 'Play Katakuri',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP08-063': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'lifeFaceDown', count: 1 },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'OP08-064': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 1 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Biscuit Warrior' },
          min: 0,
          max: 1,
          prompt: 'Play Biscuit Warrior',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP08-066': [{ timing: 'onKo', ops: [{ op: 'addDon', count: 1, rested: true }] }],
  'OP08-067': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      condition: { yourTurn: true },
      oncePerTurn: true,
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'OP08-068': [
    { timing: 'onKo', ops: [{ op: 'addDon', count: 1, rested: true }] },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'playSelf' },
      ],
    },
  ],
  'OP08-069': [
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
          prompt: 'Return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        {
          op: 'select',
          bind: 'pay2',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'pay2' },
        { op: 'deckTopToLife', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
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
  ],
  'OP08-070': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
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
          filter: { owner: 'self', zone: 'hand', nameIs: 'Viscount Hiyoko', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Play Viscount Hiyoko',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP08-071': [
    {
      timing: 'onKo',
      condition: { opponentsTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        {
          op: 'searchDeck',
          filter: { nameIs: 'Baron Tamago', costAtMost: 4 },
          upTo: 1,
          to: 'play',
        },
      ],
    },
  ],
  'OP08-073': [
    {
      timing: 'onKo',
      condition: { opponentsTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        {
          op: 'searchDeck',
          filter: { nameIs: 'Count Niwatori', costAtMost: 6 },
          upTo: 1,
          to: 'play',
        },
      ],
    },
  ],
  'OP08-074': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { lacksOtherCharacterNamed: 'Black Maria' },
      ops: [
        { op: 'addDon', count: 5, rested: true },
        { op: 'restrictSelf', restriction: 'donEqualize' },
      ],
    },
  ],
  'OP08-075': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
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
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
        { op: 'lifeFaceDown', count: 'all' },
      ],
    },
  ],
  'OP08-076': [
    {
      timing: 'main',
      ops: [
        { op: 'addDon', count: 1, rested: false },
        { op: 'requireCond', cond: { oppCharPowerAtLeast: 6000 } },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'OP08-077': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Return 2 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        {
          op: 'requireCond',
          cond: { leaderTypeIncludesAny: ['Animal Kingdom Pirates', 'Big Mom Pirates'] },
        },
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
  ],
  'OP08-079': [
    {
      timing: 'activateMain',
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
        { op: 'requireCond', cond: { selfPlayedThisTurn: true } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Trash up to 1',
        },
        { op: 'trashFromField', ref: 'b1' },
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
  'OP08-080': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Queen', typeIncludes: 'Animal Kingdom Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP08-081': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', typeContains: 'CP' },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'You may bottom-deck 3 from your trash',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashToDeckBottom', ref: 'b1' },
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
  ],
  'OP08-082': [
    {
      timing: 'activateMain',
      cost: { restDon: 1, restSelf: true },
      ops: [
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
  'OP08-084': [
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
      cost: { restSelf: true },
    },
  ],
  'OP08-085': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      condition: { minSelfCharCost: 8 },
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
  'OP08-086': [
    {
      timing: 'onPlay',
      condition: { oppCharCostAtMost: 0 },
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
  'OP08-087': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
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
      ],
    },
  ],
  'OP08-088': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: '+1 cost',
        },
        { op: 'costMod', ref: 'b1', amount: 1, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP08-090': [
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
            typeIncludes: 'SMILE',
            costAtMost: 2,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP08-091': [
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
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b3' },
      ],
    },
  ],
  'OP08-092': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Ulti', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Play Ulti from trash',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP08-094': [
    {
      timing: 'main',
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
          bind: 'pay2',
          filter: { owner: 'self', zone: 'trash' },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'Bottom-deck 3 from trash?',
        },
        { op: 'abortIfEmpty', ref: 'pay2' },
        { op: 'trashToDeckBottom', ref: 'pay2' },
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
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP08-095': [
    {
      timing: 'main',
      condition: { minTrashSelf: 10 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
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
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP08-096': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+5000 if a 6+ cost card is trashed',
        },
        {
          op: 'millTopCheck',
          filter: { costAtLeast: 6 },
          ref: 'b1',
          amount: 5000,
          duration: 'battle',
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
            colorIncludes: 'Black',
            cardType: 'Character',
            costAtMost: 3,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP08-097': [
    {
      timing: 'main',
      ops: [
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Animal Kingdom Pirates' } },
        {
          op: 'select',
          bind: 'b0',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -2 cost',
        },
        { op: 'costMod', ref: 'b0', amount: -2, duration: 'turn' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 0 },
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP08-098': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Shandian Warrior',
            costAtMostSelfDon: true,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'playCards', ref: 'b1' },
        { op: 'lifeTopToHand', count: 1 },
      ],
      donRequired: 1,
    },
  ],
  'OP08-100': [
    {
      timing: 'onPlay',
      ops: [{ op: 'searchTop', count: 7, filter: { nameIs: 'Upper Yard' }, upTo: 1, to: 'play' }],
    },
  ],
  'OP08-101': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'trashLifeTop', owner: 'self', count: 1 },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Big Mom Pirates' } },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'OP08-102': [
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
          filter: { owner: 'opponent', zone: 'characters', costAtMostSelfLife: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP08-103': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP08-104': [
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
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'OP08-105': [
    {
      timing: 'onEvent',
      on: { kind: 'lifeRemoved', who: 'opponent' },
      donRequired: 1,
      condition: { yourTurn: true },
      oncePerTurn: true,
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
  'OP08-106': [
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
        { op: 'requireCond', cond: { maxHandSelf: 3 } },
        { op: 'draw', count: 1 },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'onPlay' }] },
  ],
  'OP08-107': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Charlotte Pudding' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP08-109': [
    {
      timing: 'onPlay',
      ops: [{ op: 'deckTopToLife', count: 1 }],
      condition: { leaderTypeIncludes: 'Shandian Warrior' },
    },
  ],
  'OP08-110': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 5, filter: { nameIs: 'Upper Yard' }, upTo: 1, to: 'hand' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Upper Yard' },
          min: 0,
          max: 1,
          prompt: 'Play Upper Yard',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP08-111': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
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
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
        { op: 'playSelf' },
      ],
    },
  ],
  'OP08-112': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'opponent',
            zone: 'characters',
            costAtMost: 6,
            nameNot: 'Monkey.D.Luffy',
          },
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
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'onPlay' }] },
  ],
  'OP08-113': [
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
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
        { op: 'playSelf' },
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
  'OP08-114': [
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
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
        { op: 'playSelf' },
      ],
    },
  ],
  'OP08-115': [
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
          filter: { owner: 'self', zone: 'hand', nameIs: 'Upper Yard' },
          min: 0,
          max: 1,
          prompt: 'Play Upper Yard',
        },
        { op: 'playCards', ref: 'b2' },
      ],
      condition: { leaderTypeIncludes: 'Shandian Warrior' },
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
  'OP08-116': [
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
          bind: 'L',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add top Life to hand?',
        },
        { op: 'lifeToHand', ref: 'L' },
        { op: 'abortIfEmpty', ref: 'L' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Shandian Warrior' },
          min: 0,
          max: 1,
          prompt: 'Add to top of Life',
        },
        { op: 'handToLife', ref: 'h', faceUp: true },
      ],
    },
  ],
  'OP08-117': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'life' },
          min: 0,
          max: 1,
          prompt: 'Trash your top Life card?',
        },
        { op: 'abortIfEmpty', ref: 'L' },
        { op: 'lifeToTrash', ref: 'L' },
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
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'L2',
          filter: { owner: 'self', zone: 'life' },
          min: 0,
          max: 1,
          prompt: 'Add top Life to hand?',
        },
        { op: 'lifeToHand', ref: 'L2' },
        { op: 'abortIfEmpty', ref: 'L2' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Add to top of Life',
        },
        { op: 'handToLife', ref: 'h' },
      ],
    },
  ],
  'OP08-118': [
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
        { op: 'powerMod', ref: 'b1', amount: -3000, duration: 'untilTurn', untilTurnOffset: 1 },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', excludeSelf: true },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -2000, duration: 'untilTurn', untilTurnOffset: 1 },
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 3000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b3' },
      ],
    },
  ],
  'OP08-119': [
    {
      timing: 'whenAttacking',
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
        { op: 'removeAll', owner: 'both', dest: 'trash', excludeSelf: true },
        { op: 'deckTopToLife', count: 1 },
        { op: 'trashLifeTop', owner: 'opponent', count: 1 },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP08_STATICS: Record<string, StaticDef[]> = {
  'OP08-006': [
    {
      condition: { yourTurn: true, trashContainsNames: ['Kuromarimo', 'Chess'] },
      target: { scope: 'self' },
      power: 2000,
    },
  ],
  'OP08-013': [{ target: { scope: 'self' }, donRequired: 2, keyword: 'Rush' }],
  'OP08-020': [
    {
      condition: { opponentsTurn: true },
      target: { scope: 'myCharacters', typeIncludes: 'Drum Kingdom' },
      power: 1000,
    },
  ],
  'OP08-029': [
    {
      condition: { selfActive: true },
      target: {
        scope: 'myCharactersOther',
        typeIncludes: 'Minks',
        costAtMost: 3,
        nameNot: 'Pekoms',
      },
      flag: 'noEffectKo',
    },
  ],
  'OP08-083': [
    {
      donRequired: 1,
      condition: { yourTurn: true },
      target: { scope: 'oppCharacters' },
      costMod: -1,
    },
  ],
  'OP08-084': [{ target: { scope: 'self' }, costMod: 4 }],
  'OP08-093': [{ donRequired: 1, target: { scope: 'self' }, costMod: 2 }],
  'OP08-114': [
    {
      donRequired: 1,
      condition: { lessLifeThanOpp: true },
      target: { scope: 'self' },
      flag: 'noBattleKoBySlash',
    },
    {
      donRequired: 1,
      condition: { lessLifeThanOpp: true },
      target: { scope: 'self' },
      power: 2000,
    },
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP08: string[] = ['OP08-003', 'OP08-072']

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP08: Record<string, string> = {
  'OP08-002': 'SIMPLIFIED: the kept card goes to the deck bottom (text allows top or bottom)',
  'OP08-043':
    'SIMPLIFIED: the attack tax (attack allowed by trashing 2) is modeled as a hard attack lock',
  'OP08-050': 'SIMPLIFIED: both cards go to the bottom (text allows top or bottom)',
  'OP08-052': 'SIMPLIFIED: an unplayed revealed card stays on top (text allows top or bottom)',
  'OP08-054': 'SIMPLIFIED: an unplayed revealed card stays on top (text allows top or bottom)',
  'OP08-057':
    'SIMPLIFIED: modes are offered cost-down first; declining it rolls into the draw mode',
  'OP08-074': 'SIMPLIFIED: the end-of-turn DON!! return takes cost-area DON only, rested first',
  'OP08-098': "SIMPLIFIED: the played card's cost cap reads DON!! at resolution time",
  'OP08-101': 'SIMPLIFIED: the life refill happens immediately instead of at the end of the turn',
  'OP08-118': 'SIMPLIFIED: the two debuff picks may select the same Character only once each',
}
