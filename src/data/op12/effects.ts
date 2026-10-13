import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP12 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts; the rest are authored against the
 * printed text (API-dropped minus signs restored on opponent debuffs).
 * Deviations are documented in COVERAGE_NOTES_OP12.
 */
export const OP12_EFFECTS: Record<string, EffectDef[]> = {
  'OP12-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Event' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Reveal 2 Events?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', basePowerAtMost: 4000 },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP12-003': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Event' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Reveal 2 Events?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            colorIncludes: 'Red',
            basePowerAtMost: 3000,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP12-004': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Event' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Reveal 2 Events?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP12-006': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Event', colorIncludes: 'Red', orNameIs: 'Monkey.D.Luffy' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP12-007': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeContains: 'Roger Pirates',
            nameNot: 'Shanks',
          },
          min: 0,
          max: 1,
          prompt: 'Grant Rush',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'OP12-008': [
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
          filter: { owner: 'opponent', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'OP12-009': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Event' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Reveal 2 Events?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP12-012': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeContains: 'Roger Pirates',
            nameNot: 'Buggy',
          },
          min: 0,
          max: 1,
          prompt: 'Grant Blocker',
        },
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
  'OP12-013': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Event' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Reveal 2 Events?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
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
  'OP12-014': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Event', colorIncludes: 'Red', orNameIs: 'Monkey.D.Luffy' },
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
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 1,
          max: 1,
          prompt: 'Give DON!! to',
        },
        { op: 'giveRestedDon', upTo: 2, toRef: 'b1' },
      ],
    },
  ],
  'OP12-015': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Event' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Reveal 2 Events?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            colorIncludes: 'Red',
            basePowerAtMost: 3000,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
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
  'OP12-016': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'R',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Silvers Rayleigh' },
          min: 0,
          max: 1,
          prompt: 'Give 2 active DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'R' },
        { op: 'giveRestedDon', upTo: 2, toRef: 'R', fromActive: true },
        { op: 'grantFlag', ref: 'R', flag: 'noBlockCostAtMost', value: 99, duration: 'turn' },
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
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'battle' },
      ],
    },
  ],
  'OP12-017': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'R',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Silvers Rayleigh' },
          min: 0,
          max: 1,
          prompt: 'Give 1 active DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'R' },
        { op: 'giveRestedDon', upTo: 1, toRef: 'R', fromActive: true },
        {
          op: 'searchTop',
          count: 4,
          filter: {
            cardType: 'Event',
            colorIncludes: 'Red',
            orMatch: { cardType: 'Character', costAtLeast: 3 },
          },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP12-018': [
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
          op: 'powerModAll',
          amount: -1000,
          duration: 'turn',
          includeLeader: true,
          who: 'opponent',
        },
      ],
    },
  ],
  'OP12-019': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'R',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Silvers Rayleigh' },
          min: 0,
          max: 1,
          prompt: 'Give 1 active DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'R' },
        { op: 'giveRestedDon', upTo: 1, toRef: 'R', fromActive: true },
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
    {
      timing: 'counter',
      ops: [
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
  'OP12-020': [
    {
      timing: 'activateMain',
      donRequired: 3,
      oncePerTurn: true,
      ops: [
        { op: 'grantFlag', ref: 'self', flag: 'activeAfterCharBattle', duration: 'turn' },
        {
          op: 'grantFlag',
          ref: 'self',
          flag: 'noAttackCharsCostAtMost',
          value: 7,
          duration: 'turn',
        },
      ],
    },
  ],
  'OP12-022': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Will not refresh',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'OP12-024': [
    {
      timing: 'whenAttacking',
      condition: { minSelfGivenDon: 3 },
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
    },
  ],
  'OP12-026': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
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
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', nameIs: 'Roronoa Zoro' },
          min: 0,
          max: 1,
          prompt: 'Give DON!! to Leader',
        },
        { op: 'giveRestedDon', upTo: 3, toRef: 'L' },
      ],
    },
  ],
  'OP12-027': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      condition: { selfActive: true },
      guard: { owner: 'self', zone: 'characters', attributeIs: 'Slash', costAtMost: 5 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Rest Koushirou to save it?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'rest', ref: 'self' },
      ],
    },
  ],
  'OP12-028': [
    {
      timing: 'activateMain',
      cost: { restDon: 1, restSelf: true },
      condition: { leaderNameIs: 'Roronoa Zoro' },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { attributeIs: 'Slash', orMatch: { cardType: 'Event', colorIncludes: 'Green' } },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP12-029': [
    {
      timing: 'onPlay',
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'OP12-030': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 4,
          prompt: 'Set DON!! active',
        },
        { op: 'setActive', ref: 'b1' },
        { op: 'restrictSelf', restriction: 'noPlayCharCost7Plus' },
      ],
    },
  ],
  'OP12-031': [
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
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', nameIs: 'Roronoa Zoro' },
          min: 0,
          max: 1,
          prompt: 'Give DON!! to Leader',
        },
        { op: 'giveRestedDon', upTo: 3, toRef: 'L' },
      ],
    },
  ],
  'OP12-033': [
    {
      timing: 'onBlock',
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
  'OP12-034': [
    {
      timing: 'onPlay',
      condition: { leaderAttributeIs: 'Slash' },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { attributeIs: 'Slash', orMatch: { cardType: 'Event', colorIncludes: 'Green' } },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP12-037': [
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
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 2,
          prompt: 'Rest up to 2',
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
          min: 1,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'OP12-038': [
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
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 4 },
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
  'OP12-039': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leader', nameIs: 'Roronoa Zoro', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set Leader active',
        },
        { op: 'setActive', ref: 'b1' },
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
  'OP12-040': [
    {
      timing: 'onEvent',
      on: { kind: 'handTrashed', who: 'self' },
      ops: [{ op: 'draw', count: 1 }],
    },
  ],
  'OP12-041': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 1 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Event',
            typeIncludes: 'Straw Hat Crew',
            costAtMost: 3,
          },
          min: 0,
          max: 1,
          prompt: 'Activate an Event',
        },
        { op: 'activateEventFromHand', ref: 'b1' },
      ],
    },
    {
      timing: 'whenAttacking',
      condition: { oppAtLeastSelfDon: true },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'OP12-042': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
    },
  ],
  'OP12-043': [
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
          filter: { owner: 'opponent', zone: 'characters' },
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
  'OP12-044': [
    {
      timing: 'onPlay',
      ops: [{ op: 'draw', count: 2 }],
      condition: { leaderTypeIncludes: 'Navy' },
    },
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
          prompt: 'Trash 1?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
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
  'OP12-046': [
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
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'any', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b2' },
      ],
    },
  ],
  'OP12-047': [
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
          filter: { nameNot: 'Sengoku', typeIncludes: 'Navy' },
          upTo: 2,
          to: 'hand',
        },
      ],
    },
  ],
  'OP12-048': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      condition: { selfActive: true },
      guard: { owner: 'self', zone: 'characters', colorIncludes: 'Blue', typeIncludes: 'Navy' },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Rest Rosinante and trash 1 to save it?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'rest', ref: 'self' },
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'pay' },
      ],
    },
  ],
  'OP12-051': [
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
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Cannot block',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'cannotBlock', duration: 'turn' },
      ],
    },
  ],
  'OP12-053': [
    {
      timing: 'replaceKo',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Trash 1 to save Borsalino?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'trashCards', ref: 'pay' },
      ],
    },
  ],
  'OP12-054': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'The Seven Warlords of the Sea' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'OP12-056': [
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
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            nameNot: 'Monkey.D.Garp',
            typeIncludes: 'Navy',
            colorIncludes: 'Blue',
            basePowerAtMost: 8000,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'OP12-057': [
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
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'b2' },
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
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'b3' },
        { op: 'trashCards', ref: 'b3' },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'OP12-058': [
    {
      timing: 'main',
      condition: { leaderTypeContains: 'Whitebeard Pirates' },
      ops: [
        {
          op: 'revealTopMayPlay',
          filter: { cardType: 'Character', typeContains: 'Whitebeard Pirates', costAtMost: 9 },
          keyword: 'Rush',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP12-059': [
    { timing: 'main', ops: [{ op: 'draw', count: 1 }], condition: { leaderNameIs: 'Sanji' } },
    {
      timing: 'counter',
      condition: { minTrashEventsSelf: 4 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'OP12-060': [
    {
      timing: 'main',
      condition: { leaderMulticolor: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Mode 1: bounce',
        },
        { op: 'returnToHand', ref: 'b1' },
        { op: 'abortIfChosen', ref: 'b1' },
        { op: 'requireCond', cond: { maxHandSelf: 6 } },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'OP12-061': [
    {
      timing: 'guardKo',
      oncePerTurn: true,
      guard: { owner: 'self', zone: 'characters', nameIs: 'Trafalgar Law' },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Take a Life card to save Law?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 1 },
      ops: [{ op: 'grantPlayDiscount', amount: 2, nameIs: 'Trafalgar Law', minCost: 4 }],
    },
  ],
  'OP12-062': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Sanji', oppAtLeastSelfDon: true },
      ops: [
        { op: 'addDon', count: 1, rested: true },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'OP12-065': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', cardType: 'Event' },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
      ],
    },
  ],
  'OP12-069': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
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
        { op: 'requireCond', cond: { leaderTypeContains: 'Baroque Works' } },
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
  'OP12-070': [
    {
      timing: 'replaceKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!! to save Sanji?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'returnDon', ref: 'pay' },
      ],
    },
  ],
  'OP12-071': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 4,
          filter: { cardType: 'Event', orNameIs: 'Sanji' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP12-072': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      condition: { leaderNameIs: 'Sanji' },
      ops: [{ op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' }],
    },
  ],
  'OP12-073': [
    {
      timing: 'onPlay',
      condition: { oppAtLeastSelfDon: true },
      ops: [
        { op: 'addDon', count: 1, rested: false },
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Heart Pirates',
            orNameIs: 'Donquixote Rosinante',
          },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP12-074': [
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
        { op: 'requireCond', cond: { leaderNameIs: 'Sanji' } },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'OP12-075': [
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
        { op: 'addDon', count: 1, rested: false, who: 'opponent' },
      ],
    },
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
          prompt: 'Return 1 DON!!?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'playSelf' },
      ],
    },
  ],
  'OP12-077': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Trafalgar Law' },
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
  'OP12-078': [
    {
      timing: 'main',
      condition: { oppAtLeastSelfDon: true },
      ops: [
        { op: 'draw', count: 1 },
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
  'OP12-079': [
    {
      timing: 'main',
      condition: { leaderNameIs: 'Sanji' },
      ops: [{ op: 'searchTop', count: 3, filter: {}, upTo: 1, to: 'hand' }],
    },
  ],
  'OP12-080': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'bottomDeckFromField', ref: 'self' },
        { op: 'requireCond', cond: { leaderNameIs: 'Sanji' } },
        { op: 'searchTop', count: 3, filter: { cardType: 'Event' }, upTo: 1, to: 'hand' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP12-081': [
    {
      timing: 'whenAttacking',
      condition: { minSelfCharsCostAtLeast: { cost: 8, count: 2 } },
      ops: [{ op: 'draw', count: 1 }],
    },
    {
      timing: 'onEvent',
      on: { kind: 'characterPlayed', who: 'opponent', minCost: 8 },
      oncePerTurn: true,
      ops: [{ op: 'lifeTopToHand', count: 1, who: 'opponent' }],
    },
    {
      timing: 'onEvent',
      on: { kind: 'characterPlayed', who: 'opponent', fromHand: false },
      oncePerTurn: true,
      ops: [{ op: 'lifeTopToHand', count: 1, who: 'opponent' }],
    },
  ],
  'OP12-084': [
    {
      timing: 'onPlay',
      ops: [{ op: 'millSelf', count: 3 }],
      condition: { leaderTypeIncludes: 'Revolutionary Army' },
    },
  ],
  'OP12-085': [
    {
      timing: 'whenAttacking',
      condition: { leaderTypeIncludes: 'Revolutionary Army', minHandOpp: 5 },
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
  'OP12-086': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Revolutionary Army' },
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeIncludes: 'Revolutionary Army', nameNot: 'Koala', orNameIs: 'Nico Robin' },
          upTo: 1,
          to: 'hand',
          restTo: 'trash',
        },
      ],
    },
  ],
  'OP12-087': [
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
        { op: 'requireCond', cond: { minHandOpp: 5 } },
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
  ],
  'OP12-089': [
    {
      timing: 'onKo',
      condition: { leaderTypeIncludes: 'Revolutionary Army' },
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
  'OP12-090': [
    {
      timing: 'whenAttacking',
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
  'OP12-091': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash' },
          min: 3,
          max: 3,
          prompt: 'Bottom-deck 3 from trash',
        },
        { op: 'trashToDeckBottom', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'SMILE' },
          min: 0,
          max: 2,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP12-094': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash', typeIncludes: 'Revolutionary Army' },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'Bottom-deck 3 Revolutionary Army cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashToDeckBottom', ref: 'pay' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Revolutionary Army' } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', cardType: 'Character', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'OP12-095': [
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
  ],
  'OP12-096': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 (cost 4-)',
        },
        { op: 'ko', ref: 'b1' },
        { op: 'abortIfChosen', ref: 'b1' },
        {
          op: 'requireCond',
          cond: { charTypedCostAtLeast: { type: 'Revolutionary Army', cost: 8 } },
        },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 (cost 6-)',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 1 },
        { op: 'millSelf', count: 1 },
      ],
    },
  ],
  'OP12-097': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { nameNot: 'Captains Assembled', typeIncludes: 'Revolutionary Army' },
          upTo: 1,
          to: 'hand',
          restTo: 'trash',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP12-098': [
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
          op: 'requireCond',
          cond: { charTypedCostAtLeast: { type: 'Revolutionary Army', cost: 8 } },
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'battle' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 1 },
        { op: 'millSelf', count: 1 },
      ],
    },
  ],
  'OP12-099': [
    {
      timing: 'onEvent',
      on: { kind: 'lifeRemoved', who: 'self' },
      condition: { yourTurn: true },
      ops: [
        { op: 'draw', count: 1 },
        { op: 'restrictSelf', restriction: 'noEffectDraw' },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'lifeRemoved', who: 'opponent' },
      condition: { yourTurn: true },
      ops: [
        { op: 'draw', count: 1 },
        { op: 'restrictSelf', restriction: 'noEffectDraw' },
      ],
    },
  ],
  'OP12-100': [
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1 },
      ops: [
        { op: 'lifeTopToHand', count: 1 },
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
  'OP12-101': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leader', typeIncludes: 'Supernovas' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP12-102': [
    {
      timing: 'guardKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      guard: { owner: 'self', zone: 'characters', costAtMost: 6 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Turn a Life card face-up to save it?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'lifeFaceUp', count: 1 },
      ],
    },
  ],
  'OP12-104': [
    {
      timing: 'trigger',
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
  'OP12-105': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Trafalgar Law' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP12-107': [
    {
      timing: 'onKo',
      ops: [{ op: 'deckTopToLife', count: 1 }],
      condition: { opponentsTurn: true },
    },
  ],
  'OP12-108': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 5, filter: { nameIs: 'Trafalgar Law' }, upTo: 1, to: 'hand' },
      ],
    },
  ],
  'OP12-109': [
    {
      timing: 'trigger',
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
        { op: 'selfToHand' },
      ],
    },
  ],
  'OP12-112': [
    { timing: 'trigger', condition: { leaderMulticolor: true }, ops: [{ op: 'draw', count: 2 }] },
  ],
  'OP12-113': [
    {
      timing: 'onKo',
      condition: { leaderTypeIncludes: 'Supernovas' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Supernovas',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand rested',
        },
        { op: 'playCards', ref: 'b1', rested: true },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
        { op: 'selfToHand' },
      ],
    },
  ],
  'OP12-115': [
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
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Trafalgar Law' },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b2' },
      ],
    },
  ],
  'OP12-116': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: {
            cardType: 'Character',
            typeIncludes: 'Shandian Warrior',
            orNameIs: 'Mont Blanc Noland',
          },
          upTo: 2,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP12-117': [
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
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Supernovas' } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 9 },
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
        { op: 'fieldToLife', ref: 'b1b', bottom: true },
        { op: 'fieldToLife', ref: 'b1' },
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
  'OP12-118': [
    {
      timing: 'onPlay',
      condition: { minSelfRestedAny: 8 },
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
  'OP12-119': [
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
        { op: 'deckTopToLife', count: 1 },
        { op: 'costMod', ref: 'self', amount: 2, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
    {
      timing: 'onKo',
      ops: [{ op: 'deckTopToLife', count: 1 }],
      condition: { opponentsTurn: true },
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP12_STATICS: Record<string, StaticDef[]> = {
  'OP12-015': [{ condition: { minSelfGivenDon: 2 }, target: { scope: 'self' }, power: 2000 }],
  'OP12-021': [
    {
      condition: { leaderAttributeIs: 'Slash', minSelfRestedDon: 6 },
      target: { scope: 'self' },
      flag: 'noRest',
    },
  ],
  'OP12-024': [
    { condition: { selfActive: true }, target: { scope: 'self' }, flag: 'noOppEffectKo' },
  ],
  'OP12-036': [
    {
      condition: { leaderAttributeIs: 'Slash' },
      target: { scope: 'self' },
      flag: 'noBattleKoBySlash',
    },
    { condition: { leaderAttributeIs: 'Slash' }, target: { scope: 'self' }, power: 1000 },
  ],
  'OP12-042': [
    {
      condition: { minSelfCharsCostAtLeast: { cost: 5, count: 2 } },
      target: { scope: 'self' },
      costMod: 1,
    },
  ],
  'OP12-043': [{ condition: { minHandSelf: 5 }, target: { scope: 'self' }, costMod: 1 }],
  'OP12-053': [
    {
      condition: { opponentsTurn: true, leaderTypeIncludes: 'Navy' },
      target: { scope: 'self' },
      keyword: 'Blocker',
    },
    {
      condition: { opponentsTurn: true, leaderTypeIncludes: 'Navy' },
      target: { scope: 'self' },
      power: 1000,
    },
  ],
  'OP12-063': [
    { condition: { minTrashEventsSelf: 4 }, target: { scope: 'self' }, power: 2000 },
    { condition: { minTrashEventsSelf: 4 }, target: { scope: 'self' }, costMod: 5 },
  ],
  'OP12-065': [
    { condition: { minTrashEventsSelf: 4 }, target: { scope: 'self' }, keyword: 'Blocker' },
  ],
  'OP12-066': [
    { condition: { minTrashEventsSelf: 4 }, target: { scope: 'self' }, keyword: 'Blocker' },
  ],
  'OP12-070': [{ target: { scope: 'self' }, powerPer: { trashEventsPerN: 5, amount: 1000 } }],
  'OP12-085': [
    {
      condition: { leaderTypeIncludes: 'Revolutionary Army' },
      target: { scope: 'self' },
      costMod: 3,
    },
  ],
  'OP12-087': [
    {
      condition: { anyOf: [{ leaderNameIs: 'Koala' }, { leaderNameIs: 'Monkey.D.Luffy' }] },
      target: { scope: 'self' },
      keyword: 'Blocker',
    },
    {
      condition: { anyOf: [{ leaderNameIs: 'Koala' }, { leaderNameIs: 'Monkey.D.Luffy' }] },
      target: { scope: 'self' },
      costMod: 3,
    },
  ],
  'OP12-089': [
    {
      condition: { leaderTypeIncludes: 'Revolutionary Army' },
      target: { scope: 'self' },
      keyword: 'Blocker',
    },
    {
      condition: { leaderTypeIncludes: 'Revolutionary Army' },
      target: { scope: 'self' },
      costMod: 4,
    },
  ],
  'OP12-093': [
    {
      condition: { leaderTypeIncludes: 'Revolutionary Army' },
      target: { scope: 'self' },
      costMod: 4,
    },
  ],
  'OP12-095': [
    {
      condition: { leaderTypeIncludes: 'Revolutionary Army' },
      target: { scope: 'self' },
      costMod: 4,
    },
  ],
  'OP12-100': [
    { condition: { maxLifeSelf: 3 }, target: { scope: 'self' }, keyword: 'Blocker' },
    { condition: { maxLifeSelf: 3 }, target: { scope: 'self' }, costMod: 3 },
  ],
  'OP12-102': [
    {
      condition: { opponentsTurn: true, lacksOtherCharacterNamed: 'Shirahoshi' },
      target: { scope: 'myCharacters', typeIncludes: 'Neptunian' },
      power: 2000,
    },
  ],
  'OP12-107': [{ condition: { maxLifeSelf: 2 }, target: { scope: 'self' }, keyword: 'Rush' }],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP12: string[] = ['OP12-050', 'OP12-106']

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP12: Record<string, string> = {
  'OP12-016': 'SIMPLIFIED: the counter buff may target any leader, not only Rayleigh',
  'OP12-019': 'SIMPLIFIED: the counter buff may target any leader, not only Rayleigh',
  'OP12-020': 'SIMPLIFIED: the leader untaps at the end of any battle against a Character',
  'OP12-037':
    'SIMPLIFIED: rests up to 2 Characters only (the Characters-or-DON mixed total is not modeled)',
  'OP12-040':
    'SIMPLIFIED: any of your own hand-trash effects count (the Navy-source check is not modeled; costs count too)',
  'OP12-041': 'SIMPLIFIED: the activated Event resolves its [Main] text at base cost 3 or less',
  'OP12-061': 'SIMPLIFIED: the guard pays by taking your top life card to hand',
  'OP12-081':
    'SIMPLIFIED: the attack draw fires on any attack; the two play-listeners carry separate once-per-turn marks',
  'OP12-096':
    'SIMPLIFIED: the cost-6 upgrade is reached by declining the cost-4 pick with an 8-cost Character out',
  'OP12-099':
    'SIMPLIFIED: the two life-removal listeners share the effect via the draw restriction, not a shared mark',
  'OP12-102': 'SIMPLIFIED: the aura ignores the base-cost-2 qualifier on "no other Shirahoshi"',
  'OP12-090': 'SIMPLIFIED: the top-deck trash payment is mandatory on attack',
  'OP12-119':
    "SIMPLIFIED: the self cost boost reads as a +2 modifier until the opponent's next End Phase",
}
