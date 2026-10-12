import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP13 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts; the rest are authored against the
 * printed text (API-dropped minus signs restored on opponent debuffs).
 * Deviations are documented in COVERAGE_NOTES_OP13.
 */
export const OP13_EFFECTS: Record<string, EffectDef[]> = {
  'OP13-001': [
    {timing: "onEvent", on: {kind: "attacked", who: "self"}, donRequired: 1, condition: {maxActiveDonSelf: 5}, ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 10, prompt: "Rest any number of DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters", typeIncludes: "Straw Hat Crew"}, min: 1, max: 1, prompt: "+2000 power per DON!! rested"}, {op: "powerModPerRef", ref: "b1", countRef: "pay", amountPer: 2000, duration: "battle"}]},
  ],
  'OP13-002': [
    {timing: "onEvent", on: {kind: "attacked", who: "self"}, oncePerTurn: true, ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "hand"}, min: 0, max: 1, prompt: "Trash 1?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "trashCards", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "Give -2000 power"}, {op: "powerMod", ref: "b1", amount: -2000, duration: "battle"}]},
    {timing: "onEvent", on: {kind: "lifeRemoved", who: "self"}, donRequired: 1, oncePerTurn: true, ops: [{op: "draw", count: 1}]},
    {timing: "onEvent", on: {kind: "characterKoed", who: "self"}, donRequired: 1, oncePerTurn: true, ops: [{op: "draw", count: 1}]},
  ],
  'OP13-005': [
    {timing: "onPlay", ops: [{op: "select", bind: "L", filter: {owner: "self", zone: "leader"}, min: 0, max: 1, prompt: "Give DON!! to Leader"}, {op: "giveRestedDon", upTo: 1, toRef: "L"}]},
  ],
  'OP13-006': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters", nameIs: "Monkey.D.Luffy"}, min: 0, max: 1, prompt: "Give DON!! to"}, {op: "giveRestedDon", upTo: 2, toRef: "b1"}]},
  ],
  'OP13-007': [
    {timing: "activateMain", ops: [{op: "select", bind: "t", filter: {owner: "self", zone: "leaderOrCharacters", excludeSelf: true}, min: 1, max: 1, prompt: "Give 1 active DON!! to"}, {op: "giveRestedDon", upTo: 1, toRef: "t", fromActive: true}, {op: "trashFromField", ref: "self"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -3000 power"}, {op: "powerMod", ref: "b1", amount: -3000, duration: "turn"}]},
  ],
  'OP13-008': [
    {timing: "guardKo", replaceWhen: "oppEffect", guard: {owner: "self", zone: "characters", typeIncludes: "Revolutionary Army"}, ops: [{op: "select", bind: "g", filter: {owner: "self", zone: "guarded"}, min: 0, max: 1, prompt: "Trash Ivankov to save it?"}, {op: "guardResolve", choiceRef: "g", targetRef: "target"}, {op: "trashFromField", ref: "self"}]},
  ],
  'OP13-012': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 4, filter: {typeIncludesAny: ["Alabasta", "Straw Hat Crew"], costAtLeast: 2}, upTo: 1, to: "hand"}]},
  ],
  'OP13-013': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", powerAtMost: 0}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
  ],
  'OP13-014': [
    {timing: "trigger", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters", nameIs: "Portgas.D.Ace"}, min: 0, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b1", amount: 3000, duration: "turn"}]},
  ],
  'OP13-015': [
    {timing: "activateMain", cost: {restSelf: true}, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters", nameIs: "Monkey.D.Luffy"}, min: 0, max: 1, prompt: "+2000 power"}, {op: "powerMod", ref: "b1", amount: 2000, duration: "turn"}]},
  ],
  'OP13-016': [
    {timing: "onPlay", condition: {leaderNameIs: "Monkey.D.Luffy"}, ops: [{op: "searchTop", count: 4, filter: {costAtLeast: 3}, upTo: 1, to: "hand"}]},
    {timing: "onPlay", condition: {leaderNameIs: "Sabo"}, ops: [{op: "searchTop", count: 4, filter: {costAtLeast: 3}, upTo: 1, to: "hand"}]},
    {timing: "onPlay", condition: {leaderNameIs: "Portgas.D.Ace"}, ops: [{op: "searchTop", count: 4, filter: {costAtLeast: 3}, upTo: 1, to: "hand"}]},
  ],
  'OP13-017': [
    {timing: "guardKo", replaceWhen: "oppEffect", oncePerTurn: true, guard: {owner: "self", zone: "characters", typeIncludes: "Revolutionary Army"}, ops: [{op: "select", bind: "g", filter: {owner: "self", zone: "guarded"}, min: 0, max: 1, prompt: "Dragon takes -2000 to save it?"}, {op: "guardResolve", choiceRef: "g", targetRef: "target"}, {op: "powerMod", ref: "self", amount: -2000, duration: "turn"}]},
  ],
  'OP13-019': [
    {timing: "main", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 4, exact: true, prompt: "Rest 4 DON!!?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "select", bind: "b0", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -3000 power"}, {op: "powerMod", ref: "b0", amount: -3000, duration: "turn"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", powerAtMost: 3000}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
    {timing: "counter", ops: [{op: "select", bind: "b2", filter: {owner: "self", zone: "leader"}, min: 1, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b2", amount: 3000, duration: "battle"}]},
  ],
  'OP13-020': [
    {timing: "main", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -5000 power"}, {op: "powerMod", ref: "b1", amount: -5000, duration: "turn"}]},
    {timing: "trigger", ops: [{op: "activateTiming", timing: "main"}]},
  ],
  'OP13-021': [
    {timing: "main", ops: [{op: "select", bind: "b0", filter: {owner: "self", zone: "leaderOrCharacters", nameIs: "Monkey.D.Luffy"}, min: 0, max: 1, prompt: "Give DON!! to"}, {op: "giveRestedDon", upTo: 1, toRef: "b0"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -2000 power"}, {op: "powerMod", ref: "b1", amount: -2000, duration: "turn"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -2000 power"}, {op: "powerMod", ref: "b2", amount: -2000, duration: "turn"}]},
  ],
  'OP13-022': [
    {timing: "activateMain", cost: {restSelf: true}, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "characters", basePowerAtMost: 2000}, min: 0, max: 1, prompt: "+1000 power"}, {op: "powerMod", ref: "b1", amount: 1000, duration: "turn"}]},
  ],
  'OP13-023': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 2, prompt: "Set DON!! active"}, {op: "setActive", ref: "b1"}, {op: "restrictSelf", restriction: "noPlayCharCost5Plus"}]},
    {timing: "onKo", ops: [{op: "select", bind: "b2", filter: {owner: "self", zone: "hand", cardType: "Character", costAtMost: 5}, min: 0, max: 1, prompt: "Play from hand rested"}, {op: "playCards", ref: "b2", rested: true}]},
  ],
  'OP13-024': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "hand", typeIncludes: "FILM"}, min: 0, max: 1, prompt: "Reveal a FILM card?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "reveal", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 2, prompt: "Set DON!! active"}, {op: "setActive", ref: "b1"}]},
  ],
  'OP13-025': [
    {timing: "onPlay", condition: {leaderTypeIncludes: "FILM"}, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 1, prompt: "Set DON!! active"}, {op: "setActive", ref: "b1"}]},
    {timing: "onPlay", condition: {leaderAttributeIs: "Strike"}, ops: [{op: "select", bind: "b2", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 1, prompt: "Set DON!! active"}, {op: "setActive", ref: "b2"}]},
  ],
  'OP13-026': [
    {timing: "activateMain", oncePerTurn: true, ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 1, exact: true, prompt: "Rest 1 DON!!?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "powerMod", ref: "self", amount: 2000, duration: "untilTurn", untilTurnOffset: 1}]},
  ],
  'OP13-027': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 2, prompt: "Set DON!! active"}, {op: "setActive", ref: "b1"}]},
    {timing: "endOfTurn", ops: [{op: "select", bind: "b2", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 1, prompt: "Set DON!! active"}, {op: "setActive", ref: "b2"}], condition: {leaderTypeIncludesAny: ["FILM", "Straw Hat Crew"]}},
  ],
  'OP13-028': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 10, prompt: "Set all DON!! active"}, {op: "setActive", ref: "b1"}, {op: "restrictSelf", restriction: "noPlayFromHand"}]},
  ],
  'OP13-030': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 2, prompt: "Set DON!! active"}, {op: "setActive", ref: "b1"}]},
  ],
  'OP13-031': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "characters"}, min: 0, max: 1, prompt: "Return 1 of your Characters?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnToHand", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand", cardType: "Character", costAtMost: 5}, min: 0, max: 1, prompt: "Play from hand rested"}, {op: "playCards", ref: "b1", rested: true}]},
  ],
  'OP13-032': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 8}, min: 0, max: 1, prompt: "Cannot be rested"}, {op: "grantFlag", ref: "b1", flag: "noRest", duration: "untilTurn", untilTurnOffset: 1}]},
  ],
  'OP13-033': [
    {timing: "onKo", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", rested: false}, min: 0, max: 2, prompt: "Rest up to 2"}, {op: "rest", ref: "b1"}]},
  ],
  'OP13-034': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 1, prompt: "Set DON!! active"}, {op: "setActive", ref: "b1"}], condition: {leaderTypeIncludesAny: ["FILM", "Straw Hat Crew"]}},
  ],
  'OP13-035': [
    {timing: "endOfTurn", ops: [{op: "select", bind: "m", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 1, prompt: "Mode: set a DON!! active"}, {op: "setActive", ref: "m"}, {op: "abortIfChosen", ref: "m"}, {op: "setActive", ref: "self"}]},
  ],
  'OP13-037': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 2, prompt: "Set DON!! active"}, {op: "setActive", ref: "b1"}], condition: {leaderTypeIncludesAny: ["FILM", "Straw Hat Crew"]}},
    {timing: "endOfTurn", ops: [{op: "setActive", ref: "self"}]},
  ],
  'OP13-038': [
    {timing: "main", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 5}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b1"}, {op: "select", bind: "b2", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 2, prompt: "Set DON!! active"}, {op: "setActive", ref: "b2"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b3", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 5}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b3"}]},
  ],
  'OP13-039': [
    {timing: "counter", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 4, rested: true}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
    {timing: "trigger", ops: [{op: "activateTiming", timing: "counter"}]},
  ],
  'OP13-040': [
    {timing: "main", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 2, exact: true, prompt: "Rest 2 DON!!?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", rested: true, costAtMost: 7}, min: 0, max: 2, prompt: "Will not refresh"}, {op: "grantFlag", ref: "b1", flag: "noRefresh", duration: "untilYourNextTurn"}]},
    {timing: "counter", ops: [{op: "select", bind: "b2", filter: {owner: "self", zone: "leader"}, min: 1, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b2", amount: 3000, duration: "battle"}]},
  ],
  'OP13-041': [
    {timing: "onPlay", ops: [{op: "draw", count: 2}]},
  ],
  'OP13-042': [
    {timing: "onPlay", ops: [{op: "draw", count: 2}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "b1"}, {op: "select", bind: "L", filter: {owner: "self", zone: "leader"}, min: 0, max: 1, prompt: "Give DON!! to Leader"}, {op: "giveRestedDon", upTo: 2, toRef: "L"}, {op: "select", bind: "c", filter: {owner: "self", zone: "characters"}, min: 0, max: 1, prompt: "Give DON!! to"}, {op: "giveRestedDon", upTo: 2, toRef: "c"}]},
  ],
  'OP13-043': [
    {timing: "onPlay", ops: [{op: "draw", count: 2}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "b1"}], condition: {maxLifeSelf: 3}},
  ],
  'OP13-044': [
    {timing: "whenAttacking", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters", typeContains: "Whitebeard Pirates"}, min: 0, max: 1, prompt: "Give DON!! to"}, {op: "giveRestedDon", upTo: 1, toRef: "b1"}]},
    {timing: "onKo", ops: [{op: "draw", count: 1}]},
  ],
  'OP13-045': [
    {timing: "whenAttacking", ops: [{op: "draw", count: 1}], condition: {maxHandSelf: 4}},
  ],
  'OP13-046': [
    {timing: "replaceKo", oncePerTurn: true, ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "hand", typeContains: "Whitebeard Pirates"}, min: 0, max: 1, prompt: "Trash a Whitebeard card to save Vista?"}, {op: "guardResolve", choiceRef: "pay", targetRef: "self"}, {op: "trashCards", ref: "pay"}]},
  ],
  'OP13-047': [
    {timing: "guardKo", replaceWhen: "oppEffect", guard: {owner: "self", zone: "characters", typeContains: "Whitebeard Pirates"}, ops: [{op: "select", bind: "g", filter: {owner: "self", zone: "guarded"}, min: 0, max: 1, prompt: "Trash Fossa to save it?"}, {op: "guardResolve", choiceRef: "g", targetRef: "target"}, {op: "trashFromField", ref: "self"}]},
  ],
  'OP13-050': [
    {timing: "onPlay", condition: {leaderNameIs: "Boa Hancock"}, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", nameIs: "Boa Hancock", costAtMost: 3}, min: 0, max: 1, prompt: "Play Boa Hancock"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP13-051': [
    {timing: "onKo", condition: {leaderNameIs: "Boa Hancock"}, ops: [{op: "draw", count: 2}]},
    {timing: "onKo", condition: {leaderMulticolor: true}, ops: [{op: "draw", count: 2}]},
  ],
  'OP13-052': [
    {timing: "onPlay", condition: {leaderNameIs: "Boa Hancock"}, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", nameIs: "Boa Hancock", costAtMost: 6}, min: 0, max: 1, prompt: "Play Boa Hancock"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP13-053': [
    {timing: "whenAttacking", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "characters", typeContains: "Whitebeard Pirates", excludeSelf: true}, min: 0, max: 1, prompt: "Trash a Whitebeard Character?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "trashFromField", ref: "pay"}, {op: "draw", count: 1}, {op: "grantKeyword", ref: "self", keyword: "Banish", duration: "turn"}]},
  ],
  'OP13-054': [
    {timing: "onPlay", condition: {maxLifeSelf: 3}, ops: [{op: "draw", count: 2}, {op: "select", bind: "L", filter: {owner: "self", zone: "leader"}, min: 0, max: 1, prompt: "Give DON!! to Leader"}, {op: "giveRestedDon", upTo: 1, toRef: "L"}]},
  ],
  'OP13-055': [
    {timing: "whenAttacking", condition: {maxHandSelf: 4}, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "characters", typeContains: "Whitebeard Pirates"}, min: 0, max: 5, prompt: "+1000 power (select all)"}, {op: "powerMod", ref: "b1", amount: 1000, duration: "turn"}]},
  ],
  'OP13-056': [
    {timing: "whenAttacking", ops: [{op: "draw", count: 1}], condition: {leaderTypeContains: "Whitebeard Pirates"}},
  ],
  'OP13-057': [
    {timing: "main", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 1, exact: true, prompt: "Rest 1 DON!!?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "requireCond", cond: {maxLifeSelf: 1}}, {op: "select", bind: "L", filter: {owner: "self", zone: "leader"}, min: 1, max: 1, prompt: "No blockers on Leader attacks"}, {op: "grantFlag", ref: "L", flag: "noBlockCostAtMost", value: 99, duration: "turn"}]},
    {timing: "counter", ops: [{op: "select", bind: "b2", filter: {owner: "self", zone: "leader"}, min: 1, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b2", amount: 3000, duration: "battle"}]},
  ],
  'OP13-058': [
    {timing: "main", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 1, exact: true, prompt: "Rest 1 DON!!?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", powerAtMost: 3000}, min: 0, max: 1, prompt: "Bottom-deck"}, {op: "bottomDeckFromField", ref: "b1"}]},
    {timing: "counter", ops: [{op: "select", bind: "b2", filter: {owner: "self", zone: "leader"}, min: 1, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b2", amount: 3000, duration: "battle"}]},
  ],
  'OP13-059': [
    {timing: "main", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "characters"}, min: 0, max: 1, prompt: "Return 1 of your Characters?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnToHand", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 6}, min: 0, max: 1, prompt: "Return to hand"}, {op: "returnToHand", ref: "b1"}]},
  ],
  'OP13-060': [
    {timing: "guardKo", replaceWhen: "oppEffect", guard: {owner: "self", zone: "characters", typeContains: "Roger Pirates"}, ops: [{op: "select", bind: "g", filter: {owner: "self", zone: "guarded"}, min: 0, max: 1, prompt: "Trash Toki to save it?"}, {op: "guardResolve", choiceRef: "g", targetRef: "target"}, {op: "trashFromField", ref: "self"}]},
  ],
  'OP13-061': [
    {timing: "onPlay", condition: {minSelfGivenDon: 1}, ops: [{op: "addDon", count: 1, rested: true}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 1}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
  ],
  'OP13-062': [
    {timing: "onPlay", condition: {minSelfGivenDon: 1}, ops: [{op: "addDon", count: 1, rested: false}]},
    {timing: "whenAttacking", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", basePowerAtMost: 3000}, min: 0, max: 1, prompt: "Return to hand"}, {op: "returnToHand", ref: "b1"}]},
  ],
  'OP13-063': [
    {timing: "onPlay", condition: {minSelfGivenDon: 1}, ops: [{op: "addDon", count: 1, rested: true}]},
  ],
  'OP13-064': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 3, exact: true, prompt: "Rest 3 DON!!?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "select", bind: "L", filter: {owner: "self", zone: "leader"}, min: 0, max: 1, prompt: "+2000 power"}, {op: "powerMod", ref: "L", amount: 2000, duration: "untilYourNextTurn"}, {op: "powerModAll", amount: -2000, duration: "untilYourNextTurn", who: "opponent"}]},
  ],
  'OP13-065': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 5, filter: {nameNot: "Shanks", typeIncludes: "Roger Pirates"}, upTo: 1, to: "hand"}]},
  ],
  'OP13-066': [
    {timing: "onPlay", condition: {minSelfGivenDon: 1}, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 5}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b1"}, {op: "addDon", count: 1, rested: false}]},
  ],
  'OP13-067': [
    {timing: "onPlay", ops: [{op: "draw", count: 2}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "b1"}, {op: "addDon", count: 1, rested: true}], condition: {leaderTypeContains: "Roger Pirates"}},
  ],
  'OP13-068': [
    {timing: "onPlay", ops: [{op: "addDon", count: 1, rested: true}], condition: {leaderTypeContains: "Roger Pirates"}},
  ],
  'OP13-069': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don"}, min: 0, max: 1, exact: true, prompt: "You may return 1 DON!!"}, {op: "abortIfEmpty", ref: "b1"}, {op: "returnDon", ref: "b1"}, {op: "select", bind: "b2", filter: {owner: "self", zone: "trash", cardType: "Stage", costAtMost: 3}, min: 0, max: 1, prompt: "Add to hand"}, {op: "toHand", ref: "b2"}]},
  ],
  'OP13-071': [
    {timing: "onPlay", condition: {minDonField: 8}, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", basePowerAtMost: 3000}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
  ],
  'OP13-072': [
    {timing: "onPlay", ops: [{op: "addDon", count: 1, rested: true}], condition: {leaderTypeIncludes: "Roger Pirates"}},
  ],
  'OP13-074': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", cardType: "Character", typeIncludes: "Homies", basePowerAtMost: 3000}, min: 0, max: 1, prompt: "Play from hand"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP13-075': [
    {timing: "main", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 1, exact: true, prompt: "Rest 1 DON!!?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "requireCond", cond: {leaderNameIs: "Gol.D.Roger", minSelfGivenDon: 1}}, {op: "addDon", count: 1, rested: true}]},
    {timing: "counter", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leader"}, min: 1, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b1", amount: 3000, duration: "battle"}]},
  ],
  'OP13-076': [
    {timing: "main", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 5, exact: true, prompt: "Rest 5 DON!!?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "requireCond", cond: {minSelfGivenDon: 1}}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -8000 power"}, {op: "powerMod", ref: "b1", amount: -8000, duration: "turn"}]},
    {timing: "counter", ops: [{op: "select", bind: "pay2", filter: {owner: "self", zone: "hand"}, min: 0, max: 1, prompt: "You may trash 1"}, {op: "abortIfEmpty", ref: "pay2"}, {op: "trashCards", ref: "pay2"}, {op: "select", bind: "b2", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b2", amount: 3000, duration: "battle"}]},
  ],
  'OP13-077': [
    {timing: "main", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 3, exact: true, prompt: "Rest 3 DON!!?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "requireCond", cond: {minSelfGivenDon: 1}}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", basePowerAtMost: 4000}, min: 0, max: 1, prompt: "K.O. up to 1 (4000-)"}, {op: "ko", ref: "b1"}, {op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters", basePowerAtMost: 3000}, min: 0, max: 1, prompt: "K.O. up to 1 (3000-)"}, {op: "ko", ref: "b2"}]},
    {timing: "counter", ops: [{op: "select", bind: "b3", filter: {owner: "self", zone: "leader"}, min: 1, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b3", amount: 3000, duration: "turn"}]},
  ],
  'OP13-078': [
    {timing: "onEvent", on: {kind: "charRemovedByEffect", who: "opponent"}, oncePerTurn: true, ops: [{op: "addDon", count: 1, rested: true}]},
  ],
  'OP13-079': [
    {timing: "activateMain", oncePerTurn: true, ops: [{op: "draw", count: 1}, {op: "select", bind: "c", filter: {owner: "self", zone: "characters", typeIncludes: "Celestial Dragons"}, min: 0, max: 1, prompt: "Mode: trash a Celestial Dragons Character"}, {op: "trashFromField", ref: "c"}, {op: "abortIfChosen", ref: "c"}, {op: "select", bind: "h", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1 from hand"}, {op: "trashCards", ref: "h"}]},
  ],
  'OP13-080': [
    {timing: "whenAttacking", condition: {minTrashSelf: 10}, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -2000 power"}, {op: "powerMod", ref: "b1", amount: -2000, duration: "turn"}]},
  ],
  'OP13-081': [
    {timing: "activateMain", oncePerTurn: true, ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "trash"}, min: 1, max: 1, prompt: "Bottom-deck 1 from trash"}, {op: "trashToDeckBottom", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 1, max: 1, prompt: "Give DON!! to"}, {op: "giveRestedDon", upTo: 1, toRef: "b1"}]},
  ],
  'OP13-082': [
    {timing: "activateMain", condition: {leaderNameIs: "Imu"}, cost: {restDon: 1}, ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "pay"}, {op: "select", bind: "all", filter: {owner: "self", zone: "characters"}, min: 0, max: 5, prompt: "Trash all your Characters (select all)"}, {op: "trashFromField", ref: "all"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "trash", cardType: "Character", typeIncludes: "Five Elders", powerAtLeast: 5000, basePowerAtMost: 5000}, min: 0, max: 5, prompt: "Play Five Elders from trash"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP13-083': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 5, filter: {typeIncludes: "Five Elders"}, upTo: 1, to: "hand"}]},
  ],
  'OP13-084': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 5, filter: {typeIncludes: "Five Elders"}, upTo: 1, to: "hand"}]},
  ],
  'OP13-086': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 3, filter: {typeIncludes: "Celestial Dragons", nameNot: "Saint Shalria"}, upTo: 1, to: "hand", restTo: "trash"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP13-087': [
    {timing: "onPlay", ops: [{op: "millSelf", count: 1}]},
  ],
  'OP13-089': [
    {timing: "onKo", ops: [{op: "draw", count: 1}]},
  ],
  'OP13-091': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "hand"}, min: 0, max: 1, prompt: "Trash 1?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "trashCards", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 5}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
  ],
  'OP13-092': [
    {timing: "onPlay", condition: {maxLifeSelf: 3}, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "trash", cardType: "Stage", typeIncludes: "Mary Geoise", costIs: 1}, min: 0, max: 1, prompt: "Play from trash"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP13-093': [
    {timing: "onPlay", ops: [{op: "draw", count: 2}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 2, max: 2, prompt: "Trash 2"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP13-094': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "characters", typeIncludes: "Celestial Dragons"}, min: 0, max: 1, prompt: "+2000 power"}, {op: "powerMod", ref: "b1", amount: 2000, duration: "turn"}]},
  ],
  'OP13-095': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "hand"}, min: 0, max: 1, prompt: "Trash 1?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "trashCards", ref: "pay"}, {op: "requireCond", cond: {allSelfCharsTyped: "Celestial Dragons"}}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 3}, min: 0, max: 2, prompt: "K.O. up to 2"}, {op: "ko", ref: "b1"}]},
  ],
  'OP13-096': [
    {timing: "main", ops: [{op: "searchTop", count: 3, filter: {typeIncludes: "Celestial Dragons", nameNot: "The Five Elders Are at Your Service!!!"}, upTo: 1, to: "hand", restTo: "trash"}]},
    {timing: "trigger", ops: [{op: "activateTiming", timing: "main"}]},
  ],
  'OP13-097': [
    {timing: "main", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 5, exact: true, prompt: "Rest 5 DON!!?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "requireCond", cond: {allSelfCharsTyped: "Celestial Dragons"}}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 6}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
    {timing: "counter", ops: [{op: "select", bind: "b2", filter: {owner: "self", zone: "leader"}, min: 1, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b2", amount: 3000, duration: "battle"}]},
  ],
  'OP13-098': [
    {timing: "main", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 1, exact: true, prompt: "Rest 1 DON!!?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "requireCond", cond: {leaderNameIs: "Imu"}}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "stage", costIs: 7}, min: 0, max: 1, prompt: "K.O. their Stage"}, {op: "ko", ref: "b1"}]},
    {timing: "counter", ops: [{op: "select", bind: "b2", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+4000 power"}, {op: "powerMod", ref: "b2", amount: 4000, duration: "battle"}], condition: {leaderNameIs: "Imu"}},
  ],
  'OP13-099': [
    {timing: "activateMain", cost: {restDon: 3, restSelf: true}, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", colorIncludes: "Black", cardType: "Character", typeIncludes: "Five Elders", costAtMostSelfDon: true}, min: 0, max: 1, prompt: "Play from hand"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP13-100': [
    {timing: "onEvent", on: {kind: "characterPlayed", who: "self", withTrigger: true}, condition: {yourTurn: true}, oncePerTurn: true, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 1, max: 1, prompt: "Give DON!! to"}, {op: "giveRestedDon", upTo: 2, toRef: "b1"}]},
  ],
  'OP13-102': [
    {timing: "activateMain", ops: [{op: "trashFromField", ref: "self"}, {op: "requireCond", cond: {atMostLifeOfOpp: true}}, {op: "draw", count: 1}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 3}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b1"}]},
    {timing: "trigger", ops: [{op: "draw", count: 1}, {op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 3}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b2"}]},
  ],
  'OP13-104': [
    {timing: "onKo", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 0, max: 1, prompt: "You may trash 1"}, {op: "abortIfEmpty", ref: "b1"}, {op: "trashCards", ref: "b1"}, {op: "requireCond", cond: {leaderMulticolor: true}}, {op: "deckTopToLife", count: 1}]},
  ],
  'OP13-105': [
    {timing: "onPlay", ops: [{op: "scryLifeTops", prompt: "You may move your top Life card to the bottom"}]},
  ],
  'OP13-106': [
    {timing: "onEvent", on: {kind: "triggerActivated", who: "self"}, condition: {opponentsTurn: true}, ops: [{op: "grantKeyword", ref: "self", keyword: "Blocker", duration: "turn"}]},
    {timing: "trigger", ops: [{op: "playSelf"}]},
  ],
  'OP13-108': [
    {timing: "onPlay", condition: {leaderTypeIncludes: "Egghead"}, ops: [{op: "grantKeyword", ref: "self", keyword: "Rush", duration: "turn"}, {op: "lifeTopToHand", count: 1, who: "opponent"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 7}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b1"}], condition: {maxLifeSelf: 1}},
  ],
  'OP13-109': [
    {timing: "replaceKo", replaceWhen: "oppEffect", ops: [{op: "select", bind: "conf", filter: {owner: "self", zone: "life"}, min: 0, max: 1, prompt: "Flip a Life face-up to save Bonney?"}, {op: "guardResolve", choiceRef: "conf", targetRef: "self"}, {op: "lifeFaceUp", count: 1}]},
    {timing: "trigger", ops: [{op: "draw", count: 2}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP13-110': [
    {timing: "onPlay", condition: {leaderTypeIncludes: "Egghead"}, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", cardType: "Character", costAtMost: 5, hasTrigger: true}, min: 0, max: 1, prompt: "Play from hand"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP13-113': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 4, filter: {hasTrigger: true, nameNot: "Lilith"}, upTo: 1, to: "hand"}]},
    {timing: "trigger", ops: [{op: "activateTiming", timing: "onPlay"}]},
  ],
  'OP13-114': [
    {timing: "onPlay", ops: [{op: "lifeFaceUp", count: 1}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -2000 power"}, {op: "powerMod", ref: "b1", amount: -2000, duration: "turn"}]},
    {timing: "whenAttacking", ops: [{op: "lifeFaceUp", count: 1}, {op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -2000 power"}, {op: "powerMod", ref: "b2", amount: -2000, duration: "turn"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b3", filter: {owner: "self", zone: "hand"}, min: 0, max: 1, prompt: "You may trash 1"}, {op: "abortIfEmpty", ref: "b3"}, {op: "trashCards", ref: "b3"}, {op: "playSelf"}]},
  ],
  'OP13-115': [
    {timing: "counter", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b1", amount: 3000, duration: "battle"}, {op: "requireCond", cond: {maxLifeOpp: 2}}, {op: "select", bind: "b2", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+1000 power"}, {op: "powerMod", ref: "b2", amount: 1000, duration: "turn"}]},
    {timing: "trigger", ops: [{op: "draw", count: 1}]},
  ],
  'OP13-116': [
    {timing: "main", ops: [{op: "searchTop", count: 5, filter: {typeIncludes: "Supernovas", cardType: "Character"}, upTo: 1, to: "hand"}]},
    {timing: "trigger", ops: [{op: "activateTiming", timing: "main"}]},
  ],
  'OP13-117': [
    {timing: "main", ops: [{op: "lifeFaceUp", count: 1}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 6}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
    {timing: "trigger", ops: [{op: "draw", count: 1}]},
  ],
  'OP13-118': [
    {timing: "onPlay", condition: {leaderMulticolor: true}, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 4, prompt: "Set DON!! active"}, {op: "setActive", ref: "b1"}, {op: "restrictSelf", restriction: "noPlayCharCost5Plus"}]},
  ],
  'OP13-119': [
    {timing: "onPlay", ops: [{op: "select", bind: "L", filter: {owner: "self", zone: "leader"}, min: 0, max: 1, prompt: "Give DON!! to Leader"}, {op: "giveRestedDon", upTo: 1, toRef: "L"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 5}, min: 0, max: 1, prompt: "Return to hand"}, {op: "returnToHand", ref: "b1"}, {op: "abortIfEmpty", ref: "b1"}, {op: "select", bind: "b2", filter: {owner: "opponent", zone: "hand", cardType: "Character", costAtMost: 4}, min: 0, max: 1, chooser: "opponent", prompt: "You may play a Character"}, {op: "playCards", ref: "b2", who: "opponent"}]},
  ],
  'OP13-120': [
    {timing: "activateMain", oncePerTurn: true, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "characters"}, min: 0, max: 1, prompt: "+2 cost"}, {op: "costMod", ref: "b1", amount: 2, duration: "untilTurn", untilTurnOffset: 1}, {op: "select", bind: "L", filter: {owner: "self", zone: "leader"}, min: 0, max: 1, prompt: "Give DON!! to Leader"}, {op: "giveRestedDon", upTo: 1, toRef: "L"}]},
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP13_STATICS: Record<string, StaticDef[]> = {
  'OP13-003': [
    {condition: {maxDonField: 9}, target: {scope: 'self'}, power: 2000},
  ],
  'OP13-004': [
    {condition: {minLifeSelf: 4}, target: {scope: 'self'}, power: 1000},
    {donRequired: 1, condition: {minSelfCharCost: 8}, target: {scope: 'self'}, power: 1000},
    {donRequired: 1, condition: {minSelfCharCost: 8}, target: {scope: 'myCharacters'}, power: 1000},
  ],
  'OP13-009': [
    {condition: {hasOtherCharacterTyped: 'Mountain Bandits'}, target: {scope: 'self'}, keyword: 'Double Attack'},
  ],
  'OP13-031': [
    {condition: {maxLifeSelf: 1}, target: {scope: 'self'}, keyword: 'Blocker'},
  ],
  'OP13-068': [
    {condition: {minDonField: 8}, target: {scope: 'self'}, power: 2000},
  ],
  'OP13-080': [
    {condition: {minTrashSelf: 7}, target: {scope: 'self'}, flag: 'noOppEffectRemove'},
    {condition: {minTrashSelf: 7}, target: {scope: 'self'}, keyword: 'Rush'},
  ],
  'OP13-081': [
    {condition: {leaderTypeIncludes: 'Revolutionary Army'}, target: {scope: 'self'}, costMod: 3},
  ],
  'OP13-083': [
    {condition: {minTrashSelf: 7}, target: {scope: 'self'}, flag: 'noOppEffectRemove'},
  ],
  'OP13-084': [
    {condition: {minTrashSelf: 7}, target: {scope: 'self'}, flag: 'noOppEffectRemove'},
  ],
  'OP13-089': [
    {condition: {minTrashSelf: 7}, target: {scope: 'self'}, flag: 'noOppEffectRemove'},
    {condition: {minTrashSelf: 7}, target: {scope: 'self'}, keyword: 'Blocker'},
  ],
  'OP13-091': [
    {condition: {minTrashSelf: 7}, target: {scope: 'self'}, flag: 'noOppEffectRemove'},
    {condition: {minTrashSelf: 7}, target: {scope: 'self'}, keyword: 'Blocker'},
  ],
  'OP13-099': [
    {condition: {yourTurn: true, minTrashSelf: 19}, target: {scope: 'myLeader'}, power: 1000},
  ],
  'OP13-112': [
    {condition: {minSelfGivenDon: 2}, target: {scope: 'self'}, keyword: 'Blocker'},
  ],
  'OP13-119': [
    {condition: {maxLifeSelf: 3}, target: {scope: 'self'}, keyword: 'Rush'},
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP13: string[] = []

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP13: Record<string, string> = {
  'OP13-002': 'SIMPLIFIED: the damage/K.O. draw is two listeners with separate marks; the 6000+ base power filter on the K.O. side is not modeled',
  'OP13-007': 'SIMPLIFIED: the active DON!! moves to one chosen card before the trash',
  'OP13-016': 'SIMPLIFIED: the three leader names are three defs; with a matching leader exactly one fires',
  'OP13-024': 'SIMPLIFIED: the DON!! refresh happens immediately instead of at the end of the turn; the Music type is not in the pool',
  'OP13-025': 'SIMPLIFIED: a FILM-typed Strike leader would fire both halves',
  'OP13-038': 'SIMPLIFIED: the DON!! refresh happens immediately instead of at the end of the turn',
  'OP13-053': 'SIMPLIFIED: the trash cost cannot take Teach himself',
  'OP13-055': 'SIMPLIFIED: "all" is a select-all prompt rather than automatic',
  'OP13-064': 'SIMPLIFIED: the self-negation aura on non-Roger crews is not modeled; buffs run until your next Refresh',
  'OP13-066': 'SIMPLIFIED: the end-of-turn DON!! arrives immediately',
  'OP13-078': 'SIMPLIFIED: the Roger Pirates type check on the removed card is not modeled',
  'OP13-079': 'SIMPLIFIED: the draw happens before the trash cost; Imu\'s opening Stage comes from the deck at game start',
  'OP13-082': 'SIMPLIFIED: "trash all" is a select-all prompt; the different-names rule on the mass play is not enforced',
  'OP13-105': 'SIMPLIFIED: the full life reorder is modeled as the top-to-bottom life scry',
  'OP13-109': 'SIMPLIFIED: the save confirm uses the top life card; with no face-down life the flip is skipped',
  'OP13-119': 'SIMPLIFIED: bounce targets the opponent side only; the opponent replay is their choice from hand',
}
