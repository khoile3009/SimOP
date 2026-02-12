# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SimPiece is a web-based One Piece Trading Card Game (TCG) simulator. V1 scope: OP01 set, local self-play (both sides), deck builder, automated card effects. Future: AI opponent (P1), online multiplayer (P2).

## Architecture

See `ARCHITECTURE_AND_PLAN.md` for the full spec. Key architectural decisions:

- **Pure Game Engine**: `src/engine/` is framework-agnostic TypeScript with zero React imports. It takes a `GameState` + `GameAction` and returns a new `GameState`. This enables unit testing without DOM, reuse for AI/network, and deterministic replays.
- **Command Pattern**: Every game action is a serializable discriminated union (`GameAction`). Enables undo, replay, network sync.
- **Player Adapter Pattern**: `PlayerAdapter` interface abstracts input source (Human UI, AI, Remote WebSocket) so the engine doesn't care where actions come from.
- **Zustand as thin glue**: Zustand store holds `GameState` and dispatches to the engine. React components subscribe to state slices.
- **Effect Registry**: Card effects are registered per card ID (not parsed from text). Each set has its own effect file (`src/data/op01/effects.ts`).

## Tech Stack

React 18 + TypeScript (strict) + Vite + Zustand + @dnd-kit + TailwindCSS v4 + Framer Motion + Vitest

## Card Data

Card data comes from the [OPTCG API](https://optcgapi.com/) (free, no auth, GET-only). Key endpoint: `GET https://www.optcgapi.com/api/sets/OP01/`. Cached locally in IndexedDB with a static `src/data/op01/cards.json` fallback. Visual card reference: [onepiece-cardgame.dev](https://onepiece-cardgame.dev/cards?f=%24R+%28srcN%3A%22Romance+Dawn+%5BOP-01%5D%22%29).

**Important**: Only use non-alternate (base) art versions of cards. Filter out alternate/parallel art variants. Each card ID (e.g., OP01-024) should have exactly one entry.

## Game Rules Reference

The authoritative rules spec is in `ARCHITECTURE_AND_PLAN.md` Section 2. Critical rules to keep in mind when implementing:
- First player: no draw on turn 1, only 1 DON on turn 1, neither player attacks on turn 1
- Battle sequence is 4 steps: Attack → Block → Counter → Damage (all within Main Phase)
- Counter cards are played from hand only (no cost), field characters cannot counter
- Max 5 characters on field; playing a 6th requires trashing one (no When KO'd trigger)
- Characters at 0 power are NOT destroyed (only via battle loss or explicit KO effects)
- Life damage: life card goes to hand, player may optionally activate its Trigger effect
- DON attached to characters returns to cost area (rested) at End Phase
