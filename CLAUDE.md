# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SimPiece is a web-based One Piece Trading Card Game (TCG) simulator. V1 scope: OP01 set, local self-play (both sides), deck builder, automated card effects. Future: AI opponent (P1), online multiplayer (P2).

## Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Type check + production build
npm run lint         # ESLint
npm run format       # Prettier format all src files
npm run format:check # Prettier check (no write)
npm run test         # Run all tests once (Vitest)
npm run test:watch   # Run tests in watch mode
npx vitest run src/engine/rules.test.ts  # Run a single test file
npm run ingest -- OP-02  # Fetch + convert a set from optcgapi into src/data/<set>/
```

## Architecture

See `ARCHITECTURE_AND_PLAN.md` for the full spec. Key architectural decisions:

- **Pure Game Engine**: `src/engine/` is framework-agnostic TypeScript with zero React imports. It takes a `GameState` + `GameAction` and returns a new `GameState`. This enables unit testing without DOM, reuse for AI/network, and deterministic replays.
- **Command Pattern**: Every game action is a serializable discriminated union (`GameAction` in `src/engine/types.ts`). Enables undo, replay, network sync.
- **Player Adapter Pattern**: `PlayerAdapter` interface in `src/adapters/` abstracts input source (Human UI, AI, Remote WebSocket) so the engine doesn't care where actions come from.
- **Zustand as thin glue**: Zustand store in `src/store/` holds `GameState` and dispatches to the engine. React components subscribe to state slices.
- **Effect Registry**: Card effects are registered per card ID (not parsed from text). Each set has its own effect file (`src/data/op01/effects.ts`).

## Tech Stack

React 19 + TypeScript (strict) + Vite + Zustand + @dnd-kit + TailwindCSS v4 + Framer Motion + Vitest

Path alias: `@/` maps to `src/` (configured in tsconfig and vite.config.ts).

## Project Structure

- `src/engine/` — Pure game engine (NO React imports). Types, rules, processor, battle, effects.
- `src/data/` — Card data service (OPTCG API + IndexedDB cache), static fallback JSON.
- `src/store/` — Zustand stores (game state, deck builder, UI state).
- `src/adapters/` — PlayerAdapter interface + implementations (human, AI, remote).
- `src/components/` — React components: `pages/`, `game/`, `deck-builder/`, `common/`.
- `src/hooks/` — React hooks (useGameEngine, useDragCard, useCardData).
- `src/utils/` — Pure helper functions (shuffle, id generation, image URLs).
- `tests/` — Test files mirroring src structure.

## Effect System

Coverage: FULL for every main set on optcgapi — OP01–OP13, OP16, OP17 (Oct 2026;
OP-14/OP-15 are absent from the API). Every card is automated via effect defs +
statics in `src/data/<set>/effects.ts`, printed-keyword parsing, or the rules layer;
each set's `COVERAGE_NOTES` documents the remaining SIMPLIFIED deviations (enforced by
the shared coverage test). Each set is fleet-certified: 1600 games, zero invariant
violations. Authoring guards: the def linter, the IMPLEMENTED_CONDS check (every cond
key used in data must be implemented in statics.ts — update the set when adding a
cond), and the sign-drop rule (optcgapi drops minus signs on debuffs; all
opponent-bound power/cost mods must be authored negative). New sets enter in three steps:
1. `npm run ingest -- <API set id>` — fetch + convert cards.json/battleAttributes.json.
2. `npm run compile-effects -- <SET>` — the clause→ops pattern compiler drafts
   `effects.draft.ts` (~50-65% of cards fully compiled; unmatched clauses become TODO
   comments). It REFUSES anything it can't parse exactly — validated at 162/162 exact
   against the hand-authored OP01–03 defs (`--dry-run` mode reruns that comparison).
   Compiler output is authoring-time scaffolding only; card text is never parsed at
   runtime.
3. Hand-author the TODO residue until the set's coverage test passes. The def linter
   (`effects/__tests__/defLint.test.ts`) statically rejects unbound refs,
   free-to-activate cost encodings, keyword/type/name typos, list overlaps, and
   DON/once-per-turn marks on Event cards.
Key mechanisms beyond the basics: statics/auras (`effects/statics.ts`, applied at read
time — `getEffectivePower`/`hasKeyword`/`hasFlag` all take `state`), [Activate: Main]
abilities (`ACTIVATE_EFFECT` action, costs + once-per-turn), counter events
(`PLAY_COUNTER_EVENT`, pays DON cost; `USE_COUNTER` chains and `PASS_COUNTER` resolves),
[On Block] timing, two-phase choice ops (searches/scries pause on `pendingChoice` and
re-execute), opponent-as-chooser selects, all-or-nothing DON!!-X cost selects (`exact`),
restriction flags (taunt / cannotAttack / noBattleKo / noBlockPowerAtMost / per-attribute
noBattleKoBy*), and `untilTurn` modifier durations. Characters leaving the field return
attached DON to the owner's cost area (conservation invariant is tested).

Phase B machinery (M5): the **event pipeline** — `timing: 'onEvent'` defs subscribe via
`EffectDef.on` queries (`eventActivated`, `characterKoed`); `emitEngineEvent` queues
listeners turn-player-first from the choke points (event plays in processor.ts, KOs in
`koById`). The **K.O. replacement window** — a `timing: 'replaceKo'` def on the dying
card runs INSTEAD of the K.O. (mandatory replacements only, so far). **Cost modifiers** —
`StaticDef` scope `'myHand'` + `costMod`; `getEffectiveCost(state, pid, card)` is the
only correct way to read a hand card's cost (rules, processor, legalActions all use it).
**Rules layer** (`src/engine/rulesLayer.ts`) — `cardHasName` (names are sets; never
compare `data.name` directly), `deckCopyLimit`, `getBattleAttribute` (real battle
attributes live in `src/data/op01/battleAttributes.json`; cards.json's `attribute` field
holds the TYPE list). **Revealed knowledge** — `GameCard.revealed` marks publicly-known
cards in hands (reveal ops, field bounces, trash-to-hand); life cards added to hand stay
HIDDEN — the official ruling reveals a life card only to activate its [Trigger]; cleared
on draw or bottom-deck; `determinize` pins revealed cards instead of resampling them.

M6 additions (OP02): **field cost modifiers** — `Modifier` kind `'cost'`, cost auras
(StaticDef `costMod` on field scopes), and `getEffectiveFieldCost(state, card)` for all
cost-based targeting/conditions (recursion-guarded: aura conditions that ask about costs
settle on printed+modifiers). **Stages are effect sources** — activatables, statics,
[Trigger] plays, and K.O. targets all handle `player.stage`. **`endOfTurn` timing** —
[End of Your Turn] defs queue on END_TURN; a choice inside one sets
`state.pendingEndTurn` and the turn switch completes when the stack drains. **Events**
`donAttached` / `donReturned` / `characterPlayed` (with `noBaseEffect`/`fromHand`
query filters), and `afterBattleKo` timing on attackers. **Player turn state** —
`state.turnFlags` (e.g. 'noLifeToHand') and one-shot `state.playDiscounts`, both cleared
at end of turn. **DON!!-X activation costs** — `EffectDef.cost.returnDon` pays up front
(rested first) and emits `donReturned`; ops-encoded DON!!-X selects are only for
auto-timing effects where paying is optional.

OP03 additions: **life-stack ops** (`deckTopToLife`, `trashLifeTop`, `fieldToLife`,
`scryLifeTops` — Yellow's engine), **mill** (`millSelf` + the `lifeDamageDealt` event
with `sourceIsSelf` filters — Nami; deck-out can be a WIN via the rules layer's
`deckOutWins`), the **`attacked` event** (listeners on the attack's target),
**`powerModPerRef`** (per-count power mods), **`abortIfChosen`** ("choose one" modes:
a mode-1 select left empty falls through to mode 2), `trashToDeckBottom`, `typeContains`
(substring type match for the "CP" family), `searchTop`'s `to/restTo: 'trash'`, and
`giveRestedDon`'s `toRef`.

## Effect System (Phase A)

- `src/engine/effects/ast.ts` — data-DSL for card effects: an `EffectDef` is timing + condition + `[DON!! xN]` requirement + a list of ops (draw, select, powerMod, grantKeyword, ko, rest, bottomDeck, playSelf, abortIfEmpty). Effects are data so cards can be added without engine changes.
- `src/data/op01/effects.ts` — effect definitions keyed by card ID (grow coverage here); `src/engine/effects/registry.ts` looks them up.
- `src/engine/effects/interpreter.ts` — runs `GameState.stack` frames until empty or a `select` op pauses on `state.pendingChoice`; the choice is answered by a `CHOOSE` action (enumerated by legalActions, validated by rules). Shared helpers: `koById` (queues [On K.O.]), `drawCards`, `updateFieldCard`.
- Modifiers: `GameCard.modifiers` carry power deltas and keyword grants with durations (`turn`/`battle`/`untilYourNextTurn`/`permanent`); expiry happens in `executeEndPhase`, `executeRefresh`, and end of battle. Power is always computed (`getEffectivePower`), never stored.
- Keywords: `src/engine/keywords.ts` parses PRINTED keywords positionally (ability-opener position only — "gains [Rush]" or "cannot activate a [Blocker]" are mentions, not possession) and checks modifier-granted keywords. Never use `effectText.includes` for keywords.

## Playing vs the AI

`/play` offers "vs AI" (greedy agent drives player2 via `useAiDriver` in PlayPage; its hand
renders face-down, mulligan auto-decided) and "Hotseat". Human decision surfaces, all
driven by `legalActions`: ChoicePrompt modal for `state.pendingChoice` (any zone,
min/max/exact enforced), TriggerPrompt for life triggers, blocker buttons and
counter-event buttons in ControlsBar during battle, and "Activate: <name>" buttons for
[Activate: Main] abilities in the main phase. The coverage ledger for unimplemented
cards lives in `src/data/op01/effects.ts` (`COVERAGE_NOTES`, enforced by
`src/data/op01/__tests__/coverage.test.ts`).

## AI / Simulation Layer

- `src/engine/legalActions.ts` — `whoActs(state)` + `legalActions(state)`: enumerates every legal action for the acting player (mulligan, main phase, block/counter steps, trigger prompts). Candidates are generated structurally and filtered through `validateAction`, so enumeration can never disagree with the rules module. Counter-step options are deliberately pruned to PASS + the cheapest battle-flipping subset.
- `src/ai/evaluate.ts` — hand-tuned logistic evaluation returning a win-probability estimate in [0,1]. Same shape as logistic regression so weights can later be fitted from self-play logs. `explainEvaluation` returns per-feature contributions for the analyzer UI.
- `src/ai/agents.ts` — `Agent` interface + `RandomAgent` + `GreedyAgent` (one-ply, with opponent best-response rollout through battle interrupts).
- `src/sim/selfplay.ts` — headless seeded self-play (`runGame`, `runMatch`, `makeAutoDeck`). Deterministic per seed via `src/utils/rng.ts` (`setRandomSource`); the UI keeps `Math.random`.
- `npm run selfplay -- <n> <modes>` — e.g. `npm run selfplay -- 30 gr` (greedy vs random), modes: `g`/`r` per player. Prints win counts and a per-turn win-probability trace.
- `src/ai/turnSearch.ts` — whole-turn line search (beam + adversarial verification + lethal certificates) powering the Analyze panel, and `TurnPlannerAgent` (plans a turn, follows the line, replans on divergence).
- `npm run benchmark -- <gamesPerPair>` — agent strength ladder (random/greedy/planner), mirror deck, seat-swapped, seeded. Reference result: planner 85% > greedy 65% > random 0%; planner beats greedy ~70%.
- `npm run playtest -- <n>` — the invariant/coverage fleet (see the playtest skill).

## Card Data

Card data is a **static JSON file** at `src/data/op01/cards.json` (no runtime API dependency). Card images are loaded from the [Limitless TCG CDN](https://onepiece.limitlesstcg.com/cards):
- Image URL pattern: `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/OP01/{CARD_ID}_EN.webp`
- Visual reference: [onepiece-cardgame.dev](https://onepiece-cardgame.dev/cards?f=%24R+%28srcN%3A%22Romance+Dawn+%5BOP-01%5D%22%29)

**Important**: Only non-alternate (base) art versions. Each card ID (e.g., OP01-024) has exactly one entry.

## Game Rules Reference

The authoritative rules spec is in `ARCHITECTURE_AND_PLAN.md` Section 2. Critical rules to keep in mind when implementing:
- First player: no draw on turn 1, only 1 DON on turn 1, neither player attacks on turn 1
- Battle sequence is 4 steps: Attack → Block → Counter → Damage (all within Main Phase)
- Counter cards are played from hand only (no cost), field characters cannot counter
- Max 5 characters on field; playing a 6th requires trashing one (no When KO'd trigger)
- Characters at 0 power are NOT destroyed (only via battle loss or explicit KO effects)
- Life damage: life card goes to hand, player may optionally activate its Trigger effect
- DON attached to characters returns to cost area (rested) at End Phase

## Styling

Dark oceanic theme with glassmorphism panels. Custom colors defined in `src/index.css` via `@theme`:
- `ocean-*`: background gradients
- `don-gold`: DON!! / resource accent
- `life-red`: life/damage
- `action-green`: valid actions
- `text-primary`, `text-secondary`, `text-muted`: text hierarchy

Use `glass-panel` class for card zone containers.
