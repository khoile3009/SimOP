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
- [ ]: Lethal/best-line calculator: search over legal action sequences for the current turn to find lethal (damage the opponent cannot fully counter) or the eval-maximizing line; surface it in a side panel ("suggested line") and as a lethal warning when defending. Builds on legalActions + greedy rollout; a depth-limited turn search is enough for lethal detection (counter capacity bounds from opponent hand size x max counter value for the honest version).
- [ ]: Class-based DON picker (design approved — v1 grouped-modal variant): DON are fungible within a class (zone, carrier, state incl. rested/frozen), so selection = count per class, never "which physical DON". Design draft with interactive prototype + engine mapping: https://claude.ai/artifact/VQkJ7FGmdYNLnapQ4J6xaS
  Build when an effect must touch attached DON (restand/attach manipulation in later sets, or full-fidelity DON!!-X — current OP01 DON!!-X pays from the cost area only, which is fine for now). Engine diff when built: grouped PendingChoice shape ({key, carrierUid?, capacity}), CHOOSE as count-vector, returnDon/restand ops accept {class: count}, legalActions emits canonical count-vectors (also shrinks bot action space). Card-target choices keep the flat instanceId shape.
