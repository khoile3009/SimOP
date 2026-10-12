import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP10 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts; the rest are authored against the
 * printed text (API-dropped minus signs restored on opponent debuffs).
 * Deviations are documented in COVERAGE_NOTES_OP10.
 */
export const OP10_EFFECTS: Record<string, EffectDef[]> = {
  'OP10-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { otherCharPowerAtLeast: 7000 },
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
  'OP10-002': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Punk Hazard',
            costAtLeast: 2,
          },
          min: 0,
          max: 1,
          prompt: 'Return a Punk Hazard Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnToHand', ref: 'pay' },
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
  'OP10-003': [
    {
      timing: 'endOfTurn',
      condition: { charTypedPowerAtLeast: { type: 'Donquixote Pirates', power: 6000 } },
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
    {
      timing: 'onEvent',
      on: { kind: 'eventActivated', who: 'self' },
      condition: { opponentsTurn: true },
      oncePerTurn: true,
      ops: [{ op: 'addDon', count: 1, rested: false }],
    },
  ],
  'OP10-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Vergo', typeIncludes: 'Punk Hazard' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP10-005': [{ timing: 'onKo', ops: [{ op: 'draw', count: 1 }] }],
  'OP10-006': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 5, filter: { nameIs: 'Smiley' }, upTo: 1, to: 'hand' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Smiley' },
          min: 0,
          max: 1,
          prompt: 'Play Smiley',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP10-007': [
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
            typeIncludes: 'Punk Hazard',
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
  'OP10-008': [
    {
      timing: 'onPlay',
      condition: { lacksCharacterNamed: 'Rock' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Rock' },
          min: 0,
          max: 1,
          prompt: 'Play Rock',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP10-009': [
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
      condition: { leaderTypeIncludes: 'Punk Hazard' },
    },
  ],
  'OP10-010': [
    {
      timing: 'whenAttacking',
      ops: [{ op: 'powerMod', ref: 'self', amount: 1000, duration: 'turn' }],
      condition: { maxSelfCharacters: 1 },
    },
  ],
  'OP10-015': [
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
  'OP10-016': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -1000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -1000, duration: 'turn' },
      ],
    },
  ],
  'OP10-017': [
    {
      timing: 'onPlay',
      condition: { lacksCharacterNamed: 'Scotch' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Scotch' },
          min: 0,
          max: 1,
          prompt: 'Play Scotch',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP10-018': [
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
          filter: { owner: 'opponent', zone: 'leaderOrCharacters' },
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
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b3', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'OP10-019': [
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
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 8000 },
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
  'OP10-020': [
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
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 3000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b3' },
      ],
    },
  ],
  'OP10-021': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { leaderNameIs: 'Caesar Clown' },
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
  'OP10-022': [
    {
      timing: 'activateMain',
      donRequired: 1,
      oncePerTurn: true,
      condition: { minSelfCharsTotalCost: 5 },
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
          op: 'revealLifeTopMayPlay',
          filter: { cardType: 'Character', typeIncludes: 'Supernovas', costAtMost: 5 },
        },
      ],
    },
  ],
  'OP10-023': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 5 },
          min: 0,
          max: 2,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
      condition: { leaderTypeIncludes: 'Navy' },
    },
  ],
  'OP10-024': [
    {
      timing: 'onPlay',
      condition: { minSelfRestedCharacters: 2 },
      ops: [
        {
          op: 'select',
          bind: 'b0',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b0' },
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
    },
  ],
  'OP10-025': [
    {
      timing: 'onPlay',
      condition: { minSelfRestedCharacters: 2 },
      ops: [
        { op: 'draw', count: 3 },
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
  'OP10-026': [
    {
      timing: 'activateMain',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash', nameIs: "Kin'emon", powerAtMost: 0 },
          min: 1,
          max: 1,
          prompt: "Bottom-deck a Kin'emon from trash",
        },
        { op: 'trashToDeckBottom', ref: 'pay' },
        { op: 'bottomDeckFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: "Kin'emon", costIs: 6 },
          min: 0,
          max: 1,
          prompt: "Play Kin'emon",
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP10-027': [
    {
      timing: 'activateMain',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash', nameIs: "Kin'emon", powerAtLeast: 1000 },
          min: 1,
          max: 1,
          prompt: "Bottom-deck a Kin'emon from trash",
        },
        { op: 'trashToDeckBottom', ref: 'pay' },
        { op: 'bottomDeckFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', nameIs: "Kin'emon", costIs: 6 },
          min: 0,
          max: 1,
          prompt: "Play Kin'emon",
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP10-028': [
    {
      timing: 'activateMain',
      cost: { restDon: 2 },
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'The Akazaya Nine' },
          upTo: 2,
          to: 'hand',
        },
      ],
    },
  ],
  'OP10-029': [
    {
      timing: 'onPlay',
      condition: { minSelfRestedCharacters: 2 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'ODYSSEY',
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
  ],
  'OP10-030': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
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
  'OP10-032': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guard: { owner: 'self', zone: 'characters', colorIncludes: 'Green', nameNot: 'Tashigi' },
      condition: { selfRested: false },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Rest Tashigi to save it?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'rest', ref: 'self' },
      ],
    },
  ],
  'OP10-033': [
    {
      timing: 'onPlay',
      condition: { minSelfRestedCharsTyped: { type: 'ODYSSEY', count: 2 } },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'don', rested: true },
          min: 0,
          max: 1,
          prompt: 'DON!! stays rested',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'OP10-034': [
    {
      timing: 'replaceKo',
      replaceWhen: 'battle',
      oncePerTurn: true,
      condition: { minLifeSelf: 1 },
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'life' },
          min: 0,
          max: 1,
          prompt: 'Take a Life card to save Franky?',
        },
        { op: 'guardResolve', choiceRef: 'L', targetRef: 'self' },
        { op: 'lifeToHand', ref: 'L' },
      ],
    },
  ],
  'OP10-035': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters', rested: false, costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP10-036': [
    {
      timing: 'onEvent',
      on: { kind: 'restedByEffect', who: 'self' },
      condition: { yourTurn: true },
      oncePerTurn: true,
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
  'OP10-037': [
    {
      timing: 'replaceKo',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'ODYSSEY', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest an ODYSSEY Character to save Lim?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'rest', ref: 'pay' },
      ],
    },
    {
      timing: 'endOfTurn',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'ODYSSEY', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b1' },
      ],
    },
  ],
  'OP10-039': [
    {
      timing: 'main',
      condition: { leaderTypeIncludes: 'ODYSSEY' },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', typeIncludes: 'ODYSSEY' },
          upTo: 2,
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
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP10-040': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 7, rested: true },
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 7, rested: true },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP10-041': [
    {
      timing: 'main',
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5, rested: true },
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
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b3' },
      ],
    },
  ],
  'OP10-042': [
    {
      timing: 'onEvent',
      on: { kind: 'charRemovedByEffect', who: 'opponent' },
      condition: { opponentsTurn: true, maxHandSelf: 5 },
      oncePerTurn: true,
      ops: [{ op: 'draw', count: 1 }],
    },
    {
      timing: 'onEvent',
      on: { kind: 'characterKoed', who: 'self' },
      condition: { opponentsTurn: true, maxHandSelf: 5 },
      oncePerTurn: true,
      ops: [{ op: 'draw', count: 1 }],
    },
  ],
  'OP10-043': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'leaderOrStage',
            typeIncludes: 'Dressrosa',
            rested: false,
          },
          min: 0,
          max: 1,
          prompt: 'Rest Leader or Stage?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Monkey.D.Luffy' },
          min: 0,
          max: 1,
          prompt: 'Grant Banish',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Banish', duration: 'turn' },
      ],
    },
  ],
  'OP10-044': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'leaderOrStage',
            typeIncludes: 'Dressrosa',
            rested: false,
          },
          min: 0,
          max: 1,
          prompt: 'Rest Leader or Stage?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP10-045': [
    {
      timing: 'whenAttacking',
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
      oncePerTurn: true,
    },
  ],
  'OP10-046': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP10-047': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Revolutionary Army',
            costAtLeast: 3,
          },
          min: 0,
          max: 1,
          prompt: 'Return a Revolutionary Army Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnToHand', ref: 'pay' },
        { op: 'powerMod', ref: 'self', amount: 3000, duration: 'turn' },
      ],
    },
  ],
  'OP10-048': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'leaderOrStage',
            typeIncludes: 'Dressrosa',
            rested: false,
          },
          min: 0,
          max: 1,
          prompt: 'Rest Leader or Stage?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP10-049': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guard: { owner: 'self', zone: 'characters', baseCostAtMost: 7, nameNot: 'Sabo' },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Return Sabo to hand to save it?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'returnToHand', ref: 'self' },
      ],
    },
  ],
  'OP10-051': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeIncludes: 'Revolutionary Army', cardType: 'Character' },
          upTo: 1,
          to: 'hand',
        },
      ],
      donRequired: 1,
    },
  ],
  'OP10-052': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
    },
  ],
  'OP10-055': [
    {
      timing: 'onKo',
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
      ],
    },
  ],
  'OP10-056': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'leaderOrStage',
            typeIncludes: 'Dressrosa',
            rested: false,
          },
          min: 0,
          max: 1,
          prompt: 'Rest Leader or Stage?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'pay2',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Dressrosa', costAtLeast: 4 },
          min: 1,
          max: 1,
          prompt: 'Return a Dressrosa Character',
        },
        { op: 'returnToHand', ref: 'pay2' },
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
  'OP10-057': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Usopp' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'leaderOrStage', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest Leader or Stage?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Dressrosa', nameNot: 'Leo' },
          upTo: 2,
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
  ],
  'OP10-058': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'requireCond', cond: { anyCharacterCostAtLeast: 8 } },
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'h1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Dressrosa',
            costAtMost: 7,
            nameNot: 'Rebecca',
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'h1' },
        {
          op: 'select',
          bind: 'h2',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Dressrosa',
            costAtMost: 4,
            nameNot: 'Rebecca',
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand rested',
        },
        { op: 'playCards', ref: 'h2', rested: true },
      ],
    },
  ],
  'OP10-059': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Dressrosa', cardType: 'Character' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP10-060': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP10-061': [
    {
      timing: 'main',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
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
  'OP10-062': [
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
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Donquixote Pirates' } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', colorIncludes: 'Purple', cardType: 'Event' },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
      ],
    },
  ],
  'OP10-063': [
    {
      timing: 'onPlay',
      condition: { leaderTypeContains: 'GERMA' },
      ops: [{ op: 'searchTop', count: 5, filter: { typeContains: 'GERMA' }, upTo: 1, to: 'hand' }],
    },
  ],
  'OP10-065': [
    {
      timing: 'activateMain',
      cost: { restDon: 1, restSelf: true },
      ops: [
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
  'OP10-066': [
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
          max: 2,
          exact: true,
          prompt: 'Rest 2 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
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
  'OP10-067': [
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
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            colorIncludes: 'Purple',
            cardType: 'Event',
            costAtMost: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
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
  'OP10-069': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP10-070': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', basePowerAtMost: 1000 },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: 'Protect from opponent K.O.',
        },
        {
          op: 'grantFlag',
          ref: 'b1',
          flag: 'noOppEffectKo',
          duration: 'untilTurn',
          untilTurnOffset: 1,
        },
      ],
    },
  ],
  'OP10-071': [
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
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay2',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Rest 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay2' },
        { op: 'rest', ref: 'pay2' },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'OP10-072': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', cardType: 'Event' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        { op: 'draw', count: 2 },
      ],
    },
    {
      timing: 'endOfTurn',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 2,
          prompt: 'Set DON!! active',
        },
        { op: 'setActive', ref: 'b2' },
      ],
      condition: { minDonField: 7 },
    },
  ],
  'OP10-074': [
    {
      timing: 'replaceKo',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Rest 2 DON!! to save Pica?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'rest', ref: 'pay' },
      ],
    },
  ],
  'OP10-075': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'requireCond', cond: { oppAtLeastSelfDon: true } },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'OP10-076': [
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
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Donquixote Pirates' } },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'OP10-077': [
    {
      timing: 'onBlock',
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
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'OP10-078': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: {
            nameNot: 'I Do Not Forgive Those Who Laugh at My Family!!!',
            typeIncludes: 'Donquixote Pirates',
          },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: {
            nameNot: 'I Do Not Forgive Those Who Laugh at My Family!!!',
            typeIncludes: 'Donquixote Pirates',
          },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP10-079': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'OP10-080': [
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
        { op: 'requireCond', cond: { minDonField: 7, maxHandSelf: 5 } },
        { op: 'draw', count: 1 },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'OP10-081': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'leaderOrStage',
            typeIncludes: 'Dressrosa',
            rested: false,
          },
          min: 0,
          max: 1,
          prompt: 'Rest Leader or Stage?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
        { op: 'millSelf', count: 2 },
      ],
    },
  ],
  'OP10-082': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Blackbeard Pirates',
            costAtMost: 5,
            nameNot: 'Kuzan',
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP10-083': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'leaderOrStage',
            typeIncludes: 'Dressrosa',
            rested: false,
          },
          min: 1,
          max: 1,
          prompt: 'Rest Leader or Stage',
        },
        { op: 'rest', ref: 'pay' },
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
  'OP10-085': [{ timing: 'onPlay', ops: [{ op: 'millSelf', count: 2 }] }],
  'OP10-086': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { leaderTypeIncludes: 'Blackbeard Pirates', selfPlayedThisTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'OP10-087': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'leaderOrStage',
            typeIncludes: 'Dressrosa',
            rested: false,
          },
          min: 1,
          max: 1,
          prompt: 'Rest Leader or Stage',
        },
        { op: 'rest', ref: 'pay' },
        { op: 'requireCond', cond: { minHandOpp: 5 } },
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
        { op: 'millSelf', count: 2 },
      ],
    },
  ],
  'OP10-088': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'leaderOrStage',
            typeIncludes: 'Dressrosa',
            rested: false,
          },
          min: 1,
          max: 1,
          prompt: 'Rest Leader or Stage',
        },
        { op: 'rest', ref: 'pay' },
        { op: 'draw', count: 1 },
        { op: 'millSelf', count: 2 },
      ],
    },
  ],
  'OP10-090': [
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
            typeIncludes: 'Dressrosa',
            costAtMost: 3,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash rested',
        },
        { op: 'playCards', ref: 'b1', rested: true },
      ],
    },
  ],
  'OP10-091': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'leaderOrStage',
            typeIncludes: 'Dressrosa',
            rested: false,
          },
          min: 1,
          max: 1,
          prompt: 'Rest Leader or Stage',
        },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
        { op: 'millSelf', count: 2 },
      ],
    },
  ],
  'OP10-092': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash', typeIncludes: 'Thriller Bark Pirates' },
          min: 2,
          max: 2,
          prompt: 'Bottom-deck 2 from trash',
        },
        { op: 'trashToDeckBottom', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', nameNot: 'Perona' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP10-093': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', colorIncludes: 'Black' },
          min: 0,
          max: 1,
          prompt: '+3 cost',
        },
        { op: 'costMod', ref: 'b1', amount: 3, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP10-095': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'leaderOrStage',
            typeIncludes: 'Dressrosa',
            rested: false,
          },
          min: 0,
          max: 1,
          prompt: 'Rest Leader or Stage?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
        { op: 'millSelf', count: 2 },
      ],
    },
  ],
  'OP10-096': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'opponent',
            zone: 'characters',
            typeIncludes: 'The Seven Warlords of the Sea',
            costAtMost: 8,
          },
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
          filter: {
            owner: 'opponent',
            zone: 'characters',
            typeIncludes: 'The Seven Warlords of the Sea',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP10-097': [
    {
      timing: 'main',
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
        { op: 'requireCond', cond: { minTrashSelf: 10 } },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Banish', duration: 'turn' },
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
  'OP10-098': [
    {
      timing: 'main',
      condition: { charDisadvantageAtLeast: 2 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 (cost 6-)',
        },
        { op: 'ko', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 (cost 4-)',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'opponent', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: 'Negate Leader',
        },
        { op: 'grantFlag', ref: 'L', flag: 'negated', duration: 'turn' },
        {
          op: 'select',
          bind: 'C',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Negate Character',
        },
        { op: 'grantFlag', ref: 'C', flag: 'negated', duration: 'turn' },
      ],
    },
  ],
  'OP10-099': [
    {
      timing: 'endOfTurn',
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Supernovas',
            costAtLeast: 3,
            costAtMost: 8,
            rested: true,
          },
          min: 0,
          max: 1,
          prompt: 'Set active, grant Blocker',
        },
        { op: 'setActive', ref: 'b1' },
        {
          op: 'grantKeyword',
          ref: 'b1',
          keyword: 'Blocker',
          duration: 'untilTurn',
          untilTurnOffset: 1,
        },
      ],
    },
  ],
  'OP10-100': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'opponent',
            zone: 'characters',
            rested: false,
            costAtMostTotalLife: true,
          },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
    {
      timing: 'trigger',
      condition: { leaderTypeIncludes: 'Revolutionary Army', maxTotalLife: 5 },
      ops: [{ op: 'playSelf' }],
    },
  ],
  'OP10-102': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Revolutionary Army' },
          min: 0,
          max: 3,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'turn' },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],
  'OP10-103': [
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Supernovas',
          },
          min: 0,
          max: 1,
          prompt: 'Add to top of Life',
        },
        { op: 'handToLife', ref: 'b1' },
      ],
    },
  ],
  'OP10-106': [
    {
      timing: 'onKo',
      condition: { leaderTypeIncludes: 'Supernovas' },
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeIncludesAny: ['Supernovas', 'Kid Pirates'] },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP10-107': [
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Supernovas',
            costIs: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Add to top of Life',
        },
        { op: 'handToLife', ref: 'b1' },
      ],
    },
  ],
  'OP10-109': [
    { timing: 'onKo', ops: [{ op: 'trashLifeTop', owner: 'opponent', count: 1 }] },
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
  'OP10-110': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMostOppLife: true },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
    { timing: 'trigger', condition: { maxLifeSelf: 2 }, ops: [{ op: 'playSelf' }] },
  ],
  'OP10-111': [
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
  ],
  'OP10-112': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'characters',
            costAtLeast: 8,
            rested: false,
            excludeSelf: false,
          },
          min: 0,
          max: 1,
          prompt: 'Rest Kid?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'trashLifeTop', owner: 'opponent', count: 1 },
      ],
    },
    {
      timing: 'endOfTurn',
      condition: { maxLifeOpp: 2 },
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
  'OP10-113': [
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
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Supernovas' } },
        { op: 'playSelf' },
      ],
    },
  ],
  'OP10-114': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { atMostLifeOfOpp: true },
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
  'OP10-115': [
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
        { op: 'requireCond', cond: { maxLifeSelf: 0 } },
        { op: 'draw', count: 1 },
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
  'OP10-116': [
    {
      timing: 'main',
      ops: [
        { op: 'scryLifeTops', prompt: 'You may move a top Life card to the bottom' },
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
  'OP10-117': [
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
          filter: { owner: 'self', zone: 'characters', costAtMost: 5, rested: true },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b2' },
      ],
      condition: { maxLifeSelf: 1 },
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP10-118': [
    { timing: 'replaceKo', replaceWhen: 'oppEffect', oncePerTurn: true, ops: [] },
    {
      timing: 'whenAttacking',
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
        { op: 'requireCond', cond: { minHandOpp: 5 } },
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
  'OP10-119': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'h',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Supernovas',
          },
          min: 0,
          max: 1,
          prompt: 'Add to top of Life',
        },
        { op: 'handToLife', ref: 'h' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', typeIncludes: 'Supernovas' },
          min: 0,
          max: 1,
          prompt: 'Give DON!! to Leader',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'L' },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP10_STATICS: Record<string, StaticDef[]> = {
  'OP10-001': [
    {
      condition: { opponentsTurn: true },
      target: { scope: 'myCharacters', typeIncludesAny: ['Navy', 'Punk Hazard'] },
      power: 1000,
    },
  ],
  'OP10-005': [{ target: { scope: 'self' }, condition: { yourTurn: true }, power: 3000 }],
  'OP10-011': [{ target: { scope: 'self' }, condition: { opponentsTurn: true }, power: 2000 }],
  'OP10-038': [
    {
      condition: { opponentsTurn: true, minSelfRestedCharacters: 2 },
      target: { scope: 'self' },
      power: 2000,
    },
  ],
  'OP10-042': [
    { target: { scope: 'myCharacters', typeIncludes: 'Dressrosa', costAtLeast: 2 }, costMod: 1 },
  ],
  'OP10-053': [
    {
      condition: { hasOtherCharacterTyped: 'The Tontattas' },
      target: { scope: 'self' },
      keyword: 'Blocker',
    },
  ],
  'OP10-082': [{ target: { scope: 'self' }, flag: 'noOppEffectRemove' }],
  'OP10-085': [
    { donRequired: 1, condition: { minTrashSelf: 8 }, target: { scope: 'self' }, keyword: 'Rush' },
  ],
  'OP10-086': [{ target: { scope: 'self' }, condition: { opponentsTurn: true }, power: 2000 }],
  'OP10-094': [{ target: { scope: 'self' }, donRequired: 1, keyword: 'Double Attack' }],
  'OP10-104': [
    {
      donRequired: 1,
      condition: { leaderTypeIncludes: 'Supernovas', minLifeOpp: 3 },
      target: { scope: 'self' },
      flag: 'noBattleKo',
    },
  ],
  'OP10-108': [
    {
      condition: { hasOtherCharacterTyped: 'Supernovas' },
      target: { scope: 'self' },
      keyword: 'Blocker',
    },
  ],
  'OP10-113': [
    { target: { scope: 'self' }, condition: { lessLifeThanOpp: true }, keyword: 'Rush' },
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP10: string[] = ['OP10-012', 'OP10-064']

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP10: Record<string, string> = {
  'OP10-022':
    'SIMPLIFIED: the revealed Life card plays only when it matches; unmatched cards stay on top',
  'OP10-030':
    'SIMPLIFIED: the "no more DON refreshes via Character effects this turn" rider is a once-per-turn mark instead',
  'OP10-032': 'SIMPLIFIED: the guard covers opponent-effect K.O.s only (other removals go through)',
  'OP10-034': 'SIMPLIFIED: the saved life card goes to hand hidden, as damage would',
  'OP10-037': 'SIMPLIFIED: the guard covers opponent-effect K.O.s only (other removals go through)',
  'OP10-042':
    'SIMPLIFIED: the removal listeners do not check that the removed card was Dressrosa-typed; two once-per-turn marks',
  'OP10-049': 'SIMPLIFIED: the guard covers opponent-effect K.O.s only (text covers any removal)',
  'OP10-058':
    'SIMPLIFIED: the two plays are separate picks; the rested rider applies to the second (cost 4 or less) pick',
  'OP10-103': 'SIMPLIFIED: the life payment takes the top card (text allows top or bottom)',
  'OP10-107':
    'SIMPLIFIED: the life payment takes the top card (text allows top or bottom); face-up not modeled',
  'OP10-108':
    'SIMPLIFIED: the Blocker condition checks the Supernovas type only (not the yellow color)',
  'OP10-112': 'SIMPLIFIED: the rest-self cost is matched by cost (8+) rather than identity',
  'OP10-119': 'SIMPLIFIED: the added life card enters face-down like all life cards here',
}
