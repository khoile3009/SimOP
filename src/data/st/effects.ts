import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * ST (starter deck) effect definitions as DSL data, keyed by card ID.
 * Compiled entries were drafted by scripts/compile-effects.ts; the rest are
 * authored against the printed text. Deviations are documented in
 * COVERAGE_NOTES_ST.
 *
 * DON cost encoding (the EB04 rule): "DON!! -N" returns N to the DON!! deck;
 * unsigned "(N)" / "DON!! N" rests N in the cost area.
 */
export const ST_EFFECTS: Record<string, EffectDef[]> = {
  'ST01-001': [
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
          prompt: 'Give 1 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'ST01-002': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      ops: [
        {
          op: 'grantFlag',
          ref: 'self',
          flag: 'noBlockPowerAtLeast',
          value: 5000,
          duration: 'battle',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'ST01-005': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', excludeSelf: true },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'ST01-007': [
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
          prompt: 'Give 1 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'ST01-011': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 2 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 2, toRef: 't' },
      ],
    },
  ],
  'ST01-012': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      ops: [
        { op: 'grantFlag', ref: 'self', flag: 'noBlockCostAtMost', value: 99, duration: 'battle' },
      ],
    },
  ],
  'ST01-014': [
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
  'ST01-015': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'ST01-016': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Straw Hat Crew' },
          min: 0,
          max: 1,
          prompt: 'No blockers when this card attacks',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noBlockCostAtMost', value: 99, duration: 'turn' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3, hasKeywordIs: 'Blocker' },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Blocker',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'ST01-017': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Straw Hat Crew' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'ST02-001': [
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
        { op: 'setActive', ref: 'self' },
      ],
      oncePerTurn: true,
      cost: { restDon: 3 },
    },
  ],
  'ST02-005': [
    {
      timing: 'onPlay',
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
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'ST02-007': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restDon: 1, restSelf: true },
      ops: [
        { op: 'searchTop', count: 5, filter: { typeIncludes: 'Supernovas' }, upTo: 1, to: 'hand' },
      ],
    },
  ],
  'ST02-008': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'don', rested: false },
          min: 0,
          max: 1,
          prompt: "Rest 1 of your opponent's DON!!",
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'ST02-009': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludesAny: ['Supernovas', 'Heart Pirates'],
            rested: true,
            costAtMost: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b1' },
      ],
    },
  ],
  'ST02-013': [{ timing: 'endOfTurn', donRequired: 1, ops: [{ op: 'setActive', ref: 'self' }] }],
  'ST02-015': [
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
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 1,
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
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 2,
          prompt: 'Set DON!! active',
        },
        { op: 'setActive', ref: 'b3' },
      ],
    },
  ],
  'ST02-016': [
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
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set DON!! active',
        },
        { op: 'setActive', ref: 'b2' },
      ],
    },
  ],
  'ST02-017': [
    {
      timing: 'main',
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
  'ST03-001': [
    {
      timing: 'activateMain',
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
      oncePerTurn: true,
      cost: { returnDon: 4 },
    },
  ],
  'ST03-003': [
    {
      timing: 'onBlock',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
      ],
      donRequired: 1,
    },
  ],
  'ST03-004': [
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
            typeIncludesAny: ['The Seven Warlords of the Sea', 'Thriller Bark Pirates'],
            costAtMost: 4,
            nameNot: 'Gecko Moria',
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b1' },
      ],
    },
  ],
  'ST03-005': [
    {
      timing: 'whenAttacking',
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
      donRequired: 1,
    },
  ],
  'ST03-007': [
    {
      timing: 'activateMain',
      donRequired: 1,
      oncePerTurn: true,
      cost: { restDon: 2 },
      ops: [
        { op: 'searchDeck', filter: { nameIs: 'Pacifista', costAtMost: 4 }, upTo: 1, to: 'play' },
      ],
    },
  ],
  'ST03-009': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'ST03-010': [
    { timing: 'onPlay', ops: [{ op: 'scryBottom', count: 3 }] },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'ST03-013': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],
  'ST03-014': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'ST03-015': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'ST03-016': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'counter' }] },
  ],
  'ST03-017': [
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
        { op: 'requireCond', cond: { maxHandSelf: 3 } },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'ST04-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 7 },
      ops: [{ op: 'trashLifeTop', owner: 'opponent', count: 1 }],
    },
  ],
  'ST04-002': [
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
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            nameIs: 'Page One',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'ST04-003': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 5,
          exact: true,
          prompt: 'You may return 5 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'returnDon', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'ST04-004': [
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'ST04-005': [
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
  'ST04-006': [
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
      ],
    },
  ],
  'ST04-008': [
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
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'ST04-010': [
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'ST04-014': [
    {
      timing: 'main',
      ops: [
        { op: 'draw', count: 1 },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'ST04-015': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
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
  'ST04-016': [
    {
      timing: 'counter',
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
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'ST04-017': [
    {
      timing: 'activateMain',
      ops: [{ op: 'addDon', count: 1, rested: true }],
      cost: { restSelf: true },
      condition: { leaderTypeIncludes: 'Animal Kingdom Pirates' },
    },
  ],
  'ST05-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 3 },
      ops: [
        {
          op: 'select',
          bind: 'all',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'FILM' },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: 'All FILM Characters +2000',
        },
        { op: 'powerMod', ref: 'all', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'ST05-002': [{ timing: 'onPlay', ops: [{ op: 'addDon', count: 1, rested: true }] }],
  'ST05-004': [
    {
      timing: 'onBlock',
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
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b2' },
      ],
    },
  ],
  'ST05-005': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'FILM' },
          min: 1,
          max: 1,
          prompt: 'Trash 1 FILM card',
        },
        { op: 'trashCards', ref: 'pay' },
        { op: 'requireCond', cond: { oppMoreDon: true } },
        { op: 'addDon', count: 2, rested: true },
      ],
    },
  ],
  'ST05-006': [
    {
      timing: 'whenAttacking',
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
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'ST05-009': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],
  'ST05-010': [
    {
      timing: 'activateMain',
      ops: [{ op: 'powerMod', ref: 'self', amount: 2000, duration: 'turn' }],
      oncePerTurn: true,
      cost: { returnDon: 1 },
    },
  ],
  'ST05-011': [
    {
      timing: 'activateMain',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 6 },
          min: 0,
          max: 2,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Double Attack', duration: 'turn' },
      ],
      oncePerTurn: true,
      cost: { returnDon: 4 },
    },
  ],
  'ST05-014': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Buena Festa', typeIncludes: 'FILM' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'ST05-016': [
    {
      timing: 'main',
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
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'ST05-017': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'FILM' },
          min: 0,
          max: 1,
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 4000, duration: 'battle' },
        { op: 'requireRefIs', ref: 'b1', cardType: 'Character' },
        { op: 'grantFlag', ref: 'b1', flag: 'noBattleKo', duration: 'turn' },
        { op: 'grantFlag', ref: 'b1', flag: 'noEffectKo', duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'ST06-001': [
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
      oncePerTurn: true,
      cost: { restDon: 3 },
    },
  ],
  'ST06-002': [
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
          filter: { owner: 'opponent', zone: 'characters', costIs: 0 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'ST06-005': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -4 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -4, duration: 'turn' },
      ],
    },
  ],
  'ST06-006': [
    {
      timing: 'activateMain',
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
      cost: { restSelf: true },
    },
  ],
  'ST06-008': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -4 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -4, duration: 'turn' },
      ],
    },
  ],
  'ST06-010': [
    {
      timing: 'onPlay',
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
      ],
    },
  ],
  'ST06-012': [
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'ST06-014': [
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
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 active Character',
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b3' },
      ],
    },
  ],
  'ST06-015': [
    {
      timing: 'main',
      ops: [
        { op: 'draw', count: 1 },
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
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'm',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 1,
          max: 1,
          chooser: 'opponent',
          prompt: 'Trash 1 card from your hand',
        },
        { op: 'trashCards', ref: 'm' },
      ],
    },
  ],
  'ST06-016': [
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
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'grantFlagAll',
          flag: 'noBattleKo',
          duration: 'turn',
        },
        {
          op: 'grantFlagAll',
          flag: 'noEffectKo',
          duration: 'turn',
        },
      ],
    },
  ],
  'ST06-017': [
    {
      timing: 'onPlay',
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
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { leaderTypeIncludes: 'Navy' },
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
  'ST07-001': [
    {
      timing: 'whenAttacking',
      donRequired: 2,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add a Life card to your hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Add to the top of your Life',
        },
        { op: 'handToLife', ref: 'h' },
      ],
    },
  ],
  'ST07-003': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'scryLifeTops', prompt: 'Move a top Life card to the bottom?' },
        { op: 'requireCond', cond: { lessLifeThanOpp: true } },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'ST07-004': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add a Life card to your hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Banish', duration: 'battle' },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'battle' },
      ],
    },
  ],
  'ST07-005': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add a Life card to your hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'ST07-007': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],
  'ST07-008': [
    {
      timing: 'onPlay',
      ops: [{ op: 'scryLifeTops', prompt: 'Move a top Life card to the bottom?' }],
    },
  ],
  'ST07-009': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 1,
          max: 1,
          prompt: 'Add a Life card to your hand',
        },
        { op: 'lifeToHand', ref: 'pay' },
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
        { op: 'playSelf' },
      ],
    },
  ],
  'ST07-010': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'm',
          filter: { owner: 'opponent', zone: 'life' },
          min: 0,
          max: 1,
          chooser: 'opponent',
          prompt: 'Trash your top Life (or decline: Linlin gains Life)',
        },
        { op: 'lifeToTrash', ref: 'm' },
        { op: 'abortIfChosen', ref: 'm' },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'ST07-011': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Charlotte Linlin' },
          min: 0,
          max: 1,
          prompt: 'Grant Banish',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Banish', duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'ST07-013': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Charlotte Linlin' },
          min: 0,
          max: 1,
          prompt: 'Grant Double Attack',
        },
        { op: 'grantKeyword', ref: 'b1', keyword: 'Double Attack', duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'ST07-015': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'm',
          filter: { owner: 'opponent', zone: 'life' },
          min: 0,
          max: 1,
          chooser: 'opponent',
          prompt: 'Trash your top Life (or decline: they gain Life)',
        },
        { op: 'lifeToTrash', ref: 'm' },
        { op: 'abortIfChosen', ref: 'm' },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'ST07-016': [
    {
      timing: 'counter',
      ops: [
        { op: 'scryLifeTops', prompt: 'Move a top Life card to the bottom?' },
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
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 1 },
        { op: 'scryLifeTops', prompt: 'Move a top Life card to the bottom?' },
      ],
    },
  ],
  'ST07-017': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 1,
          max: 1,
          prompt: 'Add a Life card to your hand',
        },
        { op: 'lifeToHand', ref: 'pay' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters', costIs: 3 },
          min: 0,
          max: 1,
          prompt: 'Add to the top of its owner Life, face-up',
        },
        { op: 'fieldToLife', ref: 'c', faceUp: true },
      ],
    },
  ],
  'ST08-001': [
    {
      timing: 'onEvent',
      on: { kind: 'characterKoed', who: 'self' },
      condition: { yourTurn: true },
      ops: [{ op: 'giveRestedDon', upTo: 1 }],
    },
    {
      timing: 'onEvent',
      on: { kind: 'characterKoed', who: 'opponent' },
      condition: { yourTurn: true },
      ops: [{ op: 'giveRestedDon', upTo: 1 }],
    },
  ],
  'ST08-002': [
    {
      timing: 'activateMain',
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
      cost: { restSelf: true },
    },
  ],
  'ST08-004': [
    {
      timing: 'activateMain',
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
      cost: { restSelf: true },
    },
  ],
  'ST08-005': [
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
        { op: 'removeAll', owner: 'both', dest: 'trash', costAtMost: 1 },
      ],
    },
  ],
  'ST08-006': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -4 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -4, duration: 'turn' },
      ],
    },
  ],
  'ST08-007': [{ timing: 'trigger', ops: [{ op: 'playSelf' }] }],
  'ST08-008': [
    {
      timing: 'onPlay',
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
  'ST08-009': [
    {
      timing: 'onPlay',
      condition: { anyCharacterCostAtMost: 0 },
      ops: [{ op: 'draw', count: 1 }],
    },
  ],
  'ST08-014': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life' },
          min: 0,
          max: 1,
          prompt: 'Add your top Life card to your hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -7 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -7, duration: 'turn' },
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
            colorIncludes: 'Black',
            costAtMost: 2,
          },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b2' },
      ],
    },
  ],
  'ST08-015': [
    {
      timing: 'main',
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
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'ST09-002': [
    {
      timing: 'trigger',
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
        { op: 'selfToHand' },
      ],
    },
  ],
  'ST09-005': [
    {
      timing: 'onKo',
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
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'ST09-007': [
    {
      timing: 'onBlock',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add a Life card to your hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        { op: 'powerMod', ref: 'self', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'ST09-008': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add a Life card to your hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            colorIncludes: 'Yellow',
            typeIncludes: 'Land of Wano',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'ST09-009': [
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
  'ST09-010': [
    {
      timing: 'replaceKo',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Trash a Life card to save Ace?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'lifeToTrash', ref: 'pay' },
      ],
    },
  ],
  'ST09-012': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add a Life card to your hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'ST09-014': [
    {
      timing: 'counter',
      ops: [
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
      condition: { maxLifeSelf: 2 },
    },
    {
      timing: 'trigger',
      ops: [
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
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'ST09-015': [
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
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Add to the top of its owner Life, face-up',
        },
        { op: 'fieldToLife', ref: 'b2', faceUp: true },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'ST10-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { returnDon: 3 },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 3000 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b1' },
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'ST10-002': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { donFieldZeroOrAtLeast: 8 },
      ops: [{ op: 'addDon', count: 1, rested: false }],
    },
  ],
  'ST10-003': [
    {
      timing: 'whenAttacking',
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
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'ST10-004': [
    {
      timing: 'onPlay',
      condition: { oppCharPowerAtLeast: 5000 },
      ops: [{ op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' }],
    },
  ],
  'ST10-005': [
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
  'ST10-006': [
    {
      timing: 'onEvent',
      on: { kind: 'blockerActivated', who: 'opponent' },
      oncePerTurn: true,
      ops: [
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
  'ST10-007': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      oncePerTurn: true,
      condition: { yourTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 rested Character',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'ST10-008': [
    {
      timing: 'onPlay',
      condition: { maxDonField: 3 },
      ops: [{ op: 'addDon', count: 2, rested: true }],
    },
  ],
  'ST10-009': [
    {
      timing: 'onPlay',
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
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'ST10-010': [
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
        { op: 'requireCond', cond: { minHandOpp: 7 } },
        {
          op: 'select',
          bind: 'm',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 2,
          max: 2,
          chooser: 'opponent',
          prompt: 'Trash 2 cards from your hand',
        },
        { op: 'trashCards', ref: 'm' },
      ],
    },
  ],
  'ST10-011': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      oncePerTurn: true,
      condition: { yourTurn: true },
      ops: [{ op: 'powerMod', ref: 'self', amount: 2000, duration: 'untilYourNextTurn' }],
    },
  ],
  'ST10-012': [
    {
      timing: 'onPlay',
      condition: { oppMoreDon: true },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
    {
      timing: 'whenAttacking',
      condition: { oppMoreDon: true },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'ST10-013': [
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
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 1000, duration: 'untilYourNextTurn' },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may return 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b3' },
        { op: 'returnDon', ref: 'b3' },
        {
          op: 'select',
          bind: 'b4',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b4', amount: 1000, duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'ST10-014': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      oncePerTurn: true,
      ops: [
        { op: 'draw', count: 1 },
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
  ],
  'ST10-015': [
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
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 2000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'ST10-016': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 7000 },
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
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+1000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: 1000, duration: 'untilTurn', untilTurnOffset: 2 },
      ],
    },
  ],
  'ST10-017': [
    {
      timing: 'main',
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
        { op: 'addDon', count: 1, rested: true },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'ST11-001': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      oncePerTurn: true,
      ops: [{ op: 'searchTop', count: 1, filter: { typeIncludes: 'FILM' }, upTo: 1, to: 'hand' }],
    },
  ],
  'ST11-002': [
    {
      timing: 'endOfTurn',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', cardType: 'Event' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1 Event',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'FILM', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 'b2' },
      ],
    },
  ],
  'ST11-003': [
    {
      timing: 'main',
      condition: { leaderNameIs: 'Uta' },
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Rest (or decline for the K.O. mode)',
        },
        { op: 'rest', ref: 'r' },
        { op: 'abortIfChosen', ref: 'r' },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 rested Character',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'ST11-004': [
    {
      timing: 'main',
      condition: { leaderNameIs: 'Uta' },
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeIncludes: 'FILM', nameNot: 'New Genesis' },
          upTo: 1,
          to: 'hand',
        },
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set DON!! active',
        },
        { op: 'setActive', ref: 'd' },
      ],
    },
  ],
  'ST11-005': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader', nameIs: 'Uta', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set your Leader active',
        },
        { op: 'setActive', ref: 'l' },
      ],
    },
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
  'ST12-001': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', costAtLeast: 2 },
          min: 0,
          max: 1,
          prompt: 'Return a Character to hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnToHand', ref: 'pay' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'characters', powerAtMost: 7000, rested: true },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 't' },
      ],
    },
  ],
  'ST12-002': [
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
      ],
      cost: { restSelf: true },
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'ST12-003': [
    {
      timing: 'onPlay',
      condition: { maxSelfCharacters: 2 },
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            attributeIs: 'Slash',
            costAtMost: 4,
            nameNot: 'Dracule Mihawk',
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand, rested',
        },
        { op: 'playCards', ref: 'p', rested: true },
      ],
    },
  ],
  'ST12-006': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Rest (or decline for the K.O. mode)',
        },
        { op: 'rest', ref: 'r' },
        { op: 'abortIfChosen', ref: 'r' },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 rested Character',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'ST12-007': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may rest 2 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'rest', ref: 'b1' },
        { op: 'requireCond', cond: { minLifeOpp: 3 } },
        {
          op: 'select',
          bind: 'b2',
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
        { op: 'setActive', ref: 'b2' },
      ],
    },
  ],
  'ST12-008': [
    {
      timing: 'whenAttacking',
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
      donRequired: 1,
    },
  ],
  'ST12-010': [
    {
      timing: 'onPlay',
      ops: [{ op: 'revealTopMayPlay', filter: { cardType: 'Character', costIs: 2 } }],
    },
    {
      timing: 'whenAttacking',
      oncePerTurn: true,
      condition: { maxHandSelf: 6 },
      ops: [{ op: 'draw', count: 1 }],
    },
  ],
  'ST12-011': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      condition: { maxHandSelf: 5 },
      ops: [{ op: 'powerMod', ref: 'self', amount: 2000, duration: 'untilYourNextTurn' }],
    },
  ],
  'ST12-012': [{ timing: 'activateMain', ops: [{ op: 'returnToHand', ref: 'self' }] }],
  'ST12-013': [
    { timing: 'onPlay', ops: [{ op: 'scryBottom', count: 3 }] },
    {
      timing: 'whenAttacking',
      ops: [{ op: 'revealTopMayPlay', filter: { cardType: 'Character', costIs: 2 }, rested: true }],
    },
  ],
  'ST12-014': [{ timing: 'onPlay', ops: [{ op: 'scryBottom', count: 3 }] }],
  'ST12-016': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters', rested: false, costAtMost: 4 },
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
          filter: { owner: 'opponent', zone: 'leaderOrCharacters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b2' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'ST12-017': [
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
        { op: 'revealTopMayPlay', filter: { cardType: 'Character', costIs: 2 } },
      ],
    },
  ],
  'ST13-001': [
    {
      timing: 'activateMain',
      donRequired: 1,
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', costAtLeast: 3, powerAtLeast: 7000 },
          min: 0,
          max: 1,
          prompt: 'Add a Character to your Life, face-up?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'fieldToLife', ref: 'pay', faceUp: true },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 't', amount: 2000, duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'ST13-002': [
    {
      timing: 'activateMain',
      donRequired: 2,
      oncePerTurn: true,
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', costIs: 5 },
          upTo: 1,
          to: 'life',
          faceUp: true,
        },
      ],
    },
    { timing: 'endOfTurn', ops: [{ op: 'trashFaceUpLife' }] },
  ],
  'ST13-003': [
    {
      timing: 'activateMain',
      donRequired: 2,
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
        { op: 'requireCond', cond: { maxLifeSelf: 0 } },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', costIs: 5 },
          min: 0,
          max: 2,
          prompt: 'Add to the top of your Life, face-up',
        },
        { op: 'handToLife', ref: 'h', faceUp: true },
      ],
    },
  ],
  'ST13-004': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'deckTopToLife', count: 1 },
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 1,
          max: 1,
          prompt: 'Return a Life card to your deck',
        },
        { op: 'lifeToDeckBottom', ref: 'l' },
      ],
    },
  ],
  'ST13-005': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Trash a Life card?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToTrash', ref: 'pay' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', costIs: 5 },
          min: 0,
          max: 1,
          prompt: 'Reveal and add to your Life, face-down',
        },
        { op: 'reveal', ref: 'h' },
        { op: 'handToLife', ref: 'h' },
      ],
    },
  ],
  'ST13-006': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'p1',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', nameIs: 'Sabo', costIs: 2 },
          min: 0,
          max: 1,
          prompt: 'Play Sabo',
        },
        { op: 'playCards', ref: 'p1' },
        {
          op: 'select',
          bind: 'p2',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            nameIs: 'Portgas.D.Ace',
            costIs: 2,
          },
          min: 0,
          max: 1,
          prompt: 'Play Ace',
        },
        { op: 'playCards', ref: 'p2' },
        {
          op: 'select',
          bind: 'p3',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            nameIs: 'Monkey.D.Luffy',
            costIs: 2,
          },
          min: 0,
          max: 1,
          prompt: 'Play Luffy',
        },
        { op: 'playCards', ref: 'p3' },
      ],
    },
  ],
  'ST13-007': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'revealLifeTopMayPlay', filter: { nameIs: 'Sabo', costIs: 5 } },
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+2000 power (only if the Life card was played)',
        },
        { op: 'powerMod', ref: 'l', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'ST13-008': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Trash a Life card?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToTrash', ref: 'pay' },
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
  'ST13-009': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'lifeFaceDown', count: 1 },
        { op: 'requireCond', cond: { minHandOpp: 7 } },
        { op: 'trashLifeTop', owner: 'opponent', count: 1 },
      ],
    },
  ],
  'ST13-011': [
    {
      timing: 'onPlay',
      condition: { maxLifeSelf: 2 },
      ops: [{ op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'permanent' }],
    },
  ],
  'ST13-012': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add a Life card to your hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        { op: 'scryLifeTops', prompt: 'Move a top Life card to the bottom?' },
      ],
    },
  ],
  'ST13-013': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameIsAny: ['Sabo', 'Portgas.D.Ace', 'Monkey.D.Luffy'], costAtMost: 5 },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'ST13-014': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'revealLifeTopMayPlay', filter: { nameIs: 'Monkey.D.Luffy', costIs: 5 } },
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+2000 power (only if the Life card was played)',
        },
        { op: 'powerMod', ref: 'l', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'ST13-015': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        { op: 'powerMod', ref: 'self', amount: 2000, duration: 'untilYourNextTurn' },
        { op: 'requireCond', cond: { minLifeSelf: 1 } },
        { op: 'draw', count: 1 },
        { op: 'trashLifeTop', owner: 'self', count: 1 },
      ],
    },
  ],
  'ST13-016': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 1,
          max: 1,
          prompt: 'Return a Life card to your deck',
        },
        { op: 'lifeToDeckBottom', ref: 'l' },
      ],
    },
  ],
  'ST13-017': [
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
        { op: 'scryLifeTops', prompt: 'Move a top Life card to the bottom?' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add a Life card to your hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Add to the top of your Life',
        },
        { op: 'handToLife', ref: 'h' },
      ],
    },
  ],
  'ST13-018': [
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
        { op: 'requireCond', cond: { maxLifeSelf: 0 } },
        { op: 'draw', count: 1 },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add a Life card to your hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Add to the top of your Life',
        },
        { op: 'handToLife', ref: 'h' },
      ],
    },
  ],
  'ST13-019': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameIsAny: ['Sabo', 'Portgas.D.Ace', 'Monkey.D.Luffy'], costAtMost: 5 },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'ST14-002': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      condition: { minSelfCharsCostAtLeast: { cost: 8, count: 1 } },
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
  'ST14-003': [
    {
      timing: 'onPlay',
      condition: { minSelfCharsCostAtLeast: { cost: 6, count: 1 } },
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
      ],
    },
  ],
  'ST14-004': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: {
            owner: 'self',
            zone: 'characters',
            colorIncludes: 'Black',
            typeIncludes: 'Straw Hat Crew',
          },
          min: 0,
          max: 1,
          prompt: '+2 cost',
        },
        { op: 'costMod', ref: 'c', amount: 2, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'ST14-006': [
    {
      timing: 'onPlay',
      condition: { maxHandSelf: 6, minSelfCharsCostAtLeast: { cost: 8, count: 1 } },
      ops: [{ op: 'draw', count: 1 }],
    },
  ],
  'ST14-007': [
    {
      timing: 'onPlay',
      condition: { minSelfCharsCostAtLeast: { cost: 8, count: 1 } },
      ops: [
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
    {
      timing: 'whenAttacking',
      condition: { minSelfCharsCostAtLeast: { cost: 8, count: 1 } },
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -5 cost',
        },
        { op: 'costMod', ref: 'b2', amount: -5, duration: 'turn' },
      ],
    },
  ],
  'ST14-008': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: {
            owner: 'self',
            zone: 'characters',
            colorIncludes: 'Black',
            typeIncludes: 'Straw Hat Crew',
          },
          min: 0,
          max: 1,
          prompt: '+2 cost',
        },
        { op: 'costMod', ref: 'c', amount: 2, duration: 'untilTurn', untilTurnOffset: 1 },
        { op: 'requireCond', cond: { minSelfCharsCostAtLeast: { cost: 8, count: 1 } } },
        { op: 'draw', count: 1 },
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
  ],
  'ST14-011': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: {
            owner: 'self',
            zone: 'characters',
            colorIncludes: 'Black',
            typeIncludes: 'Straw Hat Crew',
          },
          min: 0,
          max: 1,
          prompt: '+2 cost',
        },
        { op: 'costMod', ref: 'c', amount: 2, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'ST14-014': [
    {
      timing: 'counter',
      condition: { minSelfCharsCostAtLeast: { cost: 8, count: 1 } },
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
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'trash', cardType: 'Character', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b2' },
      ],
    },
  ],
  'ST14-015': [
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
        { op: 'requireCond', cond: { minSelfCharsCostAtLeast: { cost: 8, count: 1 } } },
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
      condition: { minSelfCharsCostAtLeast: { cost: 8, count: 1 } },
      ops: [
        {
          op: 'select',
          bind: 'b3',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b3' },
      ],
    },
  ],
  'ST14-016': [
    {
      timing: 'main',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: '+3 cost',
        },
        { op: 'costMod', ref: 'c', amount: 3, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
    {
      timing: 'trigger',
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
    },
  ],
  'ST14-017': [
    {
      timing: 'onPlay',
      ops: [{ op: 'draw', count: 1 }],
      condition: { leaderTypeIncludes: 'Straw Hat Crew' },
    },
  ],
  'ST15-001': [
    {
      timing: 'whenAttacking',
      condition: { leaderNameIs: 'Edward.Newgate' },
      ops: [{ op: 'restrictSelf', restriction: 'noLifeToHand' }],
    },
  ],
  'ST15-002': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give 1 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
    {
      timing: 'activateMain',
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
      cost: { restSelf: true },
    },
  ],
  'ST15-003': [
    {
      timing: 'onKo',
      koCause: 'oppEffect',
      ops: [
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'l', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'ST15-004': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Whitebeard Pirates' },
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
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],
  'ST15-005': [
    {
      timing: 'replaceKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Keep Ace with -2000 power instead?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'powerMod', ref: 'self', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'ST16-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'FILM' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1 FILM card',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give 1 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'ST16-002': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Music' },
          min: 0,
          max: 4,
          prompt: 'Trash any number of Music cards',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 1,
          max: 1,
          prompt: '+1000 power per card trashed',
        },
        { op: 'powerModPerRef', ref: 't', countRef: 'pay', amountPer: 1000, duration: 'battle' },
        { op: 'trashCards', ref: 'pay' },
      ],
    },
  ],
  'ST16-004': [
    {
      timing: 'onPlay',
      ops: [
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
  'ST17-001': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'revealTopCond', filter: { typeContains: 'The Seven Warlords of the Sea' } },
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Place 1 card on top of your deck',
        },
        { op: 'topDeck', ref: 'h' },
      ],
    },
  ],
  'ST17-002': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Return a Character to hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnToHand', ref: 'pay' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'The Seven Warlords of the Sea' } },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 't' },
      ],
    },
  ],
  'ST17-004': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'scryBottom', count: 3 },
        {
          op: 'select',
          bind: 't',
          filter: {
            owner: 'self',
            zone: 'leaderOrCharacters',
            typeIncludes: 'The Seven Warlords of the Sea',
          },
          min: 0,
          max: 1,
          prompt: 'Give 1 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'ST17-005': [
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
          prompt: 'Place 1 card on top of your deck?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'topDeck', ref: 'pay' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 2 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 2, toRef: 't' },
      ],
    },
  ],
  'ST18-001': [
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
      condition: { minDonField: 8 },
    },
  ],
  'ST18-002': [
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
        { op: 'draw', count: 2 },
      ],
      condition: { minDonField: 8 },
    },
  ],
  'ST18-003': [
    {
      timing: 'whenAttacking',
      ops: [{ op: 'draw', count: 1 }],
      oncePerTurn: true,
      condition: { minDonField: 8 },
    },
  ],
  'ST18-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Straw Hat Crew', colorIncludes: 'Purple' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'ST18-005': [
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
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            colorIncludes: 'Purple',
            typeIncludes: 'Straw Hat Crew',
            costAtMost: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'ST19-001': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Navy', colorIncludes: 'Black' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1 black Navy card',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 2,
          prompt: 'Cannot attack',
        },
        {
          op: 'grantFlag',
          ref: 't',
          flag: 'cannotAttack',
          duration: 'untilTurn',
          untilTurnOffset: 1,
        },
      ],
    },
  ],
  'ST19-002': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Navy', colorIncludes: 'Black' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may trash 2',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Navy' } },
        { op: 'draw', count: 3 },
      ],
    },
  ],
  'ST19-003': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Smoker' },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -4 cost',
        },
        { op: 'costMod', ref: 'b1', amount: -4, duration: 'turn' },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { selfPlayedThisTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', costIs: 0 },
          min: 0,
          max: 1,
          prompt: 'Trash up to 1 cost-0 Character',
        },
        { op: 'trashFromField', ref: 'b2' },
      ],
    },
  ],
  'ST19-004': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash' },
          min: 0,
          max: 1,
          prompt: 'Place 1 trash card at your deck bottom?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashToDeckBottom', ref: 'pay' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give 1 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'ST19-005': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash' },
          min: 0,
          max: 1,
          prompt: 'Place 1 trash card at your deck bottom?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashToDeckBottom', ref: 'pay' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -1 cost',
        },
        { op: 'costMod', ref: 't', amount: -1, duration: 'turn' },
      ],
    },
  ],
  'ST20-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give 1 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'ST20-002': [
    {
      timing: 'replaceKo',
      replaceWhen: 'effect',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life' },
          min: 0,
          max: 1,
          prompt: 'Trash your top Life card to save Cracker?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'lifeToTrash', ref: 'pay' },
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
        { op: 'playSelf' },
      ],
    },
  ],
  'ST20-003': [
    {
      timing: 'trigger',
      ops: [
        { op: 'scryLifeTops', prompt: 'Move a top Life card to the bottom?' },
        { op: 'selfToHand' },
      ],
    },
  ],
  'ST20-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life' },
          min: 0,
          max: 1,
          prompt: 'Add your top Life card to your hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        {
          op: 'select',
          bind: 't',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Big Mom Pirates',
            costAtMost: 3,
            rested: true,
          },
          min: 0,
          max: 1,
          prompt: 'Set active',
        },
        { op: 'setActive', ref: 't' },
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
  'ST20-005': [
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
          bind: 'm',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 0,
          max: 2,
          exact: true,
          chooser: 'opponent',
          prompt: 'Trash 2 (or decline: trash your top Life)',
        },
        { op: 'trashCards', ref: 'm' },
        { op: 'abortIfChosen', ref: 'm' },
        { op: 'trashLifeTop', owner: 'opponent', count: 1 },
      ],
    },
  ],
  'ST21-001': [
    {
      timing: 'activateMain',
      donRequired: 1,
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 2 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 2, toRef: 't' },
      ],
    },
  ],
  'ST21-003': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: {
            owner: 'self',
            zone: 'characters',
            typeIncludes: 'Straw Hat Crew',
            powerAtLeast: 6000,
          },
          min: 0,
          max: 1,
          prompt: 'No blockers when this card attacks',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noBlockCostAtMost', value: 99, duration: 'turn' },
      ],
    },
  ],
  'ST21-004': [{ timing: 'onKo', ops: [{ op: 'draw', count: 1 }], donRequired: 2 }],
  'ST21-009': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Straw Hat Crew' },
          min: 0,
          max: 1,
          prompt: 'Give up to 2 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 2, toRef: 't' },
      ],
    },
  ],
  'ST21-010': [
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
    },
  ],
  'ST21-012': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 2 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 2, toRef: 't' },
      ],
    },
  ],
  'ST21-014': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give 1 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'ST21-015': [
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
            nameNot: 'Roronoa Zoro',
            colorIncludes: 'Red',
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
  'ST21-016': [
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 4000 },
          min: 0,
          max: 1,
          prompt: 'Cannot block',
        },
        { op: 'grantFlag', ref: 'b2', flag: 'cannotBlock', duration: 'turn' },
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
  'ST21-017': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -5000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -5000, duration: 'turn' },
        { op: 'requireCond', cond: { minSelfCharsPoweredAtLeast: { power: 6000, count: 1 } } },
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
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'ST22-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'self', zone: 'hand', typeContains: 'Whitebeard Pirates' },
          min: 0,
          max: 1,
          prompt: 'Reveal a Whitebeard Pirates card?',
        },
        { op: 'abortIfEmpty', ref: 'r' },
        { op: 'reveal', ref: 'r' },
        { op: 'draw', count: 1 },
        { op: 'topDeck', ref: 'r' },
      ],
    },
  ],
  'ST22-002': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { nameNot: 'Izo', typeContains: 'Whitebeard Pirates' },
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
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Trash Izo: draw 1 and bottom-deck 1?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'trashFromField', ref: 'self' },
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Place 1 card at your deck bottom',
        },
        { op: 'bottomDeck', ref: 'h' },
      ],
    },
  ],
  'ST22-003': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'revealTopCond', filter: { typeContains: 'Whitebeard Pirates' } },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'ST22-005': [
    {
      timing: 'replaceKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Trash 2 to save Oden?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'trashCards', ref: 'pay' },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restDon: 3 },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters', excludeSelf: true },
          min: 1,
          max: 1,
          prompt: 'Return a Character to hand',
        },
        { op: 'returnToHand', ref: 'pay' },
        { op: 'setActive', ref: 'self' },
      ],
    },
  ],
  'ST22-006': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'revealTopCond', filter: { typeContains: 'Whitebeard Pirates' } },
        { op: 'draw', count: 2 },
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
  ],
  'ST22-007': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        { op: 'revealTopCond', filter: { typeContains: 'Whitebeard Pirates' } },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give 1 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'ST22-011': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leader', typeContains: 'Whitebeard Pirates' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
      condition: { yourTurn: true },
    },
  ],
  'ST22-012': [
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
          prompt: 'Trash 1 to save Marco?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'trashCards', ref: 'pay' },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'revealTopCond', filter: { typeContains: 'Whitebeard Pirates' } },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'ST22-015': [
    {
      timing: 'main',
      condition: { leaderTypeContains: 'Whitebeard Pirates' },
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', nameIs: 'Edward.Newgate' },
          min: 0,
          max: 1,
          prompt: 'Play Whitebeard from hand',
        },
        { op: 'playCards', ref: 'p' },
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add a Life card to your hand?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'lifeToHand', ref: 'pay' },
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'l', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'ST22-016': [
    {
      timing: 'counter',
      ops: [
        { op: 'revealTopCond', filter: { typeContains: 'Whitebeard Pirates' } },
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
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'ST22-017': [
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
          prompt: 'Reveal 2 Whitebeard Pirates cards?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 't' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Return to hand',
        },
        { op: 'returnToHand', ref: 'b1' },
      ],
    },
  ],
  'ST23-002': [
    {
      timing: 'onPlay',
      condition: { anyOf: [{ leaderTypeIncludes: 'Red-Haired Pirates' }, { leaderNameIs: 'Uta' }] },
      ops: [
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'l', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'ST23-003': [
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
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Red-Haired Pirates' } },
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 4000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b1' },
      ],
    },
  ],
  'ST23-004': [
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
          prompt: 'Give -1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -1000, duration: 'turn' },
      ],
    },
  ],
  'ST23-005': [
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
          prompt: 'Give 1 rested DON!! to...',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'ST24-001': [
    {
      timing: 'onPlay',
      condition: { minSelfRestedAny: 6 },
      ops: [
        { op: 'draw', count: 1 },
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
  ],
  'ST24-002': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 5, filter: { typeIncludes: 'Supernovas' }, upTo: 1, to: 'hand' },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Trash Kid & Killer: set a DON!! active?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set DON!! active',
        },
        { op: 'setActive', ref: 'd' },
      ],
    },
  ],
  'ST24-003': [
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
    },
  ],
  'ST24-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest (and lock through Refresh)',
        },
        { op: 'rest', ref: 'r' },
        { op: 'grantFlag', ref: 'r', flag: 'noRefresh', duration: 'untilYourNextTurn' },
        { op: 'requireCond', cond: { minOppRestedCharacters: 2 } },
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'l', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'ST24-005': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Supernovas' },
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
        { op: 'atTurnEnd', kind: 'setActiveDon', count: 1 },
      ],
    },
  ],
  'ST25-001': [
    {
      timing: 'onPlay',
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
      condition: { leaderNameIs: 'Buggy' },
    },
  ],
  'ST25-003': [
    {
      timing: 'onPlay',
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
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Cross Guild',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
    {
      timing: 'guardKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      guard: { owner: 'self', zone: 'characters', typeIncludes: 'Cross Guild' },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Trash 1 from hand to save this Cross Guild Character?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
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
  'ST25-004': [
    {
      timing: 'activateMain',
      condition: { leaderNameIs: 'Buggy' },
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
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Cross Guild',
            costAtMost: 6,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'ST25-005': [
    {
      timing: 'onKo',
      condition: { leaderNameIs: 'Buggy', maxHandSelf: 3 },
      ops: [{ op: 'draw', count: 1 }],
    },
  ],
  'ST26-001': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'a',
          filter: { owner: 'self', zone: 'characters', nameIsAny: ['San-Gorou', 'Sanji'] },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: 'Return all San-Gorou and Sanji Characters',
        },
        { op: 'returnToHand', ref: 'a' },
      ],
    },
  ],
  'ST26-002': [
    {
      timing: 'onPlay',
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
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'don', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest a DON!! (or decline for the Character mode)',
        },
        { op: 'rest', ref: 'r' },
        { op: 'abortIfChosen', ref: 'r' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 1 },
          min: 0,
          max: 1,
          prompt: 'Rest a cost-1 Character',
        },
        { op: 'rest', ref: 'c' },
      ],
    },
  ],
  'ST26-003': [
    {
      timing: 'onPlay',
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
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'ST26-004': [
    {
      timing: 'onPlay',
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
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 2,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'ST26-005': [
    {
      timing: 'onPlay',
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
        { op: 'requireCond', cond: { leaderMulticolor: true, minDonFieldOpp: 5 } },
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader', typeIncludes: 'Straw Hat Crew' },
          min: 0,
          max: 1,
          prompt: 'Base power becomes 7000',
        },
        { op: 'setPower', ref: 'l', value: 7000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: { owner: 'self', zone: 'don' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may return 2 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'b2' },
        { op: 'returnDon', ref: 'b2' },
        { op: 'requireCond', cond: { leaderMulticolor: true, minDonFieldOpp: 5 } },
        {
          op: 'select',
          bind: 'l2',
          filter: { owner: 'self', zone: 'leader', typeIncludes: 'Straw Hat Crew' },
          min: 0,
          max: 1,
          prompt: 'Base power becomes 7000',
        },
        { op: 'setPower', ref: 'l2', value: 7000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'ST27-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'anyOwn', nameIs: 'Fullalead', rested: false },
          min: 1,
          max: 1,
          prompt: 'Rest a Fullalead',
        },
        { op: 'rest', ref: 'pay' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Blackbeard Pirates' } },
        { op: 'powerMod', ref: 'self', amount: 4000, duration: 'turn' },
      ],
    },
    { timing: 'onKo', ops: [{ op: 'draw', count: 1 }] },
  ],
  'ST27-002': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Blackbeard Pirates' } },
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
    { timing: 'onKo', ops: [{ op: 'draw', count: 1 }] },
  ],
  'ST27-003': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Blackbeard Pirates',
            costAtMost: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash, rested',
        },
        { op: 'playCards', ref: 'p', rested: true },
      ],
    },
  ],
  'ST27-004': [
    {
      timing: 'onPlay',
      ops: [
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
  ],
  'ST27-005': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'any', zone: 'characters', costAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character',
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
          filter: { owner: 'self', zone: 'trash', colorIncludes: 'Black' },
          min: 0,
          max: 1,
          prompt: 'Add to hand',
        },
        { op: 'toHand', ref: 'b2' },
      ],
    },
  ],
  'ST28-001': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Land of Wano', minLifeOpp: 3 },
      ops: [
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
  ],
  'ST28-002': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader', typeIncludes: 'Land of Wano' },
          min: 0,
          max: 1,
          prompt: 'Grant Banish',
        },
        { op: 'grantKeyword', ref: 'l', keyword: 'Banish', duration: 'turn' },
      ],
    },
  ],
  'ST28-003': [
    {
      timing: 'trigger',
      condition: { leaderTypeIncludes: 'Land of Wano', maxLifeOpp: 3 },
      ops: [{ op: 'playSelf' }],
    },
  ],
  'ST28-004': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        { op: 'requireCond', cond: { minSelfGivenDon: 2 } },
        { op: 'detachDon', count: 2 },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
        { op: 'powerMod', ref: 'self', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'ST28-005': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Land of Wano', costAtLeast: 2 },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'ST30-002': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', powerAtLeast: 6000, powerAtMost: 6000 },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'ST30-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            powerAtLeast: 6000,
            powerAtMost: 6000,
          },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Reveal 2 Characters with 6000 power?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'reveal', ref: 'pay' },
        { op: 'draw', count: 3 },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'hand' },
          min: 2,
          max: 2,
          prompt: 'Trash 2',
        },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],
  'ST30-006': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            powerAtLeast: 6000,
            powerAtMost: 6000,
          },
          min: 0,
          max: 1,
          prompt: 'Trash 1 Character with 6000 power?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'ST30-007': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may rest 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'd' },
        { op: 'rest', ref: 'd' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
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
  'ST30-008': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            powerAtLeast: 6000,
            powerAtMost: 6000,
          },
          min: 0,
          max: 1,
          prompt: 'Trash 1 Character with 6000 power?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'playSelf', rested: true },
      ],
    },
  ],
  'ST30-009': [
    {
      timing: 'guardKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      guard: { owner: 'self', zone: 'characters', basePowerIs: 6000 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Trash Oars Jr. to save this Character?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'trashFromField', ref: 'self' },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'ST30-010': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: true },
          min: 0,
          max: 1,
          prompt: 'Lock through Refresh',
        },
        { op: 'grantFlag', ref: 'b1', flag: 'noRefresh', duration: 'untilYourNextTurn' },
      ],
    },
  ],
  'ST30-011': [
    {
      timing: 'guardKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      guard: { owner: 'self', zone: 'characters', basePowerIs: 6000 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Rest Buggy to save this Character?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'rest', ref: 'self' },
      ],
    },
  ],
  'ST30-012': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may rest 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'd' },
        { op: 'rest', ref: 'd' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, hasKeywordIs: 'Blocker' },
          min: 0,
          max: 1,
          prompt: 'Rest a Blocker',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'ST30-014': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'a',
          filter: { owner: 'self', zone: 'characters', basePowerIs: 6000 },
          min: 0,
          max: 1,
          prompt: 'Give up to 2 rested DON!! to...',
        },
        { op: 'giveRestedDon', upTo: 2, toRef: 'a' },
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'characters', basePowerIs: 6000 },
          min: 0,
          max: 1,
          prompt: 'Give up to 2 rested DON!! to a second Character',
        },
        { op: 'giveRestedDon', upTo: 2, toRef: 'b' },
      ],
    },
  ],
  'ST30-015': [
    {
      timing: 'counter',
      condition: { minSelfCharsBasePowerIs: { power: 6000, count: 2 } },
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
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'b2' },
      ],
    },
  ],
  'ST30-016': [
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
        { op: 'requireCond', cond: { hasCharacterNamed: 'Portgas.D.Ace' } },
        { op: 'requireCond', cond: { hasCharacterNamed: 'Monkey.D.Luffy' } },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'ST30-017': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', powerAtLeast: 6000, powerAtMost: 6000 },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'ST31-001': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Straw Hat Crew',
            costAtMost: 5,
            nameNot: 'Sanji',
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'ST31-002': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Straw Hat Crew',
            costIs: 1,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'ST31-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 's',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Straw Hat Crew' },
          min: 0,
          max: 6,
          selectAll: true,
          prompt: 'Straw Hat Crew cards on your field',
        },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -1000 power per Straw Hat Crew card',
        },
        { op: 'powerModPerRef', ref: 't', countRef: 's', amountPer: -1000, duration: 'turn' },
      ],
    },
  ],
  'ST31-005': [
    {
      timing: 'onPlay',
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
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Monkey.D.Luffy' },
          min: 0,
          max: 1,
          prompt: 'Give 1 rested DON!! to a Luffy',
        },
        { op: 'abortIfEmpty', ref: 'l' },
        { op: 'giveRestedDon', upTo: 1, toRef: 'l' },
      ],
    },
  ],
  'ST32-001': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may rest 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'd' },
        { op: 'rest', ref: 'd' },
        { op: 'draw', count: 2 },
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
  ],
  'ST32-002': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'Cannot be rested',
        },
        { op: 'grantFlag', ref: 't', flag: 'noRest', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'ST32-003': [
    {
      timing: 'onEvent',
      on: { kind: 'cardRested', who: 'self', sourceIsSelf: true },
      condition: { yourTurn: true },
      ops: [
        { op: 'draw', count: 1 },
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
    {
      timing: 'onPlay',
      condition: { leaderAttributeIs: 'Slash' },
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            costAtMost: 5,
            attributeIs: 'Slash',
            orNameIs: 'Perona',
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'ST32-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 2 },
          min: 0,
          max: 2,
          prompt: 'Rest up to 2',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'ST32-005': [
    {
      timing: 'onPlay',
      condition: { leaderAttributeIs: 'Slash' },
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
    },
  ],
  'ST33-001': [
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
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'ST33-002': [
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
        { op: 'requireCond', cond: { minHandOpp: 6 } },
        {
          op: 'select',
          bind: 'm',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 1,
          max: 1,
          chooser: 'opponent',
          prompt: 'Trash 1 card from your hand',
        },
        { op: 'trashCards', ref: 'm' },
      ],
    },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b2',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Navy',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b2' },
      ],
    },
  ],
  'ST33-003': [
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
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 2,
          prompt: 'Bottom-deck',
        },
        { op: 'bottomDeckFromField', ref: 'b2' },
      ],
    },
  ],
  'ST33-005': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Navy' },
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            colorIncludes: 'Blue',
            typeIncludes: 'Navy',
            powerAtMost: 8000,
            nameNot: 'Monkey.D.Garp',
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'ST34-001': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self' },
      oncePerTurn: true,
      condition: { yourTurn: true, leaderTypeIncludes: 'Big Mom Pirates' },
      ops: [{ op: 'addDon', count: 2, rested: true }],
    },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtMost: 8000 },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'ST34-002': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'addDon', count: 1, rested: true },
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
      condition: { leaderTypeIncludes: 'Big Mom Pirates' },
    },
  ],
  'ST34-003': [
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
  'ST34-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 4,
          exact: true,
          prompt: 'Rest 4 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'd' },
        { op: 'rest', ref: 'd' },
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'trashCards', ref: 'pay' },
        { op: 'deckTopToLife', count: 1 },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Base power becomes 0',
        },
        { op: 'setPower', ref: 't', value: 0, duration: 'turn' },
      ],
    },
  ],
  'ST34-005': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'You may rest 1 DON!!',
        },
        { op: 'abortIfEmpty', ref: 'd' },
        { op: 'rest', ref: 'd' },
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
  'ST35-001': [
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
  'ST35-002': [
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
    },
  ],
  'ST35-003': [
    {
      timing: 'whenAttacking',
      ops: [
        { op: 'millSelf', count: 2 },
        { op: 'requireCond', cond: { minHandOpp: 7 } },
        {
          op: 'select',
          bind: 'm',
          filter: { owner: 'opponent', zone: 'hand' },
          min: 1,
          max: 1,
          chooser: 'opponent',
          prompt: 'Trash 1 card from your hand',
        },
        { op: 'trashCards', ref: 'm' },
      ],
    },
  ],
  'ST35-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          selectAll: true,
          prompt: 'Give 1 rested DON!! to your Leader',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'l' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            powerAtMost: 4000,
            typeIncludes: 'Revolutionary Army',
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'p' },
        { op: 'abortIfChosen', ref: 'p' },
        {
          op: 'select',
          bind: 'p2',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            powerAtMost: 4000,
            typeIncludes: 'Revolutionary Army',
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'p2' },
      ],
    },
  ],
  'ST35-005': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          selectAll: true,
          prompt: 'Give 1 rested DON!! to your Leader',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'l' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            powerAtMost: 4000,
            typeIncludes: 'Revolutionary Army',
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'p' },
        { op: 'abortIfChosen', ref: 'p' },
        {
          op: 'select',
          bind: 'p2',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            powerAtMost: 4000,
            typeIncludes: 'Revolutionary Army',
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'p2' },
      ],
    },
  ],
  'ST36-001': [
    {
      timing: 'onKo',
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
      ],
    },
  ],
  'ST36-002': [
    {
      timing: 'onPlay',
      ops: [{ op: 'deckTopToLife', count: 1 }],
      condition: { yourTurn: true, leaderTypeIncludes: 'Kid Pirates' },
    },
    {
      timing: 'trigger',
      condition: { maxLifeOpp: 3 },
      ops: [{ op: 'playSelf' }],
    },
  ],
  'ST36-003': [
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader', typeIncludes: 'Supernovas' },
          min: 0,
          max: 1,
          prompt: 'Base power becomes 7000',
        },
        { op: 'setPower', ref: 'l', value: 7000, duration: 'turn' },
      ],
    },
  ],
  'ST36-004': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Supernovas' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'ST36-005': [
    {
      timing: 'onEvent',
      on: { kind: 'attacked', who: 'self' },
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Turn a Life card face-down to redirect the attack?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'lifeFaceDown', count: 1 },
        {
          op: 'select',
          bind: 't',
          filter: {
            owner: 'self',
            zone: 'characters',
            nameIs: 'Eustass"Captain"Kid',
            basePowerAtLeast: 5000,
          },
          min: 1,
          max: 1,
          prompt: 'Redirect the attack to...',
        },
        { op: 'redirectAttack', ref: 't' },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          selectAll: true,
          prompt: 'Give 1 rested DON!! to your Leader',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'l' },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const ST_STATICS: Record<string, StaticDef[]> = {
  'ST01-004': [{ target: { scope: 'self' }, donRequired: 2, keyword: 'Rush' }],
  'ST01-013': [{ target: { scope: 'self' }, donRequired: 1, power: 1000 }],
  'ST02-003': [
    { target: { scope: 'self' }, donRequired: 1, condition: { minSelfCharacters: 3 }, power: 2000 },
  ],
  'ST02-010': [{ target: { scope: 'self' }, donRequired: 1, flag: 'activeAfterCharBattle' }],
  'ST02-014': [
    {
      target: { scope: 'myLeader', typeIncludesAny: ['Supernovas', 'Navy'] },
      donRequired: 1,
      condition: { yourTurn: true, selfRested: true },
      power: 1000,
    },
    {
      target: { scope: 'myCharacters', typeIncludesAny: ['Supernovas', 'Navy'] },
      donRequired: 1,
      condition: { yourTurn: true, selfRested: true },
      power: 1000,
    },
  ],
  'ST05-008': [{ target: { scope: 'self' }, condition: { minDonField: 8 }, flag: 'noBattleKo' }],
  'ST06-004': [
    { target: { scope: 'self' }, flag: 'noEffectKo' },
    {
      target: { scope: 'self' },
      donRequired: 1,
      condition: { anyCharacterCostAtMost: 0 },
      keyword: 'Double Attack',
    },
  ],
  'ST09-001': [
    {
      target: { scope: 'self' },
      donRequired: 1,
      condition: { opponentsTurn: true, maxLifeSelf: 2 },
      power: 1000,
    },
  ],
  'ST09-004': [
    {
      target: { scope: 'self' },
      donRequired: 1,
      condition: { maxLifeSelf: 2 },
      flag: 'noBattleKo',
    },
  ],
  'ST09-005': [{ target: { scope: 'self' }, donRequired: 1, keyword: 'Double Attack' }],
  'ST10-003': [
    { target: { scope: 'self' }, condition: { yourTurn: true, minLifeSelf: 4 }, power: -1000 },
  ],
  'ST14-001': [
    { target: { scope: 'myCharacters' }, donRequired: 1, costMod: 1 },
    {
      target: { scope: 'self' },
      donRequired: 1,
      condition: { minSelfCharsCostAtLeast: { cost: 8, count: 1 } },
      power: 1000,
    },
  ],
  'ST14-009': [
    {
      target: { scope: 'self' },
      donRequired: 1,
      condition: { opponentsTurn: true, minSelfCharsCostAtLeast: { cost: 6, count: 1 } },
      flag: 'noOppEffectKo',
    },
    {
      target: { scope: 'self' },
      donRequired: 1,
      condition: { opponentsTurn: true, minSelfCharsCostAtLeast: { cost: 6, count: 1 } },
      power: 2000,
    },
  ],
  'ST14-012': [
    {
      target: { scope: 'self' },
      condition: { minSelfCharsCostAtLeast: { cost: 10, count: 1 } },
      keyword: 'Rush',
    },
  ],
  'ST14-017': [
    {
      target: { scope: 'myCharacters', colorIncludes: 'Black', typeIncludes: 'Straw Hat Crew' },
      costMod: 1,
    },
  ],
  'ST15-005': [
    {
      target: { scope: 'self' },
      condition: { leaderTypeIncludes: 'Whitebeard Pirates' },
      keyword: 'Rush',
    },
  ],
  'ST16-003': [
    {
      target: { scope: 'self' },
      condition: { leaderTypeIncludes: 'FILM', minSelfRestedAny: 6 },
      power: 2000,
    },
  ],
  'ST16-005': [
    {
      target: { scope: 'self' },
      condition: { hasCharacterNamed: 'Uta', minSelfRestedCharacters: 1 },
      power: 1000,
    },
  ],
  'ST19-004': [
    { target: { scope: 'self' }, donRequired: 1, condition: { opponentsTurn: true }, costMod: 4 },
  ],
  'ST21-002': [
    { target: { scope: 'self' }, donRequired: 2, condition: { opponentsTurn: true }, power: 2000 },
  ],
  'ST21-011': [
    {
      target: { scope: 'myCharacters', typeIncludes: 'Straw Hat Crew', basePowerAtMost: 4000 },
      donRequired: 2,
      condition: { opponentsTurn: true },
      power: 1000,
    },
  ],
  'ST21-015': [{ target: { scope: 'self' }, donRequired: 2, keyword: 'Rush' }],
  'ST23-001': [
    { target: { scope: 'self' }, keyword: 'Blocker' },
    {
      target: { scope: 'handSelf' },
      condition: { minSelfCharsPoweredAtLeast: { power: 10000, count: 1 } },
      costMod: -4,
    },
  ],
  'ST23-002': [
    { target: { scope: 'handSelf' }, condition: { oppBasePowerAtLeast: 8000 }, costMod: -3 },
  ],
  'ST25-001': [
    {
      target: { scope: 'self' },
      condition: { minSelfCharsCostAtLeast: { cost: 5, count: 2 } },
      costMod: 1,
    },
  ],
  'ST25-002': [
    { target: { scope: 'self' }, condition: { opponentsTurn: true }, power: 5000 },
    {
      target: { scope: 'self' },
      condition: { minSelfCharsCostAtLeast: { cost: 5, count: 2 } },
      keyword: 'Blocker',
    },
    {
      target: { scope: 'self' },
      condition: { minSelfCharsCostAtLeast: { cost: 5, count: 2 } },
      costMod: 1,
    },
  ],
  'ST25-005': [
    {
      target: { scope: 'self' },
      condition: { minSelfCharsCostAtLeast: { cost: 5, count: 2 } },
      keyword: 'Blocker',
    },
    {
      target: { scope: 'self' },
      condition: { minSelfCharsCostAtLeast: { cost: 5, count: 2 } },
      costMod: 1,
    },
  ],
  'ST26-001': [
    {
      target: { scope: 'handSelf' },
      condition: {
        anyOf: [
          { charNamedPowerAtLeast: { name: 'San-Gorou', power: 7000 } },
          { charNamedPowerAtLeast: { name: 'Sanji', power: 7000 } },
        ],
      },
      costMod: -5,
    },
  ],
  'ST27-004': [
    {
      target: { scope: 'self' },
      condition: { leaderTypeIncludes: 'Blackbeard Pirates' },
      keyword: 'Blocker',
    },
    {
      target: { scope: 'self' },
      condition: { leaderTypeIncludes: 'Blackbeard Pirates' },
      costModPer: { trashPerN: 4, amount: 1 },
    },
  ],
  'ST28-002': [{ target: { scope: 'self' }, donRequired: 2, keyword: 'Blocker' }],
  'ST28-004': [
    { target: { scope: 'myLeader' }, condition: { yourTurn: true, maxLifeSelf: 2 }, power: 1000 },
  ],
  'ST28-005': [
    { target: { scope: 'self' }, donRequired: 2, condition: { yourTurn: true }, power: 3000 },
  ],
  'ST30-001': [
    {
      target: { scope: 'self' },
      condition: { minSelfCharsBasePowerAtLeast: { power: 7000, count: 1 } },
      power: -2000,
    },
    { target: { scope: 'self' }, condition: { opponentsTurn: true }, power: 3000 },
    {
      target: { scope: 'myCharacters', nameIs: 'Portgas.D.Ace' },
      condition: { opponentsTurn: true },
      power: 3000,
    },
    {
      target: { scope: 'myCharacters', nameIs: 'Monkey.D.Luffy' },
      condition: { opponentsTurn: true },
      power: 3000,
    },
  ],
  'ST30-003': [
    {
      target: { scope: 'myCharacters', basePowerIs: 6000 },
      condition: { yourTurn: true },
      power: 1000,
    },
  ],
  'ST31-001': [{ target: { scope: 'self' }, donRequired: 2, keyword: 'Rush' }],
  'ST31-003': [
    {
      target: { scope: 'self' },
      condition: { opponentsTurn: true, minSelfGivenDon: 3 },
      keyword: 'Blocker',
    },
    {
      target: { scope: 'self' },
      condition: { opponentsTurn: true, minSelfGivenDon: 3 },
      power: 3000,
    },
  ],
  'ST31-004': [{ target: { scope: 'self' }, condition: { minSelfGivenDon: 3 }, keyword: 'Rush' }],
  'ST32-004': [
    {
      target: { scope: 'self' },
      condition: { leaderAttributeIs: 'Slash' },
      flag: 'rushCharactersOnly',
    },
  ],
  'ST32-005': [{ target: { scope: 'self' }, flag: 'rushCharactersOnly' }],
  'ST33-004': [{ target: { scope: 'self' }, keyword: 'Blocker' }],
  'ST35-004': [
    { target: { scope: 'self' }, keyword: 'Blocker' },
    { target: { scope: 'self' }, costMod: 1 },
  ],
  'ST35-005': [{ target: { scope: 'self' }, costMod: 3 }],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_ST: string[] = [
  'ST01-006',
  'ST02-004',
  'ST03-008',
  'ST04-011',
  'ST05-003',
  'ST06-007',
  'ST21-007',
  'ST22-009',
]

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_ST: Record<string, string> = {
  'ST02-010':
    'SIMPLIFIED: the set-active-after-battle rider ignores [Once Per Turn] (applies each battle)',
  'ST03-001': 'SIMPLIFIED: bounce targets the opponent side only (rules allow either)',
  'ST03-003': 'SIMPLIFIED: bottom-deck targets the opponent side only (rules allow either)',
  'ST03-009': 'SIMPLIFIED: bounce targets the opponent side only (rules allow either)',
  'ST03-014': 'SIMPLIFIED: bounce targets the opponent side only (rules allow either)',
  'ST03-015': 'SIMPLIFIED: bounce targets the opponent side only (rules allow either)',
  'ST03-016': 'SIMPLIFIED: bounce targets the opponent side only (rules allow either)',
  'ST04-002':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST04-003':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST04-004':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST04-005':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST04-006':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST04-010':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST04-016':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST05-004':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST05-006':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST05-010': 'SIMPLIFIED: the +3000-vs-Strike battle bonus is not modeled',
  'ST05-016':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST07-003':
    'SIMPLIFIED: the life scry may move either top Life card to its bottom (the look is not modeled)',
  'ST07-008':
    'SIMPLIFIED: the life scry may move either top Life card to its bottom (the look is not modeled)',
  'ST07-010':
    'SIMPLIFIED: the opponent chooses by trashing their top Life or declining (which gains Linlin a Life)',
  'ST07-015':
    'SIMPLIFIED: the opponent chooses by trashing their top Life or declining (which gains a Life)',
  'ST07-016':
    'SIMPLIFIED: the life scry may move either top Life card to its bottom (the look is not modeled)',
  'ST08-013': 'SIMPLIFIED: the end-of-battle mutual K.O. is not modeled',
  'ST09-015':
    'SIMPLIFIED: the stolen Character goes to the TOP of its owner Life (text also allows the bottom)',
  'ST10-003':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST10-010':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST10-013':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST12-003':
    'SIMPLIFIED: the Muggy Kingdom arm reads as the Slash-attribute arm (covers the deck pool)',
  'ST12-010': 'SIMPLIFIED: a missed reveal leaves the card on top, publicly known',
  'ST12-013': 'SIMPLIFIED: a missed reveal leaves the card on top, publicly known',
  'ST12-017': 'SIMPLIFIED: a missed reveal leaves the card on top, publicly known',
  'ST13-003':
    'SIMPLIFIED: the face-up Life refill plays from the hand only (the trash arm is dropped)',
  'ST13-004':
    'SIMPLIFIED: the life reorder sends the chosen Life card to the deck BOTTOM (top placement not modeled)',
  'ST13-007':
    'SIMPLIFIED: the leader +2000 select is offered even when the reveal missed (decline it)',
  'ST13-010':
    'SIMPLIFIED: the leader +2000 select is offered even when the reveal missed (decline it)',
  'ST13-012':
    'SIMPLIFIED: the full-Life reorder reads as the life scry (top card may go to the bottom)',
  'ST13-014':
    'SIMPLIFIED: the leader +2000 select is offered even when the reveal missed (decline it)',
  'ST13-016':
    'SIMPLIFIED: the life reorder sends the chosen Life card to the deck BOTTOM (top placement not modeled)',
  'ST13-017':
    'SIMPLIFIED: the full-Life reorder reads as the life scry (top card may go to the bottom)',
  'ST16-005':
    'SIMPLIFIED: the rested-Uta check reads any rested Character plus any Uta on the field',
  'ST17-002': 'SIMPLIFIED: bounce targets the opponent side only (rules allow either)',
  'ST17-003': 'SIMPLIFIED: the top-3 reorder is not modeled (information-only)',
  'ST18-005':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST20-003':
    'SIMPLIFIED: the life scry may move either top Life card to its bottom (the look is not modeled)',
  'ST20-005':
    'SIMPLIFIED: the opponent chooses by trashing 2 or declining (which trashes their top Life)',
  'ST22-017': 'SIMPLIFIED: bottom-deck targets the opponent side only (rules allow either)',
  'ST25-001': 'SIMPLIFIED: the base-cost-5 count reads effective costs (recursion-guarded)',
  'ST25-002': 'SIMPLIFIED: the base-cost-5 count reads effective costs (recursion-guarded)',
  'ST25-005': 'SIMPLIFIED: the base-cost-5 count reads effective costs (recursion-guarded)',
  'ST26-001': 'SIMPLIFIED: the 7000-base-power check reads effective power',
  'ST26-002':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST26-003':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST26-004':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST26-005':
    'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'ST28-004': 'SIMPLIFIED: the returned given-DON are taken leader-first (no per-card pick)',
  'ST30-016':
    'SIMPLIFIED: the 6000-base-power qualifier reads as Ace and Luffy presence (the deck pool is all 6000)',
  'ST31-004': 'SIMPLIFIED: the per-card count reads leader and Characters (a Stage is missed)',
  'ST32-001':
    'SIMPLIFIED: the leader-rest arm is dropped (the cost rests a DON!!); the printed attribute is <Slash>',
  'ST32-003':
    'SIMPLIFIED: the API drops the attribute name; authored as <Slash> per the printed card',
  'ST32-004':
    'SIMPLIFIED: the API drops the attribute name; authored as <Slash> per the printed card',
  'ST32-005':
    'SIMPLIFIED: the API drops the attribute name; authored as <Slash> per the printed card',
  'ST33-004': 'SIMPLIFIED: the trashed-this-turn hand discount is not modeled',
  'ST34-004':
    'SIMPLIFIED: "DON!! 4" reads as rest-4 from the cost area; the hand trash stays optional',
  'ST34-005': 'SIMPLIFIED: the rest-1 cost pays from the cost area',
  'ST35-003': 'SIMPLIFIED: the deck-top trash cost is always paid when attacking',
  'ST35-004': 'SIMPLIFIED: the trash arm is offered only when the hand play is declined',
  'ST35-005': 'SIMPLIFIED: the trash arm is offered only when the hand play is declined',
  'ST36-005': 'SIMPLIFIED: the face-down flip takes the topmost face-up Life card',
}
