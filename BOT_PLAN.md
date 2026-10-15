# Bot Improvement Plan

Brainstormed Oct 2026, after full card coverage (OP01–OP17, EB01–EB04, PRB01/02 —
2,278 cards). Current ladder: **mcts 73% > planner 50% > greedy 27%** (mirror decks,
seat-swapped). Two learned-eval generations were built and rejected by the decision
gate (see TODO.md M4); hand weights in `src/ai/evaluate.ts` are active.

## 0. The queue (updated Oct 2026, after the first full improvement cycle)

State: hand eval + three adopted nonlinear features is the champion; five
learned evals rejected by the gate; planner fast; base decks frozen; honest
PIMC agent built but budget-tuning. The loops that provably work: (a) play
observation -> named concept -> feature -> gate (2-for-2 today, ~1h each),
(b) search/infra engineering validated by the ladder.

**Next up (agent)**
1. DONE (Oct 2026): P3 complete. Honest PIMC shipped as Hard first (4x500,
   61%/57%); then IS-MCTS (src/ai/ismcts.ts, Cowling 2012) REPLACED it as
   Hard: one shared information-set tree, a fresh determinization threaded
   through per iteration (subsumes the chance-node fan-out), edges keyed by
   the root player's OBSERVATION (hidden-at-root ids key by printed card
   identity, public ids stay stable, duplicate hidden cards collapse to one
   info-set action), availability-adjusted UCB1. Budget-matched gate
   (gate-ismcts.ts, 2000 iters vs honest 4x500): 56% (18-14) vs honest PIMC
   AND 54% (13-11) vs the oracle - the double-positive signature. n=32/24
   (~30s/game), so the margin is directional; honest stays pickable as
   "classic". ~32s/game wall-clock, similar order to honest.
2. Knowledge tracking in determinize.ts: pin cards seen via searches /
   bottom-decks (today they resample uniformly). Improves the honest agent,
   Honest-mode analyzer, and any future belief modeling, and it is pure
   engineering.
3. Feature mining cadence: a play session per week-ish; every bot misjudgment
   becomes a FEATURE_IDEAS entry below, best one gets implemented + gated.
   - M4.5 #4 playing-to-outs (Oct 2026): analyzer SHIPPED, planner REJECTED.
     Below a 0.35 rank value, lines extend through their reply into OUR
     next-turn draw per out-class (forceDeckTop before our END_TURN; the top
     survives their turn), re-ranked by bestDraw then flipMass; AnalyzePanel
     badge + "wins if you draw <classes> - N% of deck". gate-outs.ts: 47% of
     100 vs outsThreshold:0 - no adoption, but the mode only acts in
     mostly-lost games so the all-games gate is low-powered for it; a
     desperate-positions-only benchmark would be the fair re-test.
   - DONE (Oct 2026), M4.5 #2 opponent-outs punisher pass: src/ai/outs.ts
     sampleOutClasses (removal read from effect defs, threat/counter/blocker,
     median ordinary); turnSearch replays each verified line to pre-END_TURN,
     forces one class rep onto their deck top, plays their greedy reply turn,
     and publishes afterReply {expected, worstDraw, branches}. Analyzer
     renders reply chips + per-class draw branches. Planner ADOPTED the
     commit-vs-hold dial (rank by 0.5·expected + 0.5·worstDraw): 57-43 (57%)
     over worst-case ranking across 100 seat-swapped base-deck games
     (scripts/gate-punish.ts). sampleOutClasses is the shared utility #4
     (playing-to-outs) reuses.
4. League bootstrap (4.1): freeze champion-v1 (hand+P0b eval, mcts300) in
   src/ai/league/; persistent ladder-results file; future adoptions must beat
   a league quorum, not just the latest.
5. Data flywheel (4.5): ladder/gate runs append gen3-format rows passively, so
   the corpus grows 10-50x without dedicated compute - reopens the learned-eval
   question for free later.

**Next up (app)**
6. DONE (Oct 2026): ST-set ingestion (35 starter decks, 365 cards, one combined
   module) -> base decks regenerated with the real ST staples (see 4.5).
7. UX: one-tap confirm for single-option effect choices (fleet: 60% of choices),
   the approved DON class picker, trash-pile modal, drag-to-attack arrow.
8. Difficulty tiers as time budgets per move, not algorithm names.

