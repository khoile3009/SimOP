# SimPiece - One Piece TCG Simulator

## Architecture, Project Plan & Implementation Steps

---

## 1. Project Overview

A web-based One Piece Trading Card Game simulator featuring drag-and-drop gameplay, automated card effects, and a deck builder. Designed for solo practice with an architecture that cleanly extends to AI opponents and online multiplayer.

| Milestone | Scope |
|-----------|-------|
| **V1** | OP01 set, local self-play, deck builder, automated effects |
| **P1** | AI opponent (rule-based + MCTS) |
| **P2** | Online multiplayer via WebSocket |

---

## 2. One Piece TCG Rules Reference (Implementation Spec)

This section is the **source of truth** the game engine must implement. Derived from the [official comprehensive rules v1.2.0](https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf) and [community rulings](https://onepiecetopdecks.com/ruling-one-piece-card-game-how-to-play/).

### 2.1 Deck Construction

| Rule | Value |
|------|-------|
| Leader card | Exactly 1 |
| Main deck | Exactly 50 cards (Characters, Events, Stages) |
| DON!! deck | Exactly 10 |
| Max copies per card code | 4 |
| Color restriction | Cards must match Leader's color(s) |

### 2.2 Game Setup Sequence

1. Shuffle main deck and DON!! deck into their respective zones
2. Place Leader card face-up in Leader zone
3. Determine turn order (coin flip / random)
4. Each player draws 5 cards
5. **Mulligan**: Each player may return entire hand to deck, shuffle, and redraw 5 (once only)
6. Place life cards face-down equal to Leader's life value (taken from top of deck)
7. First player begins

### 2.3 Turn Structure (5 Phases)

```
┌─────────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌─────┐
│ Refresh  │──▶│ Draw │──▶│ DON  │──▶│ Main │──▶│ End │
└─────────┘   └──────┘   └──────┘   └──────┘   └─────┘
```

**Refresh Phase**
- Set all rested DON!! in cost area to active
- Set all rested Characters, Leader, and Stages to active

**Draw Phase**
- Draw 1 card from deck
- *First player skips Draw on their first turn*
- If deck is empty and player must draw → that player loses

**DON!! Phase**
- Move 2 DON!! from DON!! deck to cost area (active)
- *First player gets only 1 DON!! on their first turn*

**Main Phase** (actions in any order, any number of times)
- Play Character/Event/Stage cards by resting DON!! from cost area
- Attach active DON!! from cost area to Leader or Characters on field
- Activate card effects (if conditions are met)
- Declare attacks (see Battle Sequence below)

**End Phase**
- All "until end of turn" effects expire
- All DON!! attached to characters return to cost area (rested)
- Pass turn to opponent

### 2.4 Battle Sequence

Attacks happen during Main Phase. Each attack follows this sub-sequence:

```
┌────────────┐   ┌────────────┐   ┌──────────────┐   ┌──────────────┐
│ 1. Attack  │──▶│ 2. Block   │──▶│ 3. Counter   │──▶│ 4. Damage    │
│    Step    │   │    Step    │   │    Step      │   │    Step      │
└────────────┘   └────────────┘   └──────────────┘   └──────────────┘
```

**Attack Step**
- Rest an active Character or Leader to declare an attack
- Choose target: opponent's Leader OR an opponent's rested Character
- `[When Attacking]` effects trigger now
- *Neither player can attack on their first turn*
- *Characters cannot attack the turn they are played (unless Rush)*

**Block Step**
- Defending player may activate one Character's `[Blocker]` keyword
- That Character becomes the new battle target and is rested
- A Character cannot block if it is already the attack target
- Only one Blocker activation per attack

**Counter Step**
- Defending player may play Counter cards from hand (no cost required)
- Counter values add to the defending card's power for this battle
- Can also activate `[Counter]` effects from hand
- Field characters cannot Counter — hand only

**Damage Step**
- Compare attacker power vs. defender power
- If attacker power ≥ defender power:
  - **Leader hit**: Defender takes 1 life damage (moves top life card to hand; Trigger may activate)
  - **Character hit**: Defending Character is KO'd → sent to trash
- If attacker power < defender power: nothing happens (attacker is not destroyed)
- `[Double Attack]`: Inflicts 2 life damage instead of 1
- `[Banish]`: Life cards go to trash instead of hand (no Trigger activation)

### 2.5 Life & Trigger System

- When Leader takes damage, top life card moves to hand
- Before adding to hand, if that card has a `[Trigger]` effect, the player may activate it (or decline)
- When life reaches 0, the *next* successful attack on that Leader wins the game

### 2.6 Keyword Abilities

| Keyword | Effect |
|---------|--------|
| **Blocker** | Can intercept attacks targeting other cards (rest this Character to redirect) |
| **Rush** | Can attack the same turn it is played |
| **Double Attack** | Deals 2 life damage instead of 1 |
| **Banish** | Life damage goes to trash instead of hand; no Trigger activation |
| **Counter +X000** | When used from hand as Counter, adds X000 power to defender |

### 2.7 Special Rules

- **Field limit**: Max 5 Characters on field. Playing a 6th requires trashing one (no `[When KO'd]` trigger)
- **0 power**: A Character reduced to 0 power is **not** destroyed (only KO'd via battle or effects)
- **DON!! attachment costs**: `DON!! x1` = needs 1+ DON!! attached to activate. `DON!! -1` = return 1 DON!! to deck. `Active Main (1)` = rest 1 DON!! from cost area
- **Once Per Turn effects**: Different copies of the same card each get their own activation
- **On Play effects**: Mandatory unless they have an associated cost (then optional)

---

## 3. Technology Stack

### 3.1 Decisions (with rationale)

| Layer | Choice | Why |
|-------|--------|-----|
| **Language** | TypeScript (strict mode) | Type safety critical for card data, game state, and effect resolution |
| **UI Framework** | React 18 | Component model maps well to card zones; massive ecosystem |
| **Build** | Vite | Fast HMR, native TS support, simple config |
| **State** | Zustand | Lightweight (~1KB), no boilerplate, supports middleware (immer, devtools); sufficient for V1, scales to P1/P2 |
| **Drag & Drop** | @dnd-kit/core | Not built on HTML5 DnD API → better custom animations, touch support, collision detection; more mature for card game UIs than pragmatic-drag-and-drop |
| **Styling** | TailwindCSS v4 | Utility-first, fast iteration, consistent design system |
| **Animation** | Framer Motion | Declarative layout animations, gesture support, great for card flip/move/hover |
| **Routing** | React Router v7 | Standard, simple — 3 routes for V1 |
| **Persistence** | localStorage (decks) + IndexedDB via idb (card cache) | No backend needed for V1; IndexedDB for larger card image/data cache |
| **Testing** | Vitest + React Testing Library + Playwright | Vitest for engine unit tests (fast, Vite-native); Playwright for E2E game flows |
| **Card Data** | [OPTCG API](https://optcgapi.com/) | Free, no auth, comprehensive OP01-OP12 data, REST/JSON |

### 3.2 Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.3",
    "react-dom": "^18.3",
    "react-router-dom": "^7",
    "zustand": "^5",
    "@dnd-kit/core": "^6",
    "@dnd-kit/sortable": "^8",
    "@dnd-kit/utilities": "^3",
    "framer-motion": "^11",
    "immer": "^10",
    "idb": "^8",
    "nanoid": "^5",
    "clsx": "^2"
  },
  "devDependencies": {
    "typescript": "^5.5",
    "tailwindcss": "^4",
    "vitest": "^2",
    "@testing-library/react": "^16",
    "playwright": "^1.48",
    "eslint": "^9",
    "prettier": "^3"
  }
}
```

### 3.3 Backend Stack (P2 — Online Multiplayer)

| Layer | Choice |
|-------|--------|
| Runtime | Node.js 20+ |
| Framework | Hono (lightweight, fast) or Express |
| Real-time | Socket.IO v4 |
| Database | PostgreSQL (users, decks, match history) |
| Cache | Redis (game state, matchmaking queue) |
| Auth | Lucia Auth or Clerk |
| Hosting | Railway / Fly.io |

---

## 4. Architecture

### 4.1 High-Level System Design

```
┌──────────────────────────────────────────────────────────────────┐
│                          React UI Layer                          │
│  ┌─────────────┐  ┌───────────────┐  ┌────────────────────┐    │
│  │ Card Browser │  │ Deck Builder  │  │    Game Board      │    │
│  │ /cards       │  │ /deck-builder │  │    /play           │    │
│  └──────┬──────┘  └──────┬────────┘  └─────────┬──────────┘    │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          │                                      │
│              ┌───────────▼────────────┐                         │
│              │    Zustand Store       │                         │
│              │  (game state, UI state)│                         │
│              └───────────┬────────────┘                         │
└──────────────────────────┼──────────────────────────────────────┘
                           │  dispatch(GameAction)
              ┌────────────▼────────────┐
              │                         │
              │   Game Engine (Pure)    │  ← Framework-agnostic
              │                         │     No React dependency
              │  ┌───────────────────┐  │
              │  │  State Machine    │  │  Turn/phase transitions
              │  │  (turnManager.ts) │  │
              │  └────────┬──────────┘  │
              │           │             │
              │  ┌────────▼──────────┐  │
              │  │  Action Processor │  │  Validates + applies actions
              │  │  (processor.ts)   │  │  Command pattern
              │  └────────┬──────────┘  │
              │           │             │
              │  ┌────────▼──────────┐  │
              │  │  Effect Resolver  │  │  Trigger detection, effect
              │  │  (effects.ts)     │  │  queue, resolution
              │  └────────┬──────────┘  │
              │           │             │
              │  ┌────────▼──────────┐  │
              │  │  Rules Validator  │  │  Legality checks
              │  │  (rules.ts)       │  │
              │  └───────────────────┘  │
              │                         │
              └────────────┬────────────┘
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                  │
  ┌──────▼───────┐  ┌─────▼──────┐  ┌───────▼────────┐
  │ Card Data    │  │ Persistence│  │ Player Adapter │
  │ Service      │  │ Service    │  │ (Interface)    │
  │              │  │            │  │                │
  │ OPTCG API →  │  │ localStorage│ │ ┌────────────┐│
  │ IndexedDB    │  │ IndexedDB  │  │ │ Human (UI) ││
  │ cache        │  │            │  │ ├────────────┤│
  └──────────────┘  └────────────┘  │ │ AI (P1)    ││
                                    │ ├────────────┤│
                                    │ │ Remote (P2)││
                                    │ └────────────┘│
                                    └───────────────┘
```

### 4.2 Core Design Principles

**1. Pure Game Engine (Framework-Agnostic)**
The engine is a pure TypeScript module with **no React imports**. It takes a `GameState` and a `GameAction`, validates the action, and returns a new `GameState`. This enables:
- Easy unit testing (no DOM, no React)
- Reuse across contexts (UI, AI, network, replays)
- Deterministic behavior for replays and AI simulation

```typescript
// Core engine function signature
function processAction(state: GameState, action: GameAction): GameResult {
  const validation = validateAction(state, action);
  if (!validation.valid) return { state, error: validation.reason };
  const newState = applyAction(state, action);
  const withEffects = resolveEffects(newState, action);
  return { state: withEffects, events: [...] };
}
```

**2. Command Pattern for Actions**
Every game action is a serializable object. This gives us undo, replay, network sync, and AI simulation for free.

```typescript
type GameAction =
  | { type: 'PLAY_CARD'; cardInstanceId: string; targetZone: GameZone }
  | { type: 'ATTACH_DON'; donInstanceId: string; targetCardId: string }
  | { type: 'DECLARE_ATTACK'; attackerId: string; targetId: string }
  | { type: 'ACTIVATE_BLOCKER'; blockerId: string }
  | { type: 'USE_COUNTER'; cardInstanceId: string; targetId: string }
  | { type: 'ACTIVATE_TRIGGER'; accept: boolean }
  | { type: 'ADVANCE_PHASE' }
  | { type: 'END_TURN' }
  | { type: 'MULLIGAN'; accept: boolean }
  // ...
```

**3. Player Adapter Pattern**
Abstract the "player" behind an interface so the engine doesn't care whether input comes from the UI, an AI, or a network socket.

```typescript
interface PlayerAdapter {
  requestAction(state: GameState, legalActions: GameAction[]): Promise<GameAction>;
  notify(event: GameEvent): void;
}

class HumanPlayerAdapter implements PlayerAdapter { /* reads from UI */ }
class AIPlayerAdapter implements PlayerAdapter { /* computes best action */ }
class RemotePlayerAdapter implements PlayerAdapter { /* reads from WebSocket */ }
```

**4. Zustand as Thin Glue**
The Zustand store holds the current `GameState` and dispatches actions to the engine. React components subscribe to slices of state they need.

```typescript
interface GameStore {
  gameState: GameState | null;
  dispatch: (action: GameAction) => void;
  startGame: (deck1: Deck, deck2: Deck) => void;
  getValidActions: () => GameAction[];
}
```

### 4.3 Folder Structure

```
simpiece/
├── public/
│   └── assets/                  # Static assets, card back images
├── src/
│   ├── engine/                  # Pure game engine — NO React imports
│   │   ├── types.ts             # GameState, GameAction, PlayerState, etc.
│   │   ├── constants.ts         # Game constants (5 char limit, 10 DON, etc.)
│   │   ├── processor.ts         # processAction() — core state transition
│   │   ├── rules.ts             # validateAction() — legality checks
│   │   ├── turnManager.ts       # Phase/turn state machine
│   │   ├── battleManager.ts     # Attack→Block→Counter→Damage sequence
│   │   ├── effects/
│   │   │   ├── resolver.ts      # Effect queue and resolution loop
│   │   │   ├── registry.ts      # Card ID → effect function mapping
│   │   │   └── common.ts        # Shared effect primitives (draw, KO, buff)
│   │   ├── deckValidator.ts     # Deck construction rules
│   │   └── index.ts             # Public API
│   │
│   ├── data/
│   │   ├── cardService.ts       # Fetch from OPTCG API + IndexedDB cache
│   │   ├── cardTypes.ts         # Card data interfaces (matches API response)
│   │   └── op01/
│   │       ├── effects.ts       # OP01-specific effect implementations
│   │       └── cards.json       # Fallback static data (if API is down)
│   │
│   ├── store/
│   │   ├── gameStore.ts         # Zustand store — game state + dispatch
│   │   ├── deckStore.ts         # Zustand store — deck builder state
│   │   └── uiStore.ts           # Zustand store — UI state (modals, selection)
│   │
│   ├── adapters/
│   │   ├── playerAdapter.ts     # PlayerAdapter interface
│   │   ├── humanAdapter.ts      # Bridges UI actions to engine
│   │   └── aiAdapter.ts         # (P1) AI decision-making
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Card.tsx         # Single card component (front/back/hover)
│   │   │   ├── CardStack.tsx    # Deck/trash pile visualization
│   │   │   └── Button.tsx       # Shared button styles
│   │   ├── game/
│   │   │   ├── GameBoard.tsx    # Main board layout (both player sides)
│   │   │   ├── PlayerSide.tsx   # One player's half of the board
│   │   │   ├── LeaderZone.tsx   # Leader card + life display
│   │   │   ├── CharacterZone.tsx# 5-slot character area
│   │   │   ├── DonZone.tsx      # DON!! cost area display
│   │   │   ├── HandZone.tsx     # Fan-layout hand (draggable)
│   │   │   ├── TrashZone.tsx    # Trash pile (clickable to browse)
│   │   │   ├── LifeZone.tsx     # Face-down life cards
│   │   │   ├── BattleOverlay.tsx# Attack arrows, power comparison
│   │   │   ├── PhaseBar.tsx     # Current phase + advance button
│   │   │   ├── ActionLog.tsx    # Scrollable action history
│   │   │   └── CounterModal.tsx # Counter step UI (select cards from hand)
│   │   ├── deck-builder/
│   │   │   ├── DeckBuilder.tsx  # Main deck builder layout
│   │   │   ├── CardPool.tsx     # Filterable card grid
│   │   │   ├── DeckList.tsx     # Current deck contents
│   │   │   ├── DeckStats.tsx    # Cost curve, color chart
│   │   │   └── FilterBar.tsx    # Search, color, type, cost filters
│   │   └── pages/
│   │       ├── HomePage.tsx     # Landing page
│   │       ├── PlayPage.tsx     # Deck select → game board
│   │       └── CardsPage.tsx    # Card browser/library
│   │
│   ├── hooks/
│   │   ├── useGameEngine.ts     # Hook wrapping engine dispatch + state
│   │   ├── useDragCard.ts       # @dnd-kit drag setup for cards
│   │   └── useCardData.ts       # Fetch + cache card data
│   │
│   ├── utils/
│   │   ├── shuffle.ts           # Fisher-Yates shuffle
│   │   ├── id.ts                # nanoid wrapper for instance IDs
│   │   └── images.ts            # Card image URL helpers
│   │
│   ├── App.tsx                  # Router setup
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind directives
│
├── tests/
│   ├── engine/                  # Unit tests for game engine
│   │   ├── processor.test.ts
│   │   ├── rules.test.ts
│   │   ├── battleManager.test.ts
│   │   └── effects.test.ts
│   ├── components/              # Component tests
│   └── e2e/                     # Playwright E2E tests
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── ARCHITECTURE_AND_PLAN.md
```

---

## 5. Data Models (Refined)

### 5.1 Card Data (Matches OPTCG API Response)

```typescript
// Raw card data from API / static cache
interface CardData {
  id: string;              // "OP01-001"
  name: string;            // "Roronoa Zoro"
  cardType: CardType;
  color: Color[];          // Multi-color support: ['Red', 'Green']
  cost: number;
  power: number | null;    // null for Events
  counter: number | null;  // Counter value when used from hand (+1000, +2000)
  life: number | null;     // Only for Leaders
  attribute: string[];     // ['Slash', 'Supernovas']
  effectText: string;      // Raw effect text
  triggerText: string | null;
  rarity: Rarity;
  set: string;             // "OP01"
  imageUrl: string;
}

type CardType = 'Leader' | 'Character' | 'Event' | 'Stage';
type Color = 'Red' | 'Green' | 'Blue' | 'Purple' | 'Black' | 'Yellow';
type Rarity = 'L' | 'C' | 'UC' | 'R' | 'SR' | 'SEC' | 'SP';
```

### 5.2 Game State

```typescript
interface GameState {
  id: string;
  players: Record<PlayerId, PlayerState>;
  currentPlayer: PlayerId;
  phase: GamePhase;
  turnNumber: number;
  battle: BattleState | null;       // Non-null during a battle
  effectQueue: QueuedEffect[];      // Effects waiting to resolve
  pendingTrigger: TriggerState | null; // Waiting for trigger accept/decline
  actionHistory: GameAction[];
  winner: PlayerId | null;
  setupComplete: boolean;           // False during mulligan
  mulliganState: Record<PlayerId, 'pending' | 'accepted' | 'declined'>;
}

type PlayerId = 'player1' | 'player2';

type GamePhase =
  | 'SETUP'       // Mulligan phase
  | 'REFRESH'
  | 'DRAW'
  | 'DON'
  | 'MAIN'
  | 'END';

interface PlayerState {
  leader: GameCard;
  lifeCards: GameCard[];            // Face-down life zone
  hand: GameCard[];
  characters: GameCard[];           // On field (max 5)
  donDeck: GameCard[];              // Remaining DON!! cards
  donArea: GameCard[];              // DON!! in cost area
  deck: GameCard[];
  trash: GameCard[];
  stage: GameCard | null;           // Only 1 stage at a time
}

interface GameCard {
  instanceId: string;               // Unique per game instance
  cardId: string;                   // Reference to CardData.id
  ownerId: PlayerId;
  isRested: boolean;
  powerModifier: number;            // Temporary power buffs/debuffs
  attachedDon: number;              // Number of DON!! attached
  activatedThisTurn: string[];      // Track "once per turn" effect IDs
  turnPlayed: number;               // For Rush check
}
```

### 5.3 Battle State

```typescript
interface BattleState {
  attackerId: string;               // GameCard.instanceId
  attackerPlayer: PlayerId;
  originalTargetId: string;         // Initial target
  currentTargetId: string;          // May change via Blocker
  defenderPlayer: PlayerId;
  step: BattleStep;
  counterCardsUsed: string[];       // Cards used for counter
  attackerPowerBonus: number;
  defenderPowerBonus: number;
}

type BattleStep = 'ATTACK' | 'BLOCK' | 'COUNTER' | 'DAMAGE';
```

### 5.4 Deck

```typescript
interface Deck {
  id: string;
  name: string;
  leader: string;                   // CardData.id
  cards: { cardId: string; qty: number }[];
  createdAt: number;
  updatedAt: number;
}
```

---

## 6. Effect System Design

The effect system is the most complex part of the engine. The design must handle:
- **Timing**: Effects trigger at specific game moments (On Play, When Attacking, etc.)
- **Targeting**: Some effects require player choices (search deck, choose a character)
- **Ordering**: Multiple simultaneous effects need a resolution queue
- **Interaction**: Effects can create new effects or modify the game state during resolution

### 6.1 Effect Registration (Per-Card)

Instead of parsing natural language effect text, register typed effect handlers per card ID. This is more reliable for V1 and enables full automation.

```typescript
// Effect registry — maps card ID to effect handler(s)
type EffectTrigger =
  | 'ON_PLAY'
  | 'WHEN_ATTACKING'
  | 'WHEN_KO'
  | 'ACTIVATE_MAIN'      // Manual activation during main phase
  | 'ON_BLOCK'
  | 'END_OF_TURN'
  | 'TRIGGER'             // Life trigger
  | 'COUNTER';            // When used as counter from hand

interface EffectDefinition {
  cardId: string;
  trigger: EffectTrigger;
  condition?: (state: GameState, card: GameCard) => boolean;
  requiresDonAttached?: number;    // DON!! x1, x2, etc.
  donCost?: number;                // DON!! -1, -2 (return to deck)
  isOncePerTurn?: boolean;
  execute: (ctx: EffectContext) => EffectResult;
}

interface EffectContext {
  state: GameState;
  sourceCard: GameCard;
  sourcePlayer: PlayerId;
  // For effects that need player input:
  chooseCard?: (options: GameCard[], prompt: string) => Promise<GameCard>;
  chooseYesNo?: (prompt: string) => Promise<boolean>;
}

type EffectResult = {
  stateChanges: Partial<GameState>;  // Direct state mutations
  newEffects?: QueuedEffect[];       // Chain effects
};
```

### 6.2 Common Effect Primitives

```typescript
// Reusable building blocks for effect implementations
const effects = {
  draw: (player: PlayerId, count: number) => StateChange,
  addPower: (targetId: string, amount: number, until: 'END_OF_TURN' | 'END_OF_BATTLE') => StateChange,
  ko: (targetId: string) => StateChange,
  returnToHand: (targetId: string) => StateChange,
  trashFromHand: (player: PlayerId, count: number) => StateChange,
  searchDeck: (player: PlayerId, filter: CardFilter, count: number) => StateChange,
  rest: (targetId: string) => StateChange,
  activate: (targetId: string) => StateChange,
  playFromTrash: (cardId: string) => StateChange,
};
```

### 6.3 OP01 Effect Implementation Strategy

OP01 has ~118 cards. Strategy for V1:

| Category | Count | Approach |
|----------|-------|----------|
| Keyword-only cards (Blocker, Rush, etc.) | ~30 | Handled by engine rules, no custom effect code |
| Simple effects (draw, +power, counter) | ~40 | Use effect primitives, 1-3 lines each |
| Medium effects (conditional draw, search) | ~30 | Custom handlers with primitives |
| Complex effects (multi-choice, conditional chains) | ~18 | Custom handlers with `chooseCard`/`chooseYesNo` prompts |

**Target: 100% of OP01 effects automated** (achievable because most are simple keyword + primitive combinations).

---

## 7. UI Design

Design references: [Hearthstone GDC immersive UI talk](https://gdcvault.com/play/1022036/Hearthstone-How-to-Create-an), [Fairtravel Battle UI analysis](https://gdkeys.com/the-card-games-ui-design-of-fairtravel-battle/), [LoR board design](https://www.invenglobal.com/articles/10266/the-legends-of-runeterra-board-explained), [official OP TCG playmat layout](https://en.onepiece-cardgame.com/play-guide/).

### 7.1 Visual Theme

**Dark oceanic theme** — fitting the One Piece pirate setting.

| Element | Style |
|---------|-------|
| Background | Deep navy/ocean gradient (`#0a0e1a` → `#111b2e`), subtle animated wave pattern or compass rose watermark |
| Zone panels | Dark glassmorphism — semi-transparent dark panels (`rgba(15,23,42,0.7)`) with `backdrop-blur(12px)`, thin `1px` border (`rgba(255,255,255,0.08)`) |
| Active player side | Subtle warm tint (faint gold edge glow) to indicate whose turn it is |
| Inactive player side | Slightly dimmed (opacity 0.85) |
| Cards | Crisp card art with rounded corners (4px), soft drop shadow. On hover: lift + subtle gold glow |
| DON!! cards | Gold/amber accent color (`#d4a017`) — small diamond shapes when displayed as counters |
| Life indicators | Red pips (`#ef4444`) when full, hollow when lost |
| Text | White primary (`#f8fafc`), muted secondary (`#94a3b8`), all using a clean sans-serif (Inter or system font) |
| Accent colors | Gold for DON/resources, Red for damage/life, Green for valid actions, Blue for information |

### 7.2 Game Board Layout

The board follows the **official OP TCG playmat zone arrangement** so players familiar with the physical game feel at home. Two player halves are mirrored vertically (your side at bottom, opponent at top). The layout is designed for **16:9 screens (1280px+ wide)**.

**Design principles applied:**
- **Information proximity** (Hearthstone): stats live next to their zone, not in distant HUD corners
- **Clear zone boundaries** (Fairtravel): glassmorphism panels with subtle borders define each zone
- **Generous card size**: Cards are large enough to read cost/power at a glance without hovering (~80px wide in hand, ~70px on field)
- **60/40 vertical split** (MTG Arena): your side gets slightly more space since it's interactive

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ OPPONENT SIDE (mirrored, slightly dimmed)                                   │
│                                                                             │
│  ┌─Opponent Hand──────────────────────────────────────────────────────────┐ │
│  │     [??] [??] [??] [??] [??]  (face-down, count shown)                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─Life─┐  ┌─Leader──┐  ┌─Characters (5 slots)──────────────┐  ┌─Stage─┐ │
│  │■ ■ ■ │  │┌──────┐ │  │ [C1]  [C2]  [C3]  [C4]  [C5]     │  │┌────┐ │ │
│  │■ ■   │  ││ IMG  │ │  │ 6000  4000  3000  ___   ___       │  ││    │ │ │
│  │      │  ││      │ │  │ ◆◆    ◆            (empty slots)  │  │└────┘ │ │
│  └──────┘  │└──────┘ │  └────────────────────────────────────┘  └──────┘ │
│            │ 5/10 DON │                                                   │
│            └─────────┘                                                    │
│  ┌─DON Cost Area──────────────────────────┐  ┌─Deck─┐  ┌─Trash─┐        │
│  │ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆  (8 active / 10)    │  │  38  │  │  ♻ 4  │        │
│  └────────────────────────────────────────┘  └──────┘  └───────┘        │
│                                                                             │
├─── Phase Bar ───────────────────────────────────────────────────────────────┤
│  ○ Refresh  ○ Draw  ○ DON  ● MAIN  ○ End    Turn 4 - Player 1      ⓘ Log │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─DON Cost Area──────────────────────────┐  ┌─Deck─┐  ┌─Trash─┐        │
│  │ ◆ ◆ ◆ ◆ ◆ ◆  (6 active / 10)        │  │  41  │  │  ♻ 2  │        │
│  └────────────────────────────────────────┘  └──────┘  └───────┘        │
│                                                                             │
│  ┌─Life─┐  ┌─Leader──┐  ┌─Characters (5 slots)──────────────┐  ┌─Stage─┐ │
│  │● ● ● │  │┌──────┐ │  │ [C1]  [C2]  [C3]  [C4]  [C5]     │  │┌────┐ │ │
│  │● ●   │  ││ IMG  │ │  │ 5000  7000  ___   ___   ___       │  ││    │ │ │
│  │      │  ││      │ │  │       ◆◆◆         (empty slots)   │  │└────┘ │ │
│  └──────┘  │└──────┘ │  └────────────────────────────────────┘  └──────┘ │
│            │ 6/10 DON │                                                   │
│            └─────────┘                                                    │
│                                                                             │
│ YOUR SIDE (full brightness, interactive)                                    │
│                                                                             │
│  ┌─Your Hand─────────────────────────────────────────────────────────────┐ │
│  │   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │ │
│  │   │ C  │ │ C  │ │ E  │ │ C  │ │ C  │ │ E  │ │ C  │   7 cards       │ │
│  │   │5000│ │3000│ │ 2  │ │7000│ │4000│ │ 1  │ │6000│                  │ │
│  │   └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────── Controls ──────────────────────────────────────┐ │
│  │   [End Phase · Space]    [End Turn · Enter]    [Undo · Ctrl+Z]        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Zone Design Details

Each zone is a glassmorphism panel with specific visual treatment:

#### Leader Zone (left-center of each side)
- Leader card displayed at ~1.2x normal size (most important card on board)
- Power displayed below the card: `5000` with any DON!! bonus shown as `5000 +2000`
- DON!! attached shown as gold diamonds below: ◆◆
- Total DON!! summary text: `6/10 DON` (available/total)
- When rested: card rotates 90° with smooth spring animation
- Leader's effect text visible on hover

#### Life Zone (far left of each side)
- Vertical stack of face-down card pips
- Filled pip (●/■) = remaining life, hollow (○/□) = lost
- Subtle pulse animation when a life card is about to be taken
- Click to see count tooltip: "4 life remaining"
- When life is taken: pip animates → card flips face-up → trigger prompt (if applicable) → moves to hand

#### Character Zone (center, 5 slots)
- 5 evenly spaced card slots in a horizontal row
- Empty slots shown as faint dashed outlines (indicates where cards can be placed)
- Each card shows: name (truncated), power value, DON!! diamonds
- Rested cards rotated 90° clockwise
- Slot glow green when a valid card is being played from hand
- Characters that can attack have a subtle ready-shimmer
- Power text turns **red** when character is in danger (lower than an attacker)

#### DON!! Cost Area (below characters, spans width)
- Horizontal row of small gold diamond icons (◆)
- Active (available) DON!! = bright gold, Rested = dimmed/gray
- Shows fraction: `6 active / 10 total`
- When entering attach mode: diamonds enlarge slightly and become clickable
- When paying cost to play a card: diamonds dim one by one (left to right) with a brief animation

#### Stage Zone (far right of each side)
- Single card slot with dashed border when empty
- Displayed at same size as character cards
- Label: "Stage" when empty
- When a new Stage replaces an old one: old slides to trash, new slides in

#### Deck & Trash (right side, stacked vertically)
- **Deck**: Face-down card stack with count badge: `38`
  - Subtle "draw" animation: top card slides off when drawing
  - Click does nothing in normal play (no accidental draws)
- **Trash**: Small pile icon with count badge: `♻ 4`
  - Click to open trash browser modal (scrollable grid of all trashed cards)
  - Most recently trashed card shown as mini-preview on top

#### Hand Zone (bottom edge for you, top edge for opponent)
- Cards displayed in a **slight arc** (fan layout), overlapping when > 5 cards
- Each card shows: card art, cost (top-left), power (bottom), type icon
- Playable cards (enough DON!! to pay) have a subtle **green bottom glow**
- Unplayable cards have no glow (but are still interactable for inspect)
- On hover: card rises above the arc, scales to ~1.5x, shows full text
- Opponent's hand: face-down cards, count shown: `Opponent: 5 cards`
- Cards animate in when drawn (slide from deck → hand with a flip)

#### Phase Bar (horizontal divider between player sides)
- Centered strip with phase indicators: `Refresh → Draw → DON → MAIN → End`
- Current phase: bright pill/badge with player color
- Completed phases: dimmed, past tense
- Future phases: muted
- Right side: turn counter `Turn 4` + active player indicator
- Far right: action log toggle button (ⓘ)
- In auto-advance phases (Refresh/Draw/DON): phases highlight briefly as they process, then land on MAIN

#### Controls Bar (bottom edge, below hand)
- Three primary buttons with keyboard shortcut hints:
  - `[End Phase · Space]` — primary action, most prominent
  - `[End Turn · Enter]` — secondary
  - `[Undo · Ctrl+Z]` — tertiary/muted
- Buttons are context-aware:
  - During battle block step: buttons change to `[Decline Block]` `[Select Blocker]`
  - During counter step: `[Pass]` `[Confirm Counters]`
- Active player's buttons are visible; inactive player's buttons are hidden

#### Action Log Panel (collapsible, right edge)
- Slides in from the right when toggled (keyboard `L` or click ⓘ)
- Scrollable list of all game actions in natural language:
  - `Player 1 played Roronoa Zoro (cost 3)`
  - `Player 1 attached 2 DON!! to Roronoa Zoro`
  - `Player 1 attacked Leader with Roronoa Zoro (7000 → 5000)`
  - `Player 2 activated Blocker: Nami`
- Semi-transparent panel, doesn't obscure the board
- Newest entries at the bottom (chat-style)

### 7.4 Responsive Considerations

| Screen width | Adjustment |
|-------------|------------|
| 1440px+ | Full layout as designed, generous spacing |
| 1280px | Slightly smaller cards, tighter spacing |
| 1024px | Compact mode: card text hidden (hover only), DON shown as single count instead of individual diamonds |
| < 1024px | Not officially supported for V1 (show "best on desktop" message); future mobile layout would need a completely different design |

### 7.5 Battle Overlay

When an attack is declared, a temporary overlay appears in the center divider zone:

```
┌─────────────────────────────────────────────┐
│         ⚔ BATTLE                            │
│                                              │
│  [Attacker Card]  ──→  [Defender Card]      │
│   Roronoa Zoro          Monkey D. Luffy     │
│     7000          vs      5000              │
│   ◆◆ (+2000)            + 0 counter        │
│                                              │
│  Waiting for defender response...            │
│  [Block Step]                                │
└─────────────────────────────────────────────┘
```

- Shows both cards at ~1.3x size, face-up with full art
- Power comparison with color coding (green = winning side, red = losing)
- Updates live as counters are added: `5000 + 2000 = 7000`
- Step indicator: `Attack → [Block] → Counter → Damage`
- Fades out after damage resolves with a brief result flash: "**KO!**" or "**Blocked!**" or "**Life -1**"

### 7.2 Interaction Model

Based on research from Hearthstone's GDC talk on immersive UI, MTG Arena's UX patterns, Legends of Runeterra's targeting system, the Fairtravel Battle UI analysis, and community feedback on OPTCG Sim.

#### Design Principles

1. **Click-first, drag-optional**: Research shows dragging cards across the screen is perceived as slow and error-prone (misclicks can negate minutes of strategy). Click-to-select → click-to-target is faster and more precise. Drag is supported as an alternative for users who prefer it, but never required.

2. **Physicality metaphor**: Hearthstone's success stems from making the UI feel like a physical board game box — trays, slots, tangible zones. Cards should feel like objects you pick up and place, not abstract data.

3. **Progressive disclosure**: Show only the actions relevant to the current game state. During Main Phase, show playable cards highlighted. During Block Step, only Blocker characters are interactive. Reduces cognitive load.

4. **Information proximity**: Group related info near its zone (Hearthstone principle). DON!! count next to DON!! area, life count next to life cards, power on the card itself. Avoid spreading stats across the screen.

5. **Auto-advance non-interactive phases**: Refresh, Draw, and DON!! phases require no player input — animate them automatically and land on Main Phase. This keeps the game flowing without unnecessary clicks.

#### Unified Interaction Model

Every interaction follows **one consistent pattern**: click to select → action bar appears → choose action → resolve. This avoids conflicting meanings of "click" across different contexts.

**Core rule: Single-click always means "select."** It never directly plays, attacks, or triggers a game action. The selected card gets an action bar showing what you can do with it. This is discoverable for new users and fast for experienced users (who will learn the keyboard shortcuts).

#### Selecting a Card

```
Click any card → That card is "selected"
  → Card visually lifts with a highlight border
  → Contextual action bar appears above/below the card
  → Only valid actions shown based on card location + game state

Click a different card → Selection switches to the new card
Click empty space → Deselects (returns to neutral state)
Escape → Always deselects / returns to neutral (never makes a game decision)
```

**Action bar examples by context:**

| Card location | Game state | Actions shown |
|---------------|------------|---------------|
| Your hand | Main Phase, can afford | **[Play]** [Inspect] |
| Your hand | Main Phase, can't afford | [Inspect] *(Play is grayed with cost hint)* |
| Your hand | Counter Step | **[Counter]** [Inspect] |
| Your active Character | Main Phase | **[Attack]** [Inspect] |
| Your rested Character | Main Phase | [Inspect] |
| DON!! pool | Main Phase, DON available | **[Attach]** |
| Opponent's card | Any | [Inspect] |
| Trash pile | Any | **[Browse]** |

#### Playing a Card from Hand

```
Click card in hand → Action bar: [Play] [Inspect]
  → Click [Play]
  → Card auto-plays to the correct zone (Character → field, Stage → stage, Event → resolves)
  → DON!! cost auto-paid (DON!! in cost area dim one by one)
  → On Play effects trigger
```
- Zone is determined by card type — no need to click a drop zone
- If character zone is full (5), a prompt appears: "Select a character to trash" → click one → original card plays
- Playable cards have a subtle glow during Main Phase
- Unaffordable cards show [Play] grayed out with "Need X DON!!" tooltip
- **Drag alternative**: Dragging a card from hand to the field also plays it (skips the action bar)

#### Attaching DON!!

"Pick up chips, then place" — batch multiple DON!! before choosing a target.

```
Click DON!! pool → Action bar: [Attach]
  → Click [Attach] → Enters attach mode, badge appears: "◆ x1"
  → Click DON!! pool again → "◆ x2"
  → Click DON!! pool again → "◆ x3"

  → Click any Character or Leader to place the entire batch
  → Mode exits automatically after placing
  → Escape → Returns all picked-up DON!! to pool, exits mode
```

- Floating badge near cursor: `◆ x3` — always visible while holding DON!!
- DON!! count in cost area decrements live (restores if cancelled)
- On attach: "+3000" floats up, DON!! diamonds (◆◆◆) appear below the card
- To attach to multiple targets: complete one batch → click DON!! pool → start another
- Mode exits after each placement so you never get stuck in an invisible state

#### Declaring an Attack

```
Click your active Character or Leader → Action bar: [Attack] [Inspect]
  → Click [Attack] → Enters targeting mode
  → Valid targets highlight on opponent's side (Leader + rested Characters)
  → Click a target → Attack resolves (arrow animation, attacker rests)
  → Click empty space or Escape → Cancels targeting, returns to neutral
```

- Power comparison preview on hover over target before confirming: `Your 7000 → Their 5000`
- Invalid targets are dimmed and unclickable
- Clicking one of your other characters while in targeting mode → cancels and selects the new character instead (natural flow for changing your mind)

#### Battle Response Steps (Block & Counter)

Block and Counter are **game decisions, not cancellable actions** — so they use dedicated buttons instead of Escape.

**Block Step**
```
Prompt panel appears: "Block with a character?"
  → Two clear buttons: [Decline Block]  [Select Blocker ▾]
  → If choosing to block: eligible Blocker characters pulse/glow
  → Click a glowing Blocker → it rests and becomes the new target
  → If no eligible Blockers → step auto-skips entirely
```
- Escape does nothing during this prompt (prevents accidental game decisions)
- The prompt is a distinct panel, not a tooltip — clearly a "your turn to respond" moment

**Counter Step**
```
Prompt panel: "Play counter cards?"
  → Power comparison displayed: Attacker 8000 vs Defender 5000
  → Hand cards with Counter values are highlighted and interactive
  → Click cards to toggle selection (selected cards slide up)
  → Running total updates live: Defender 5000 + 2000 + 1000 = 8000
  → Two buttons: [Confirm Counters]  [Pass]
  → Escape → Deselects all selected cards (but does NOT pass)
```
- Escape is safe here: it only deselects, never passes. You must explicitly click [Pass] to decline countering.
- Clicking a selected card again deselects it
- [Confirm Counters] is disabled until at least 1 card is selected (prevents accidental empty confirm)

#### Trigger Activation

```
Life card flips face-up with zoom animation
  → If card has [Trigger]: panel shows card + effect text
    → Two buttons: [Activate Trigger]  [Add to Hand]
  → If no [Trigger]: card auto-moves to hand after brief reveal (0.5s)
```
- Escape does nothing (must choose a button)
- Effect text displayed prominently so you can make an informed decision

#### Card Inspection

Viewing card details is **always non-destructive** and never conflicts with game actions:

- **Hover (0.3s delay)**: Card scales up ~1.5x in place showing full effect text, power, counter value. Positioned to avoid screen edges.
- **[Inspect] from action bar**: Opens a full card detail modal — large image, complete text, keywords explained.
- **Right-click any card**: Also opens the detail modal (shortcut for experienced users).
- **Opponent's hand** (self-play): Face-down by default. Optional toggle to peek.

#### Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Space` | End Phase / advance to next phase | Main Phase / End Phase |
| `Enter` | End Turn | Main Phase |
| `Escape` | Deselect / cancel targeting / exit mode | Always safe, never a game decision |
| `Ctrl+Z` | Undo last action | Main Phase |
| `L` | Toggle action log panel | Any |
| `Right-click` | Inspect card (open detail modal) | Any card |

#### Design Rationale Summary

| Problem identified | Solution |
|---|---|
| Click meant "play" in hand, "attack" on field, "view" on hover — three meanings | Click always means "select." Actions come from the action bar. |
| Contextual action bar competed with direct-click flows | Action bar IS the unified flow. All actions route through it. |
| DON!! attach mode was invisible after placing a batch | Mode exits after each placement. No hidden states. |
| Escape meant "cancel" sometimes but "decline block" / "pass counters" other times | Escape is always safe — only deselects/cancels, never makes game decisions. Block and Counter use explicit buttons. |
| "Click a zone" to play a card was an unnecessary step | Zone is auto-determined by card type. Click [Play] and it goes to the right place. |
| Attack flow had no explicit cancel | Click empty space or Escape cancels targeting. Clicking another of your cards switches selection. |

#### Self-Play Turn Switching

Since both players are the same person:

```
┌──────────────────────────────────────┐
│  ⟳ Switching to Player 2's turn...  │   ← Full-width banner, 1s pause
│                                      │      Board rotates/swaps perspective
└──────────────────────────────────────┘
```

- Brief transition animation (board flips or slides) to create mental separation
- Active player's side is always at the bottom
- Inactive player's hand is hidden (face-down) by default
- Phase bar highlights whose turn it is with player color

### 7.3 Visual Feedback

**Card States**
- **Playable**: Subtle green glow/shimmer border during Main Phase (only cards you can afford)
- **Selected**: Lifts up with a shadow, brighter border, slight scale (1.05x)
- **Dragging**: Follows cursor at 0.8x scale, original position shows ghost outline
- **Rested**: Smooth 90° clockwise rotation (Framer Motion spring animation)
- **Hovered**: Slight lift (translateY -4px) + shadow increase, scale 1.02x

**Zone States**
- **Valid drop zone**: Soft green glow pulsing when a card is selected/dragged
- **Invalid zone**: Dimmed (opacity 0.5), no interaction cursor
- **Active zone**: Normal appearance
- **Targeted zone**: Bright border highlight when in targeting mode

**Battle Feedback**
- **Attack arrow**: Animated dashed line from attacker to target, with arrowhead
- **Power comparison**: Floating overlay between the two cards: `8000 vs 5000` with color coding (green = winning, red = losing)
- **Damage**: Screen edge flash (red), life card flips with 3D rotation
- **KO**: Card shatters/dissolves, pieces drift toward trash zone
- **Counter applied**: Counter value floats up from hand card to defender with "+2000" text

**DON!! Feedback**
- **Attachment**: DON!! icon flies from cost area to target card, lands with small burst
- **Count display**: DON!! attached shown as small diamond icons below the card (e.g., ◆◆ = 2 DON!!)
- **Cost payment**: When playing a card, DON!! in cost area dim one by one as cost is paid

**Turn & Phase**
- **Phase bar**: Current phase is highlighted and enlarged; completed phases are grayed
- **Auto-advance**: Refresh/Draw/DON phases animate quickly (cards untap, card draws, DON!! appears) with no player input needed
- **Turn notification**: Player color banner + text slides in from top

---

## 8. Implementation Plan

### Phase 0: Project Scaffold (3 days)

```
Deliverable: Running dev server, routing, empty page shells
```

- [ ] `git init`, initial commit
- [ ] `npm create vite@latest . -- --template react-ts`
- [ ] Install all dependencies (see Section 3.2)
- [ ] Configure Tailwind v4, ESLint, Prettier
- [ ] Create folder structure per Section 4.3
- [ ] Set up React Router with 3 routes: `/`, `/deck-builder`, `/play`
- [ ] Create placeholder page components
- [ ] Verify build + dev server works

### Phase 1: Card Data Layer (4 days)

```
Deliverable: Card browser page showing all 118 OP01 cards with search/filter
```

- [ ] Examine OPTCG API response format: `GET https://www.optcgapi.com/api/sets/OP01/`
- [ ] Define `CardData` TypeScript interface matching API response
- [ ] Build `cardService.ts`: fetch → normalize → cache in IndexedDB
- [ ] Create fallback `op01/cards.json` static data (in case API is down)
- [ ] Build `<Card>` component: card face with image, hover to enlarge
- [ ] Build `<CardGrid>` component: responsive grid of cards
- [ ] Build `<FilterBar>`: search by name, filter by color/type/cost/attribute
- [ ] Build `CardsPage.tsx` composing the above
- [ ] Add card detail modal (click to view full card)

### Phase 2: Deck Builder (5 days)

```
Deliverable: Fully functional deck builder with validation, save/load
```

- [ ] Build `DeckBuilder.tsx` layout: card pool (left) + deck list (right)
- [ ] Add leader selection step (filter to Leaders only)
- [ ] After leader selection, filter card pool to leader's color(s)
- [ ] Implement add/remove cards (click to add, click to remove)
- [ ] Add drag-and-drop between pool and deck list
- [ ] Implement validation with real-time feedback:
  - 50 cards exactly
  - Max 4 copies per card code
  - Color restriction based on leader
- [ ] Build `DeckStats.tsx`: cost curve bar chart, color pie chart, type breakdown
- [ ] Build deck save/load with localStorage
- [ ] Build deck list page (view all saved decks, rename, delete, duplicate)
- [ ] Add deck export/import as text format

### Phase 3: Game Engine Core (7 days)

```
Deliverable: Engine that can process a full game from setup to win condition (no UI, tested via unit tests)
```

- [ ] Implement all types from Section 5 (`types.ts`)
- [ ] Implement game initialization:
  - Create `GameState` from two `Deck` objects
  - Shuffle decks (Fisher-Yates)
  - Deal 5 cards each
  - Set life cards from deck top
  - Initialize DON!! decks (10 each)
- [ ] Implement mulligan logic
- [ ] Implement `turnManager.ts`:
  - Phase state machine with transitions
  - First turn special rules (no draw for P1, 1 DON for P1, no attacks)
  - Auto-advance through Refresh → Draw → DON (player choice starts at Main)
- [ ] Implement `rules.ts` — `validateAction()`:
  - Can play this card? (enough DON, correct phase, field limit)
  - Can attack? (active character, valid target, not turn played unless Rush)
  - Can block? (has Blocker, not rested, not already attack target)
- [ ] Implement `processor.ts` — `processAction()`:
  - PLAY_CARD: Rest DON, move card to field, trigger On Play
  - ATTACH_DON: Move DON from cost area to card
  - DECLARE_ATTACK: Start battle, transition to ATTACK step
  - ADVANCE_PHASE / END_TURN
- [ ] Implement `battleManager.ts`:
  - Full attack → block → counter → damage pipeline
  - Power calculation (base + DON attached * 1000 + modifiers + counter)
  - Damage resolution (life → hand + trigger, or character KO)
  - Double Attack and Banish handling
- [ ] Implement win condition detection (0 life + hit, or deck-out)
- [ ] Write comprehensive unit tests:
  - Full game simulation (setup → turns → win)
  - Edge cases: field limit, 0 power, first turn rules
  - Battle scenarios: block, counter, double attack, banish

### Phase 4: Game Board UI (7 days)

```
Deliverable: Interactive board that renders game state and accepts player input via drag-and-drop and clicks
```

- [ ] Build `GameBoard.tsx` with two `PlayerSide` components
- [ ] Build all zone components:
  - `LeaderZone`: Leader card + life count
  - `CharacterZone`: 5 slots, shows rested state (90° rotation)
  - `DonZone`: Shows active DON count, clickable to attach
  - `HandZone`: Fan layout, cards draggable
  - `LifeZone`: Face-down card stack
  - `TrashZone`: Clickable, opens browse modal
- [ ] Integrate @dnd-kit:
  - Cards in hand are `Draggable`
  - Character zone and field are `Droppable`
  - Highlight valid drop zones based on card type and available DON
  - On drop: dispatch `PLAY_CARD` action to engine
- [ ] Build DON attachment interaction:
  - Click DON in cost area → enters "attach mode" → click target card
  - Visual feedback: target cards glow
- [ ] Build attack interaction:
  - Click active character → enters "attack mode" → click valid target
  - Show attack arrow animation
- [ ] Build `PhaseBar.tsx`: clickable phase indicator, "End Phase" / "End Turn" buttons
- [ ] Build `ActionLog.tsx`: scrollable log of game actions
- [ ] Build `CounterModal.tsx`: shows during counter step, select cards from hand
- [ ] Build `TriggerModal.tsx`: shows when life is taken, activate or decline
- [ ] Wire keyboard shortcuts: Space (end phase), Enter (end turn), Escape (cancel)
- [ ] Add Framer Motion animations:
  - Card play: hand → field with arc motion
  - Card flip: 3D rotation for reveal
  - KO: fade + scale down → slide to trash
  - Rest/activate: smooth 90° rotation

### Phase 5: Effect System + OP01 Cards (8 days)

```
Deliverable: All OP01 card effects automated and playable
```

- [ ] Build `effects/resolver.ts`: effect queue with FIFO processing
- [ ] Build `effects/common.ts`: all effect primitives (draw, power buff, KO, search, etc.)
- [ ] Build `effects/registry.ts`: maps card IDs to `EffectDefinition[]`
- [ ] Build UI for effect choices:
  - Card selection modal (for "search deck", "choose a character")
  - Yes/No prompt (for optional effects)
- [ ] Implement keyword effects in engine rules (no registry needed):
  - Blocker, Rush, Double Attack, Banish
  - Counter +X000
- [ ] Implement all OP01 Leader effects (~8 leaders):
  - OP01-001 Roronoa Zoro (Red)
  - OP01-002 Monkey D. Luffy (Red)
  - ... all 8 OP01 leaders
- [ ] Implement all OP01 Character effects (~80 characters)
- [ ] Implement all OP01 Event effects (~15 events)
- [ ] Implement all OP01 Stage effects (~5 stages)
- [ ] Implement all OP01 Trigger effects
- [ ] Write effect-specific unit tests for each card
- [ ] Playtest each OP01 archetype (Red aggro, Blue control, Green ramp, Purple trash)

### Phase 6: Self-Play Mode + Polish (5 days)

```
Deliverable: Polished V1 — complete self-play experience
```

- [ ] Build game setup flow:
  - Select deck for Player 1
  - Select deck for Player 2
  - Start game → board
- [ ] Implement "switch sides" indicator (highlight whose turn it is)
- [ ] Hide opponent's hand when it's not their turn (optional for self-play)
- [ ] Add game-over screen with stats (turns, cards played, damage dealt)
- [ ] Add "New Game" and "Rematch" buttons
- [ ] Performance optimization:
  - `React.memo` on card components
  - Lazy load card images with placeholder
  - Virtualize hand if > 10 cards
- [ ] Responsive layout adjustments for common screen sizes (1280px+)
- [ ] Add loading states and error boundaries
- [ ] Final round of playtesting and bug fixes
- [ ] Deploy to Vercel

---

## 9. Future Phases

### P1: AI Opponent (4-6 weeks)

**Architecture**: AI implements the `PlayerAdapter` interface and runs in a Web Worker to avoid blocking the UI.

**Approach (tiered difficulty)**:

| Difficulty | Strategy |
|------------|----------|
| Easy | Random legal action selection |
| Medium | Rule-based heuristics: play on curve, attack when favorable, block critical hits |
| Hard | Monte Carlo Tree Search (MCTS): simulate N random game continuations from current state, pick action with best win rate |

**Implementation**:
1. `aiAdapter.ts` implementing `PlayerAdapter`
2. Heuristic scoring functions:
   - Board advantage (total power on field)
   - Hand advantage (card count)
   - Life advantage
   - Tempo (DON!! efficiency)
3. MCTS engine in Web Worker:
   - 1000-5000 simulations per decision
   - Random rollout with heuristic evaluation at leaf
   - UCB1 for exploration/exploitation balance
4. AI "thinking" indicator in UI
5. Adjustable thinking time / simulation count per difficulty

### P2: Online Multiplayer (6-8 weeks)

**Architecture changes**:
- Game engine runs on server (authoritative)
- Clients send actions via WebSocket
- Server validates, applies, and broadcasts state updates
- Client renders state received from server

**Components**:
1. Backend API server (Hono/Express + Socket.IO)
2. Auth system (Lucia Auth)
3. PostgreSQL schema: users, decks, matches, ratings
4. Redis: active game state, matchmaking queue
5. Lobby system: create/join rooms, friend invites
6. Matchmaking: casual queue, ranked (ELO)
7. Spectator mode: read-only WebSocket subscription
8. Reconnection handling: server holds state, client resumes
9. Match history and replay viewer

---

## 10. Testing Strategy

| Layer | Tool | What to Test |
|-------|------|-------------|
| Engine unit tests | Vitest | Every rule, every phase transition, every effect, every edge case |
| Engine integration | Vitest | Full game simulations: setup → play → win |
| Component tests | React Testing Library | Zone components render correct cards, interactions dispatch correct actions |
| E2E tests | Playwright | Full game flow: build deck → start game → play turns → win |
| Effect regression | Vitest | One test per OP01 card verifying its effect works correctly |

**Testing priority for engine**: The game engine should have near-100% coverage since it's pure logic with no DOM dependency. This is the foundation everything else depends on.

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OPTCG API goes down or changes | High | Ship static `cards.json` fallback for OP01; check API on load, fall back gracefully |
| Effect interactions create bugs | High | Exhaustive per-card unit tests; effect queue with clear resolution order; manual override button for edge cases |
| @dnd-kit performance with many cards | Medium | Limit active draggables (only hand cards); use `useMemo` for collision detection config |
| Scope creep to more sets | Medium | Architecture supports it (effect registry per set), but V1 deadline is OP01 only |
| Card image hosting / bandwidth | Medium | Lazy load, use OPTCG API image URLs directly, consider caching via service worker |

---

## 12. Resources

### Card Data
- **Card data**: Static `src/data/op01/cards.json` — hand-curated JSON dataset for OP01 (118 cards, non-alternate art only)
- **Card images**: [Limitless TCG CDN](https://onepiece.limitlesstcg.com/cards) — high-quality card images
  - URL pattern: `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/OP01/{CARD_ID}_EN.webp`
  - Example: `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/OP01/OP01-001_EN.webp`
- [onepiece-cardgame.dev](https://onepiece-cardgame.dev/cards?f=%24R+%28srcN%3A%22Romance+Dawn+%5BOP-01%5D%22%29) — OP01 card browser (visual reference)

### Card Data Rules
- **Non-alternate art only**: Only include base art versions of cards. Filter out alternate art / parallel art variants. Each card ID (e.g., OP01-024) should have exactly one entry.
- **No external API dependency**: Card data ships as static JSON. No runtime API calls needed for card info. Images loaded from Limitless CDN.

### Official Rules
- [Official Rules Page](https://en.onepiece-cardgame.com/rules/)
- [Comprehensive Rules PDF v1.2.0](https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf)
- [OP01 Q&A Rulings](https://en.onepiece-cardgame.com/pdf/qa_op01.pdf)

### Reference Projects
- [MOOgiwara](https://github.com/BAA-Studios/MOOgiwara) — Open-source OP TCG simulator (Phaser + Socket.IO + TypeScript)
- [OPTCG Sim](https://optcgsim.com/) — Desktop simulator (reference for UX)
- [PTCG Sim](https://github.com/xxmichaellong/ptcg-sim) — Pokemon TCG sim (architecture reference)

### Libraries
- [@dnd-kit Docs](https://docs.dndkit.com/)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Vitest Docs](https://vitest.dev/)

---

## 13. Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 0: Project Scaffold | 3 days | 3 days |
| 1: Card Data Layer | 4 days | 1 week |
| 2: Deck Builder | 5 days | 2 weeks |
| 3: Game Engine Core | 7 days | 3.5 weeks |
| 4: Game Board UI | 7 days | 5 weeks |
| 5: Effects + OP01 Cards | 8 days | 6.5 weeks |
| 6: Self-Play + Polish | 5 days | **8 weeks (V1)** |
| P1: AI Opponent | 4-6 weeks | ~14 weeks |
| P2: Online Multiplayer | 6-8 weeks | ~22 weeks |

**V1 target: ~8 weeks** (aggressive but achievable with focused effort and AI-assisted coding)
