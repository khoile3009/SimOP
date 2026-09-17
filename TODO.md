## Roadmap

- [x] M1 Rules-solid core — engine gaps closed, fleet-certified (1200 games, zero violations/unused effects)
- [x] M2 Analyzer — eval bar, adversarially-verified turn lines, lethal certificates, Honest mode
- [x] M3 MCTS — perfect-info UCT beats planner (ladder: mcts 73% > planner 50% > greedy 27%); determinization; difficulty select
- [~] M4 Learned eval — pipeline SHIPPED, generation 1 REJECTED by the gate (working as designed):
      Done: mk2 features (threshold/rent/counter-pressure buckets, trade coverage, leader
      one-hots; dynamic feature vector), evalFn injectable through all agents, npm run
      gendata (33k rows / 3k games, by-game train/test split), npm run train (TS logistic,
      calibration report), npm run evalab (hand-vs-fitted, cross-deck, seat-swapped).
      Gen-1 result: prediction improved a lot (test log-loss 0.59 -> 0.47, calibration
      monotone) but LOST the ladder (fitted 20-40% win rates) - prediction != decision
      quality. Diagnosis: (a) turn-start-only sampling means the mid-turn AFTERSTATES that
      decisions compare are out-of-distribution; (b) correlational traps - e.g. high
      counterHandDiff weight teaches agents to hoard counters because winners happen to
      hold more, not because holding wins; (c) random-agent games pollute labels.
      PARKED (user call, Sep 2026): keep hand weights until card coverage is complete
      (M5+M6) - training on the partial pool would bake a truncated meta into the
      weights, and card completeness is the bigger unlock. The pipeline stays ready;
      gen-2 when resumed: sample mid-turn afterstates, drop random games from the mix,
      add the deck-potential features from the draw-planning research
      (deckCounterDensity, curveNextTurn hypergeometric, deckThreatDensity,
      triggerDensity - honest by construction via the hidden-pool multiset), re-gate.
      Gen-3 option if needed: pairwise ranking loss over (chosen, rejected) afterstates.
