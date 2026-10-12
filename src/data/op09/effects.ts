import type { EffectDef, StaticDef } from '@/engine/effects/ast'

/**
 * OP09 effect definitions as DSL data, keyed by card ID. Compiled entries were
 * drafted by scripts/compile-effects.ts; the rest are authored against the
 * printed text. The API drops minus signs on debuffs, so every power/cost mod
 * aimed at the opponent is authored negative. Deviations: COVERAGE_NOTES_OP09.
 */
export const OP09_EFFECTS: Record<string, EffectDef[]> = {
  'OP09-001': [
    {timing: "onEvent", on: {kind: "attacked", who: "self"}, oncePerTurn: true, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "Give -1000 power"}, {op: "powerMod", ref: "b1", amount: -1000, duration: "turn"}]},
  ],
  'OP09-002': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 5, filter: {typeIncludes: "Red-Haired Pirates"}, upTo: 1, to: "hand"}]},
  ],
  'OP09-003': [
    {timing: "whenAttacking", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -2000 power"}, {op: "powerMod", ref: "b1", amount: -2000, duration: "turn"}]},
  ],
  'OP09-005': [
    {timing: "onPlay", condition: {minOppCharsBasePowerAtLeast: {power: 5000, count: 2}}, ops: [{op: "draw", count: 2}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP09-007': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leader", powerAtMost: 4000}, min: 0, max: 1, prompt: "+1000 power"}, {op: "powerMod", ref: "b1", amount: 1000, duration: "turn"}]},
  ],
  'OP09-008': [
    {timing: "activateMain", ops: [{op: "bottomDeckFromField", ref: "self"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -3000 power"}, {op: "powerMod", ref: "b1", amount: -3000, duration: "turn"}]},
  ],
  'OP09-009': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", powerAtMost: 6000}, min: 0, max: 1, prompt: "Trash up to 1"}, {op: "trashFromField", ref: "b1"}]},
  ],
  'OP09-010': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", nameIs: "Monster"}, min: 0, max: 1, prompt: "Play Monster"}, {op: "playCards", ref: "b1"}]},
    {timing: "whenAttacking", ops: [{op: "powerMod", ref: "self", amount: 2000, duration: "turn"}], donRequired: 1},
  ],
  'OP09-012': [
    {timing: "guardKo", replaceWhen: "effect", guard: {owner: "self", zone: "characters", nameIs: "Bonk Punch"}, ops: [{op: "select", bind: "g", filter: {owner: "self", zone: "guarded"}, min: 0, max: 1, prompt: "Trash Monster to save Bonk Punch?"}, {op: "guardResolve", choiceRef: "g", targetRef: "target"}, {op: "trashFromField", ref: "self"}]},
  ],
  'OP09-011': [
    {timing: "activateMain", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -2000 power"}, {op: "powerMod", ref: "b1", amount: -2000, duration: "turn"}], cost: {restSelf: true}, condition: {leaderTypeIncludes: "Red-Haired Pirates"}},
  ],
  'OP09-013': [
    {timing: "onPlay", ops: [{op: "select", bind: "b0", filter: {owner: "self", zone: "leader"}, min: 0, max: 1, prompt: "+1000 power"}, {op: "powerMod", ref: "b0", amount: 1000, duration: "untilTurn", untilTurnOffset: 1}]},
    {timing: "whenAttacking", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -1000 power"}, {op: "powerMod", ref: "b1", amount: -1000, duration: "turn"}], donRequired: 1},
  ],
  'OP09-014': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", powerAtMost: 4000, hasKeywordIs: "Blocker"}, min: 0, max: 1, prompt: "Cannot block"}, {op: "grantFlag", ref: "b1", flag: "cannotBlock", duration: "turn"}]},
  ],
  'OP09-015': [
    {timing: "onKo", condition: {leaderTypeIncludes: "Red-Haired Pirates"}, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", basePowerAtMost: 6000}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
  ],
  'OP09-018': [
    {timing: "main", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", powerAtMost: 4000}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
  ],
  'OP09-019': [
    {timing: "main", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -3000 power"}, {op: "powerMod", ref: "b1", amount: -3000, duration: "turn"}, {op: "requireCond", cond: {oppCharPowerAtLeast: 5000}}, {op: "draw", count: 1}], condition: {leaderTypeIncludes: "Red-Haired Pirates"}},
    {timing: "trigger", ops: [{op: "draw", count: 1}]},
  ],
  'OP09-020': [
    {timing: "main", ops: [{op: "searchTop", count: 5, filter: {nameNot: "Come On!! We'll Fight You!!", typeIncludes: "Red-Haired Pirates"}, upTo: 1, to: "hand"}]},
    {timing: "trigger", ops: [{op: "draw", count: 1}]},
  ],
  'OP09-021': [
    {timing: "activateMain", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -1000 power"}, {op: "powerMod", ref: "b1", amount: -1000, duration: "turn"}], cost: {restSelf: true}, condition: {leaderTypeIncludes: "Red-Haired Pirates"}},
  ],
  'OP09-022': [
    {timing: "activateMain", oncePerTurn: true, cost: {restDon: 3}, ops: [{op: "addDon", count: 1, rested: true}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand", cardType: "Character", typeIncludes: "ODYSSEY", costAtMost: 5}, min: 0, max: 1, prompt: "Play from hand"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP09-023': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "don", rested: true}, min: 0, max: 3, prompt: "Set DON!! active"}, {op: "setActive", ref: "b1"}], condition: {leaderTypeIncludes: "ODYSSEY"}},
    {timing: "onEvent", on: {kind: "attacked", who: "self"}, oncePerTurn: true, ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don", rested: false}, min: 0, max: 1, exact: true, prompt: "You may rest 1 DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "select", bind: "b2", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+2000 power"}, {op: "powerMod", ref: "b2", amount: 2000, duration: "battle"}]},
  ],
  'OP09-024': [
    {timing: "onPlay", condition: {minSelfRestedCharacters: 2}, ops: [{op: "draw", count: 2}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 2, max: 2, prompt: "Trash 2"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP09-026': [
    {timing: "onPlay", condition: {minSelfRestedCharacters: 2}, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 5}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
  ],
  'OP09-027': [
    {timing: "whenAttacking", oncePerTurn: true, condition: {minSelfRestedCharacters: 3}, ops: [{op: "draw", count: 1}]},
  ],
  'OP09-028': [
    {timing: "onKo", condition: {minLifeSelf: 1}, ops: [{op: "lifeTopToHand", count: 1}, {op: "select", bind: "b1", filter: {owner: "self", zone: "trash", cardType: "Character", typeIncludesAny: ["ODYSSEY", "Straw Hat Crew"], costAtMost: 4}, min: 0, max: 1, prompt: "Play from trash rested"}, {op: "playCards", ref: "b1", rested: true}]},
  ],
  'OP09-029': [
    {timing: "endOfTurn", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "characters", typeIncludes: "ODYSSEY", costAtMost: 4, rested: true}, min: 0, max: 1, prompt: "Set active"}, {op: "setActive", ref: "b1"}]},
  ],
  'OP09-030': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "characters"}, min: 0, max: 1, prompt: "Return 1 of your Characters?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnToHand", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand", cardType: "Character", typeIncludes: "ODYSSEY", costAtMost: 3, nameNot: "Trafalgar Law"}, min: 0, max: 1, prompt: "Play from hand"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP09-031': [
    {timing: "endOfTurn", condition: {minSelfRestedCharacters: 2}, ops: [{op: "setActive", ref: "self"}]},
  ],
  'OP09-032': [
    {timing: "onEvent", on: {kind: "attacked", who: "self"}, oncePerTurn: true, ops: [{op: "setActive", ref: "self"}]},
  ],
  'OP09-033': [
    {timing: "onPlay", condition: {minSelfRestedCharacters: 2}, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "characters", typeIncludesAny: ["ODYSSEY", "Straw Hat Crew"]}, min: 0, max: 5, prompt: "Protect from effect K.O. (select all)"}, {op: "grantFlag", ref: "b1", flag: "noEffectKo", duration: "untilTurn", untilTurnOffset: 1}]},
  ],
  'OP09-034': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 5, filter: {typeIncludes: "Thriller Bark Pirates", orNameIs: "Dracule Mihawk"}, upTo: 1, to: "hand"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP09-035': [
    {timing: "onPlay", condition: {minSelfRestedCharacters: 2}, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 5}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b1"}]},
  ],
  'OP09-036': [
    {timing: "onPlay", condition: {minSelfRestedCharacters: 2}, ops: [{op: "select", bind: "d", filter: {owner: "opponent", zone: "don", rested: false}, min: 0, max: 1, prompt: "Mode 1: rest a DON!!"}, {op: "rest", ref: "d"}, {op: "abortIfChosen", ref: "d"}, {op: "select", bind: "c", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 6}, min: 0, max: 1, prompt: "Mode 2: rest a Character"}, {op: "rest", ref: "c"}]},
  ],
  'OP09-037': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 5, filter: {nameNot: "Lim", typeIncludes: "ODYSSEY"}, upTo: 1, to: "hand"}]},
    {timing: "endOfTurn", condition: {minSelfRestedCharacters: 3}, ops: [{op: "setActive", ref: "self"}]},
  ],
  'OP09-039': [
    {timing: "counter", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+2000 power"}, {op: "powerMod", ref: "b1", amount: 2000, duration: "battle"}, {op: "requireCond", cond: {leaderTypeIncludes: "ODYSSEY", minSelfRestedCharacters: 2}}, {op: "select", bind: "b2", filter: {owner: "self", zone: "characters", rested: true}, min: 0, max: 2, prompt: "Set active"}, {op: "setActive", ref: "b2"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b3", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 4}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b3"}]},
  ],
  'OP09-040': [
    {timing: "main", condition: {minSelfRestedCharacters: 2}, ops: [{op: "select", bind: "b0", filter: {owner: "opponent", zone: "characters", costAtMost: 4}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b0"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 4}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b1"}]},
  ],
  'OP09-041': [
    {timing: "counter", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+2000 power"}, {op: "powerMod", ref: "b1", amount: 2000, duration: "battle"}],},
    {timing: "trigger", ops: [{op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 4}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b2"}]},
  ],
  'OP09-042': [
    {timing: "activateMain", cost: {restDon: 5}, ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand", cardType: "Character", typeIncludes: "Cross Guild"}, min: 0, max: 1, prompt: "Play from hand"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP09-043': [
    {timing: "onKo", condition: {leaderTypeIncludes: "Cross Guild"}, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", cardType: "Character", costAtMost: 5, nameNot: "Alvida"}, min: 0, max: 1, prompt: "Play from hand"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP09-044': [
    {timing: "whenAttacking", ops: [{op: "searchTop", count: 5, filter: {typeContains: "Whitebeard Pirates", orTypeIncludes: "Land of Wano"}, upTo: 1, to: "hand"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP09-046': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", cardType: "Character", typeIncludesAny: ["Cross Guild", "Baroque Works", "Former Baroque Works"], costAtMost: 5}, min: 0, max: 1, prompt: "Play from hand"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP09-047': [
    {timing: "onKo", ops: [{op: "draw", count: 2}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP09-048': [
    {timing: "onPlay", ops: [{op: "draw", count: 2}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP09-050': [
    {timing: "whenAttacking", ops: [{op: "searchTop", count: 5, filter: {colorIncludes: "Blue", cardType: "Event"}, upTo: 1, to: "hand"}]},
  ],
  'OP09-051': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Bottom-deck"}, {op: "bottomDeckFromField", ref: "b1"}, {op: "requireCond", cond: {fewerSelfCharsCostAtLeast: {cost: 5, count: 5}}}, {op: "bottomDeckFromField", ref: "self"}]},
  ],
  'OP09-052': [
    {timing: "onKo", condition: {opponentsTurn: true}, ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "hand"}, min: 0, max: 1, prompt: "Trash 1 to replay Marco?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "trashCards", ref: "pay"}, {op: "playSelf", rested: true}]},
  ],
  'OP09-053': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 5, filter: {nameIs: "Richie"}, upTo: 1, to: "hand"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand", nameIs: "Richie"}, min: 0, max: 1, prompt: "Play Richie"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP09-056': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 4, filter: {typeIncludesAny: ["Cross Guild", "Baroque Works", "Former Baroque Works"], nameNot: "Mr.3(Galdino)"}, upTo: 1, to: "hand"}]},
  ],
  'OP09-057': [
    {timing: "main", ops: [{op: "searchTop", count: 4, filter: {typeIncludes: "Cross Guild"}, upTo: 1, to: "hand"}]},
    {timing: "trigger", ops: [{op: "activateTiming", timing: "main"}]},
  ],
  'OP09-058': [
    {timing: "main", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 6}, min: 1, max: 1, chooser: "opponent", prompt: "Return 1 of your Characters to hand"}, {op: "returnToHand", ref: "b1"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters", costAtMost: 3}, min: 0, max: 1, prompt: "Return to hand"}, {op: "returnToHand", ref: "b2"}]},
  ],
  'OP09-059': [
    {timing: "counter", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b1", amount: 3000, duration: "battle"}, {op: "select", bind: "b2", filter: {owner: "self", zone: "hand"}, min: 0, max: 2, prompt: "Trash up to 2"}, {op: "trashCards", ref: "b2"}, {op: "millPerRef", countRef: "b2"}]},
    {timing: "trigger", ops: [{op: "draw", count: 1}]},
  ],
  'OP09-060': [
    {timing: "activateMain", cost: {restSelf: true}, condition: {minHandSelf: 2, leaderTypeIncludes: "Cross Guild"}, ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "hand"}, min: 2, max: 2, prompt: "Bottom-deck 2"}, {op: "bottomDeck", ref: "pay"}, {op: "draw", count: 2}]},
  ],
  'OP09-061': [
    {timing: "onEvent", on: {kind: "donReturned", who: "self"}, condition: {yourTurn: true}, oncePerTurn: true, ops: [{op: "addDon", count: 1, rested: false}, {op: "addDon", count: 1, rested: true}]},
  ],
  'OP09-062': [
    {timing: "whenAttacking", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", hasTrigger: true}, min: 0, max: 1, prompt: "You may trash 1"}, {op: "abortIfEmpty", ref: "b1"}, {op: "trashCards", ref: "b1"}, {op: "addDon", count: 1, rested: true}]},
  ],
  'OP09-064': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don"}, min: 0, max: 1, exact: true, prompt: "You may return 1 DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnDon", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "leader", typeIncludes: "Kid Pirates", rested: true}, min: 0, max: 1, prompt: "Set Leader active"}, {op: "setActive", ref: "b1"}]},
  ],
  'OP09-065': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don"}, min: 0, max: 10, prompt: "Return any number of DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnDon", ref: "pay"}, {op: "grantKeyword", ref: "self", keyword: "Rush", duration: "turn"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 6}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b1"}]},
  ],
  'OP09-066': [
    {timing: "onPlay", condition: {oppMoreDon: true}, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 3}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
  ],
  'OP09-068': [
    {timing: "endOfTurn", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don"}, min: 0, max: 10, prompt: "Return any number of DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnDon", ref: "pay"}, {op: "setActive", ref: "self"}, {op: "grantKeyword", ref: "self", keyword: "Blocker", duration: "untilTurn", untilTurnOffset: 1}]},
  ],
  'OP09-069': [
    {timing: "onPlay", ops: [{op: "searchTop", count: 4, filter: {typeIncludesAny: ["Straw Hat Crew", "Heart Pirates"], costAtLeast: 2}, upTo: 1, to: "hand"}]},
  ],
  'OP09-070': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don"}, min: 0, max: 10, prompt: "Return any number of DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnDon", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 1, max: 1, prompt: "Give DON!! to"}, {op: "giveRestedDon", upTo: 2, toRef: "b1"}]},
  ],
  'OP09-072': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don"}, min: 0, max: 2, exact: true, prompt: "Return 2 DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnDon", ref: "pay"}, {op: "select", bind: "pay2", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "pay2"}, {op: "draw", count: 2}]},
  ],
  'OP09-073': [
    {timing: "whenAttacking", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don"}, min: 0, max: 10, prompt: "Return any number of DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnDon", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 2, prompt: "Give -2000 power"}, {op: "powerMod", ref: "b1", amount: -2000, duration: "turn"}]},
  ],
  'OP09-074': [
    {timing: "onEvent", on: {kind: "donReturned", who: "self"}, condition: {yourTurn: true}, oncePerTurn: true, ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+1000 power"}, {op: "powerMod", ref: "b1", amount: 1000, duration: "turn"}]},
  ],
  'OP09-075': [
    {timing: "onPlay", condition: {minLifeSelf: 1}, ops: [{op: "lifeTopToHand", count: 1}, {op: "requireCond", cond: {leaderTypeIncludes: "Kid Pirates"}}, {op: "addDon", count: 1, rested: false}]},
  ],
  'OP09-076': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don"}, min: 0, max: 10, prompt: "Return any number of DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnDon", ref: "pay"}, {op: "addDon", count: 1, rested: false}]},
  ],
  'OP09-077': [
    {timing: "main", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don"}, min: 0, max: 2, exact: true, prompt: "Return 2 DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnDon", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", powerAtMost: 6000}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
    {timing: "trigger", ops: [{op: "addDon", count: 1, rested: false}]},
  ],
  'OP09-078': [
    {timing: "counter", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don"}, min: 0, max: 2, exact: true, prompt: "Return 2 DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnDon", ref: "pay"}, {op: "select", bind: "pay2", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "pay2"}, {op: "requireCond", cond: {leaderTypeIncludes: "Straw Hat Crew"}}, {op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+4000 power"}, {op: "powerMod", ref: "b1", amount: 4000, duration: "battle"}, {op: "draw", count: 2}]},
  ],
  'OP09-079': [
    {timing: "main", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don"}, min: 0, max: 2, exact: true, prompt: "Return 2 DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnDon", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", rested: false, costAtMost: 5}, min: 0, max: 1, prompt: "Rest"}, {op: "rest", ref: "b1"}, {op: "draw", count: 1}]},
    {timing: "trigger", ops: [{op: "addDon", count: 1, rested: false}]},
  ],
  'OP09-080': [
    {timing: "onEvent", on: {kind: "charRemovedByEffect", who: "opponent"}, condition: {opponentsTurn: true}, ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "stage", rested: false}, min: 0, max: 1, prompt: "Rest Thousand Sunny?"}, {op: "abortIfEmpty", ref: "pay"}, {op: "rest", ref: "pay"}, {op: "addDon", count: 1, rested: true}]},
  ],
  'OP09-081': [
    {timing: "activateMain", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "pay"}, {op: "select", bind: "L", filter: {owner: "opponent", zone: "leader"}, min: 1, max: 1, prompt: "Negate their On Play effects"}, {op: "grantFlag", ref: "L", flag: "noOnPlay", duration: "untilTurn", untilTurnOffset: 1}]},
  ],
  'OP09-083': [
    {timing: "activateMain", cost: {restSelf: true}, condition: {leaderTypeIncludes: "Blackbeard Pirates"}, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -3 cost"}, {op: "costMod", ref: "b1", amount: -3, duration: "turn"}]},
    {timing: "onKo", ops: [{op: "draw", count: 1}]},
  ],
  'OP09-084': [
    {timing: "activateMain", oncePerTurn: true, condition: {leaderTypeIncludes: "Blackbeard Pirates"}, ops: [{op: "select", bind: "m", filter: {owner: "self", zone: "characters", nameIs: "Catarina Devon"}, min: 0, max: 1, prompt: "Mode: Double Attack?"}, {op: "grantKeyword", ref: "m", keyword: "Double Attack", duration: "untilTurn", untilTurnOffset: 1}, {op: "abortIfChosen", ref: "m"}, {op: "grantKeyword", ref: "self", keyword: "Blocker", duration: "untilTurn", untilTurnOffset: 1}]},
  ],
  'OP09-085': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "trash", cardType: "Character", typeIncludes: "Thriller Bark Pirates", costAtMost: 2}, min: 0, max: 1, prompt: "Play from trash rested"}, {op: "playCards", ref: "b1", rested: true}]},
  ],
  'OP09-087': [
    {timing: "onPlay", condition: {minHandOpp: 5}, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "hand"}, min: 1, max: 1, chooser: "opponent", prompt: "Trash 1 from your hand"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP09-088': [
    {timing: "whenAttacking", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 0, max: 2, exact: true, prompt: "You may trash 2"}, {op: "abortIfEmpty", ref: "b1"}, {op: "trashCards", ref: "b1"}, {op: "draw", count: 2}], donRequired: 1},
  ],
  'OP09-089': [
    {timing: "activateMain", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "pay"}, {op: "trashFromField", ref: "self"}, {op: "requireCond", cond: {leaderTypeIncludes: "Blackbeard Pirates"}}, {op: "draw", count: 1}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Give -2 cost"}, {op: "costMod", ref: "b1", amount: -2, duration: "turn"}]},
  ],
  'OP09-090': [
    {timing: "activateMain", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", costAtMost: 1}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}], cost: {restSelf: true}, condition: {leaderTypeIncludes: "Blackbeard Pirates"}},
    {timing: "onKo", ops: [{op: "draw", count: 1}]},
  ],
  'OP09-092': [
    {timing: "activateMain", cost: {restSelf: true}, condition: {handDisadvantageAtLeast: 3}, ops: [{op: "draw", count: 2}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP09-093': [
    {timing: "activateMain", oncePerTurn: true, condition: {leaderTypeIncludes: "Blackbeard Pirates", selfPlayedThisTurn: true}, ops: [{op: "select", bind: "L", filter: {owner: "opponent", zone: "leader"}, min: 0, max: 1, prompt: "Negate Leader"}, {op: "grantFlag", ref: "L", flag: "negated", duration: "turn"}, {op: "select", bind: "C", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Negate + cannot attack"}, {op: "grantFlag", ref: "C", flag: "negated", duration: "untilTurn", untilTurnOffset: 1}, {op: "grantFlag", ref: "C", flag: "cannotAttack", duration: "untilTurn", untilTurnOffset: 1}]},
  ],
  'OP09-095': [
    {timing: "activateMain", cost: {restDon: 1, restSelf: true}, ops: [{op: "searchTop", count: 5, filter: {typeIncludes: "Blackbeard Pirates"}, upTo: 1, to: "hand"}]},
  ],
  'OP09-096': [
    {timing: "main", ops: [{op: "searchTop", count: 3, filter: {nameNot: "My Era...Begins!!", typeIncludes: "Blackbeard Pirates"}, upTo: 1, to: "hand", restTo: "trash"}]},
    {timing: "trigger", ops: [{op: "activateTiming", timing: "main"}]},
  ],
  'OP09-097': [
    {timing: "counter", ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "Negate and -4000 power"}, {op: "grantFlag", ref: "b1", flag: "negated", duration: "turn"}, {op: "powerMod", ref: "b1", amount: -4000, duration: "turn"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b2", filter: {owner: "opponent", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "Negate"}, {op: "grantFlag", ref: "b2", flag: "negated", duration: "turn"}]},
  ],
  'OP09-098': [
    {timing: "main", condition: {leaderTypeIncludes: "Blackbeard Pirates"}, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters"}, min: 0, max: 1, prompt: "Negate"}, {op: "grantFlag", ref: "b1", flag: "negated", duration: "turn"}, {op: "requireRefCostAtMost", ref: "b1", max: 4}, {op: "ko", ref: "b1"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b2", filter: {owner: "opponent", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "Negate"}, {op: "grantFlag", ref: "b2", flag: "negated", duration: "turn"}]},
  ],
  'OP09-099': [
    {timing: "activateMain", cost: {restSelf: true}, ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "hand"}, min: 1, max: 1, prompt: "Trash 1"}, {op: "trashCards", ref: "pay"}, {op: "searchTop", count: 3, filter: {typeIncludes: "Blackbeard Pirates"}, upTo: 1, to: "hand"}]},
  ],
  'OP09-100': [
    {timing: "trigger", condition: {leaderTypeIncludes: "Revolutionary Army", maxTotalLife: 5}, ops: [{op: "playSelf"}]},
  ],
  'OP09-101': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "opponent", zone: "characters", costAtMost: 3}, min: 1, max: 1, prompt: "Place onto their Life"}, {op: "fieldToLife", ref: "pay"}, {op: "select", bind: "b1", filter: {owner: "opponent", zone: "hand"}, min: 1, max: 1, chooser: "opponent", prompt: "Trash 1 from your hand"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP09-102': [
    {timing: "onPlay", condition: {leaderNameIs: "Nico Robin"}, ops: [{op: "searchTop", count: 3, filter: {hasTrigger: true}, upTo: 1, to: "hand"}]},
    {timing: "trigger", ops: [{op: "activateTiming", timing: "onPlay"}]},
  ],
  'OP09-103': [
    {timing: "onPlay", condition: {minLifeSelf: 1}, ops: [{op: "lifeTopToHand", count: 1}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand", cardType: "Character", typeIncludes: "Revolutionary Army", costAtMost: 4}, min: 0, max: 1, prompt: "Play from hand"}, {op: "playCards", ref: "b1"}, {op: "abortIfEmpty", ref: "b1"}, {op: "draw", count: 1}]},
  ],
  'OP09-104': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", cardType: "Character", typeIncludes: "Revolutionary Army"}, min: 0, max: 1, prompt: "Add to top of Life"}, {op: "handToLife", ref: "b1"}, {op: "requireCond", cond: {minLifeSelf: 2}}, {op: "lifeTopToHand", count: 1}]},
    {timing: "trigger", condition: {leaderMulticolor: true}, ops: [{op: "draw", count: 2}]},
  ],
  'OP09-105': [
    {timing: "trigger", ops: [{op: "deckTopToLife", count: 1}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 2, max: 2, prompt: "Trash 2"}, {op: "trashCards", ref: "b1"}], condition: {leaderTypeIncludes: "Egghead"}},
  ],
  'OP09-106': [
    {timing: "onPlay", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leader", nameIs: "Nico Robin"}, min: 0, max: 1, prompt: "+3000 power"}, {op: "powerMod", ref: "b1", amount: 3000, duration: "turn"}]},
    {timing: "trigger", ops: [{op: "draw", count: 3}, {op: "select", bind: "b2", filter: {owner: "self", zone: "hand"}, min: 2, max: 2, prompt: "Trash 2"}, {op: "trashCards", ref: "b2"}], condition: {leaderNameIs: "Nico Robin"}},
  ],
  'OP09-107': [
    {timing: "onPlay", ops: [{op: "trashLifeTop", owner: "opponent", count: 1}], condition: {minLifeOpp: 3}},
    {timing: "trigger", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "hand", cardType: "Character", colorIncludes: "Yellow", costAtMost: 3}, min: 0, max: 1, prompt: "Play from hand"}, {op: "playCards", ref: "b1"}]},
  ],
  'OP09-108': [
    {timing: "trigger", condition: {leaderTypeIncludes: "Revolutionary Army", maxTotalLife: 5}, ops: [{op: "playSelf"}]},
  ],
  'OP09-109': [
    {timing: "trigger", condition: {leaderNameIs: "Nico Robin"}, ops: [{op: "playSelf"}]},
  ],
  'OP09-110': [
    {timing: "onPlay", ops: [{op: "draw", count: 2}, {op: "select", bind: "b1", filter: {owner: "self", zone: "hand"}, min: 2, max: 2, prompt: "Trash 2"}, {op: "trashCards", ref: "b1"}]},
    {timing: "trigger", ops: [{op: "playSelf"}]},
  ],
  'OP09-111': [
    {timing: "trigger", condition: {leaderTypeIncludes: "Egghead", minHandOpp: 6}, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "hand"}, min: 2, max: 2, chooser: "opponent", prompt: "Trash 2 from your hand"}, {op: "trashCards", ref: "b1"}]},
  ],
  'OP09-112': [
    {timing: "onPlay", ops: [{op: "draw", count: 1}], condition: {maxLifeSelf: 2}},
    {timing: "trigger", condition: {leaderTypeIncludes: "Revolutionary Army", maxTotalLife: 5}, ops: [{op: "playSelf"}]},
  ],
  'OP09-114': [
    {timing: "onPlay", condition: {maxTotalLife: 5}, ops: [{op: "select", bind: "b1", filter: {owner: "opponent", zone: "characters", powerAtMost: 2000}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b1"}]},
    {timing: "trigger", condition: {maxTotalLife: 5}, ops: [{op: "playSelf"}]},
  ],
  'OP09-115': [
    {timing: "main", ops: [{op: "select", bind: "b2", filter: {owner: "opponent", zone: "characters", hasTrigger: true, costAtMost: 3}, min: 0, max: 1, prompt: "K.O. up to 1"}, {op: "ko", ref: "b2"}]},
    {timing: "trigger", ops: [{op: "draw", count: 1}]},
  ],
  'OP09-116': [
    {timing: "counter", ops: [{op: "select", bind: "b1", filter: {owner: "self", zone: "leaderOrCharacters"}, min: 0, max: 1, prompt: "+2000 power"}, {op: "powerMod", ref: "b1", amount: 2000, duration: "battle"}]},
    {timing: "trigger", ops: [{op: "select", bind: "b2", filter: {owner: "self", zone: "hand", cardType: "Character", typeIncludes: "Revolutionary Army", costAtMost: 4}, min: 0, max: 1, prompt: "Play from hand"}, {op: "playCards", ref: "b2"}]},
  ],
  'OP09-117': [
    {timing: "main", ops: [{op: "searchTop", count: 5, filter: {hasTrigger: true, nameNot: "Dereshi!"}, upTo: 2, to: "hand"}]},
    {timing: "trigger", ops: [{op: "draw", count: 1}]},
  ],
  'OP09-118': [
    {timing: "onEvent", on: {kind: "blockerActivated", who: "opponent"}, condition: {anyPlayerLifeZero: true}, ops: [{op: "winGame"}]},
  ],
  'OP09-119': [
    {timing: "onPlay", ops: [{op: "select", bind: "pay", filter: {owner: "self", zone: "don"}, min: 0, max: 10, prompt: "Return any number of DON!!"}, {op: "abortIfEmpty", ref: "pay"}, {op: "returnDon", ref: "pay"}, {op: "draw", count: 1}, {op: "grantKeyword", ref: "self", keyword: "Rush", duration: "turn"}]},
  ],
}

/** Continuous effects (auras), applied at read time. */
export const OP09_STATICS: Record<string, StaticDef[]> = {
  'OP09-004': [
    {target: {scope: 'oppCharacters'}, power: -1000},
  ],
  'OP09-017': [
    {donRequired: 1, condition: {leaderTypeIncludes: 'Kid Pirates', leaderPowerAtLeast: 7000}, target: {scope: 'self'}, keyword: 'Rush'},
  ],
  'OP09-025': [
    {condition: {leaderTypeIncludes: 'ODYSSEY'}, target: {scope: 'self'}, flag: 'noBattleKoByLeader'},
  ],
  'OP09-045': [
    {condition: {hasCharacterNamedAny: ['Buggy', 'Mohji']}, target: {scope: 'self'}, flag: 'noBattleKo'},
  ],
  'OP09-061': [
    {donRequired: 1, target: {scope: 'myCharacters'}, costMod: 1},
  ],
  'OP09-081': [
    {target: {scope: 'self'}, flag: 'noOnPlay'},
  ],
  'OP09-086': [
    {target: {scope: 'self'}, flag: 'noOppEffectKo'},
    {condition: {leaderTypeIncludes: 'Blackbeard Pirates'}, target: {scope: 'self'}, powerPer: {trashPerN: 4, amount: 1000}},
  ],
}

/** Cards fully handled by the keyword parser and/or the rules layer. */
export const KEYWORD_ONLY_OP09: string[] = ["OP09-054", "OP09-071", "OP09-091"]

/** The coverage ledger: every deviation from the printed text, with the reason. */
export const COVERAGE_NOTES_OP09: Record<string, string> = {
  'OP09-012': 'SIMPLIFIED: guards Bonk Punch against any non-battle K.O. (not only effects that name him)',
  'OP09-014': 'SIMPLIFIED: the lock is a flag the blocker check reads; only currently-granted Blocker is seen at select time',
  'OP09-018': 'SIMPLIFIED: K.O.s a single target with 4000 power or less (the 2-target total-power split is not modeled)',
  'OP09-033': 'SIMPLIFIED: "none of your" is a select-all prompt rather than automatic',
  'OP09-044': 'SIMPLIFIED: the hand trash happens after the search resolves',
  'OP09-052': 'SIMPLIFIED: revives on any K.O. during the opponent\'s turn (battle K.O.s included)',
  'OP09-058': 'SIMPLIFIED: the trigger bounce targets the opponent side only (rules allow either)',
  'OP09-061': 'SIMPLIFIED: the listener fires on any DON!! return, not only 2-or-more at once',
  'OP09-068': 'SIMPLIFIED: Blocker lasts through the opponent\'s next turn via a turn-anchored modifier',
  'OP09-084': 'SIMPLIFIED: the mode choice offers Double Attack or Blocker (Banish is dropped)',
  'OP09-093': 'SIMPLIFIED: the leader negation lasts this turn; the character negation and attack lock last through the opponent\'s next turn',
  'OP09-101': 'SIMPLIFIED: the Character is placed on TOP of the opponent\'s Life; face-up not modeled',
  'OP09-118': 'SIMPLIFIED: the win checks life totals when the Blocker is activated',
}
