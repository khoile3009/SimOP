---
name: playtest
description: Deploy the SimPiece bot-tester fleet - hundreds of seeded self-play games with invariant checks, usage-hole detection, and measured UX friction notes. Use whenever the user asks to playtest, run the bots/fleet/testers, check game or engine health, ask "did that break anything?", or after any engine, effect-definition, or card-data change worth validating at scale.
---

# Playtest fleet

Run a campaign of seeded bot games and triage what falls out. The fleet plays
greedy and random agents against each other across four matchups; every action
is checked against engine invariants, and the campaign tracks which actions and
card effects ever actually occur.

## Run

```bash
npm run playtest -- 800
```

(Default 400 when no count given; 800+ is a good standard campaign, ~5s. Use
2000+ after big engine changes.) Harness: `scripts/playtest.ts` on top of
`src/sim/playtest.ts`.

Games rotate across **coverage decks** (`src/sim/decks.ts`): the set's card pool
is partitioned so every card rides in at least one deck, and leader-conditioned
effects ride with a leader that satisfies them. Newly added cards join the decks
automatically - an effect that never fires anywhere shows up as a usage hole.

## Triage the report

Work through the sections in this order - they're sorted by severity:

1. **Violations** (exit code 1): an impossible state was reached (card/DON
   conservation, board overflow, malformed choices) or a game threw. Each one
   is written to `playtest-failures/game-<n>-seed-<s>.json` with the seed,
   matchup, action index, and full action history. Games are deterministic:
   rerunning the same seed + matchup reproduces the bug exactly, so bisect by
   replaying the history prefix. Fix before anything else.

2. **Usage holes**: an expected action type or a registered `cardId:timing`
   effect that occurred zero times across the whole campaign. This is the
   signature of an unpayable cost, a dead condition, or unreachable timing -
   e.g. PLAY_COUNTER_EVENT at zero exposed the end-phase DON-rest bug. Explain
   every hole: either point at the known cause (check TODO.md's engine-gaps
   list first) or investigate the effect definition and its cost path.

3. **UX suggestions**: friction measured from what the bots were prompted with
   (trivial block/counter prompts, single-option choices, mass-declined
   choices), each with a percentage. Record noteworthy ones in TODO.md's
   Backlog section WITH their numbers so priorities stay evidence-based; skip
   ones already listed.

4. **Balance drift**: compare wins/avg-turns against the previous campaign
   (memory or recent TODO notes). Mirror matchups should stay near 50/50 with
   no draws; a shift after an effect change usually means a card is doing the
   wrong thing - check the newest effect definitions first.

## Report back

Summarize for the user: violations (with repro seeds), each usage hole and its
explanation, UX notes recorded, and balance vs the last run. File engine bugs
in TODO.md's engine-gaps section; UX items go to the Backlog section.
