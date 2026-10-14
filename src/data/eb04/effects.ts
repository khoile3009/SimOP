import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * EB04 (Premium Booster - The Best Vol.2) effect definitions as DSL data,
 * keyed by card ID. Compiled entries were drafted by scripts/compile-effects.ts
 * and reviewed; the rest are authored against the printed text. Deviations are
 * in COVERAGE_NOTES_EB04.
 */
export const EB04_EFFECTS: Record<string, EffectDef[]> = {
  'EB04-001': [
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
        { op: 'requireCond', cond: { minLifeSelf: 2 } },
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'leader', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Add your top Life to hand?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'lifeTopToHand', count: 1 },
      ],
    },
  ],
  'EB04-002': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 4,
          filter: { typeIncludesAny: ['Egghead', 'Straw Hat Crew'], nameNot: 'Jewelry Bonney' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'EB04-004': [
    {
      timing: 'whenAttacking',
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
        { op: 'setPower', ref: 'L', value: 7000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
  ],
  'EB04-006': [
    {
      timing: 'onPlay',
      ops: [
        { op: 'searchTop', count: 7, filter: { nameIs: 'Lulucia Kingdom' }, upTo: 1, to: 'hand' },
      ],
    },
  ],
  'EB04-007': [
    {
      timing: 'onPlay',
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
        { op: 'powerMod', ref: 'L', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { oppCharPowerAtLeast: 8000 },
      ops: [{ op: 'grantFlag', ref: 'self', flag: 'rushCharactersOnly', duration: 'turn' }],
    },
  ],
  'EB04-008': [
    {
      timing: 'main',
      condition: { maxLifeSelf: 2 },
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
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'L', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'EB04-009': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'self', zone: 'characters', nameIs: 'Silvers Rayleigh' },
          min: 0,
          max: 1,
          prompt: 'Give 1 active DON!! to [Silvers Rayleigh] to activate?',
        },
        { op: 'abortIfEmpty', ref: 'r' },
        { op: 'giveRestedDon', upTo: 1, fromActive: true, toRef: 'r' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'c', amount: -2000, duration: 'turn' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b',
          filter: {
            owner: 'self',
            zone: 'leaderOrCharacters',
            cardType: 'Character',
            orNameIs: 'Silvers Rayleigh',
          },
          min: 0,
          max: 1,
          prompt: '+2000 power this battle',
        },
        { op: 'powerMod', ref: 'b', amount: 2000, duration: 'battle' },
      ],
    },
  ],
  'EB04-010': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Set power to 0 this turn',
        },
        { op: 'setPower', ref: 'c', value: 0, duration: 'turn' },
      ],
    },
  ],
  'EB04-011': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'n',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Neptunian' },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: '',
        },
        { op: 'drawPerRef', countRef: 'n' },
        {
          op: 'selectPerRef',
          bind: 't',
          filter: { owner: 'self', zone: 'hand' },
          countRef: 'n',
          prompt: 'Trash 1 per Neptunian drawn',
        },
        { op: 'trashCards', ref: 't' },
      ],
    },
  ],
  'EB04-012': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { selfPlayedThisTurn: true },
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
        { op: 'setActive', ref: 'L' },
      ],
    },
  ],
  'EB04-013': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Minks' },
      ops: [
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Minks', rested: true },
          min: 0,
          max: 2,
          prompt: 'Set up to 2 Minks Characters active',
        },
        { op: 'setActive', ref: 'c' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'setActive', ref: 'L' },
      ],
    },
  ],
  'EB04-014': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
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
        { op: 'giveRestedDon', upTo: 1, toRef: 'L' },
      ],
    },
  ],
  'EB04-015': [
    {
      timing: 'onKo',
      condition: { anyOf: [{ leaderTypeIncludes: 'Fish-Man' }, { leaderTypeIncludes: 'Merfolk' }] },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'anyOwn', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest 1 of your cards: play a green Character?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            colorIncludes: 'Green',
            costAtMost: 6,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 green Character with a cost of 6 or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB04-016': [
    {
      timing: 'activateMain',
      ops: [
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
    {
      timing: 'whenAttacking',
      condition: { minSelfCharsTypedAny: { types: ['Neptunian'], count: 3 } },
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 8, rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest up to 1 Character with a cost of 8 or less',
        },
        { op: 'rest', ref: 'r' },
      ],
    },
  ],
  'EB04-017': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Minks' },
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Minks',
            costAtMost: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Minks Character with a cost of 5 or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB04-018': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Rest Megalo: K.O. a rested 8000-or-less Character?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'rest', ref: 'g' },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', rested: true, powerAtMost: 8000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'EB04-019': [
    {
      timing: 'main',
      condition: { leaderTypeIncludes: 'Minks' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'anyOwn', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest 1 of your cards to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -3 cost',
        },
        { op: 'costMod', ref: 'c', amount: -3, duration: 'turn' },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Minks' },
          min: 0,
          max: 1,
          prompt: '+3000 power this battle',
        },
        { op: 'powerMod', ref: 'b', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'EB04-020': [
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Fish-Man' },
          min: 0,
          max: 1,
          prompt: '+3000 power this battle',
        },
        { op: 'powerMod', ref: 'b', amount: 3000, duration: 'battle' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Fish-Man', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set up to 1 Fish-Man Character active',
        },
        { op: 'setActive', ref: 'c' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', rested: false, costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Rest',
        },
        { op: 'rest', ref: 'r' },
      ],
    },
  ],
  'EB04-021': [
    {
      timing: 'onPlay',
      condition: { leaderNameIs: 'Nefeltari Vivi' },
      ops: [
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
          prompt: 'Trash 1 card from your hand',
        },
        { op: 'trashCards', ref: 'pay' },
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
  'EB04-022': [
    {
      timing: 'onPlay',
      condition: { minHandOpp: 6 },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Trash 2 to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'oh',
          filter: { owner: 'opponent', zone: 'hand' },
          chooser: 'opponent',
          min: 2,
          max: 2,
          prompt: 'Place 2 cards from your hand at the bottom of your deck',
        },
        { op: 'bottomDeck', ref: 'oh' },
      ],
    },
    {
      timing: 'whenAttacking',
      donRequired: 1,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Trash 1: give -2000 power?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give -2000 power',
        },
        { op: 'powerMod', ref: 'c', amount: -2000, duration: 'turn' },
      ],
    },
  ],
  'EB04-023': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader', rested: false },
          min: 0,
          max: 1,
          prompt: 'Pay: your active Leader gets -5000 power. Draw 2?',
        },
        { op: 'abortIfEmpty', ref: 'L' },
        { op: 'powerMod', ref: 'L', amount: -5000, duration: 'turn' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'EB04-024': [
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
          prompt: 'Trash 1 card from your hand',
        },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'self', zone: 'characters', typeIncludes: 'Alabasta' },
          min: 0,
          max: 1,
          prompt: 'Grant [Unblockable] this turn',
        },
        { op: 'grantKeyword', ref: 't', keyword: 'Unblockable', duration: 'turn' },
      ],
    },
  ],
  'EB04-025': [
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
            typeIncludes: 'Alabasta',
            costAtMost: 8,
            nameNot: 'Nefeltari Vivi',
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 other Alabasta Character with a cost of 8 or less',
        },
        { op: 'playCards', ref: 'p' },
        {
          op: 'select',
          bind: 'oh',
          filter: { owner: 'opponent', zone: 'hand' },
          chooser: 'opponent',
          min: 1,
          max: 1,
          prompt: 'Place 1 card from your hand at the bottom of your deck',
        },
        { op: 'bottomDeck', ref: 'oh' },
      ],
    },
  ],
  'EB04-026': [
    {
      timing: 'onPlay',
      ops: [
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
    {
      timing: 'whenAttacking',
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
  'EB04-027': [
    {
      timing: 'onPlay',
      ops: [
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
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            powerAtMost: 5000,
            hasTrigger: true,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Character with 5000 power or less and a [Trigger]',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB04-028': [
    {
      timing: 'main',
      condition: { leaderTypeIncludes: 'Navy' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Trash 1 to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters', powerAtMost: 10000 },
          min: 0,
          max: 2,
          prompt:
            "Up to 2 Characters cannot attack until the end of your opponent's next End Phase",
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
  ],
  'EB04-029': [
    {
      timing: 'main',
      condition: { leaderNameIs: 'Sanji' },
      ops: [
        {
          op: 'searchTop',
          count: 3,
          filter: { cardType: 'Event', orNameIs: 'Sanji' },
          upTo: 1,
          to: 'hand',
          restTo: 'trash',
        },
      ],
    },
    {
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Trash 1: +4000 power?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Sanji' },
          min: 0,
          max: 1,
          prompt: '+4000 power this battle',
        },
        { op: 'powerMod', ref: 'b', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'EB04-030': [
    {
      timing: 'replaceKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!! to save Kaido?',
        },
        { op: 'returnDon', ref: 'pay' },
        { op: 'abortIfChosen', ref: 'pay' },
        { op: 'koSelfNoReplace' },
      ],
    },
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Animal Kingdom Pirates' },
      ops: [
        {
          op: 'select',
          bind: 'p2',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Return 2 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'p2' },
        { op: 'returnDon', ref: 'p2' },
        { op: 'grantKeyword', ref: 'self', keyword: 'Rush', duration: 'turn' },
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 7, rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest up to 1 Character with a cost of 7 or less',
        },
        { op: 'rest', ref: 'r' },
      ],
    },
  ],
  'EB04-031': [
    {
      timing: 'replaceKo',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 1,
          exact: true,
          prompt: 'Return 1 DON!! to save King?',
        },
        { op: 'returnDon', ref: 'pay' },
        { op: 'abortIfChosen', ref: 'pay' },
        { op: 'koSelfNoReplace' },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      condition: { leaderTypeIncludes: 'Animal Kingdom Pirates', lacksOtherCharacterNamed: 'King' },
      ops: [
        { op: 'addDon', count: 1, rested: false },
        { op: 'addDon', count: 1, rested: true },
      ],
    },
  ],
  'EB04-032': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', typeIncludes: 'Animal Kingdom Pirates' },
          min: 0,
          max: 1,
          prompt: 'Trash 1 Animal Kingdom Pirates card: draw 2?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'draw', count: 2 },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      cost: { restDon: 2 },
      condition: { leaderTypeIncludes: 'Animal Kingdom Pirates' },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'EB04-033': [
    {
      timing: 'onPlay',
      condition: { minSelfCharsTypedAny: { types: ['Foxy Pirates'], count: 3 } },
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
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with 6000 base power or less',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'EB04-034': [
    {
      timing: 'onEvent',
      on: { kind: 'attackDeclared', who: 'opponent' },
      oncePerTurn: true,
      condition: { minTrashEventsSelf: 4 },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Trash 1: +2000 power this battle?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+2000 power this battle',
        },
        { op: 'powerMod', ref: 'b', amount: 2000, duration: 'battle' },
      ],
    },
  ],
  'EB04-035': [
    {
      timing: 'onEvent',
      on: { kind: 'donReturned', who: 'self', byOwnEffect: true },
      oncePerTurn: true,
      condition: { yourTurn: true, leaderTypeIncludes: 'Kid Pirates' },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'EB04-036': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Foxy Pirates' },
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
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 9, rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest up to 1 Character with a cost of 9 or less',
        },
        { op: 'rest', ref: 'r' },
      ],
    },
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'EB04-037': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Foxy Pirates' },
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Foxy Pirates' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'EB04-038': [
    {
      timing: 'onPlay',
      condition: { oppAtLeastSelfDon: true },
      ops: [
        { op: 'draw', count: 1 },
        { op: 'addDon', count: 1, rested: false },
      ],
    },
  ],
  'EB04-039': [
    { timing: 'onPlay', ops: [{ op: 'addDon', count: 1, rested: false }] },
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Kid Pirates',
            costAtMost: 5,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Kid Pirates Character with a cost of 5 or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB04-040': [
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
          prompt: 'Rest 6 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'rest', ref: 'pay' },
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'leaderOrCharacters', nameIs: 'Kaido' },
          min: 0,
          max: 1,
          prompt: '+3000 power this turn',
        },
        { op: 'powerMod', ref: 'b', amount: 3000, duration: 'turn' },
        {
          op: 'select',
          bind: 'r',
          filter: { owner: 'opponent', zone: 'characters', rested: false },
          min: 0,
          max: 1,
          prompt: 'Rest up to 1 Character',
        },
        { op: 'rest', ref: 'r' },
      ],
    },
    {
      timing: 'counter',
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
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+4000 power',
        },
        { op: 'powerMod', ref: 'L', amount: 4000, duration: 'battle' },
      ],
    },
  ],
  'EB04-041': [
    {
      timing: 'main',
      condition: { leaderNameIs: 'Sanji', minDonField: 4 },
      ops: [
        {
          op: 'select',
          bind: 'p1',
          filter: { owner: 'self', zone: 'hand', nameIs: 'Sanji', powerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'Play [Sanji] from hand (skip to play from trash)',
        },
        { op: 'playCards', ref: 'p1' },
        { op: 'abortIfChosen', ref: 'p1' },
        {
          op: 'select',
          bind: 'p2',
          filter: { owner: 'self', zone: 'trash', nameIs: 'Sanji', powerAtMost: 6000 },
          min: 0,
          max: 1,
          prompt: 'Play [Sanji] from trash',
        },
        { op: 'playCards', ref: 'p2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
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
  'EB04-042': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Trash your top 3: give +1 cost?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'millSelf', count: 3 },
        {
          op: 'select',
          bind: 'c',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Give +1 cost this turn',
        },
        { op: 'costMod', ref: 'c', amount: 1, duration: 'turn' },
      ],
    },
  ],
  'EB04-043': [
    {
      timing: 'guardKo',
      oncePerTurn: true,
      replaceWhen: 'oppEffect',
      guard: { owner: 'self', zone: 'characters', colorIncludes: 'Black', baseCostAtMost: 5 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'guarded' },
          min: 0,
          max: 1,
          prompt: 'Save: bottom-deck 3 cards from your trash instead?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'target' },
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'trash' },
          min: 3,
          max: 3,
          prompt: 'Place 3 trash cards at the deck bottom',
        },
        { op: 'trashToDeckBottom', ref: 'pay' },
      ],
    },
    { timing: 'onPlay', ops: [{ op: 'millSelf', count: 2 }] },
  ],
  'EB04-044': [
    {
      timing: 'replaceKo',
      guardScope: 'removal',
      oncePerTurn: true,
      condition: { leaderTypeIncludes: 'Navy' },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Trash 1 card from your hand to save Koby?',
        },
        { op: 'guardResolve', choiceRef: 'pay', targetRef: 'self' },
        { op: 'trashCards', ref: 'pay' },
      ],
    },
    {
      timing: 'onEvent',
      on: { kind: 'characterKoed', who: 'opponent' },
      oncePerTurn: true,
      condition: { yourTurn: true },
      ops: [{ op: 'draw', count: 1 }],
    },
  ],
  'EB04-045': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { minCharsCostAtLeastAnywhere: { cost: 8, count: 2 } },
      ops: [
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Revolutionary Army' },
          min: 0,
          max: 1,
          prompt: '+1000 power this turn',
        },
        { op: 'powerMod', ref: 'b', amount: 1000, duration: 'turn' },
      ],
    },
  ],
  'EB04-047': [
    {
      timing: 'activateMain',
      ops: [
        { op: 'trashFromField', ref: 'self' },
        {
          op: 'select',
          bind: 'p1',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'SWORD',
            costAtMost: 3,
            nameNot: 'Helmeppo',
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
            typeIncludes: 'SWORD',
            costAtMost: 3,
            nameNot: 'Helmeppo',
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'p2' },
      ],
    },
  ],
  'EB04-048': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'characters' },
          min: 0,
          max: 1,
          prompt: 'Trash 1 of your Characters: draw 1?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashFromField', ref: 'pay' },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'EB04-049': [
    {
      timing: 'main',
      ops: [
        { op: 'millSelf', count: 2 },
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with a base cost of 5 or less',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'EB04-050': [
    {
      timing: 'main',
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
      timing: 'counter',
      ops: [
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          prompt: '+3000 power',
        },
        { op: 'powerMod', ref: 'L', amount: 3000, duration: 'battle' },
      ],
    },
  ],
  'EB04-051': [
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'all',
          filter: { owner: 'opponent', zone: 'characters' },
          min: 0,
          max: 5,
          selectAll: true,
          prompt: '',
        },
        { op: 'powerMod', ref: 'all', amount: -3000, duration: 'turn' },
        { op: 'requireCond', cond: { maxLifeSelf: 0 } },
        { op: 'playSelf' },
      ],
    },
  ],
  'EB04-052': [
    {
      timing: 'whenAttacking',
      ops: [{ op: 'basePowerToOppLeader', duration: 'turn' }],
    },
    {
      timing: 'onKo',
      condition: { maxLifeSelf: 2 },
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            colorIncludes: 'Yellow',
            powerAtMost: 6000,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 yellow Character with 6000 power or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'EB04-053': [
    { timing: 'onBlock', condition: { maxLifeSelf: 2 }, ops: [{ op: 'draw', count: 1 }] },
  ],
  'EB04-054': [
    {
      timing: 'onPlay',
      condition: { maxLifeSelf: 2 },
      ops: [{ op: 'deckTopToLife', count: 1 }],
    },
    {
      timing: 'onKo',
      ops: [{ op: 'lifeTopToHand', count: 1, who: 'opponent' }],
    },
  ],
  'EB04-055': [
    {
      timing: 'onKo',
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Revolutionary Army',
            costAtMost: 4,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Revolutionary Army Character with a cost of 4 or less',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
    {
      timing: 'trigger',
      condition: { leaderTypeIncludes: 'Revolutionary Army', maxTotalLife: 5 },
      ops: [{ op: 'playSelf' }],
    },
  ],
  'EB04-058': [
    {
      timing: 'onPlay',
      condition: { maxLifeSelf: 2 },
      ops: [{ op: 'deckTopToLife', count: 1 }],
    },
  ],
  'EB04-059': [
    {
      timing: 'main',
      condition: { charDisadvantageAtLeast: 1 },
      ops: [
        { op: 'lifeFaceUp', count: 1 },
        {
          op: 'select',
          bind: 'k1',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with a cost of 6 or less',
        },
        { op: 'ko', ref: 'k1' },
        {
          op: 'select',
          bind: 'k2',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with a cost of 5 or less',
        },
        { op: 'ko', ref: 'k2' },
      ],
    },
    {
      timing: 'trigger',
      ops: [
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
  'EB04-060': [
    {
      timing: 'main',
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 0,
          max: 1,
          prompt: 'Add the top or bottom Life card to hand to activate?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'lifeToHand', ref: 'g' },
        {
          op: 'select',
          bind: 'h',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', typeIncludes: 'Egghead' },
          min: 0,
          max: 1,
          prompt: 'Add up to 1 Egghead Character to the top of your Life, face-up',
        },
        { op: 'handToLife', ref: 'h', faceUp: true },
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
    {
      timing: 'trigger',
      ops: [
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
  'EB04-061': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand' },
          min: 0,
          max: 1,
          prompt: 'Trash 1 to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 'L',
          filter: { owner: 'self', zone: 'leader' },
          min: 1,
          max: 1,
          selectAll: true,
          prompt: '',
        },
        { op: 'powerMod', ref: 'L', amount: 2000, duration: 'untilTurn', untilTurnOffset: 1 },
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
}

/** Continuous effects (auras), applied at read time. */
export const EB04_STATICS: Record<string, StaticDef[]> = {
  'EB04-001': [
    {
      target: { scope: 'self' },
      condition: { opponentsTurn: true, maxLifeSelf: 1 },
      power: 2000,
    },
  ],
  // Smoker & Tashigi: the Navy Leader's base becomes 7000 on the opponent's turn
  'EB04-003': [
    {
      target: { scope: 'myLeader', typeIncludes: 'Navy' },
      condition: { opponentsTurn: true },
      basePowerSet: 7000,
    },
  ],
  'EB04-005': [
    {
      target: { scope: 'self' },
      condition: { maxOppCharsBasePowerAtLeast: { power: 5000, count: 1 } },
      flag: 'cannotAttack',
    },
  ],
  'EB04-010': [
    {
      target: { scope: 'myCharacters', costIs: 1 },
      condition: { opponentsTurn: true },
      power: 5000,
    },
  ],
  'EB04-017': [
    {
      target: { scope: 'oppCharacters' },
      condition: { yourTurn: true, minSelfCharsTypedAny: { types: ['Minks'], count: 3 } },
      costMod: -1,
    },
  ],
  'EB04-046': [
    {
      target: { scope: 'myCharacters', typeIncludes: 'Navy' },
      condition: { opponentsTurn: true },
      costMod: 2,
    },
  ],
  'EB04-048': [
    {
      target: { scope: 'self' },
      condition: { leaderTypeContains: 'CP' },
      powerPer: { trashPerN: 5, amount: 1000 },
    },
    {
      target: { scope: 'self' },
      condition: { leaderTypeContains: 'CP' },
      costModPer: { trashPerN: 5, amount: -2 },
    },
  ],
  'EB04-051': [
    {
      target: { scope: 'self' },
      condition: { noCharBasePowerAtLeastAnywhere: 12000 },
      flag: 'cannotAttack',
    },
  ],
  'EB04-056': [
    {
      target: { scope: 'self' },
      condition: {
        anyOf: [{ hasCharacterNamed: 'Jewelry Bonney' }, { leaderNameIs: 'Jewelry Bonney' }],
        maxLifeSelf: 0,
      },
      keyword: 'Blocker',
    },
  ],
  'EB04-057': [
    { target: { scope: 'self' }, donRequired: 1, keyword: 'Blocker' },
    {
      target: { scope: 'myCharacters', colorIncludes: 'Yellow', typeIncludes: 'Scientist' },
      condition: { maxLifeSelf: 2 },
      flag: 'noOppEffectRemove',
    },
  ],
  'EB04-061': [{ target: { scope: 'handSelf' }, condition: { maxLifeSelf: 1 }, costMod: -1 }],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_EB04: string[] = []

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_EB04: Record<string, string> = {
  'EB04-009':
    "SIMPLIFIED: the counter's '[Silvers Rayleigh]' arm uses the name-override select (a non-Character Rayleigh Leader is selectable; cost bounds unchanged).",
  'EB04-016':
    'SIMPLIFIED: the "cannot set DON!! active with Character effects this turn" rider is not modeled.',
  'EB04-030':
    'SIMPLIFIED: the DON!!-X return pays from the cost area or attached DON (class picker).',
  'EB04-043': 'SIMPLIFIED: a save with fewer than 3 cards in the trash bottom-decks what is there.',
  'EB04-044':
    "SIMPLIFIED: 'removed from the field' uses the engine's removal window (effect removals and K.O.s).",
  'EB04-049':
    'SIMPLIFIED: the optional deck-top trash is mandatory (playing the Event is the opt-in).',
  'EB04-059':
    'SIMPLIFIED: the Life face-up flip is the activation gate; with no face-down Life the Event whiffs.',
}
