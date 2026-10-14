import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * PRB02 (Premium Booster - The Best Vol.2 promos) effect definitions as DSL
 * data, keyed by card ID. Deviations are in COVERAGE_NOTES_PRB02.
 */
export const PRB02_EFFECTS: Record<string, EffectDef[]> = {
  'PRB02-001': [
    {
      timing: 'whenAttacking',
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 3000 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with 3000 base power or less',
        },
        { op: 'ko', ref: 'k' },
        { op: 'requireCond', cond: { maxHandSelf: 6 } },
        { op: 'draw', count: 1 },
      ],
    },
  ],
  'PRB02-002': [
    {
      timing: 'replaceKo',
      guardScope: 'removal',
      replaceWhen: 'oppEffect',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Save: this Character gets -2000 power instead?',
        },
        { op: 'guardResolve', choiceRef: 'g', targetRef: 'self' },
        { op: 'powerMod', ref: 'self', amount: -2000, duration: 'turn' },
      ],
    },
    {
      timing: 'whenAttacking',
      ops: [
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
  'PRB02-003': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', cardType: 'Character', powerAtLeast: 6000 },
          min: 0,
          max: 1,
          prompt: 'Trash 1 Character with 6000 power or more: draw 2?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'trashCards', ref: 'pay' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'PRB02-004': [
    {
      timing: 'onEvent',
      on: { kind: 'attackDeclared', who: 'opponent' },
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'self', zone: 'don', rested: true },
          min: 0,
          max: 1,
          prompt: 'Set up to 1 DON!! active',
        },
        { op: 'setActive', ref: 'd' },
      ],
    },
  ],
  'PRB02-005': [
    {
      timing: 'onPlay',
      condition: { yourTurn: true, leaderMulticolor: true, maxDonFieldOpp: 7 },
      ops: [
        {
          op: 'select',
          bind: 'd',
          filter: { owner: 'opponent', zone: 'don', rested: false },
          chooser: 'opponent',
          min: 1,
          max: 1,
          prompt: 'Rest 1 of your active DON!!',
        },
        { op: 'rest', ref: 'd' },
      ],
    },
  ],
  'PRB02-007': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'The Seven Warlords of the Sea', nameNot: 'Jinbe' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
  ],
  'PRB02-008': [{ timing: 'onKo', ops: [{ op: 'draw', count: 2 }] }],
  'PRB02-009': [
    {
      timing: 'onEvent',
      on: { kind: 'restedByEffect', who: 'opponent' },
      condition: { selfRested: true },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'characters', fromRef: 'self' },
          min: 0,
          max: 1,
          prompt: 'Trash Galdino: draw 2?',
        },
        { op: 'abortIfEmpty', ref: 'g' },
        { op: 'trashFromField', ref: 'self' },
        { op: 'draw', count: 2 },
      ],
    },
  ],
  'PRB02-010': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Big Mom Pirates', minDonFieldOpp: 6 },
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'don', includeAttached: true },
          min: 0,
          max: 2,
          exact: true,
          prompt: 'Return 2 DON!! to activate?',
        },
        { op: 'abortIfEmpty', ref: 'pay' },
        { op: 'returnDon', ref: 'pay' },
        { op: 'draw', count: 2 },
        {
          op: 'select',
          bind: 'p',
          filter: {
            owner: 'self',
            zone: 'hand',
            cardType: 'Character',
            typeIncludes: 'Big Mom Pirates',
            powerAtLeast: 6000,
            powerAtMost: 8000,
          },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Big Mom Pirates Character with 6000-8000 power',
        },
        { op: 'playCards', ref: 'p' },
      ],
    },
  ],
  'PRB02-011': [
    {
      timing: 'onPlay',
      condition: { leaderMulticolor: true },
      ops: [{ op: 'addDon', count: 1, rested: true }],
    },
  ],
  'PRB02-012': [
    {
      timing: 'onPlay',
      ops: [
        {
          op: 'searchTop',
          count: 5,
          filter: { typeIncludes: 'Straw Hat Crew', nameNot: 'Nami' },
          upTo: 1,
          to: 'hand',
        },
      ],
    },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'PRB02-013': [
    {
      timing: 'onPlay',
      condition: { leaderTypeIncludes: 'Thriller Bark Pirates' },
      ops: [
        {
          op: 'select',
          bind: 'p',
          filter: { owner: 'self', zone: 'trash', cardType: 'Character', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'Play up to 1 Character with a cost of 4 or less from your trash, rested',
        },
        { op: 'playCards', ref: 'p', rested: true },
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
  'PRB02-015': [
    {
      timing: 'onKo',
      condition: { leaderTypeIncludes: 'Blackbeard Pirates' },
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', baseCostAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1 Character with a base cost of 4 or less',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'PRB02-016': [
    {
      timing: 'activateMain',
      cost: { restSelf: true },
      condition: { minLifeSelf: 1 },
      ops: [
        {
          op: 'select',
          bind: 'g',
          filter: { owner: 'self', zone: 'life', lifeEnds: true },
          min: 1,
          max: 1,
          prompt: 'Add the top or bottom Life card to hand',
        },
        { op: 'lifeToHand', ref: 'g' },
        {
          op: 'select',
          bind: 'b',
          filter: { owner: 'self', zone: 'leaderOrCharacters' },
          min: 0,
          max: 1,
          prompt: '+3000 power this turn',
        },
        { op: 'powerMod', ref: 'b', amount: 3000, duration: 'turn' },
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
  'PRB02-017': [
    {
      timing: 'activateMain',
      oncePerTurn: true,
      ops: [
        {
          op: 'select',
          bind: 'pay',
          filter: { owner: 'self', zone: 'hand', hasTrigger: true },
          min: 1,
          max: 1,
          prompt: 'Trash 1 card with a [Trigger]',
        },
        { op: 'trashCards', ref: 'pay' },
        {
          op: 'select',
          bind: 't',
          filter: { owner: 'opponent', zone: 'leaderOrCharacters', nameNot: 'Monkey.D.Luffy' },
          min: 0,
          max: 1,
          prompt: "Cannot attack until the end of your opponent's next End Phase",
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
    {
      timing: 'trigger',
      ops: [
        {
          op: 'select',
          bind: 'k',
          filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 },
          min: 0,
          max: 1,
          prompt: 'K.O. up to 1',
        },
        { op: 'ko', ref: 'k' },
      ],
    },
  ],
  'PRB02-018': [
    {
      timing: 'onPlay',
      condition: { hasFaceUpLife: true },
      ops: [
        {
          op: 'select',
          bind: 'p1',
          filter: {
            owner: 'self',
            zone: 'hand',
            costIs: 2,
            nameIsAny: ['Sabo', 'Portgas.D.Ace', 'Monkey.D.Luffy'],
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
            costIs: 2,
            nameIsAny: ['Sabo', 'Portgas.D.Ace', 'Monkey.D.Luffy'],
          },
          min: 0,
          max: 1,
          prompt: 'Play from trash',
        },
        { op: 'playCards', ref: 'p2' },
      ],
    },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const PRB02_STATICS: Record<string, StaticDef[]> = {
  'PRB02-001': [
    {
      target: { scope: 'self' },
      condition: { opponentsTurn: true, leaderTypeIncludes: 'Navy' },
      power: 1000,
    },
  ],
  // Zoro: the rest-redirect replacement is approximated as rest-immunity
  'PRB02-006': [{ target: { scope: 'self' }, condition: { opponentsTurn: true }, flag: 'noRest' }],
  'PRB02-014': [{ target: { scope: 'handSelf' }, condition: { minTrashSelf: 15 }, costMod: -3 }],
  'PRB02-015': [
    {
      target: { scope: 'self' },
      condition: { leaderTypeIncludes: 'Blackbeard Pirates' },
      keyword: 'Blocker',
      costMod: 4,
    },
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_PRB02: string[] = []

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_PRB02: Record<string, string> = {
  'PRB02-005':
    "SIMPLIFIED: the opponent rests the DON!! immediately instead of 'at the start of their next Main Phase'.",
  'PRB02-006':
    'SIMPLIFIED: the rest-redirect replacement ("rest another Character instead") is modeled as rest-immunity on the opponent\'s turn.',
  'PRB02-009':
    "SIMPLIFIED: the listener fires on any of the opponent's effect rests while this Character is rested (the event does not name the rested card).",
  'PRB02-017':
    'SIMPLIFIED: the attack-lock may also target an ACTIVE opponent Leader (printed restricts the Leader arm to a rested Leader).',
}
