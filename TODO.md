- [ ]: If we click into trash, show modal of the trash pile
- [ ]: When the character on the field, if the character is allowed to attack and you drag the character, show an arrow from character to the cursor, if release on a target, attack that target
- [x]: Support multiple counter — USE_COUNTER now keeps the defender in the counter step (chain counters, then Pass resolves damage); [Counter] events are their own action (PLAY_COUNTER_EVENT) and pay their DON cost

Engine rules gaps (found during AI-layer work, ordered by impact):

- [ ]: 6th-character flow not wired: validatePlayCard allows the play but processPlayCard just appends a 6th character; CHOOSE_CHARACTER_TO_TRASH is never demanded by any pending state. legalActions excludes character plays on a full board as a workaround.
- [ ]: Double Attack + Trigger drops damage: dealLifeDamage returns early when the first life card has a trigger, so the second damage of [Double Attack] is lost.
- [ ]: DON return timing: attached DON returns to cost area at End Phase; per CR 6-2-3 it should return during the owner's next Refresh Phase (matters for [DON!! xN] conditions on the opponent's turn).
- [ ]: DON power bonus applies on both turns; per CR 6-5-5-2 the +1000/DON applies only during the owner's turn (currently masked by the early DON return above).
- [ ]: Setup order: life is dealt before mulligan; per CR 5-2-1-6/7 mulligan happens first, then life is dealt from the top of the deck. (Life stack orientation itself is fixed — see dealLife.)
- [x]: ACTIVATE_TRIGGER accept:true now runs the card's registered trigger effect (cards without a registered effect keep legacy stay-in-hand behavior).
- [x]: DON duplication: ATTACH_DON used to rest DON in the cost area while End Phase minted new ones for each attached DON, inflating the economy every turn. Attaching now removes them from the cost area; a DON-conservation invariant test guards this.
- [x]: UI: pendingChoice picker (ChoicePrompt modal), trigger prompt, blocker buttons, [Activate: Main] buttons, counter-event buttons — humans can now play every implemented mechanic; vs-AI mode drives player2 with the greedy agent.

Backlog (feature ideas):

- [ ]: UI/UX streamlining: reduce the select-then-popup friction — e.g. single-click plays when unambiguous, hover previews instead of Inspect, inline board highlighting for effect targets instead of the modal where targets are on the field (keep the modal for hidden zones like deck searches).
- [ ]: Lethal/best-line calculator: search over legal action sequences for the current turn to find lethal (damage the opponent cannot fully counter) or the eval-maximizing line; surface it in a side panel ("suggested line") and as a lethal warning when defending. Builds on legalActions + greedy rollout; a depth-limited turn search is enough for lethal detection (counter capacity bounds from opponent hand size x max counter value for the honest version).
- [ ]: Future DON UX (restand/attach/DON-minus on attached DON): no UI overhaul needed — DON are fungible, so every choice reduces to "how many, from where/which card", never "which physical DON". Cost-area picks stay count-based (the ChoicePrompt's DON tiles); attached-DON removal becomes a (card, count) picker — group DON tiles under the carrier card's portrait in the modal, or click the carrier then +/- count. Engine already models attached DON as a per-card counter, which matches that UI shape.
