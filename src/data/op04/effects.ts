import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP04 effect definitions as DSL data, keyed by card ID: compiler-drafted
 * entries merged with hand-authored ones (authored wins per card).
 */
export const OP04_EFFECTS: Record<string, EffectDef[]> = {
  'OP04-001': [
    { timing: 'activateMain', oncePerTurn: true, cost: { restDon: 2 }, ops: [
      { op: 'draw', count: 1 },
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters' }, min: 0, max: 1, prompt: 'Up to 1 of your Characters gains [Rush] this turn' },
      { op: 'grantKeyword', ref: 't', keyword: 'Rush', duration: 'turn' },
    ] },
  ],
  'OP04-002': [
    { timing: 'activateMain', cost: { restSelf: true }, condition: { leaderActive: true }, ops: [
      { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader', rested: false }, min: 1, max: 1, prompt: 'Give your active Leader -5000 power this turn' },
      { op: 'abortIfEmpty', ref: 'l' },
      { op: 'powerMod', ref: 'l', amount: -5000, duration: 'turn' },
      { op: 'searchTop', count: 5, filter: { typeIncludes: 'Alabasta' }, upTo: 1, to: 'hand' },
    ] },
  ],
  'OP04-003': [
    { timing: 'onKo', ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', basePowerAtMost: 5000 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with 5000 base power or less' },
      { op: 'ko', ref: 't' },
    ] },
  ],
  'OP04-004': [
    { timing: 'activateMain', cost: { restSelf: true }, ops: [
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', typeIncludes: 'Alabasta' }, min: 0, max: 1, prompt: 'Give 1 rested DON!! to an {Alabasta} Character' },
      { op: 'giveRestedDon', upTo: 1, toRef: 't' },
    ] },
  ],
  'OP04-006': [
    { timing: 'whenAttacking', ops: [
      { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader', rested: false }, min: 0, max: 1, prompt: 'You may give your active Leader -5000 power this turn' },
      { op: 'abortIfEmpty', ref: 'l' },
      { op: 'powerMod', ref: 'l', amount: -5000, duration: 'turn' },
      { op: 'powerMod', ref: 'self', amount: 2000, duration: 'untilYourNextTurn' },
    ] },
  ],
  'OP04-008': [
    {timing: "whenAttacking", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -3000 power"}, {op: "powerMod", ref: "b1", amount: -3000, duration: "turn"}, {op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters", powerAtMost: 0}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b2"}], donRequired: 1, condition: {leaderNameIs: "Nefeltari Vivi"}},
  ],
  'OP04-009': [
    { timing: 'whenAttacking', ops: [
      { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader', rested: false }, min: 0, max: 1, prompt: 'You may give your active Leader -5000 power this turn' },
      { op: 'abortIfEmpty', ref: 'l' },
      { op: 'powerMod', ref: 'l', amount: -5000, duration: 'turn' },
      { op: 'grantFlag', ref: 'self', flag: 'bounceAtTurnEnd', duration: 'turn' },
    ] },
  ],
  'OP04-010': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", cardType: "Character", typeIncludes: "Animal", powerAtMost: 3000}, min: 0, max: 1, prompt: "Play from hand"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP04-011': [
    { timing: 'whenAttacking', ops: [
      { op: 'revealTopCheck', filter: { cardType: 'Character', powerAtLeast: 6000 }, amount: 3000, duration: 'turn' },
    ] },
  ],
  'OP04-013': [
    {timing: "whenAttacking", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", powerAtMost: 4000}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}], donRequired: 1},
  ],
  'OP04-015': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -2000 power"}, {op: "powerMod", ref: "b1", amount: -2000, duration: "turn"}]},
  ],
  'OP04-016': [
    {timing: "counter", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 0, max: 1, prompt: "You may trash 1"}, {op: "abortIfEmpty", ref: "b1"}, {op: "trashCards", ref: "b1"}, {op: "select", bind: "b2", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b2", amount: 3000, duration: "battle"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b3", filter: {owner: "opponent", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "Give -3000 power"}, {op: "powerMod", ref: "b3", amount: -3000, duration: "turn"}]},
  ],
  'OP04-017': [
    { timing: 'counter', ops: [
      { op: 'select', bind: 'a', filter: { owner: 'opponent', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: 'Give up to 1 Leader or Character -2000 power this turn' },
      { op: 'powerMod', ref: 'a', amount: -2000, duration: 'turn' },
      { op: 'requireCond', cond: { leaderActive: true } },
      { op: 'select', bind: 'b', filter: { owner: 'opponent', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: 'Give up to 1 Leader or Character -1000 power this turn' },
      { op: 'powerMod', ref: 'b', amount: -1000, duration: 'turn' },
    ] },
  ],
  'OP04-018': [
    {timing: "main", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 2, prompt: "Give -2000 power"}, {op: "powerMod", ref: "b1", amount: -2000, duration: "turn"}], condition: {leaderTypeIncludes: "Alabasta"}},
    {timing: "trigger", ops: [{op: "activateTiming", timing: "main"}]},
  ],
  'OP04-019': [
    {timing: "endOfTurn", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 2, prompt: "Set DON!! active"}, {op: "setActive", ref: "b1"}]},
  ],
  'OP04-020': [
    { timing: 'endOfTurn', ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 1, exact: true, prompt: 'You may rest 1 DON!!' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'rest', ref: 'pay' },
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', rested: true, costAtMost: 5 }, min: 0, max: 1, prompt: 'Set up to 1 Character with cost 5 or less as active' },
      { op: 'setActive', ref: 't' },
    ] },
  ],
  'OP04-021': [
    { timing: 'onEvent', on: { kind: 'attacked', who: 'self' }, ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 2, exact: true, prompt: 'You may rest 2 DON!!' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'rest', ref: 'pay' },
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'don', rested: false }, min: 0, max: 1, prompt: "Rest up to 1 of your opponent's DON!!" },
      { op: 'rest', ref: 't' },
    ] },
  ],
  'OP04-022': [
    {timing: "activateMain", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 1}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b1"}], cost: {restSelf: true}},
  ],
  'OP04-024': [
    { timing: 'onEvent', on: { kind: 'characterPlayed', who: 'opponent' }, oncePerTurn: true, condition: { opponentsTurn: true, leaderTypeIncludes: 'Donquixote Pirates' }, ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: false }, min: 0, max: 1, prompt: "Rest up to 1 of your opponent's Characters" },
      { op: 'rest', ref: 't' },
      { op: 'rest', ref: 'self' },
    ] },
    { timing: 'onPlay', ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 4 or less' },
      { op: 'rest', ref: 't' },
    ] },
  ],
  'OP04-025': [
    { timing: 'onEvent', on: { kind: 'attacked', who: 'self' }, ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 2, exact: true, prompt: 'You may rest 2 DON!!' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'rest', ref: 'pay' },
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 4 or less' },
      { op: 'rest', ref: 't' },
    ] },
  ],
  'OP04-026': [
    {timing: "whenAttacking", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 1, exact: true, prompt: "You may rest 1 DON!!"}, {op: "abortIfEmpty", ref: "b1"}, {op: "rest", ref: "b1"}, {op: "requireCond", cond: {leaderTypeIncludes: "Donquixote Pirates"}}, {op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 4}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b2"}, {op: "select", bind: "b3", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 1, prompt: "Set DON!! active"}, {op: "setActive", ref: "b3"}]},
  ],
  'OP04-027': [
    {timing: "endOfTurn", ops: [{op: "setActive", ref: "self"}], donRequired: 1},
  ],
  'OP04-028': [
    { timing: 'endOfTurn', donRequired: 1, condition: { minActiveDonSelf: 2 }, ops: [{ op: 'setActive', ref: 'self' }] },
  ],
  'OP04-029': [
    {timing: "endOfTurn", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 1, prompt: "Set DON!! active"}, {op: "setActive", ref: "b1"}]},
  ],
  'OP04-030': [
    { timing: 'onPlay', ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 5 }, min: 0, max: 1, prompt: 'K.O. up to 1 rested Character with cost 5 or less' },
      { op: 'ko', ref: 't' },
    ] },
    { timing: 'onEvent', on: { kind: 'attacked', who: 'self' }, ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: 2, exact: true, prompt: 'You may rest 2 DON!!' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'rest', ref: 'pay' },
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4, rested: false }, min: 0, max: 1, prompt: 'Rest up to 1 Character with cost 4 or less' },
      { op: 'rest', ref: 't' },
    ] },
  ],
  'OP04-031': [
    { timing: 'onPlay', ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'leaderOrCharacters', rested: true }, min: 0, max: 3, prompt: 'Up to 3 rested cards will not refresh next turn' },
      { op: 'grantFlag', ref: 't', flag: 'noRefresh', duration: 'untilTurn', untilTurnOffset: 1 },
    ] },
  ],
  'OP04-032': [
    { timing: 'endOfTurn', ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'characters', nameIs: 'Baby 5' }, min: 0, max: 1, prompt: 'You may trash Baby 5: set up to 2 DON!! active' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'trashFromField', ref: 'pay' },
      { op: 'select', bind: 'd', filter: { owner: 'self', zone: 'don', rested: true }, min: 0, max: 2, prompt: 'Set up to 2 DON!! as active' },
      { op: 'setActive', ref: 'd' },
    ] },
  ],
  'OP04-033': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 5}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b1"}, {op: "select", bind: "b2", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 1, prompt: "Set DON!! active"}, {op: "setActive", ref: "b2"}], condition: {leaderTypeIncludes: "Donquixote Pirates"}},
  ],
  'OP04-034': [
    { timing: 'endOfTurn', condition: { minActiveDonSelf: 3 }, ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', rested: true, costAtMost: 3 }, min: 0, max: 1, prompt: 'K.O. up to 1 rested Character with cost 3 or less' },
      { op: 'ko', ref: 't' },
    ] },
  ],
  'OP04-035': [
    { timing: 'counter', ops: [
      { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+4000 power during this battle' },
      { op: 'powerMod', ref: 'b', amount: 4000, duration: 'battle' },
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', rested: true }, min: 0, max: 1, prompt: 'Set up to 1 of your Characters as active' },
      { op: 'setActive', ref: 't' },
    ] },
    { timing: 'trigger', ops: [
      { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader' }, min: 0, max: 1, prompt: 'Up to 1 of your Leader gains +2000 this turn' },
      { op: 'powerMod', ref: 'l', amount: 2000, duration: 'turn' },
    ] },
  ],
  'OP04-036': [
    { timing: 'counter', ops: [{ op: 'searchTop', count: 5, filter: { typeIncludes: 'Donquixote Pirates' }, upTo: 1, to: 'hand' }] },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'counter' }] },
  ],
  'OP04-037': [
    {timing: "counter", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+2000 power"}, {op: "powerMod", ref: "b1", amount: 2000, duration: "turn"}], condition: {leaderTypeIncludes: "Donquixote Pirates"}},
    {timing: "trigger", ops: [{op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters", costAtMost: 4, rested: true}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b2"}]},
  ],
  'OP04-038': [
    {timing: "main", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "leaderOrCharacters", rested: false}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b1"}, {op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters", costAtMost: 6, rested: true}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b2"}]},
    {timing: "counter", ops: [{op: "select", bind: "b3", filter: {owner: "opponent", zone: "leaderOrCharacters", rested: false}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b3"}, {op: "select", bind: "b4", filter: {owner: "opponent", zone: "characters", costAtMost: 6, rested: true}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b4"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b5", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 5, prompt: "Set DON!! active"}, {op: "setActive", ref: "b5"}]},
  ],
  'OP04-039': [
    { timing: 'activateMain', oncePerTurn: true, cost: { restDon: 1 }, condition: { maxHandSelf: 6 }, ops: [
      { op: 'searchTop', count: 2, filter: { typeIncludes: 'Dressrosa' }, upTo: 1, to: 'hand', restTo: 'trash' },
    ] },
  ],
  'OP04-040': [
    { timing: 'whenAttacking', donRequired: 1, condition: { maxLifePlusHandSelf: 4, minSelfCharCost: 8 }, ops: [{ op: 'deckTopToLife', count: 1 }] },
    { timing: 'whenAttacking', donRequired: 1, condition: { maxLifePlusHandSelf: 4, lacksSelfCharCost: 8 }, ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP04-041': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 0, max: 2, exact: true, prompt: "You may trash 2"}, {op: "abortIfEmpty", ref: "b1"}, {op: "trashCards", ref: "b1"}, {op: "searchTop", count: 5, filter: {typeIncludes: "East Blue"}, upTo: 1, to: "hand"}]},
  ],
  'OP04-042': [
    { timing: 'onPlay', ops: [
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', attributeIs: 'Slash' }, min: 0, max: 1, prompt: 'Up to 1 of your <Slash> Characters gains +3000 this turn' },
      { op: 'powerMod', ref: 't', amount: 3000, duration: 'turn' },
      { op: 'millSelf', count: 1 },
    ] },
  ],
  'OP04-043': [
    { timing: 'whenAttacking', donRequired: 1, ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 2 or less to the owner's hand" },
      { op: 'returnToHand', ref: 't' },
    ] },
  ],
  'OP04-044': [
    { timing: 'onPlay', ops: [
      { op: 'select', bind: 'a', filter: { owner: 'opponent', zone: 'characters', costAtMost: 8 }, min: 0, max: 1, prompt: 'Return up to 1 Character with cost 8 or less' },
      { op: 'returnToHand', ref: 'a' },
      { op: 'select', bind: 'b', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: 'Return up to 1 Character with cost 3 or less' },
      { op: 'returnToHand', ref: 'b' },
    ] },
  ],
  'OP04-045': [
    {timing: "onPlay", ops: [{op: "draw", count: 1}]},
  ],
  'OP04-046': [
    { timing: 'onPlay', condition: { leaderTypeIncludes: 'Animal Kingdom Pirates' }, ops: [
      { op: 'searchTop', count: 7, filter: { nameIsAny: ['Plague Rounds', 'Ice Oni'] }, upTo: 2, to: 'hand' },
    ] },
  ],
  'OP04-048': [
    { timing: 'onPlay', ops: [{ op: 'shuffleHandIntoDeckDraw' }] },
  ],
  'OP04-049': [
    {timing: "onKo", ops: [{op: "draw", count: 1}]},
  ],
  'OP04-050': [
    { timing: 'activateMain', cost: { restSelf: true }, condition: { minHandSelf: 1 }, ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Trash 1 card from your hand' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'trashCards', ref: 'pay' },
      { op: 'draw', count: 1 },
    ] },
  ],
  'OP04-051': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 5, filter: {nameNot: "Who's.Who", typeIncludes: "Animal Kingdom Pirates"}, upTo: 1, to: "hand"}]},
  ],
  'OP04-052': [
    {timing: "activateMain", ops: [{op: "draw", count: 1}], cost: {restDon: 2, restSelf: true}},
    {timing: "trigger", ops: [{op: "playSelf"}]},
  ],
  'OP04-053': [
    { timing: 'onEvent', on: { kind: 'eventActivated', who: 'self' }, donRequired: 1, oncePerTurn: true, ops: [
      { op: 'draw', count: 1 },
      { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Place 1 card at the bottom of your deck' },
      { op: 'bottomDeck', ref: 'b' },
    ] },
  ],
  'OP04-055': [
    { timing: 'main', ops: [
      { op: 'select', bind: 'p1', filter: { owner: 'self', zone: 'hand', nameIs: 'Ice Oni' }, min: 0, max: 1, prompt: 'You may trash 1 [Ice Oni] from your hand' },
      { op: 'abortIfEmpty', ref: 'p1' },
      { op: 'trashCards', ref: 'p1' },
      { op: 'select', bind: 'p2', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 1, max: 1, prompt: "Place 1 Character with cost 4 or less at the bottom of the owner's deck" },
      { op: 'abortIfEmpty', ref: 'p2' },
      { op: 'bottomDeckFromField', ref: 'p2' },
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'trash', nameIs: 'Ice Oni' }, min: 0, max: 1, prompt: 'Play 1 [Ice Oni] from your trash' },
      { op: 'playCards', ref: 't' },
    ] },
    { timing: 'trigger', ops: [{ op: 'activateTiming', timing: 'main' }] },
  ],
  'OP04-056': [
    {timing: "main", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Bottom-deck"}, {op: "bottomDeckFromField", ref: "b1"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters", costAtMost: 4}, min: 0, max: 1, prompt: "Bottom-deck"}, {op: "bottomDeckFromField", ref: "b2"}]},
  ],
  'OP04-057': [
    { timing: 'counter', ops: [
      { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+4000 power during this battle' },
      { op: 'powerMod', ref: 'b', amount: 4000, duration: 'battle' },
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 }, min: 0, max: 1, prompt: "Place up to 1 Character with cost 1 or less at the bottom of the owner's deck" },
      { op: 'bottomDeckFromField', ref: 't' },
    ] },
    { timing: 'trigger', ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 6 or less to the owner's hand" },
      { op: 'returnToHand', ref: 't' },
    ] },
  ],
  'OP04-058': [
    { timing: 'onEvent', on: { kind: 'donReturned', who: 'self' }, oncePerTurn: true, condition: { opponentsTurn: true }, ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'OP04-059': [
    { timing: 'onEvent', on: { kind: 'attacked', who: 'self' }, ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'returnDon', ref: 'pay' },
      { op: 'requireCond', cond: { leaderTypeIncludes: 'Water Seven' } },
      { op: 'grantKeyword', ref: 'self', keyword: 'Blocker', duration: 'turn' },
    ] },
  ],
  'OP04-060': [
    { timing: 'onPlay', ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 2, exact: true, prompt: 'You may return 2 DON!! to your DON!! deck' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'returnDon', ref: 'pay' },
      { op: 'requireCond', cond: { leaderTypeIncludes: 'Baroque Works' } },
      { op: 'deckTopToLife', count: 1 },
    ] },
    { timing: 'onEvent', on: { kind: 'attacked', who: 'self' }, oncePerTurn: true, ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'returnDon', ref: 'pay' },
      { op: 'draw', count: 1 },
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Trash 1 card from your hand' },
      { op: 'trashCards', ref: 't' },
    ] },
  ],
  'OP04-061': [
    { timing: 'activateMain', ops: [
      { op: 'trashFromField', ref: 'self' },
      { op: 'requireCond', cond: { leaderTypeIncludes: 'Water Seven' } },
      { op: 'addDon', count: 1, rested: true },
    ] },
  ],
  'OP04-063': [
    { timing: 'onEvent', on: { kind: 'attacked', who: 'self' }, oncePerTurn: true, ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'returnDon', ref: 'pay' },
      { op: 'requireCond', cond: { leaderTypeIncludes: 'Water Seven' } },
      { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+1000 power during this battle' },
      { op: 'powerMod', ref: 'b', amount: 1000, duration: 'battle' },
    ] },
  ],
  'OP04-064': [
    {timing: "onPlay", ops: [{op: "addDon", count: 1, rested: true}, {op: "requireCond", cond: {minDonField: 6}}, {op: "draw", count: 1}]},
    {timing: "trigger", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don"}, min: 0, max: 2, exact: true, prompt: "You may return 2 DON!!"}, {op: "abortIfEmpty", ref: "b1"}, {op: "returnDon", ref: "b1"}, {op: "playSelf"}]},
  ],
  'OP04-065': [
    { timing: 'onPlay', condition: { leaderTypeIncludes: 'Baroque Works' }, ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 }, min: 0, max: 1, prompt: 'Up to 1 Character with cost 5 or less cannot attack until your next turn' },
      { op: 'grantFlag', ref: 't', flag: 'cannotAttack', duration: 'untilYourNextTurn' },
    ] },
    { timing: 'trigger', ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'returnDon', ref: 'pay' },
      { op: 'playSelf' },
    ] },
  ],
  'OP04-066': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 5, filter: {typeIncludes: "Baroque Works"}, upTo: 1, to: "hand"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don"}, min: 0, max: 1, exact: true, prompt: "You may return 1 DON!!"}, {op: "abortIfEmpty", ref: "b1"}, {op: "returnDon", ref: "b1"}, {op: "playSelf"}]},
  ],
  'OP04-067': [
    {timing: "trigger", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don"}, min: 0, max: 1, exact: true, prompt: "You may return 1 DON!!"}, {op: "abortIfEmpty", ref: "b1"}, {op: "returnDon", ref: "b1"}, {op: "playSelf"}]},
  ],
  'OP04-068': [
    { timing: 'onEvent', on: { kind: 'attacked', who: 'self' }, ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'returnDon', ref: 'pay' },
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 }, min: 0, max: 1, prompt: "Return up to 1 Character with cost 2 or less to the owner's hand" },
      { op: 'returnToHand', ref: 't' },
    ] },
  ],
  'OP04-069': [
    { timing: 'onEvent', on: { kind: 'attacked', who: 'self' }, ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'returnDon', ref: 'pay' },
      { op: 'basePowerToAttacker', duration: 'turn' },
    ] },
    { timing: 'trigger', ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'returnDon', ref: 'pay' },
      { op: 'playSelf' },
    ] },
  ],
  'OP04-070': [
    { timing: 'onEvent', on: { kind: 'attacked', who: 'self' }, oncePerTurn: true, ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'returnDon', ref: 'pay' },
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -1000 power this turn' },
      { op: 'powerMod', ref: 't', amount: -1000, duration: 'turn' },
    ] },
  ],
  'OP04-071': [
    { timing: 'onEvent', on: { kind: 'attacked', who: 'self' }, ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 1, exact: true, prompt: 'You may return 1 DON!! to your DON!! deck' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'returnDon', ref: 'pay' },
      { op: 'grantKeyword', ref: 'self', keyword: 'Blocker', duration: 'battle' },
      { op: 'powerMod', ref: 'self', amount: 1000, duration: 'battle' },
    ] },
  ],
  'OP04-072': [
    { timing: 'onEvent', on: { kind: 'attacked', who: 'self' }, oncePerTurn: true, ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'don' }, min: 0, max: 2, exact: true, prompt: 'You may return 2 DON!! to your DON!! deck' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'returnDon', ref: 'pay' },
      { op: 'rest', ref: 'self' },
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 4 or less' },
      { op: 'ko', ref: 't' },
    ] },
  ],
  'OP04-073': [
    { timing: 'activateMain', ops: [
      { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'characters', typeContains: 'Baroque Works', excludeSelf: true }, min: 1, max: 1, prompt: 'Trash 1 of your {Baroque Works} Characters' },
      { op: 'abortIfEmpty', ref: 'p' },
      { op: 'trashFromField', ref: 'p' },
      { op: 'trashFromField', ref: 'self' },
      { op: 'addDon', count: 1, rested: false },
    ] },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP04-074': [
    {timing: "counter", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don"}, min: 0, max: 1, exact: true, prompt: "You may return 1 DON!!"}, {op: "abortIfEmpty", ref: "b1"}, {op: "returnDon", ref: "b1"}, {op: "select", bind: "b2", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+1000 power"}, {op: "powerMod", ref: "b2", amount: 1000, duration: "battle"}, {op: "select", bind: "b3", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 4}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b3"}]},
    {timing: "trigger", ops: [{op: "addDon", count: 1, rested: false}]},
  ],
  'OP04-075': [
    { timing: 'counter', ops: [
      { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+6000 power during this battle' },
      { op: 'powerMod', ref: 'b', amount: 6000, duration: 'battle' },
      { op: 'requireCond', cond: { maxLifeSelf: 2 } },
      { op: 'addDon', count: 1, rested: true },
    ] },
    { timing: 'trigger', ops: [{ op: 'addDon', count: 1, rested: false }] },
  ],
  'OP04-076': [
    {timing: "counter", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don"}, min: 0, max: 1, exact: true, prompt: "You may return 1 DON!!"}, {op: "abortIfEmpty", ref: "b1"}, {op: "returnDon", ref: "b1"}, {op: "select", bind: "b2", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+1000 power"}, {op: "powerMod", ref: "b2", amount: 1000, duration: "turn"}]},
    {timing: "trigger", ops: [{op: "addDon", count: 1, rested: false}]},
  ],
  'OP04-079': [
    { timing: 'activateMain', oncePerTurn: true, ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -4 cost this turn' },
      { op: 'costMod', ref: 't', amount: -4, duration: 'turn' },
      { op: 'millSelf', count: 2 },
      { op: 'select', bind: 'k', filter: { owner: 'self', zone: 'characters', typeIncludes: 'Dressrosa' }, min: 1, max: 1, prompt: 'K.O. 1 of your {Dressrosa} Characters' },
      { op: 'ko', ref: 'k' },
    ] },
  ],
  'OP04-080': [
    { timing: 'onPlay', ops: [
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', typeIncludes: 'Dressrosa' }, min: 0, max: 1, prompt: 'Up to 1 {Dressrosa} Character can attack active Characters this turn' },
      { op: 'grantFlag', ref: 't', flag: 'canAttackActive', duration: 'turn' },
    ] },
  ],
  'OP04-081': [
    { timing: 'whenAttacking', ops: [
      { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader', rested: false }, min: 0, max: 1, prompt: 'You may rest your Leader' },
      { op: 'abortIfEmpty', ref: 'l' },
      { op: 'rest', ref: 'l' },
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 1 or less' },
      { op: 'ko', ref: 't' },
      { op: 'millSelf', count: 2 },
    ] },
  ],
  'OP04-082': [
    { timing: 'replaceKo', ops: [
      { op: 'select', bind: 'm1', filter: { owner: 'self', zone: 'leader', rested: false }, min: 0, max: 1, prompt: 'Rest your Leader instead of the K.O.?' },
      { op: 'rest', ref: 'm1' },
      { op: 'abortIfChosen', ref: 'm1' },
      { op: 'select', bind: 'm2', filter: { owner: 'self', zone: 'stage', nameIs: 'Corrida Coliseum', rested: false }, min: 0, max: 1, prompt: 'Rest a Corrida Coliseum instead of the K.O.?' },
      { op: 'rest', ref: 'm2' },
      { op: 'abortIfChosen', ref: 'm2' },
      { op: 'koSelfNoReplace' },
    ] },
    { timing: 'onPlay', condition: { leaderNameIs: 'Rebecca' }, ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 1 or less' },
      { op: 'ko', ref: 't' },
      { op: 'millSelf', count: 1 },
    ] },
  ],
  'OP04-083': [
    { timing: 'onPlay', ops: [
      { op: 'grantFlagAll', flag: 'noEffectKo', duration: 'untilYourNextTurn' },
      { op: 'draw', count: 2 },
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand' }, min: 2, max: 2, prompt: 'Trash 2 cards from your hand' },
      { op: 'trashCards', ref: 't' },
    ] },
  ],
  'OP04-084': [
    { timing: 'onPlay', ops: [
      { op: 'searchTop', count: 3, filter: { cardType: 'Character', typeContains: 'CP', nameNot: 'Stussy', costAtMost: 2 }, upTo: 1, to: 'play', restTo: 'trash' },
    ] },
  ],
  'OP04-085': [
    { timing: 'onPlay', condition: { leaderTypeIncludes: 'Dressrosa' }, ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -2 cost this turn' },
      { op: 'costMod', ref: 't', amount: -2, duration: 'turn' },
      { op: 'millSelf', count: 1 },
    ] },
    { timing: 'whenAttacking', condition: { leaderTypeIncludes: 'Dressrosa' }, ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -2 cost this turn' },
      { op: 'costMod', ref: 't', amount: -2, duration: 'turn' },
      { op: 'millSelf', count: 1 },
    ] },
  ],
  'OP04-086': [
    { timing: 'afterBattleKo', donRequired: 1, ops: [
      { op: 'draw', count: 2 },
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand' }, min: 2, max: 2, prompt: 'Trash 2 cards from your hand' },
      { op: 'trashCards', ref: 't' },
    ] },
  ],
  'OP04-088': [
    { timing: 'activateMain', condition: { leaderActive: true }, ops: [
      { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader', rested: false }, min: 1, max: 1, prompt: 'Rest your Leader' },
      { op: 'abortIfEmpty', ref: 'l' },
      { op: 'rest', ref: 'l' },
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters' }, min: 0, max: 1, prompt: 'Give up to 1 Character -4 cost this turn' },
      { op: 'costMod', ref: 't', amount: -4, duration: 'turn' },
    ] },
  ],
  'OP04-090': [
    { timing: 'activateMain', oncePerTurn: true, ops: [
      { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'trash' }, min: 0, max: 7, exact: true, prompt: 'You may return 7 cards from your trash to the deck bottom' },
      { op: 'abortIfEmpty', ref: 'p' },
      { op: 'trashToDeckBottom', ref: 'p' },
      { op: 'setActive', ref: 'self' },
      { op: 'grantFlag', ref: 'self', flag: 'noRefresh', duration: 'untilTurn', untilTurnOffset: 2 },
    ] },
  ],
  'OP04-091': [
    { timing: 'onPlay', ops: [
      { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader', rested: false }, min: 0, max: 1, prompt: 'You may rest your Leader' },
      { op: 'abortIfEmpty', ref: 'l' },
      { op: 'rest', ref: 'l' },
      { op: 'requireCond', cond: { leaderTypeIncludes: 'Dressrosa' } },
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 1 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 1 or less' },
      { op: 'ko', ref: 't' },
      { op: 'millSelf', count: 2 },
    ] },
  ],
  'OP04-092': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 3, filter: {nameNot: "Rebecca", typeIncludes: "Dressrosa"}, upTo: 1, to: "hand", restTo: "trash"}]},
  ],
  'OP04-093': [
    { timing: 'main', ops: [
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', typeIncludes: 'Dressrosa' }, min: 0, max: 1, prompt: 'Up to 1 {Dressrosa} Character gains +6000 this turn' },
      { op: 'powerMod', ref: 't', amount: 6000, duration: 'turn' },
      { op: 'requireCond', cond: { minTrashSelf: 15 } },
      { op: 'grantKeyword', ref: 't', keyword: 'Double Attack', duration: 'turn' },
    ] },
    { timing: 'trigger', ops: [
      { op: 'draw', count: 3 },
      { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand' }, min: 2, max: 2, prompt: 'Trash 2 cards from your hand' },
      { op: 'trashCards', ref: 'p' },
    ] },
  ],
  'OP04-094': [
    { timing: 'main', condition: { minTrashSelf: 15 }, ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 6 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 6 or less' },
      { op: 'ko', ref: 't' },
    ] },
    { timing: 'main', condition: { maxTrashSelf: 14 }, ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 4 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 4 or less' },
      { op: 'ko', ref: 't' },
    ] },
    { timing: 'trigger', ops: [
      { op: 'select', bind: 'l', filter: { owner: 'self', zone: 'leader', rested: false }, min: 0, max: 1, prompt: 'You may rest your Leader' },
      { op: 'abortIfEmpty', ref: 'l' },
      { op: 'rest', ref: 'l' },
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 5 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 5 or less' },
      { op: 'ko', ref: 't' },
    ] },
  ],
  'OP04-095': [
    { timing: 'counter', ops: [
      { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+2000 power during this battle' },
      { op: 'powerMod', ref: 'b', amount: 2000, duration: 'battle' },
      { op: 'requireCond', cond: { minTrashSelf: 15 } },
      { op: 'powerMod', ref: 'b', amount: 2000, duration: 'battle' },
    ] },
    { timing: 'trigger', ops: [
      { op: 'draw', count: 2 },
      { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Trash 1 card from your hand' },
      { op: 'trashCards', ref: 'p' },
    ] },
  ],
  'OP04-097': [
    { timing: 'onPlay', ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', typeIncludesAny: ['Animal', 'SMILE'], costAtMost: 3 }, min: 0, max: 1, prompt: "Add up to 1 {Animal}/{SMILE} Character to the top of your opponent's Life" },
      { op: 'fieldToLife', ref: 't' },
    ] },
  ],
  'OP04-098': [
    { timing: 'onPlay', ops: [
      { op: 'select', bind: 'pay', filter: { owner: 'self', zone: 'hand', typeIncludes: 'Land of Wano' }, min: 0, max: 2, exact: true, prompt: 'You may trash 2 {Land of Wano} cards from your hand' },
      { op: 'abortIfEmpty', ref: 'pay' },
      { op: 'trashCards', ref: 'pay' },
      { op: 'requireCond', cond: { maxLifeSelf: 1 } },
      { op: 'deckTopToLife', count: 1 },
    ] },
  ],
  'OP04-099': [
    { timing: 'trigger', condition: { maxLifeSelf: 1 }, ops: [{ op: 'playSelf' }] },
  ],
  'OP04-100': [
    { timing: 'trigger', ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: 'Up to 1 Leader or Character cannot attack this turn' },
      { op: 'grantFlag', ref: 't', flag: 'cannotAttack', duration: 'turn' },
    ] },
  ],
  'OP04-101': [
    {timing: "onPlay", ops: [{op: "draw", count: 1}], condition: {yourTurn: true}},
    {timing: "trigger", ops: [{op: "playSelf"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 2}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
  ],
  'OP04-102': [
    { timing: 'activateMain', oncePerTurn: true, cost: { restDon: 1 }, condition: { minLifeSelf: 1 }, ops: [
      { op: 'lifeTopToHand', count: 1 },
      { op: 'setActive', ref: 'self' },
    ] },
  ],
  'OP04-103': [
    { timing: 'onPlay', ops: [
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Land of Wano' }, min: 0, max: 1, prompt: 'Up to 1 {Land of Wano} card gains +1000 this turn' },
      { op: 'powerMod', ref: 't', amount: 1000, duration: 'turn' },
    ] },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP04-104': [
    {timing: "trigger", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 0, max: 1, prompt: "You may trash 1"}, {op: "abortIfEmpty", ref: "b1"}, {op: "trashCards", ref: "b1"}, {op: "playSelf"}]},
  ],
  'OP04-105': [
    {timing: "activateMain", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", hasTrigger: true}, min: 0, max: 1, prompt: "You may trash 1"}, {op: "abortIfEmpty", ref: "b1"}, {op: "trashCards", ref: "b1"}, {op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 2}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b2"}], oncePerTurn: true},
  ],
  'OP04-106': [
    {timing: "trigger", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 0, max: 1, prompt: "You may trash 1"}, {op: "abortIfEmpty", ref: "b1"}, {op: "trashCards", ref: "b1"}, {op: "playSelf"}]},
  ],
  'OP04-108': [
    {timing: "trigger", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 0, max: 1, prompt: "You may trash 1"}, {op: "abortIfEmpty", ref: "b1"}, {op: "trashCards", ref: "b1"}, {op: "playSelf"}]},
  ],
  'OP04-109': [
    { timing: 'activateMain', ops: [
      { op: 'trashFromField', ref: 'self' },
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'leaderOrCharacters', typeIncludes: 'Land of Wano' }, min: 0, max: 1, prompt: 'Up to 1 {Land of Wano} card gains +3000 this turn' },
      { op: 'powerMod', ref: 't', amount: 3000, duration: 'turn' },
    ] },
  ],
  'OP04-110': [
    { timing: 'onKo', ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: "Add up to 1 Character with cost 3 or less to the top of your opponent's Life" },
      { op: 'fieldToLife', ref: 't' },
    ] },
  ],
  'OP04-111': [
    { timing: 'activateMain', cost: { restSelf: true }, ops: [
      { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'characters', typeIncludes: 'Homies', excludeSelf: true }, min: 1, max: 1, prompt: 'Trash 1 of your other {Homies} Characters' },
      { op: 'abortIfEmpty', ref: 'p' },
      { op: 'trashFromField', ref: 'p' },
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', nameIs: 'Charlotte Linlin', rested: true }, min: 0, max: 1, prompt: 'Set up to 1 [Charlotte Linlin] as active' },
      { op: 'setActive', ref: 't' },
    ] },
    { timing: 'trigger', ops: [{ op: 'playSelf' }] },
  ],
  'OP04-112': [
    { timing: 'onPlay', ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMostTotalLife: true }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost at most the total life count' },
      { op: 'ko', ref: 't' },
      { op: 'requireCond', cond: { maxLifeSelf: 1 } },
      { op: 'deckTopToLife', count: 1 },
    ] },
  ],
  'OP04-113': [
    {timing: "trigger", ops: [{op: "playSelf"}]},
  ],
  'OP04-115': [
    { timing: 'main', condition: { minLifeSelf: 1 }, ops: [
      { op: 'lifeTopToHand', count: 1 },
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'characters', typeIncludes: 'Land of Wano' }, min: 0, max: 1, prompt: 'Up to 1 {Land of Wano} Character gains [Double Attack] this turn' },
      { op: 'grantKeyword', ref: 't', keyword: 'Double Attack', duration: 'turn' },
    ] },
    { timing: 'trigger', ops: [
      { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+1000 power this turn' },
      { op: 'powerMod', ref: 'b', amount: 1000, duration: 'turn' },
    ] },
  ],
  'OP04-116': [
    { timing: 'counter', ops: [
      { op: 'select', bind: 'b', filter: { owner: 'self', zone: 'leaderOrCharacters' }, min: 0, max: 1, prompt: '+6000 power during this battle' },
      { op: 'powerMod', ref: 'b', amount: 6000, duration: 'battle' },
      { op: 'requireCond', cond: { maxTotalLife: 4 } },
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 2 }, min: 0, max: 1, prompt: 'K.O. up to 1 Character with cost 2 or less' },
      { op: 'ko', ref: 't' },
    ] },
    { timing: 'trigger', ops: [{ op: 'draw', count: 1 }] },
  ],
  'OP04-117': [
    { timing: 'main', ops: [
      { op: 'select', bind: 't', filter: { owner: 'opponent', zone: 'characters', costAtMost: 3 }, min: 0, max: 1, prompt: "Add up to 1 Character with cost 3 or less to the top of your opponent's Life" },
      { op: 'fieldToLife', ref: 't' },
    ] },
    { timing: 'trigger', condition: { minLifeSelf: 1 }, ops: [
      { op: 'lifeTopToHand', count: 1 },
      { op: 'select', bind: 't', filter: { owner: 'self', zone: 'hand' }, min: 1, max: 1, prompt: 'Add 1 card from your hand to the top of your Life' },
      { op: 'handToLife', ref: 't' },
    ] },
  ],
  'OP04-119': [
    { timing: 'onPlay', cost: { restSelf: true }, ops: [
      { op: 'select', bind: 'p', filter: { owner: 'self', zone: 'hand', cardType: 'Character', colorIncludes: 'Green', costIs: 5 }, min: 0, max: 1, prompt: 'Play up to 1 green cost-5 Character from your hand' },
      { op: 'playCards', ref: 'p' },
    ] },
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP04_STATICS: Record<string, StaticDef[]> = {
  'OP04-001': [{ target: { scope: 'self' }, flag: 'cannotAttack' }],
  'OP04-005': [{ condition: { hasOtherCharacterNamed: 'Kung Fu Jugon' }, target: { scope: 'self' }, keyword: 'Blocker' }],
  'OP04-012': [{ condition: { yourTurn: true }, target: { scope: 'myCharactersOther', typeIncludes: 'Alabasta' }, power: 1000 }],
  'OP04-020': [{ donRequired: 1, condition: { yourTurn: true }, target: { scope: 'oppCharacters' }, costMod: -1 }],
  'OP04-039': [{ target: { scope: 'self' }, flag: 'cannotAttack' }],
  'OP04-047': [{ condition: { yourTurn: true }, target: { scope: 'self' }, flag: 'bottomDecksBattledFoe', flagValue: 5 }],
  'OP04-081': [{ donRequired: 1, target: { scope: 'self' }, flag: 'canAttackActive' }],
  'OP04-090': [{ target: { scope: 'self' }, flag: 'canAttackActive' }],
  'OP04-096': [{ condition: { leaderTypeIncludes: 'Dressrosa' }, target: { scope: 'myCharacters', typeIncludes: 'Dressrosa' }, flag: 'rushCharactersOnly' }],
  'OP04-106': [
    {target: {scope: "self"}, donRequired: 1, condition: {lessLifeThanOpp: true}, power: 1000},
  ],
  'OP04-108': [
    {target: {scope: "self"}, donRequired: 1, keyword: "Banish"},
  ],
  'OP04-118': [{ target: { scope: 'myCharactersOther', colorIncludes: 'Red', costAtLeast: 3 }, keyword: 'Rush' }],
  'OP04-119': [{ condition: { opponentsTurn: true, selfRested: true }, target: { scope: 'myCharacters', costIs: 5, activeOnly: true }, flag: 'noEffectKo' }],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP04: string[] = ["OP04-014", "OP04-077", "OP04-089"]

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP04: Record<string, string> = {
  'OP04-004': 'SIMPLIFIED: gives a rested DON!! to ONE chosen {Alabasta} Character, not to each',
  'OP04-040': 'SIMPLIFIED: with a cost-8 Character the life-add is auto-chosen over the draw',
  'OP04-043': 'SIMPLIFIED: bounce goes to the hand only (\'or the bottom of their deck\' not offered) and targets the opponent side only',
  'OP04-044': 'SIMPLIFIED: bounces target the opponent side only (rules allow either)',
  'OP04-055': 'SIMPLIFIED: the bottom-deck cost targets the opponent side only (rules allow either)',
  'OP04-056': 'SIMPLIFIED: bottom-deck targets the opponent side only (rules allow either)',
  'OP04-057': 'SIMPLIFIED: counter bottom-deck and trigger bounce target the opponent side only',
  'OP04-058': 'SIMPLIFIED: fires on any DON!! leaving your field (the engine does not track WHOSE effect caused it)',
  'OP04-060': 'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP04-064': 'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP04-065': 'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP04-066': 'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP04-067': 'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP04-069': 'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP04-073': 'SIMPLIFIED: trigger plays this card without the DON cost printed on similar cards (none printed here)',
  'OP04-074': 'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP04-076': 'SIMPLIFIED: DON!!-X pays from the cost area only (attached DON need the class picker)',
  'OP04-090': 'SIMPLIFIED: the trash-to-deck-bottom cost returns cards in selection order, not \'any order\'',
  'OP04-094': 'SIMPLIFIED: at 15+ trash only the cost-6-or-less mode is offered (the lesser mode is strictly worse)',
  'OP04-097': 'SIMPLIFIED: always to the TOP of the life stack; face-up not modeled',
  'OP04-102': 'SIMPLIFIED: the life-to-hand cost takes the top card (\'top or bottom\' not offered)',
  'OP04-110': 'SIMPLIFIED: always to the TOP of the life stack; face-up not modeled',
  'OP04-115': 'SIMPLIFIED: the life-to-hand cost takes the top card (\'top or bottom\' not offered)',
  'OP04-117': 'SIMPLIFIED: always to the TOP of the life stack (\'top or bottom\' not offered); face-up not modeled; trigger life-to-hand takes the top',
}