**Funded-when-wanted (research-grade)**
9. Rich-input learned eval: per-card board representation (the effect-AST gives
   free card features), set-of-cards encoder, trained on the flywheel corpus -
   the only remaining path to a learned eval that can out-know the features.
10. Opponent range modeling: archetype inference from revealed cards weighting
    determinizations.
11. M7 online multiplayer (actions are already serializable).

**FEATURE_IDEAS (from play observations - the proven loop)**
- Double Attack-aware lifeDanger (2-life hits deserve defense a bucket earlier).
- Trigger-equity when taking hits (life with triggers is worth MORE to take).
- Rested-blocker tempo: a blocker that rested this turn is exposed next turn.
- Don-curve stall: holding 2+ unspent DON at end of turn is usually a leak.

## 1. The counter-economy problem (first priority)

Observation (from play-testing): playing a 2000-counter card to the board removes it
from your hand's defensive pool, so the "same tempo" play can leave you strictly worse
on defense. The eval must price this.

What exists today: `counterHand` sums `getEffectiveCounter` over the hand, weighted
`counterHandDiff: 0.05` — a flat linear term. So playing a counter card *does* lower
the afterstate score, but the price is constant: it ignores whether the counters are
actually needed.

Planned changes (all in `src/ai/evaluate.ts`, gated by the benchmark ladder):

- **Defense-coverage ratio instead of a flat counter sum.** Compute expected incoming
  damage next turn (opponent attackers × their power margins over our bodies/leader)
  against our defensive capacity — counter total in hand, live blockers, life buffer.
  The lethal certificate in `src/ai/turnSearch.ts` already computes exactly this
  defense-capacity bound (hand×counter + blockers, small knapsack); reuse its math as
  a *graded* feature (coverage ∈ buckets: dead / tight / comfortable) rather than only
  as a binary lethal check.
- **Threat-conditional counter value.** Counters in hand are worth a lot when the
  opponent's board can attack next turn and we're at low life; near zero when their
  board is empty and we hold the race. Multiply the counter-hand term by a pressure
  factor (opponent rested/active attackers, our life) instead of a global 0.05.
- **Spend-order policy.** Whenever an effect asks "trash/pay a card from hand", the
  choice enumerator should prefer 0-counter cards all else equal (move ordering /
  greedy tie-break), so costs stop silently burning 2k counters. Cheap, search-free.

## 2. What the research says

Fresh survey on top of the Sep 2026 "Topdeck Problem" research (Karsten hypergeometrics,
Who's-the-Beatdown role valuation, lazy chance-node ISMCTS = 2019 Hearthstone competition
winner, Zhang–Buro chance bucketing, PIMC strategy-fusion pathology, Suphx oracle):

