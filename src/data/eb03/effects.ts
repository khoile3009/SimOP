import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * EB03 (Memorial Collection 2) effect definitions as DSL data, keyed by card
 * ID. Compiled entries were drafted by scripts/compile-effects.ts and reviewed;
 * the rest are authored against the printed text. Deviations are in
 * COVERAGE_NOTES_EB03.
 */
export const EB03_EFFECTS: Record<string, EffectDef[]> = {
  'EB03-001': [
    {
      timing: 'guardKo',
      oncePerTurn: true,
      guard: { owner: 'self', zone: 'characters', baseCostAtLeast: 4 },
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
    {
      timing: 'activateMain',
      cost: { restSelf: true },
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
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'self', zone: 'characters', noWhenAttacking: true },
          min: 0,
          max: 1,
          prompt: 'A Character without a [When Attacking] effect gains [Rush]',
        },
        { op: 'grantKeyword', ref: 'r', keyword: 'Rush', duration: 'turn' },
      ],
    },
  ],
  'EB03-003': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Uta' },
      ops: [
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            powerAtMost: 6000,
            noBaseEffect: true,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Character with 6000 power or less and no base effect',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB03-005': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Sugar' },
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Donquixote Pirates',
            powerAtMost: 6000,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Donquixote Pirates Character with 6000 power or less, rested',
        },
        { op: 'playCards', ref: 'p', rested: true },
      ],
    },
  ],
  'EB03-006': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', rested: false },
          min: 0,
          max: 1,
          prompt: 'Pay: your active Leader gets -5000 power. Draw 1?',
        },
        { op: 'abortIfEmpty', ref: 'L' },
        { op: 'powerMod', ref: 'L', amount: -5000, duration: 'turn' },
        { op: 'draw', count: 1 },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { leaderTypeIncludes: 'Alabasta' },
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
  'EB03-007': [
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
            powerAtMost: 6000,
            noBaseEffect: true,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
      ],
    },
  ],
  'EB03-008': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'SWORD' },
          min: 0,
          max: 1,
          prompt: 'May also attack active Characters this turn',
        },
        { op: 'grantFlag', ref: 't', flag: 'canAttackActive', duration: 'turn' },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 't2',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'SWORD' },
          min: 0,
          max: 1,
          prompt: 'May also attack active Characters this turn',
        },
        { op: 'grantFlag', ref: 't2', flag: 'canAttackActive', duration: 'turn' },
      ],
    },
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
          prompt: 'Give -1000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: -1000, duration: 'turn' },
      ],
    },
  ],
  'EB03-009': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'characters', noBaseEffect: true },
          min: 0,
          max: 1,
          prompt: '+2000 power',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'EB03-010': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { cardType: 'Character', powerAtMost: 1000, orMatch: { cardType: 'Event' } },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'EB03-011': [
    {
      timing: 'counter',
      condition: { leaderNameIs: 'Nefeltari Vivi' },
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
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'b2', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'EB03-012': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'opponent', zone: 'don', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest an opponent DON!! (skip to rest a Character)',
        },
        { op: 'rest', ref: 'd' },
        { op: 'abortIfChosen', ref: 'd' },
        {
          op: 'select',
          bind: 'c',
          filter: {
            owner: 'opponent',
            zone: 'characters',
            typeIncludesAny: ['Animal', 'SMILE'],
            costAtMost: 3,
            rested: false,
          },
          min: 0,
          max: 1,
          prompt: 'Rest an Animal or SMILE Character with a cost of 3 or less',
        },
        { op: 'rest', ref: 'c' },
      ],
    },
  ],
  'EB03-013': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { selfPlayedThisTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 rested Character with a cost of 5 or less',
        },
        { op: 'ko', ref: 'k' },
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Zou' },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 [Zou]',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB03-014': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', attributeIs: 'Slash' },
          min: 0,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'giveRestedDon', upTo: 2, toRef: 'L' },
      ],
    },
  ],
  'EB03-015': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: {
            owner: 'self',
            zone: 'leaderOrCharacters',
            typeIncludesAny: ['Fish-Man', 'Merfolk'],
          },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to a Fish-Man or Merfolk Leader/Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
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
  'EB03-016': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Kouzuki Oden' },
      ops: [{ op: 'draw', count: 1 }],
    },
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', typeIncludes: 'Land of Wano' },
          min: 0,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'L' },
      ],
    },
  ],
  'EB03-017': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Supernovas' },
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
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 8 },
          min: 0,
          max: 1,
          prompt: "Cannot be rested until the end of your opponent's next End Phase",
        },
        { op: 'grantFlag', ref: 'c', flag: 'noRest', duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'EB03-018': [
    {
      timing: 'endOfTurn',
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest 1 DON!! and trash 1: set Tashigi active?',
        },
        { op: 'abortIfEmpty', ref: 'd' },
        { op: 'rest', ref: 'd' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'h' },
        { op: 'setActive', ref: 'self' },
      ],
    },
  ],
  'EB03-020': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+2000 power (+2000 more with 2 FILM Characters)',
        },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'battle' },
        { op: 'requireCond', cond: { minSelfCharsTypedAny: { types: ['FILM'], count: 2 } } },
        { op: 'powerMod', ref: 'b1', amount: 2000, duration: 'battle' },
      ],
    },
  ],
  'EB03-021': [
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
          bind: 'a',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 4000 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck up to 1 Character with 4000 base power or less',
        },
        { op: 'bottomDeckFromField', ref: 'a' },
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'any', zone: 'characters', baseCostAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'Bottom-deck up to 1 Character with a base cost of 3 or less',
        },
        { op: 'bottomDeckFromField', ref: 'b' },
      ],
    },
  ],
  'EB03-022': [
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
  'EB03-023': [{ timing: 'onPlay', ops: [{ op: 'scryBottom', count: 5 }] }],
  'EB03-024': [
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
            typeIncludesAny: ['Alabasta', 'Straw Hat Crew'],
            costAtMost: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand',
        },
        { op: 'playCards', ref: 'b1' },
        { op: 'restrictSelf', restriction: 'noPlayCharacters' },
      ],
    },
  ],
  'EB03-025': [
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
          bind: 'r',
          filter: {
            owner: 'any',
            zone: 'characters',
            basePowerAtLeast: 6000,
            basePowerAtMost: 6000,
          },
          min: 0,
          max: 1,
          prompt: 'Return up to 1 Character with 6000 base power to hand',
        },
        { op: 'returnToHand', ref: 'r' },
      ],
    },
  ],
  'EB03-026': [
    {
      timing: 'onPlay',
      condition: { minHandOpp: 5 },
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
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters' },
          min: 1,
          max: 1,
          prompt: "Cost: place 1 of your Characters at the bottom of the owner's deck",
        },
        { op: 'bottomDeckFromField', ref: 'pay' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'L' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to a Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'c' },
      ],
    },
  ],
  'EB03-027': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: {
            owner: 'any',
            zone: 'characters',
            basePowerAtLeast: 7000,
            basePowerAtMost: 7000,
          },
          min: 0,
          max: 1,
          prompt: 'Return up to 1 Character with 7000 base power to hand',
        },
        { op: 'returnToHand', ref: 'r' },
      ],
    },
  ],
  'EB03-028': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1',
        },
        { op: 'trashCards', ref: 'h' },
      ],
    },
    {
      timing: 'activateMain',
      condition: { maxHandSelf: 4 },
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'EB03-029': [
    {
      timing: 'main',
      condition: { leaderNameIs: 'Boa Hancock' },
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 4,
          exact: true,
          prompt: 'Rest 4 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'd' },
        { op: 'rest', ref: 'd' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludesAny: ['Amazon Lily', 'Kuja Pirates'],
            costAtMost: 6,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Amazon Lily or Kuja Pirates Character with a cost of 6 or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Boa Hancock' },
          min: 0,
          max: 1,
          prompt: '+3000 power this battle',
        },
        { op: 'powerMod', ref: 'b', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'EB03-031': [
    {
      timing: 'onPlay',
      condition: { yourTurn: true, leaderNameIs: 'Sanji' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        {
          op: 'select',
          bind: 'e',
          filter: { owner: 'self', zone: 'trash', cardType: 'Event', costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Activate the [Main] of up to 1 Event with a cost of 7 or less in your trash',
        },
        { op: 'activateEventFromTrash', ref: 'e' },
      ],
    },
  ],
  'EB03-032': [
    {
      timing: 'onPlay',
      condition: { yourTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Charlotte Katakuri' },
          min: 0,
          max: 1,
          prompt: '+2000 power this turn',
        },
        { op: 'powerMod', ref: 'b', amount: 2000, duration: 'turn' },
      ],
    },
  ],
  'EB03-033': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self', byOwnEffect: true },
      oncePerTurn: true,
      condition: { opponentsTurn: true, leaderTypeIncludes: 'Big Mom Pirates' },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'EB03-034': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'draw', count: 1 },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Place 1 card on top of your deck',
        },
        { op: 'topDeck', ref: 'h' },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!! to add a Life card?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'deckTopToLife', count: 1 },
      ],
    },
  ],
  'EB03-035': [
    {
      timing: 'onPlay',
      condition: { oppAtLeastSelfDon: true },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'EB03-036': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 3 },
          min: 0,
          max: 2,
          prompt: 'K.O. up to 2 Characters with a base cost of 3 or less',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'EB03-037': [
    {
      timing: 'onPlay',
      condition: { minDonField: 7 },
      ops: [
        {
          op: 'select',
          bind: 'all',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'ODYSSEY' },
          min: 0,
          max: 6,
          selectAll: true,
          prompt: '',
        },
        { op: 'powerMod', ref: 'all', amount: 1000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'EB03-038': [
    {
      timing: 'main',
      condition: { oppAtLeastSelfDon: true, allSelfCharsTypeContains: 'GERMA' },
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Rest 1 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'd' },
        { op: 'rest', ref: 'd' },
        { op: 'addDon', count: 2, rested: true },
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
  'EB03-039': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Animal Kingdom Pirates' },
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
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            powerAtMost: 6000,
            noBaseEffect: true,
          },
          min: 0,
          max: 1,
          prompt:
            'Play up to 1 Character with 6000 power or less and no base effect from your trash',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB03-041': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Navy' },
          min: 0,
          max: 1,
          prompt: 'You may trash 1 Navy card',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashCards', ref: 'b1' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'EB03-042': [
    {
      timing: 'onKo',
      condition: { opponentsTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'p1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Revolutionary Army',
            costAtMost: 6,
            nameNot: 'Koala',
            orNameIs: 'Nico Robin',
          },
          min: 0,
          max: 1,
          prompt: 'Play from hand (skip to play from trash)',
        },
        { op: 'playCards', ref: 'p1' },
        { op: 'abortIfChosen', ref: 'p1' },
        {
          op: 'select',
          bind: 'p2',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Revolutionary Army',
            costAtMost: 6,
            nameNot: 'Koala',
            orNameIs: 'Nico Robin',
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'p2' },
      ],
    },
  ],
  'EB03-043': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'b1',
          filter: { owner: 'self', zone: 'trash', typeContains: 'CP' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'You may bottom-deck 2 from your trash',
        },
        { op: 'abortIfEmpty', ref: 'b1' },
        { op: 'trashToDeckBottom', ref: 'b1' },
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
  'EB03-045': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to your Leader or a Character',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 't' },
        { op: 'requireCond', cond: { minTrashSelf: 10 } },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 2,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Thriller Bark Pirates Character with a cost of 2 or less, rested',
        },
        { op: 'playCards', ref: 'p', rested: true },
      ],
    },
  ],
  'EB03-046': [
    {
      timing: 'onPlay',
      condition: { anyOf: [{ anyCharacterCostAtMost: 0 }, { anyCharacterCostAtLeast: 8 }] },
      ops: [{ op: 'draw', count: 1 }],
    },
    { timing: 'onKo', ops: [{ op: 'millSelf', count: 2 }] },
  ],
  'EB03-047': [
    { timing: 'onPlay', ops: [{ op: 'millSelf', count: 3 }] },
    { timing: 'onKo', ops: [{ op: 'draw', count: 1 }] },
  ],
  'EB03-048': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Dressrosa', cardType: 'Stage' },
          upTo: 1,
          to: 'hand',
        },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Stage',
            typeIncludes: 'Dressrosa',
            costIs: 1,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 cost-1 Dressrosa Stage',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB03-049': [
    {
      timing: 'main',
      condition: { leaderNameIs: 'Perona' },
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 7,
          exact: true,
          prompt: 'Rest 7 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'd' },
        { op: 'rest', ref: 'd' },
        {
          op: 'select',
          bind: 'p1',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 6,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Thriller Bark Pirates Character with a cost of 6 or less',
        },
        { op: 'playCards', ref: 'p1' },
        {
          op: 'select',
          bind: 'p2',
          filter: {
            owner: 'self',
            zone: 'trash',
            cardType: 'Character',
            typeIncludes: 'Thriller Bark Pirates',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Thriller Bark Pirates Character with a cost of 4 or less',
        },
        { op: 'playCards', ref: 'p2' },
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
  'EB03-050': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Sky Island' },
          min: 0,
          max: 1,
          prompt: 'Grant [Double Attack] this turn',
        },
        { op: 'grantKeyword', ref: 't', keyword: 'Double Attack', duration: 'turn' },
      ],
    },
  ],
  'EB03-051': [
    {
      timing: 'onPlay',
      condition: { hasFaceUpLife: true },
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'k' },
        { op: 'lifeFaceDown', count: 'all' },
      ],
    },
  ],
  'EB03-052': [
    {
      timing: 'activateMain',
      condition: { leaderNameIs: 'Shirahoshi' },
      ops: [
        { op: 'trashFromField', ref: 'self' },
        { op: 'deckTopToLife', count: 1 },
        {
          op: 'select',
          bind: 'all',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Neptunian' },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: '',
        },
        { op: 'powerMod', ref: 'all', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'EB03-053': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 0,
          max: 1,
          prompt: 'Give up to 1 rested DON!! to your Leader',
        },
        { op: 'giveRestedDon', upTo: 1, toRef: 'L' },
        { op: 'requireCond', cond: { minLifeOpp: 3 } },
        { op: 'lifeTopToHand', count: 1, who: 'opponent' },
      ],
    },
    {
      timing: 'onKo',
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Character with 6000 power or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB03-054': [
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
          prompt: 'Trash your top Life: add deck top to Life?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'trashLifeTop', owner: 'self', count: 1 },
        { op: 'deckTopToLife', count: 1 },
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
  'EB03-055': [
    {
      timing: 'onPlay',
      condition: { minLifeSelf: 1, leaderTypeIncludes: 'Straw Hat Crew' },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Trash your top Life: add 2 deck tops to Life?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'trashLifeTop', owner: 'self', count: 1 },
        { op: 'deckTopToLife', count: 2 },
      ],
    },
    {
      timing: 'onKo',
      condition: { opponentsTurn: true },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Deal 1 damage to your opponent?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'dealDamage', count: 1 },
      ],
    },
  ],
  'EB03-056': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 3 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with a base cost of 3 or less',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'EB03-057': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', typeIncludes: 'Land of Wano' },
          min: 0,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'giveRestedDon', upTo: 3, toRef: 'L' },
      ],
    },
    {
      timing: 'onKo',
      ops: [{ op: 'trashLifeTop', owner: 'opponent', count: 1 }],
    },
  ],
  'EB03-058': [
    {
      timing: 'onPlay',
      condition: { yourTurn: true, maxLifeSelf: 2 },
      ops: [{ op: 'draw', count: 1 }],
    },
    {
      timing: 'trigger',
      condition: { leaderNameIs: 'Vegapunk' },
      ops: [{ op: 'playSelf' }],
    },
  ],
  'EB03-059': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Egghead', minLifeSelf: 2 },
      ops: [
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', hasTrigger: true },
          min: 0,
          max: 1,
          prompt: 'Add up to 1 Character with a [Trigger] to the top of your Life, face-up',
        },
        { op: 'handToLife', ref: 'h', faceUp: true },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: {
            owner: 'opponent',
            zone: 'characters',
            costAtMost: 6,
            nameNot: 'Monkey.D.Luffy',
          },
          min: 0,
          max: 1,
          prompt: 'Cannot attack this turn',
        },
        { op: 'grantFlag', ref: 'c', flag: 'cannotAttack', duration: 'turn' },
      ],
    },
  ],
  'EB03-060': [
    {
      timing: 'main',
      condition: { leaderNameIs: 'Nami' },
      ops: [
        {
          op: 'searchTop',
          count: 4,
          filter: { costAtLeast: 2, costAtMost: 8 },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'EB03-061': [
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
        {
          op: 'select',
          bind: 'od',
          filter: { owner: 'opponent', zone: 'don', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest an opponent DON!! (skip to rest a Character)',
        },
        { op: 'rest', ref: 'od' },
        { op: 'abortIfChosen', ref: 'od' },
        {
          op: 'select',
          bind: 'oc',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4, rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest a Character with a cost of 4 or less',
        },
        { op: 'rest', ref: 'oc' },
      ],
    },
    {
      timing: 'endOfTurn',
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest 1 DON!!: set a FILM Character active?',
        },
        { op: 'abortIfEmpty', ref: 'd' },
        { op: 'rest', ref: 'd' },
        {
          op: 'select',
          bind: 'f',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'FILM', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set up to 1 FILM Character active',
        },
        { op: 'setActive', ref: 'f' },
      ],
    },
  ],
  'EB03-062': [
    {
      timing: 'activateMain',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 1,
          max: 1,
          prompt: 'Trash 1 card from your hand',
        },
        { op: 'trashCards', ref: 'pay' },
        { op: 'trashFromField', ref: 'self' },
        { op: 'deckTopToLife', count: 1 },
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Trafalgar Law', costAtMost: 7 },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 [Trafalgar Law] with a cost of 7 or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const EB03_STATICS: Record<string, StaticDef[]> = {
  'EB03-004': [
    {
      target: { scope: 'self' },
      condition: {
        opponentsTurn: true,
        leaderMulticolor: true,
        maxSelfCharsPoweredAtLeast: { power: 6000, count: 0 },
      },
      power: 4000,
    },
  ],
  'EB03-018': [
    {
      target: { scope: 'self' },
      condition: { opponentsTurn: true },
      keyword: 'Blocker',
      flag: 'noOppEffectKo',
    },
  ],
  'EB03-041': [
    {
      target: { scope: 'myCharacters', typeIncludes: 'SWORD', costAtMost: 6 },
      condition: { opponentsTurn: true },
      power: 2000,
    },
  ],
  'EB03-042': [
    {
      target: { scope: 'self' },
      condition: { leaderTypeIncludes: 'Revolutionary Army' },
      costMod: 4,
    },
  ],
  'EB03-044': [
    { target: { scope: 'self' }, condition: { leaderMulticolor: true }, keyword: 'Blocker' },
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_EB03: string[] = ['EB03-019']

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_EB03: Record<string, string> = {
  'EB03-004':
    "SIMPLIFIED: 'no Characters with 6000 base power or more' reads EFFECTIVE power (the DON!! bonus is 0 on the opponent's turn, so this almost always coincides).",
  'EB03-014':
    "SIMPLIFIED: 'your attribute Leader' (API-mangled text) is read as your Slash-attribute Leader (Kuina).",
  'EB03-031':
    'SIMPLIFIED: the trash-Event activation runs the [Main] def while the card stays in the trash.',
  'EB03-044':
    'SIMPLIFIED: the [On Play] search targets [Onigashima Island], which does not exist in the API card pool - the search can never hit, so only the Blocker aura is modeled.',
  'EB03-049':
    'SIMPLIFIED: the two revival slots play from the TRASH only (printed allows hand or trash).',
  'EB03-054':
    'SIMPLIFIED: the Life self-trash cost is offered as a confirm gate; it always trashes the TOP Life card.',
  'EB03-055': 'SIMPLIFIED: same Life-top gate as EB03-054.',
}
