# Bot Improvement Plan

Brainstormed Oct 2026, after full card coverage (OP01–OP17, EB01–EB04, PRB01/02 —
2,278 cards). Current ladder: **mcts 73% > planner 50% > greedy 27%** (mirror decks,
seat-swapped). Two learned-eval generations were built and rejected by the decision
gate (see TODO.md M4); hand weights in `src/ai/evaluate.ts` are active.

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

**P0 — counter economy + eval hygiene (hand weights, no training)**
1. Defense-coverage feature + threat-conditional counter weighting (§1).
2. Spend-order tie-break for hand-cost choices.
3. Gate: ladder vs current hand weights (greedy, planner, mcts legs), 300+ games.

**P1 — planner performance (blocker for everything else)**
- TurnPlannerAgent is pathologically slow on the full-fidelity pool (minutes/game;
  TODO entry exists). Profile `turnSearch.ts` (suspects: adversarial verification
  breadth × 2,278-card effect surface, re-evaluation without caching). Analyze mode
  and gendata both depend on it.

**P2 — gen-3 learned eval (recipe)**
1. Data: MCTS-vs-MCTS self-play (not greedy/random), mid-turn afterstates.
2. Targets, two candidate losses (run both, same gate):
   a. Pairwise ranking: (chosen, rejected) sibling afterstates from the actual
      decision points, RankNet loss on score differences.
   b. Search bootstrap: regress toward MCTS root value of the position (Veness).
3. Gate unchanged and non-negotiable: cross-deck ladder win rate with greedy AND
   mcts consumers; prediction metrics are reported but never decide adoption.
4. Counter-economy features from P0 ride along as inputs.

**P3 — honest-information search**
- IS-MCTS / multiple-observer variant over the existing determinizer (stop averaging
  incompatible worlds at the root — strategy-fusion fix).
- Chance-node bucketing for draw/life reveals (Zhang–Buro) to keep branching sane.
- Knowledge tracking: revealed cards already pin determinization; extend to "opponent
  searched deck for X type" constraints.

**P4 — exploitability + meta benchmarks**
- Fixed benchmark deck pool (one per color archetype incl. OP15 Enel 6-DON, Brook
  mill, black trash-count) so ladders are comparable across engine versions.
- Best-response exploiter runs against any candidate agent before adoption.

## 4. Non-goals (for now)

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
