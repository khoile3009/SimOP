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
- [x] M5 Phase B engine — DONE (Sep 2026). OP01 is now FULLY implemented: zero
      MISSING/PARTIAL ledger entries (only documented SIMPLIFIED deviations).
      Shipped: (1) event pipeline - 'onEvent' EffectDefs subscribe to engine
      events (eventActivated, characterKoed) via EffectDef.on queries, emitted
      from processor/koById choke points, turn-player-first (CR 8-6-1); unlocks
      Usopp OP01-004, Kaido leader OP01-061, Crocodile leader OP01-062.
      (2) K.O. replacement window - 'replaceKo' defs run INSTEAD of the K.O.
      (socket 2; mandatory replacements only - optional "you may instead" needs
      a confirm op, build with its first card). (3) cost modifiers - StaticDef
      scope 'myHand' + costMod, getEffectiveCost read everywhere costs are
      checked/paid (OP01-067). (4) rules-layer registry (engine/rulesLayer.ts) -
      names-as-sets (cardHasName; OP01-121 Yamato-as-Oden), deck copy limits
      (OP01-075 Pacifista any-number), battle attributes (battleAttributes.json
      from optcgapi; OP01-024 Strike shield). (5) revealed-hand knowledge -
      GameCard.revealed set by reveal ops (OP01-063 Arlong, OP01-105 Bao Huang),
      bounces, and trash-to-hand; life cards added to hand stay hidden (official
      ruling: revealed only to activate a [Trigger]); determinize pins revealed
      cards (first real knowledge tracking); vs-AI UI renders revealed opponent
      cards face-up and supports blind picks over face-down hands.
      Fleet-certified: 1200 games, zero invariant violations, ZERO unused
      effects. Coverage decks upgraded: leaders with abilities always anchor a
      deck, and every deck carries >=2 Events (this caught Crocodile leader's
      draw never firing - his deck had no Events to activate).
- [x] M6 Card ingestion + OP02 — DONE (Sep 2026). The "adding a set is a data drop"
      thesis held: OP02's 121 cards ingested with ZERO MISSING ledger entries.
      Harness: `npm run ingest -- OP-02` (scripts/ingest.ts) fetches optcgapi, converts
      to CardData, writes cards.json + battleAttributes.json; handles parallel-art
      dupes, embedded [Trigger] text, literal-NULL texts, space-joined colors, and
      type lists via a vocabulary splitter (unsegmentable strings are flagged, then
      added to SEED_TYPES by hand).
      New vocabulary OP02 forced (all incremental, no re-architecture): field cost
      modifiers (Modifier kind 'cost' + cost auras + getEffectiveFieldCost, recursion-
      guarded for cost-dependent aura conditions), stages as effect sources, endOfTurn
      timing with a pause-able turn switch (state.pendingEndTurn), 3 event kinds
      (donAttached/donReturned/characterPlayed with noBaseEffect filter), afterBattleKo
      timing (Isuka), player turnFlags (noLifeToHand) + one-shot playDiscounts
      (Kin'emon), DON!!-X as a first-class activation cost (cost.returnDon - the fleet
      caught bots spamming Byrnndi World's free activation before this), flags
      noEffectKo/noOppEffectRemove/noBlockCostAtMost/bottomDeckAtBattleEnd, ops
      drawTo/lifeTopToHand/oppReturnDon/powerModAll/costMod/restrictSelf/searchDeck.
      Coverage decks: leaders with abilities anchor, >=2 Events per deck, named-partner
      pairing (Fullbody rides with Jango - the fleet caught this too), Stage cards ride.
      Fleet-certified: 4800 games across 23 coverage decks (OP01+OP02), zero invariant
      violations; 1 advisory (OP02-017's DON!!x2 attack never fired - twin machinery
      OP02-004 fires; bot DON-stacking rarity, not a wiring hole). 92 tests green.
      NOT done here: eval retrain (parked with M4 gen-2 per the training-data decision).
      Per-set checklist for OP03+: ingest -> author defs vs the coverage test ->
      fleet 1200+ -> (once training resumes) RETRAIN EVAL -> A/B ladder gate.
- [x] OP03 (Pillars of Strength) — DONE (Sep 2026), the first true "data drop" set:
      123 cards, Yellow debuts (Big Mom life engine), zero MISSING entries, ZERO
      invariant violations on the first fleet run (OP02's first run had 34). New
      vocabulary was ops-only - no new timings, no architecture: life-stack ops
      (deckTopToLife / trashLifeTop / lifeTopToHand reuse / fieldToLife / simplified
      scryLifeTops), mill (millSelf + lifeDamageDealt event with source filters,
      Nami's engine), deck-out WIN inversion (rules layer deckOutWins - socket 6's
      headline use), 'attacked' event (Ace leader), powerModPerRef (+1000 per pitched
      card - first numeric-expression op), abortIfChosen (encodes "choose one" modes,
      Jango), trashToDeckBottom + typeContains ("CP" family), searchTop restTo trash,
      giveRestedDon toRef (Haruta), trashAtTurnEnd + noLeaderAttackTurnPlayed flags.
      Ingest hardening: foreign alt-art reprints dropped, [Trigger]-section vs
      keyword-mention splitting, literal-NULL types; 2 API-corrupted texts verified
      against limitless (OP03-013, OP03-042). Coverage decks: cross-set leader
      borrowing with color matching (OP03's {Impel Down} jailers ride with OP02
      Magellan - the fleet caught both bugs in this). Certified 3600 games / 33 decks
      / 3 sets: zero violations; 2 advisories remain (OP02-017/115 DON!!x2 attack
      effects - bot DON-stacking rarity). 95 tests green.
      Fidelity debt worth tracking: SIMPLIFIED notes grew to ~28 for OP03, mostly
      the DON!!-X-from-field class-picker debt and "top or bottom of Life" choices.
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