- [ ] M4.5 Draw-planning abstractions (from research, effort-ordered; #2-#4 are
      independent of the learned eval and can land anytime; #1 waits with gen-2).
      Full research + implementation spec: https://claude.ai/artifact/RMxsm56stRe8Uq5U9kbRUx
      1. deck-potential eval features (folds into M4 gen-2);
      2. opponent-outs punisher pass on verified lines ("if they draw removal-class -> n%",
         commit-vs-hold dial via mean-minus-spread ranking);
      3. chance-node draw steps in MCTS at turn boundaries (Choe & Kim 2019 lazy
         determinization + Zhang-Buro outcome bucketing; fixes topdeck clairvoyance);
      4. playing-to-your-outs mode (when max win% < threshold, rank lines by P(win | best
         draw class) - direct transcription of pro play; unpublished as an AI technique).
- [ ] M5 Phase B engine — event pipeline, replacement interceptors, cost modifiers,
      rules-layer registry; unlocks the 7 deferred OP01 cards.
- [ ] M6 Card ingestion + OP02 — LLM emits EffectDefs, schema+coverage-ledger gates.
      Per-set checklist (mostly automatic): ingest defs -> coverage decks auto-expand ->
      fleet campaign (correctness: violations/usage holes) -> RETRAIN EVAL (one command;
      features are set-agnostic, weights drift with the meta) -> A/B ladder gate.
      A new MECHANIC (not just new cards) may warrant a new feature - a calibration drop
      on new-set games is the signal that the feature set can't express something.
- [ ] M7 Online multiplayer (original P2) — serializable actions make this feasible whenever.

## Tasks

- [ ]: If we click into trash, show modal of the trash pile
- [ ]: When the character on the field, if the character is allowed to attack and you drag the character, show an arrow from character to the cursor, if release on a target, attack that target
- [x]: Support multiple counter — USE_COUNTER now keeps the defender in the counter step (chain counters, then Pass resolves damage); [Counter] events are their own action (PLAY_COUNTER_EVENT) and pay their DON cost

Engine rules gaps — ALL CLOSED in M1 "rules-solid core" (verified by a 1200-game
coverage campaign: zero invariant violations, zero unused effects, counter events
live at 1385 uses):

- [x]: DON rest/return timing: unspent cost-area DON keeps its state through the opponent's turn, and given DON returns (rested) at the owner's Refresh (CR 6-2-3/6-2-4) — counter events are now payable on defense and [DON!! xN] [Opponent's Turn] conditions actually fire.
- [x]: DON power bonus is your-turn-only (CR 6-5-5-2) — defenders no longer get +1000/DON.
- [x]: 6th-character replacement (CR 3-7-6-1): playing onto a full board demands a trash via the '$boardFull' rule-processing pseudo-def (board-picker UI for free; the trash is NOT a K.O., verified against [On K.O.] cards). CHOOSE_CHARACTER_TO_TRASH action removed.
- [x]: Double Attack + Trigger: a trigger suspends damage processing and the remainder resumes after it settles (state.pendingDamage, CR 8-6-2-1).
- [x]: Setup order: life is dealt after both mulligans (CR 5-2-1-6/7).
- [x]: ACTIVATE_TRIGGER accept:true now runs the card's registered trigger effect (cards without a registered effect keep legacy stay-in-hand behavior).
- [x]: DON duplication: ATTACH_DON used to rest DON in the cost area while End Phase minted new ones for each attached DON, inflating the economy every turn. Attaching now removes them from the cost area; a DON-conservation invariant test guards this.
- [x]: UI: pendingChoice picker (ChoicePrompt modal), trigger prompt, blocker buttons, [Activate: Main] buttons, counter-event buttons — humans can now play every implemented mechanic; vs-AI mode drives player2 with the greedy agent.

Backlog (feature ideas):

- [x]: UX (from playtest fleet): trivial block/counter prompts now auto-advance in the engine — the 91%/68% dead-prompt rates measured pre-fix are 0%/12% post-fix. Still open from that report: 25% of effect choices offer exactly one option — one-tap confirm or auto-pick for mandatory single-option effects.

- [x]: UI/UX streamlining phase 1 — "the board is the picker": field-zone effect choices highlight eligible cards in place (green ring, dim ineligible) with the prompt/confirm in the ControlsBar strip; hand-zone choices reuse the counter-step hand toggles (HandZone pickMode); hidden-zone choices (deck/trash/life/DON) use a non-dimming bottom sheet instead of a full-screen modal. Triggers keep a small centered prompt. Remaining ideas: single-click plays, hover previews instead of Inspect.
- [x]: M2 analyzer shipped: chess-style eval bar + Analyze toggle, eval-history sparkline, and whole-turn line recommendations (src/ai/turnSearch.ts) — beam search generates candidate lines, then each is ADVERSARIALLY VERIFIED (minimax over every defender option at every response node, so counter allocation across the turn is priced in; diverged tails repaired greedily). Published value = worst case; "if they X → n%" branch annotations on the top line. Lethal badges: GUARANTEED (closed-form defense-capacity certificate vs any possible hand — ignores life triggers, noted in tooltip) vs LETHAL (through best defense with their revealed hand).
- [x]: M3 shipped: determinization (src/ai/determinize.ts — hidden pools resampled uniformly, incl. own life per CR 3-10-2), MctsAgent (src/ai/mcts.ts — perfect-info UCT with eval leaves, tree crosses turn boundaries and searches its own defense) beating the acceptance gate: mcts 73% > planner 50% > greedy 27% on the 30-game ladder (mcts vs planner 20-10). Analyzer Honest mode: 10 sampled worlds, lines ranked by world-frequency with avg value and "lethal in X% of worlds". AI difficulty select in /play (greedy/planner/mcts).
- [ ]: M3 leftovers: click-through board preview per line step; honest-information MCTS variant (determinized root voting) for a fair hidden-info bot; knowledge tracking for determinize (cards seen via searches/bottom-decking are currently resampled uniformly).
- [ ]: Class-based DON picker (design approved — v1 grouped-modal variant): DON are fungible within a class (zone, carrier, state incl. rested/frozen), so selection = count per class, never "which physical DON". Design draft with interactive prototype + engine mapping: https://claude.ai/artifact/VQkJ7FGmdYNLnapQ4J6xaS
  Build when an effect must touch attached DON (restand/attach manipulation in later sets, or full-fidelity DON!!-X — current OP01 DON!!-X pays from the cost area only, which is fine for now). Engine diff when built: grouped PendingChoice shape ({key, carrierUid?, capacity}), CHOOSE as count-vector, returnDon/restand ops accept {class: count}, legalActions emits canonical count-vectors (also shrinks bot action space). Card-target choices keep the flat instanceId shape.