- **Hidden information:** determinized/IS-MCTS remains the standard for CCGs; the
  practical guidelines paper (Świechowski & Tajmajer) recommends removing explicit
  chance ("nature") moves, separating decision vs simulation states, and transposition
  tables — our determinize.ts + perfect-info UCT matches the baseline; the chance-node
  and information-set upgrades are the known next steps.
  ([guidelines](https://annals-csis.org/Volume_25/pliks/3.pdf),
  [PIMC+ISMCTS Hearthstone](https://arxiv.org/pdf/1808.04794))
- **Eval functions:** feature-based evaluators with fitted weights are the standard
  recipe, and even small learned models help most when used to *guide search* rather
  than replace it ([evolved evals](https://ar5iv.labs.arxiv.org/html/2105.01115),
  [MCTS+SL](https://arxiv.org/pdf/1808.04794)).
- **Search-robust training (our gen-2 failure mode):** two precedents fit exactly:
  - *Pairwise ranking loss* (RankNet-style) on positions instead of absolute
    win-probability regression — more training signal per game, and it optimizes
    exactly what search consumes: the *ordering* of afterstates
    ([ICGA 2019](https://content.iospress.com/articles/icga-journal/icg190108),
    [Texel tuning baseline](https://chessprogramming.org/Texel%27s_Tuning_Method)).
  - *Bootstrapping from search* (Veness et al., NeurIPS 2009): regress the eval toward
    deep-search root values from self-play, not game outcomes — the eval learns to
    agree with search, which is the property gen-2 lacked
    ([paper](https://neurips.cc/virtual/2009/poster/1641); modern NNUE pipelines do
    the same with fixed-node self-play, cf. [Giraffe](https://alphaxiv.org/abs/1509.01549)).
- **Benchmarking:** no standard CCG benchmark exists; competitions used premade-deck
  ladders, and even strong RL agents (ByteRL) stay *exploitable* — win rate against a
  fixed pool is not robustness
  ([competition summary](https://arxiv.org/pdf/2305.11814),
  [exploitability](https://arxiv.org/pdf/2404.16689)).
  Keep our seat-swapped cross-deck ladder as the gate, and add a best-response
  spot-check (train/search an exploiter against the candidate).

## 3. Workstreams

**P0b — life-stage counter policy (over-countering) — ADOPTED (Oct 2026)**
Play observation (user): bots burned counters defending leader hits at full
life, where good play takes the damage (the life card joins the hand, so early
hits are near card-neutral). Probe confirmed: 81% of leader attacks defended at
4-5 life, same as at 0-1 (scripts/probe-overcounter.ts). Cause: linear
lifeDiff 0.5 dwarfing the card-economy terms. Fix: convex life value -
lifeDiff 0.2 + new lifeDanger feature (max(0, 3 - life), weight 0.35).
Behavior after: 2% defended at 4-5 life, 71% at 2-3 (counters banked early get
spent where they matter), 83% at 0-1. Gate vs the pre-change weights: greedy
142-158 (47%, parity) and MCTS 41-31 (57%) - adopted on the same
greedy-parity/MCTS-up signature as P0. Known nuance for later: Double Attack
hits (2 life) may deserve defense one bucket earlier.

**P0 — counter economy + eval hygiene — DONE (Oct 2026, ADOPTED)**
Shipped as `defenseShortfall(side, attacker)` in evaluate.ts: demand = the
attacker's counterPressure, supply = hand counters + 2k per live blocker, minus
life the side can tank (down to 2); weight `defenseShortfallDiff: 0.08` on top
of the flat counterHandDiff (which already gives every agent the 0-counter-first
spend-order tie-break). Gate (scripts/gate-eval.ts, base-deck pairs,
seat-swapped): greedy 147-153 (49%, parity) and **MCTS 43-29 (60%)** — the
deep-search consumer improves, the exact property gen-1/gen-2 lacked.

**P1 — planner performance — DONE (Oct 2026)**
Eval waste, not action-space size: the beam sort re-ran the eval in its
comparator, identical states were re-evaluated (per-search WeakMap memo now),
and beam interrupts used the raw eval. Planner budgets: maxExpansions 6000,
verifyBudget 1200 (analyzer keeps the richer defaults). Worst deck ~30s/game ->
~5s; strength re-gated at planner 73% vs greedy. Profiler:
scripts/profile-planner.ts.

**P2 — gen-3 learned eval — iteration 1 RUN, NOT ADOPTED (Oct 2026)**
Pipeline shipped and exercised end to end (~1.5h: 480 MCTS self-play games on
the base decks via scripts/gendata3.ts -> 158k pairs + 64k boot rows ->
scripts/train-gen3.ts -> gates). Both variants rejected by the ladder:
- RANK (same-parent pairs, RankNet): test pair-accuracy 58.2% vs 57.6% hand,
  but gate 24% greedy / 35% MCTS - REJECTED HARD. Diagnosis: same-parent pairs
  teach an ACTION-STYLE prior, not state value (it learned negative hand-count
  and active-units weights = "search likes developing"), which as an absolute
  eval rewards dumping cards.
- BOOT (regress toward MCTS root values, Veness): test CE 0.566 vs 0.571 hand,
  gate 46% greedy / 44% MCTS - parity-minus, NOT adopted. Expected ceiling:
  the label search was GUIDED BY the hand eval, so one pass is a single policy-
  iteration step off its own teacher.
Hand weights (with P0's counter economy) remain the champion.

**Gen-3.1 (deep labels) — RUN, REJECTED (Oct 2026).** 150 games at 1000
iterations (3.3x deeper labels), outcome field added; BOOT gated 45%/42%,
BLEND (0.75 search + 0.25 outcome) gated 48%/39% despite the best prediction
metrics yet (CE 0.555 vs 0.570) and sane weights (it independently rediscovered
the convex life curve: lifeDanger 0.31 vs our hand-set 0.35).

**The pattern after four rejected fits** (gen-1 outcomes, gen-2 afterstates,
gen-3 rank/boot, gen-3.1 deep boot): a LINEAR model fit to targets produced by
search-over-that-same-linear-eval mostly recovers its teacher - the tactical
gains search finds are state-specific and not expressible as better global
weights on these features. Meanwhile every adopted improvement (threshold
buckets, defenseShortfall, lifeDanger) was a new hand-designed NONLINEAR
feature. Conclusion: the target is now right; the FUNCTION CLASS is the
bottleneck. Next steps, in order:
1. Keep mining nonlinear hand features from play observations (cheap, 2-for-2
   adoption rate; each also enriches any future learned model's inputs).
2. Small MLP over the feature vector - RUN, REJECTED (Oct 2026): 16 tanh
   hidden units, AdamW + early stopping (the corpus overfits in ~2 epochs -
   rows within a game are correlated), best val CE 0.5583 vs hand 0.5701.
   Gate: 45% greedy / 39% MCTS - the same parity-minus shape as every linear
   fit. CONCLUSION UPDATE after five rejected learned evals: with these 20
   aggregate features, capacity does not help - the inputs are information-
   saturated. The eval improves when a NEW feature adds information (3
   adoptions, all hand-designed from play observations), not when weights or
   function class change over the same features. Remaining learned-eval levers,
   both expensive: a 10-50x corpus (the overfitting ceiling is data-bound too),
   or genuinely richer inputs (per-card board representation / embeddings).
   The practical loop stays: watch games -> name the missing concept -> add the
   feature -> gate. Trainer/runtime kept (scripts/train-mlp.ts,
   src/ai/mlpEval.ts, weights archived) for when either lever is funded.

**P3 — honest-information search**
- IS-MCTS / multiple-observer variant over the existing determinizer (stop averaging
  incompatible worlds at the root — strategy-fusion fix).
- DONE (Oct 2026): chance-node bucketing for draw/life reveals (Zhang–Buro).
  src/ai/chance.ts + mcts.ts: END_TURN draws and leader-hit life reveals fan
  into weight-proportional outcome children over resampled unknown orderings
  (seenByOwner/revealed pinned), width damped 3->2->1 with chance depth.
  Default ON for MctsAgent and HonestMctsAgent (gate-eval's deep leg now
  searches without topdeck clairvoyance). Gate (scripts/gate-chance.ts,
  seat-swapped, enel/luffy-bg + teach/ace pairs): honest+chance 63% (15-9)
  vs honest; oracle+chance 45% (27-33) vs oracle - parity within noise, the
  oracle was genuinely profiting from knowing the future deck order.
  Remaining clairvoyance: searches/effect draws inside a turn still resolve
  from the fixed order.
- Knowledge tracking: revealed cards already pin determinization; extend to "opponent
  searched deck for X type" constraints.

**P4 — exploitability + meta benchmarks**
- Fixed benchmark deck pool (one per color archetype incl. OP15 Enel 6-DON, Brook
  mill, black trash-count) so ladders are comparable across engine versions.
- Best-response exploiter runs against any candidate agent before adoption.

## 4. Long-term program: the improvement loop

The workstreams above are the current queue; this is the standing machinery that
keeps the agent improving indefinitely. The principle throughout: **every change
passes the same decision gate** (seat-swapped cross-deck ladder, greedy + MCTS
consumers), because both failed eval generations looked great on every other metric.

### 4.1 The agent league (regression protection)

Freeze each adopted agent as a named snapshot - eval weights + search config,
e.g. `v1-hand/mcts300` - in `src/ai/league/`. A candidate is adopted only when it
beats a quorum of the league, not just the latest member; this prevents cycling
(A beats B, B beats C, C beats A) and silent regressions against older styles.
Keep a persistent ladder result file so strength over time is a chart, not an
anecdote. Elo over league members once there are 4+.

### 4.2 Eval evolution path (each step gated)

1. hand weights + counter economy (P0, in progress)
2. gen-3 linear: pairwise ranking / search-bootstrap targets (P2)
3. small MLP over the same feature vector (NNUE-style: cheap, search-friendly)
   - only after gen-3 proves the *training target* is right; capacity never
     fixes a wrong target
4. learned card/state embeddings (replaces hand-crafted features last, not first)

### 4.3 Search evolution path

1. budget-tuned perfect-info UCT (today) with the P1 budgets
2. honest IS-MCTS: root-world voting over determinizations (TODO leftover),
   then multiple-observer trees
3. chance-node bucketing for draw/reveal events (Zhang-Buro)
4. policy priors from the eval (progressive bias / implicit minimax) - turns
   eval quality directly into search speed.
   ATTEMPTED Oct 2026, REJECTED (scripts/tune-prior.ts holds the full record):
   (a) AlphaZero sqrt-form PUCT loses to UCB1 here even with UNIFORM priors
   (19-38%) - deterministic eval leaves want log exploration; the engine got
   prior-weighted UCB1 instead (tilt = 1 + cPuct·(k·P - 1), uniform ==
   incumbent exactly, verified 46% seed-noise). (b) The recycled gen-3 rank
   model is harmful as a prior, monotonically in mix (42% at 0.5, 29-33% at
   1.0): its corpus is search-over-the-hand-eval choices, so it double-counts
   the teacher's biases and adds no ordering information - the same
   saturation lesson as the five rejected evals, now confirmed for ordering.
   Machinery KEPT (MctsOptions.prior/cPuct/priorTemp, PriorFn hook, default
   off): a future prior must carry information the eval lacks (per-card
   model, or human-game imitation).
5. fixed time-per-move budgets for the UI tiers (difficulty = milliseconds,
   not algorithm identity)

### 4.4 Knowledge and inference

- Knowledge tracking: cards seen via searches/bottom-decks pinned in the
  determinizer (today they are resampled - a known honesty gap).
- Opponent range modeling: infer archetype from revealed cards + leader, weight
  determinized worlds accordingly (full pool makes uniform sampling very wrong).

### 4.5 Benchmark and data infrastructure

- Fixed meta pool: DONE (Oct 2026) - 8 frozen archetype decks in
  src/data/baseDecks.json (built by scripts/build-base-decks.ts from the OP16
  meta: Enel 6-DON, BG Luffy Impel Down, Rosinante Navy, Teach control, Lucy
  Dressrosa, black Yamato, Kalgara Shandia, red Whitebeard). They double as the
  "Base decks" group in the Play/Watch pickers and the gate-eval deck pairs.
  Regenerate deliberately on a meta shift and note it here.
  - Rebuild 2026-10-14 (ST ingestion landed): OP-pool stand-ins replaced by the
    real starter staples the netdecks run - base-teach gained the ST27
    Blackbeard package (Kuzan ST27-003 x4, Sanjuan Wolf ST27-004 x4, big Teach
    ST27-005 x3; Devon ST27-002 entered via fill), base-ace-red the ST15
    Whitebeard package (Newgate ST15-002 x4, Rush Ace ST15-005 x4; Thatch
    ST15-004 via fill), base-luffy-bg picked up ST30-014 Mr.3 through the
    Baroque Works fill. The other five archetypes are unchanged (no color-legal
    ST staples). Gate/league history before this date used the stand-in lists,
    so gate numbers across the rebuild are not directly comparable.
- Exploitability probe before adoption: tune a best-response agent against the
  candidate (ByteRL lesson: ladder win rate is not robustness).
- Data flywheel: every ladder/fleet run can log (chosen, rejected) afterstate
  pairs - the gen-3 corpus grows as a side effect of routine testing.
- Human leg: occasional play sessions against the current bot, with notes -
  the counter-economy insight came from play, not from the fleet.

### 4.6 Per-set-release ritual (keeps the bot current with the card pool)

ingest -> certify (coverage/defLint/deffire/fleet) -> refresh benchmark ladder ->
retrain eval if adopted-eval is learned (features are set-agnostic; weights drift
with the meta; a genuinely new MECHANIC may need a new feature - calibration drop
is the signal) -> league gate -> snapshot.

## 5. Non-goals (for now)

- Deep RL from scratch (PPO-class agents underperform search+eval at this scale and
  are unstable in multi-agent CCG settings per the CTU study).
- Neural policy networks before P2's eval question is settled — same gate would apply.

Sources: [MCTS guidelines](https://annals-csis.org/Volume_25/pliks/3.pdf) ·
[MCTS+SL Hearthstone](https://arxiv.org/pdf/1808.04794) ·
[Strategy Card Game AI competition](https://arxiv.org/pdf/2305.11814) ·
[ByteRL exploitability](https://arxiv.org/pdf/2404.16689) ·
[Evolving evaluation functions](https://ar5iv.labs.arxiv.org/html/2105.01115) ·
[Texel tuning](https://chessprogramming.org/Texel%27s_Tuning_Method) ·
[RankNet chess eval, ICGA 2019](https://content.iospress.com/articles/icga-journal/icg190108) ·
[Bootstrapping from game tree search](https://neurips.cc/virtual/2009/poster/1641) ·
[Giraffe](https://alphaxiv.org/abs/1509.01549)
