# SimPiece

A web-based One Piece Trading Card Game simulator with drag-and-drop gameplay, automated card effects, and a deck builder.

Built for solo practice (local self-play controlling both sides), with an architecture designed to extend to AI opponents and online multiplayer.

## Features

- Full game loop: mulligan, 5-phase turns (Refresh, Draw, DON!!, Main, End), battle sequence (Attack, Block, Counter, Damage)
- Drag-and-drop: drag hand cards to field to play, drag characters to opponents to attack (with arrow visualization)
- Click-first alternative: every drag action also works via click + popup menu
- Counter step UI: select counter cards from hand during battle to boost defender power
- DON!! attachment: click DON pool then click a character/leader to power them up
- Life system with trigger effects
- OP01 (Romance Dawn) card set with images from Limitless TCG CDN
- Pure game engine with full rule validation — deterministic, framework-agnostic, testable

## Tech Stack

React 19, TypeScript (strict), Vite, Zustand, @dnd-kit, TailwindCSS v4, Framer Motion, Vitest

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type check + production build |
| `npm run test` | Run tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier format |

## Architecture

```
src/
├── engine/       Pure game engine (zero React imports)
│                 GameState + GameAction → new GameState
├── data/         Card data (static JSON) + effect registry
├── store/        Zustand stores (game state, UI state)
├── adapters/     Player input abstraction (Human, AI, Remote)
├── components/   React UI (game board, deck builder, common)
├── hooks/        React hooks (drag, card data, game engine)
└── utils/        Pure helpers (shuffle, IDs, image URLs)
```

The game engine is a pure function: it takes a `GameState` and a `GameAction` (serializable discriminated union) and returns a new `GameState`. This enables unit testing without DOM, deterministic replays, and reuse across AI/network layers.

See [ARCHITECTURE_AND_PLAN.md](./ARCHITECTURE_AND_PLAN.md) for the full spec.

## Roadmap

| Milestone | Scope |
|-----------|-------|
| **V1** | OP01 set, local self-play, deck builder, automated effects |
| **P1** | AI opponent (rule-based + MCTS) |
| **P2** | Online multiplayer via WebSocket |
