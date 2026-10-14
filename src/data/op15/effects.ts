import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP15 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts and reviewed; the rest are authored
 * against the printed text. Deviations are documented in COVERAGE_NOTES_OP15.
 *
 * Set mechanics: DON!! gifts drain the RECEIVER's cost area (giveRestedDon's
 * owner-aware pool), purple pays DON!!-1 return costs toward its "6 or less
 * DON!!" thresholds, and black scales off trash size (basePowerSet tiers).
 */
export const OP15_EFFECTS: Record<string, EffectDef[]> = {
  // ===== Leaders =====
  'OP15-001': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', attachedDonAtLeast: 2, rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest up to 1 Character with 2+ DON!! given',
        },
        { op: 'rest', ref: 'r' },
      ],
    },
  ],
  'OP15-002': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'hand', cardTypeAny: ['Event', 'Stage'] },
          min: 0,
          max: 10,
          prompt: 'Trash any number of Events/Stages: +1000 each',
        },
        { op: 'trashCards', ref: 't' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'powerModPerRef', ref: 'L', countRef: 't', amountPer: 1000, duration: 'battle' },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'attackDeclared', who: 'opponent' },
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'hand', cardTypeAny: ['Event', 'Stage'] },
          min: 0,
          max: 10,
          prompt: 'Trash any number of Events/Stages: +1000 each',
        },
        { op: 'trashCards', ref: 't' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'powerModPerRef', ref: 'L', countRef: 't', amountPer: 1000, duration: 'battle' },
      ],
    },
    {
      // Printed as a manual [Activate: Main]; encoded as an auto listener
      timing: 'onEvent',
      on: { kind: 'eventActivated', who: 'self', minCost: 3 },
      oncePerTurn: true,
      condition: { yourTurn: true },
      ops: [{ op: 'draw', count: 1 }],
    },
  ],
  'OP15-022': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        { op: 'millSelf', count: 4 },
        { op: 'requireCond', cond: { maxDeckSelf: 0 } },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set up to 1 of your Characters as active',
        },
        { op: 'setActive', ref: 'c' },
      ],
    },
  ],
  'OP15-039': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Dressrosa' },
          min: 1,
          max: 1,
          prompt: 'Return 1 of your Dressrosa Characters to hand',
        },
        { op: 'returnToHand', ref: 'r' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Dressrosa',
            costIs: 3,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 cost-3 Dressrosa Character',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'OP15-058': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { minTurnNumber: 3 },
      ops: [
        { op: 'addDon', count: 1, rested: false },
        { op: 'addDon', count: 4, rested: true },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 4 rested DON!! to 1 of your Characters',
        },
        { op: 'giveRestedDon', upTo: 4, toRef: 'c' },
      ],
    },
  ],
  'OP15-098': [
    {
      timing: 'guardKo',
      replaceWhen: 'byOpponent',
      guardScope: 'removal',
      guard: {
        owner: 'self',
        zone: 'characters',
        typeIncludes: 'Sky Island',
        basePowerAtLeast: 6000,
      },
      condition: { minLifeSelf: 1 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Save: add your top Life to hand instead?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],

  // ===== Red (East Blue) =====
  'OP15-003': [
    {
      timing: 'replaceKo',
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'Trash a Character with 6000 power or less instead?',
        },
        { op: 'trashCards', ref: 'p' },
        { op: 'abortIfChosen', ref: 'p' },
        { op: 'koSelfNoReplace' },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'oc',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 1,
          max: 1,
          prompt: "Cost: give 1 of your opponent's rested DON!! to this Character",
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'oc' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'any', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to a Leader or Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'OP15-004': [
    {
      timing: 'onPlay',
      condition: { leaderPowerAtMost: 0 },
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -3000 power',
        },
        { op: 'powerMod', ref: 'c', amount: -3000, duration: 'turn' },
      ],
    },
  ],
  'OP15-005': [
    {
      timing: 'whenAttacking',
      condition: { minOppGivenDon: 1 },
      ops: [{ op: 'powerMod', ref: 'self', amount: 2000, duration: 'turn' }],
    },
  ],
  'OP15-007': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'East Blue' },
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Character with a cost of 5 or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'OP15-008': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'oc',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: "Give up to 3 of your opponent's rested DON!! to this Character",
        },
        { op: 'giveRestedDon', upTo: 3, toRef: 'oc' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { selfPlayedThisTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'dc',
          filter: { owner: 'opponent', zone: 'characters', attachedDonAtLeast: 1 },
          min: 1,
          max: 1,
          prompt: 'Count the DON!! given to which Character?',
        },
        {
          op: 'select',
          bind: 'all',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: '',
        },
        {
          op: 'powerModPerRef',
          ref: 'all',
          countRef: 'dc',
          amountPer: -1000,
          countAttachedDon: true,
          duration: 'turn',
        },
      ],
    },
  ],
  'OP15-009': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guardScope: 'removal',
      guard: { owner: 'self', zone: 'characters', basePowerAtMost: 7000 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Save: your Leader gets -2000 power instead?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'powerMod', ref: 'L', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'OP15-010': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'any', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to a Leader or Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'OP15-011': [
    {
      timing: 'onKo',
      condition: { leaderTypeIncludes: 'East Blue' },
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with 6000 base power or less',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'OP15-012': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'any', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to a Leader or Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
    { timing: 'onKo', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP15-014': [
    {
      timing: 'replaceKo',
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', cardType: 'Event' },
          min: 0,
          max: 1,
          prompt: 'Trash an Event instead?',
        },
        { op: 'trashCards', ref: 'p' },
        { op: 'abortIfChosen', ref: 'p' },
        { op: 'koSelfNoReplace' },
      ],
    },
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'e',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Event',
            typeIncludes: 'Dressrosa',
            baseCostAtMost: 3,
          },
          min: 0,
          max: 1,
          prompt: 'Activate up to 1 Dressrosa Event with a base cost of 3 or less',
        },
        { op: 'activateEventFromHand', ref: 'e' },
      ],
    },
  ],
  'OP15-015': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'oc',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: "Give up to 1 of your opponent's rested DON!! to this Character",
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'oc' },
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'opponent', zone: 'characters', attachedDonAtLeast: 1 },
          min: 0,
          max: 1,
          prompt: 'Give -1000 power to a Character with a DON!! given',
        },
        { op: 'powerMod', ref: 'd', amount: -1000, duration: 'turn' },
      ],
    },
  ],
  'OP15-017': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'oc',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 1,
          max: 1,
          prompt: "Cost: give 1 of your opponent's rested DON!! to this Character",
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'oc' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'any', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to a Leader or Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'OP15-018': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: {
            owner: 'opponent',
            zone: 'characters',
            powerAtMost: 3000,
            attachedDonAtLeast: 1,
          },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with 3000 power or less and a DON!! given',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'OP15-019': [
    {
      timing: 'main',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'powerMod', ref: 'L', amount: 1000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
    {
      timing: 'trigger',
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
    },
  ],
  'OP15-020': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'powerMod', ref: 'L', amount: 3000, duration: 'turn' },
        {
          op: 'select',
          bind: 'w',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -8000 power until the end of their next End Phase',
        },
        { op: 'powerMod', ref: 'w', amount: -8000, duration: 'untilTurn', untilTurnOffset: 1 },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may trash 2: K.O. a 0-power Character',
        },
        { op: 'abortIfEmpty', ref: 't' },
        { op: 'trashCards', ref: 't' },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 0 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with 0 power or less',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'OP15-021': [
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
      ],
    },
    {
      timing: 'counter',
      ops: [
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

  // ===== Green (East Blue) =====
  'OP15-023': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', rested: true },
          min: 0,
          max: 2,
          prompt: 'Up to 2 rested Characters skip the next Refresh Phase',
        },
        { op: 'grantFlag', ref: 'r', flag: 'noRefresh', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'oc',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 1,
          max: 1,
          prompt: "Cost: give 1 of your opponent's rested DON!! to this Character",
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'oc' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'any', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: "Give up to 1 DON!! from its owner's cost area to a Leader or Character",
        },
        { op: 'giveRestedDon', upTo: 1, anyState: true, toRef: 't' },
      ],
    },
  ],
  'OP15-024': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters', rested: false, costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'b1' },
      ],
    },
  ],
  'OP15-025': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'oc',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: "Give up to 2 DON!! from your opponent's cost area to this Character",
        },
        { op: 'giveRestedDon', upTo: 2, anyState: true, toRef: 'oc' },
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'any', zone: 'characters', rested: true, attachedDonAtLeast: 3 },
          min: 0,
          max: 1,
          prompt: 'A rested Character with 3+ DON!! skips the next Refresh Phase',
        },
        { op: 'grantFlag', ref: 'r', flag: 'noRefresh', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP15-026': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 3, filter: { typeIncludes: 'East Blue' }, upTo: 1, to: 'hand' },
      ],
    },
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'oc',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: "Give up to 1 of your opponent's rested DON!! to this Character",
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'oc' },
      ],
    },
  ],
  'OP15-027': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', attachedDonAtLeast: 1, rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest up to 1 Character with a DON!! given',
        },
        { op: 'rest', ref: 'r' },
      ],
    },
  ],
  'OP15-028': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'East Blue' },
      ops: [
        {
          op: 'select',
          bind: 'oc',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: "Give up to 1 DON!! from your opponent's cost area to this Character",
        },
        { op: 'giveRestedDon', upTo: 1, anyState: true, toRef: 'oc' },
      ],
    },
  ],
  'OP15-029': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: "Cannot be rested until the end of your opponent's next End Phase",
        },
        { op: 'grantFlag', ref: 'c', flag: 'noRest', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP15-031': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'characters', rested: true },
          min: 0,
          max: 1,
          prompt: 'Select a rested Character (K.O. if cost equals its given DON!!)',
        },
        { op: 'requireRefCostEqualsAttachedDon', ref: 't' },
        { op: 'ko', ref: 't' },
      ],
    },
  ],
  'OP15-032': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'anyOwn', rested: false },
          min: 0,
          max: 1,
          prompt: "Rest up to 1 of your opponent's cards",
        },
        { op: 'rest', ref: 'r' },
      ],
    },
    {
      timing: 'activateMain',
      condition: { leaderTypeIncludes: 'Straw Hat Crew' },
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters', rested: true, baseCostAtMost: 8 },
          min: 0,
          max: 1,
          prompt: 'Set up to 1 Character with a base cost of 8 or less as active',
        },
        { op: 'setActive', ref: 'c' },
      ],
    },
  ],
  'OP15-033': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', typeIncludes: 'Fish-Man' },
          min: 0,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'setActive', ref: 'L' },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],
  'OP15-034': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Brook' },
          min: 0,
          max: 1,
          prompt: 'Up to 1 of your [Brook] cards gains +2000 power',
        },
        { op: 'powerMod', ref: 'b', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'OP15-035': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guardScope: 'removal',
      guard: { owner: 'self', zone: 'characters', basePowerAtMost: 7000 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Save: rest 2 of your cards instead?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'anyOwn', rested: false },
          min: 2,
          max: 2,
          prompt: 'Rest 2 of your cards',
        },
        { op: 'rest', ref: 'pay' },
      ],
    },
  ],
  'OP15-036': [
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
      timing: 'whenAttacking',
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
  'OP15-037': [
    {
      timing: 'main',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: {
            nameNot: "The Outcome Will Tell Us Who's Strong and Who's Weak",
            typeIncludes: 'East Blue',
          },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP15-038': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: {
            owner: 'opponent',
            zone: 'characters',
            rested: true,
            costAtMost: 8,
            attachedDonAtLeast: 2,
          },
          min: 0,
          max: 1,
          prompt: 'A rested cost-8-or-less Character with 2+ DON!! skips the next Refresh Phase',
        },
        { op: 'grantFlag', ref: 'r', flag: 'noRefresh', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Krieg' },
          min: 0,
          max: 1,
          prompt: '+4000 power this battle',
        },
        { op: 'powerMod', ref: 'k', amount: 4000, duration: 'battle' },
      ],
    },
  ],

  // ===== Blue (Dressrosa) =====
  'OP15-040': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 3, filter: { typeIncludes: 'Dressrosa' }, upTo: 1, to: 'hand' },
      ],
    },
  ],
  'OP15-041': [
    { timing: 'onKo', ops: [{ op: 'draw', count: 1 }] },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters' },
          min: 1,
          max: 1,
          prompt: "Cost: place 1 of your Characters at the bottom of the owner's deck",
        },
        { op: 'bottomDeckFromField', ref: 'c' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'OP15-042': [
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
        { op: 'requireCond', cond: { leaderNameIs: 'Rebecca' } },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
    { timing: 'onKo', ops: [{ op: 'selfToHand' }] },
  ],
  'OP15-043': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Bobby Funk' },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 [Bobby Funk]',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'OP15-044': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { typeIncludes: 'Dressrosa', cardType: 'Event' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'OP15-045': [
    {
      timing: 'onPlay',
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
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'OP15-046': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Dressrosa' },
      ops: [
        {
          op: 'select',
          bind: 'e',
          filter: { owner: 'self', zone: 'hand', cardType: 'Event', typeIncludes: 'Dressrosa' },
          min: 0,
          max: 1,
          prompt: 'Activate up to 1 Dressrosa Event',
        },
        { op: 'activateEventFromHand', ref: 'e' },
      ],
    },
  ],
  'OP15-047': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Grant [Unblockable] this turn',
        },
        { op: 'grantKeyword', ref: 'c', keyword: 'Unblockable', duration: 'turn' },
      ],
    },
  ],
  'OP15-048': [
    {
      timing: 'onPlay',
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
        { op: 'draw', count: 2 },
      ],
    },
    {
      timing: 'onKo',
      condition: { opponentsTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'opponent', zone: 'hand' },
          chooser: 'opponent',
          min: 1,
          max: 1,
          prompt: 'Place 1 card from your hand at the bottom of your deck',
        },
        { op: 'bottomDeck', ref: 'h' },
      ],
    },
  ],
  'OP15-052': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guardScope: 'removal',
      guard: { owner: 'self', zone: 'characters', basePowerAtMost: 7000 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Save: bottom-deck 1 of your Characters instead?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters' },
          min: 1,
          max: 1,
          prompt: "Place 1 of your Characters at the bottom of the owner's deck",
        },
        { op: 'bottomDeckFromField', ref: 'pay' },
      ],
    },
  ],
  'OP15-053': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 3, filter: { typeIncludes: 'Dressrosa' }, upTo: 1, to: 'hand' },
      ],
    },
  ],
  'OP15-054': [
    {
      timing: 'main',
      condition: { leaderNameIs: 'Lucy' },
      ops: [
        {
          op: 'select',
          bind: 'm2',
          filter: { owner: 'any', zone: 'stage' },
          min: 0,
          max: 1,
          prompt: "Mode 2: return a Stage to the owner's hand (skip for the draw mode)",
        },
        { op: 'returnToHand', ref: 'm2' },
        { op: 'abortIfChosen', ref: 'm2' },
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
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Dressrosa',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Dressrosa Character with a cost of 4 or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'OP15-055': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'm2',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Dressrosa' },
          min: 0,
          max: 1,
          prompt: 'Mode 2: grant [Blocker] (skip to draw 2 instead)',
        },
        {
          op: 'grantKeyword',
          ref: 'm2',
          keyword: 'Blocker',
          duration: 'untilTurn',
          untilTurnOffset: 1,
        },
        { op: 'abortIfChosen', ref: 'm2' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'OP15-056': [
    {
      timing: 'main',
      ops: [
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', nameIs: 'Lucy' },
          min: 0,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'grantKeyword', ref: 'L', keyword: 'Double Attack', duration: 'turn' },
        { op: 'powerMod', ref: 'L', amount: 3000, duration: 'turn' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'draw', count: 2 }] },
  ],
  'OP15-057': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Dressrosa' },
      ops: [{ op: 'draw', count: 1 }],
    },
    {
      timing: 'onEvent',
      on: { kind: 'attackDeclared', who: 'opponent' },
      condition: { selfActive: true },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardTypeAny: ['Event', 'Stage'] },
          min: 0,
          max: 1,
          prompt: 'Rest this Stage and trash 1 Event/Stage: +2000 power this battle?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'rest', ref: 'self' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+2000 power this battle',
        },
        { op: 'powerMod', ref: 't', amount: 2000, duration: 'battle' },
      ],
    },
  ],

  // ===== Purple (Sky Island / Enel) =====
  'OP15-059': [
    {
      timing: 'onEvent',
      on: { kind: 'attackDeclared', who: 'opponent' },
      condition: { selfActive: true },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Rest Amazon: the opponent returns a DON!! or a card gets -2000?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'rest', ref: 'g' },
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'opponent', zone: 'don', rested: false },
          chooser: 'opponent',
          min: 0,
          max: 1,
          prompt: 'Return 1 active DON!! to your DON!! deck? (decline: -2000 power)',
        },
        { op: 'returnDon', ref: 'd' },
        { op: 'abortIfChosen', ref: 'd' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 't', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'OP15-060': [
    {
      timing: 'activateMain',
      cost: { restDon: 1 },
      ops: [
        {
          op: 'grantKeyword',
          ref: 'self',
          keyword: 'Blocker',
          duration: 'untilTurn',
          untilTurnOffset: 1,
        },
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
  'OP15-061': [
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
          prompt: 'Rest 1 DON!! to draw 1?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'draw', count: 1 },
      ],
    },
    {
      timing: 'whenAttacking',
      condition: { maxDonField: 6 },
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -1000 power',
        },
        { op: 'powerMod', ref: 'c', amount: -1000, duration: 'turn' },
      ],
    },
  ],
  'OP15-063': [
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
          prompt: 'Rest 1 DON!! to draw 1?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'draw', count: 1 },
      ],
    },
    {
      timing: 'onKo',
      condition: { maxDonField: 6 },
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 2000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with 2000 power or less',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'OP15-064': [
    {
      timing: 'activateMain',
      cost: { restDon: 2, restSelf: true },
      condition: { hasCharacterNamed: 'Satori', hasOtherCharacterNamed: 'Hotori' },
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 5000, rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest up to 1 Character with 5000 power or less',
        },
        { op: 'rest', ref: 'r' },
      ],
    },
  ],
  'OP15-065': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'revealTopCond', filter: { costAtMost: 2 } },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
  ],
  'OP15-066': [
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
          prompt: 'Rest 1 DON!! to draw 1?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'draw', count: 1 },
      ],
    },
    {
      timing: 'whenAttacking',
      condition: { maxDonField: 6 },
      ops: [{ op: 'scryBottom', count: 2 }],
    },
  ],
  'OP15-067': [
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
          prompt: 'Rest 1 DON!! to draw 1?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'OP15-069': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guardScope: 'removal',
      guard: { owner: 'self', zone: 'characters', basePowerAtMost: 7000 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Save: return 1 DON!! to the DON!! deck instead?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        {
          op: 'select',
          bind: 'npay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 1,
          max: 1,
          prompt: 'Return 1 DON!! from your field',
        },
        { op: 'returnDon', ref: 'npay' },
      ],
    },
  ],
  'OP15-072': [
    {
      timing: 'activateMain',
      cost: { restDon: 2, restSelf: true },
      condition: { hasCharacterNamed: 'Kotori', hasOtherCharacterNamed: 'Satori' },
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -3000 power',
        },
        { op: 'powerMod', ref: 'c', amount: -3000, duration: 'turn' },
      ],
    },
  ],
  'OP15-073': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            costIs: 1,
            typeIncludes: 'Vassals',
            orNameIs: 'Heavenly Warriors',
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 cost-1 [Heavenly Warriors] or Vassals Character',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'OP15-074': [
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
          prompt: 'Rest 1 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: "Give +2 cost until the end of your opponent's next End Phase",
        },
        { op: 'costMod', ref: 'c', amount: 2, duration: 'untilTurn', untilTurnOffset: 1 },
        { op: 'requireCond', cond: { leaderNameIs: 'Enel' } },
        { op: 'draw', count: 1 },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'e',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Enel' },
          min: 0,
          max: 1,
          prompt: '+2000 power this battle',
        },
        { op: 'powerMod', ref: 'e', amount: 2000, duration: 'battle' },
      ],
    },
  ],
  'OP15-075': [
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
          prompt: 'Rest 1 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 3000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with 3000 power or less',
        },
        { op: 'ko', ref: 'k' },
        { op: 'requireCond', cond: { leaderNameIs: 'Enel' } },
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+1000 power this turn',
        },
        { op: 'powerMod', ref: 'b', amount: 1000, duration: 'turn' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'e',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Enel' },
          min: 0,
          max: 1,
          prompt: '+2000 power this battle',
        },
        { op: 'powerMod', ref: 'e', amount: 2000, duration: 'battle' },
      ],
    },
  ],
  'OP15-076': [
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
          prompt: 'Rest 1 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -1000 power',
        },
        { op: 'powerMod', ref: 'c', amount: -1000, duration: 'turn' },
        { op: 'requireCond', cond: { leaderNameIs: 'Enel' } },
        { op: 'draw', count: 1 },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'e',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Enel' },
          min: 0,
          max: 1,
          prompt: '+2000 power this battle',
        },
        { op: 'powerMod', ref: 'e', amount: 2000, duration: 'battle' },
      ],
    },
  ],
  'OP15-077': [
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
          prompt: 'Rest 1 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', rested: true, powerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'A rested Character with 6000 power or less skips the next Refresh Phase',
        },
        { op: 'grantFlag', ref: 'r', flag: 'noRefresh', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'OP15-078': [
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
          prompt: 'Rest 2 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 5000, rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest up to 1 Character with 5000 power or less',
        },
        { op: 'rest', ref: 'r' },
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
          prompt: '+1000 power this battle',
        },
        { op: 'powerMod', ref: 'b2', amount: 1000, duration: 'battle' },
        { op: 'requireCond', cond: { maxDonField: 6 } },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'OP15-118': [
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
          prompt: 'Rest 1 DON!! to look at your top 5?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        { op: 'searchTop', count: 5, filter: {}, upTo: 1, to: 'hand' },
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
  'OP15-119': [
    {
      timing: 'onEvent',
      on: { kind: 'eventActivated', who: 'opponent' },
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        { op: 'powerModPerLifeTopCost', ref: 'self', amountPer: 1000, duration: 'turn' },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'blockerActivated', who: 'opponent' },
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        { op: 'powerModPerLifeTopCost', ref: 'self', amountPer: 1000, duration: 'turn' },
      ],
    },
  ],

  // ===== Black (Thriller Bark / Straw Hat Crew) =====
  'OP15-079': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'trash', typeIncludes: 'Thriller Bark Pirates' },
          min: 0,
          max: 1,
          prompt: 'Add up to 1 Thriller Bark Pirates card to hand',
        },
        { op: 'toHand', ref: 't' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'onKo' }] },
  ],
  'OP15-080': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash', excludeSelf: true },
          min: 0,
          max: 3,
          exact: true,
          prompt: 'Place 3 trash cards at the deck bottom to play this Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashToDeckBottom', ref: 'pay' },
        { op: 'playSelf' },
      ],
    },
  ],
  'OP15-081': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Straw Hat Crew' },
      ops: [{ op: 'millSelf', count: 5 }],
    },
  ],
  'OP15-082': [
    { timing: 'onPlay', ops: [{ op: 'millSelf', count: 3 }] },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'trash', cardType: 'Character', costAtMost: 8 },
          min: 0,
          max: 1,
          prompt: 'Add up to 1 Character with a cost of 8 or less to hand',
        },
        { op: 'toHand', ref: 't' },
      ],
    },
  ],
  'OP15-083': [
    { timing: 'onPlay', ops: [{ op: 'millSelf', count: 3 }] },
    {
      timing: 'activateMain',
      condition: { minTrashSelf: 15 },
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to a Leader or Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'OP15-084': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Thriller Bark Pirates' },
      ops: [{ op: 'millSelf', count: 5 }],
    },
    { timing: 'onKo', condition: { maxHandSelf: 6 }, ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP15-085': [
    { timing: 'onPlay', ops: [{ op: 'millSelf', count: 3 }] },
    {
      timing: 'activateMain',
      condition: { leaderTypeIncludes: 'Straw Hat Crew' },
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 't',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Straw Hat Crew',
            nameNot: 'Tony Tony.Chopper',
          },
          min: 0,
          max: 1,
          prompt: 'Add up to 1 other Straw Hat Crew Character to hand',
        },
        { op: 'toHand', ref: 't' },
      ],
    },
  ],
  'OP15-086': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Straw Hat Crew' },
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Straw Hat Crew',
            costAtMost: 7,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Straw Hat Crew Character with a cost of 7 or less from your trash',
        },
        { op: 'playCards', ref: 'p' },
        { op: 'grantKeyword', ref: 'p', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'OP15-087': [
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
  'OP15-088': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Trash your top 3 to play a cost-2 Straw Hat Crew from trash?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'millSelf', count: 3 },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Straw Hat Crew',
            costAtMost: 2,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Straw Hat Crew Character with a cost of 2 or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'OP15-090': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guardScope: 'removal',
      guard: { owner: 'self', zone: 'characters', basePowerAtMost: 7000 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Save: trash 1 card from your hand instead?',
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
  'OP15-091': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'trash' },
          min: 0,
          max: 1,
          prompt: "Place up to 1 card from your opponent's trash at the bottom of their deck",
        },
        { op: 'trashToDeckBottom', ref: 't' },
      ],
    },
  ],
  'OP15-093': [
    {
      timing: 'activateMain',
      condition: { minTrashSelf: 15 },
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'l',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Monkey.D.Luffy' },
          min: 0,
          max: 1,
          prompt: 'Grant [Rush: Character] this turn',
        },
        { op: 'grantFlag', ref: 'l', flag: 'rushCharactersOnly', duration: 'turn' },
      ],
    },
  ],
  'OP15-094': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guardScope: 'removal',
      guard: { owner: 'self', zone: 'characters', typeIncludes: 'Straw Hat Crew' },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Save: trash this Character instead?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'trashFromField', ref: 'self' },
      ],
    },
  ],
  'OP15-095': [
    {
      timing: 'main',
      condition: { minTrashSelf: 15 },
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 1,
          max: 1,
          prompt: 'Rest 1 DON!!',
        },
        { op: 'rest', ref: 'd' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Straw Hat Crew' },
          min: 0,
          max: 1,
          prompt: '+3000 power this turn',
        },
        { op: 'powerMod', ref: 't', amount: 3000, duration: 'turn' },
      ],
    },
    {
      timing: 'counter',
      condition: { minTrashSelf: 15 },
      ops: [
        {
          op: 'select',
          bind: 't2',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+4000 power this battle',
        },
        { op: 'powerMod', ref: 't2', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'OP15-096': [
    {
      timing: 'main',
      condition: { leaderTypeIncludes: 'Straw Hat Crew' },
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 1,
          max: 1,
          prompt: 'Rest 1 DON!!',
        },
        { op: 'rest', ref: 'd' },
        { op: 'millSelf', count: 5 },
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
  'OP15-097': [
    {
      timing: 'main',
      condition: { minTrashSelf: 10 },
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 5 },
          min: 0,
          max: 1,
          prompt: "Cannot attack until the end of your opponent's next End Phase",
        },
        {
          op: 'grantFlag',
          ref: 'c',
          flag: 'cannotAttack',
          duration: 'untilTurn',
          untilTurnOffset: 1,
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],

  // ===== Yellow (Sky Island) =====
  'OP15-099': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Supernovas' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1 Supernovas card',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
      ],
    },
    {
      timing: 'activateMain',
      ops: [
        { op: 'lifeFaceDown', count: 1 },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to your Leader or a Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'OP15-100': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt:
            'Trash this Character and add your top Life to hand: K.O. a cost-6-or-less Character?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'trashFromField', ref: 'self' },
        { op: 'lifeTopToHand', count: 1 },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with a cost of 6 or less',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'OP15-101': [
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
          filter: { typeIncludes: 'Shandian Warrior', orNameIs: 'Mont Blanc Noland' },
          upTo: 2,
          to: 'hand',
        },
      ],
    },
  ],
  'OP15-102': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', costAtMostOppLife: true, rested: false },
          min: 0,
          max: 1,
          prompt: "Rest up to 1 Character with cost at most your opponent's Life count",
        },
        { op: 'rest', ref: 'r' },
      ],
    },
  ],
  'OP15-103': [
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 1 },
        { op: 'requireCond', cond: { maxLifeSelf: 2 } },
        { op: 'playSelf' },
      ],
    },
  ],
  'OP15-104': [
    {
      timing: 'onPlay',
      condition: { lessLifeThanOpp: true },
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
  'OP15-105': [
    {
      timing: 'guardKo',
      replaceWhen: 'oppEffect',
      guardScope: 'removal',
      guard: { owner: 'self', zone: 'characters', basePowerAtMost: 7000 },
      condition: { minLifeSelf: 1 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Save: add your top Life to hand instead?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],
  'OP15-106': [
    {
      timing: 'trigger',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardTypeAny: ['Character', 'Stage'],
            colorIncludes: 'Yellow',
            costAtMost: 2,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 yellow Character or Stage with a cost of 2 or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'OP15-108': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 3, filter: { typeIncludes: 'Sky Island' }, upTo: 1, to: 'hand' },
      ],
    },
  ],
  'OP15-109': [
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Add your top Life to hand to activate?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'lifeTopToHand', count: 1 },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Sky Island',
            costAtMost: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Sky Island Character with a cost of 5 or less',
        },
        { op: 'playCards', ref: 'p' },
        { op: 'requireCond', cond: { leaderTypeIncludes: 'Straw Hat Crew' } },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'OP15-110': [
    {
      timing: 'onKo',
      condition: { leaderTypeIncludes: 'Shandian Warrior' },
      ops: [{ op: 'deckTopToLife', count: 1 }],
    },
  ],
  'OP15-111': [
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Kalgara' },
          min: 0,
          max: 1,
          prompt: 'Up to 1 [Kalgara] gains [Rush] this turn',
        },
        { op: 'grantKeyword', ref: 'k', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'OP15-112': [
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
            typeIncludes: 'Shandian Warrior',
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
  'OP15-113': [
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
      ],
    },
  ],
  'OP15-114': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        {
          op: 'select',
          bind: 'all',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: '',
        },
        { op: 'powerMod', ref: 'all', amount: -2000, duration: 'turn' },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 0 },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: '',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Sky Island' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to a Sky Island Leader or Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
  ],
  'OP15-115': [
    {
      timing: 'main',
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
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],
  'OP15-116': [
    {
      timing: 'main',
      condition: { leaderTypeIncludes: 'Straw Hat Crew' },
      ops: [
        { op: 'trashLifeTop', owner: 'self', count: 1 },
        { op: 'deckTopToLife', count: 1 },
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
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'powerMod', ref: 'L', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'OP15-117': [
    {
      timing: 'main',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Sky Island' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to a Sky Island Leader or Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
      ],
    },
    {
      timing: 'trigger',
      condition: { leaderTypeIncludes: 'Sky Island' },
      ops: [{ op: 'draw', count: 2 }],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP15_STATICS: Record<string, StaticDef[]> = {
  // Krieg leader: East Blue-only board debuffs the whole enemy field
  'OP15-001': [
    {
      donRequired: 1,
      condition: { opponentsTurn: true, allSelfCharsTyped: 'East Blue' },
      target: { scope: 'oppCharacters' },
      power: -2000,
    },
  ],
  'OP15-006': [{ target: { scope: 'self' }, condition: { minTrashEventsSelf: 4 }, power: 2000 }],
  'OP15-011': [
    {
      target: { scope: 'self' },
      condition: { opponentsTurn: true, leaderTypeIncludes: 'East Blue' },
      keyword: 'Blocker',
      power: 2000,
    },
  ],
  'OP15-013': [{ target: { scope: 'handSelf' }, condition: { leaderPowerAtMost: 0 }, costMod: -2 }],
  'OP15-021': [
    { target: { scope: 'handSelf' }, condition: { minTrashEventsSelf: 4 }, costMod: -3 },
  ],
  'OP15-024': [
    {
      target: { scope: 'self' },
      condition: { opponentsTurn: true },
      keyword: 'Blocker',
      flag: 'noRest',
    },
  ],
  'OP15-039': [{ target: { scope: 'self' }, flag: 'cannotAttack' }],
  'OP15-050': [
    { target: { scope: 'self' }, condition: { hasCharacterNamed: 'Kelly Funk' }, power: 3000 },
  ],
  'OP15-051': [
    {
      target: { scope: 'self' },
      condition: { opponentsTurn: true, leaderTypeIncludes: 'Dressrosa' },
      power: 3000,
    },
  ],
  'OP15-053': [{ target: { scope: 'self' }, donRequired: 1, keyword: 'Blocker' }],
  'OP15-060': [
    {
      target: { scope: 'self' },
      condition: { maxDonField: 6 },
      flag: 'noOppEffectRemove',
      power: 2000,
    },
  ],
  'OP15-067': [{ target: { scope: 'self' }, condition: { maxDonField: 6 }, keyword: 'Rush' }],
  'OP15-068': [{ target: { scope: 'self' }, condition: { maxDonField: 6 }, keyword: 'Blocker' }],
  'OP15-070': [
    { target: { scope: 'self' }, keyword: 'Unblockable' },
    { target: { scope: 'myCharacters', nameIs: 'Shura' }, keyword: 'Unblockable' },
    { target: { scope: 'self' }, condition: { opponentsTurn: true }, basePowerSet: 6000 },
    {
      target: { scope: 'myCharacters', nameIs: 'Shura' },
      condition: { opponentsTurn: true },
      basePowerSet: 6000,
    },
  ],
  'OP15-071': [
    { target: { scope: 'self' }, keyword: 'Double Attack' },
    { target: { scope: 'myCharacters', nameIs: 'Ohm' }, keyword: 'Double Attack' },
    { target: { scope: 'self' }, condition: { opponentsTurn: true }, basePowerSet: 6000 },
    {
      target: { scope: 'myCharacters', nameIs: 'Ohm' },
      condition: { opponentsTurn: true },
      basePowerSet: 6000,
    },
  ],
  'OP15-080': [
    {
      target: { scope: 'self' },
      condition: {
        charNamedPowerAtLeast: { name: 'Gecko Moria', power: 10000 },
        lacksOtherCharacterNamed: 'Oars',
      },
      power: 7000,
    },
  ],
  'OP15-087': [{ target: { scope: 'self' }, condition: { minTrashSelf: 10 }, keyword: 'Blocker' }],
  'OP15-088': [{ target: { scope: 'self' }, costMod: 6 }],
  'OP15-092': [
    { target: { scope: 'self' }, condition: { minTrashSelf: 10 }, basePowerSet: 9000 },
    { target: { scope: 'self' }, condition: { minTrashSelf: 10 }, costMod: 10 },
    {
      target: { scope: 'myLeader' },
      condition: { minTrashSelf: 20, opponentsTurn: true },
      basePowerSet: 7000,
    },
    { target: { scope: 'self' }, condition: { minTrashSelf: 30 }, power: 1000 },
  ],
  'OP15-102': [
    {
      target: { scope: 'handSelf' },
      condition: { charTypedPowerAtLeast: { type: 'Sky Island', power: 7000 } },
      costMod: -3,
    },
  ],
  'OP15-118': [
    {
      target: { scope: 'self' },
      condition: { maxDonField: 6 },
      flag: 'noOppEffectRemove',
      power: 2000,
    },
  ],
  'OP15-119': [{ target: { scope: 'self' }, condition: { minDonField: 6 }, keyword: 'Rush' }],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP15: string[] = []

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP15: Record<string, string> = {
  'OP15-002':
    'SIMPLIFIED: the manual [Activate: Main] "draw if you activated a cost-3+ Event this turn" is an auto listener that draws when the Event is activated (once per turn, your turn only) - strictly-better-auto.',
  'OP15-003':
    'SIMPLIFIED: the DON!!-gift activation cost resolves as a no-op when the opponent has no rested DON!! (the activation is not blocked up front).',
  'OP15-017': 'SIMPLIFIED: same no-op DON!!-gift cost behavior as OP15-003.',
  'OP15-022':
    'SIMPLIFIED: the deferred deck-out is checked at every End Phase while the deck is empty; refilling the deck before the End Phase avoids the loss (the printed text locks the loss to the turn the deck FIRST hit 0).',
  'OP15-023':
    "SIMPLIFIED: [On K.O.] refresh-lock targets Characters only (rested DON!!/Leader/Stage cannot carry the flag); the activation cost shares OP15-003's no-op behavior.",
  'OP15-024':
    "SIMPLIFIED: 'cannot be rested' (noRest) blocks ALL effect rests, not only the opponent's Leader/Character effects.",
  'OP15-025':
    'SIMPLIFIED: the refresh-lock is applied on play rather than "at the end of this turn".',
  'OP15-029':
    "SIMPLIFIED: 'cannot be rested' (noRest) blocks ALL effect rests, not only the opponent's.",
  'OP15-035':
    'SIMPLIFIED: the rest-2 payment is selected after the save is committed; a board that cannot pay still saves (engine-wide guardKo shape).',
  'OP15-074':
    'SIMPLIFIED: ops reordered (cost-give before the conditional draw) because requireCond aborts the remainder; net effects identical.',
  'OP15-075':
    'SIMPLIFIED: ops reordered (K.O. before the conditional buff); net effects identical.',
  'OP15-076':
    'SIMPLIFIED: ops reordered (debuff before the conditional draw); net effects identical.',
  'OP15-093':
    'SIMPLIFIED: [Rush: Character] = rushCharactersOnly flag; the "Slash attribute" grant is not modeled (battle attributes are static data).',
  'OP15-109':
    'SIMPLIFIED: ops reordered (hand-play before the conditional Life top-up) because requireCond aborts the remainder; "add up to 1 to Life" is mandatory once the condition holds.',
  'OP15-116': 'SIMPLIFIED: "add up to 1 card from deck top to Life" is mandatory.',
  'OP15-119':
    'SIMPLIFIED: the power boost requires a face-down top Life card to reveal; an already face-up top card grants nothing (reveal-first encoding).',
}
