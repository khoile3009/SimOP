import { runGame } from './selfplay'
import { getBaseDeck } from './baseDecks'
import { GreedyAgent } from '@/ai/agents'
import { MctsAgent, type MctsSearchInfo } from '@/ai/mcts'
import { featureVector, type EvalFn } from '@/ai/evaluate'
import { mulberry32 } from '@/utils/rng'

/**
 * The eval adoption gate (BOT_PLAN): seat-swapped matches on the frozen base
 * deck pairs with BOTH consumers - greedy (1-ply) and MCTS (deep search, the
 * consumer that exposed every rejected generation). Shared by the ad-hoc gate
 * script and the league runner.
 *
 * Data flywheel (BOT_PLAN 4.5): MCTS legs log what their searches compared -
 * gen3-format pairwise + bootstrap rows with game outcomes - through the
 * caller-provided sink (scripts append to data/flywheel.jsonl), so the training
 * corpus grows as a side effect of routine gating. Game ids are
 * timestamp-derived to stay unique across appended runs.
 */

export const GATE_DECK_PAIRS: [string, string][] = [
  ['base-enel', 'base-luffy-bg'],
  ['base-teach', 'base-ace-red'],
  ['base-kalgara', 'base-lucy'],
]

export interface LegResult {
  newWins: number
  oldWins: number
}

export interface GateResult {
  greedy: LegResult
  mcts: LegResult
}

export function legPct(leg: LegResult): number {
  return (100 * leg.newWins) / Math.max(1, leg.newWins + leg.oldWins)
}

export type FlywheelSink = (jsonlLine: string) => void

export function runGate(
  NEW: EvalFn,
  OLD: EvalFn,
  opts: { gamesGreedy?: number; gamesMcts?: number; flywheelSink?: FlywheelSink } = {},
): GateResult {
  const { gamesGreedy = 50, gamesMcts = 12, flywheelSink } = opts

  const greedy = runLeg(
    gamesGreedy,
    (ev, rand) => () => new GreedyAgent(rand(), ev),
    NEW,
    OLD,
    null,
  )
  const mcts = runLeg(
    gamesMcts,
    (ev, rand, onSearch) => () => new MctsAgent(rand(), { evalFn: ev, onSearch }),
    NEW,
    OLD,
    flywheelSink ?? null,
  )
  return { greedy, mcts }
}

type AgentMaker = (
  ev: EvalFn,
  rand: () => () => number,
  onSearch?: (info: MctsSearchInfo) => void,
) => () => import('@/ai/agents').Agent

function runLeg(
  games: number,
  make: AgentMaker,
  NEW: EvalFn,
  OLD: EvalFn,
  log: FlywheelSink | null,
): LegResult {
  let newWins = 0
  let oldWins = 0
  // Unique-by-run game ids so by-game corpus splits stay valid across appends
  let gameId = (Date.now() % 1_000_000_000) * 100

  for (const [l1, l2] of GATE_DECK_PAIRS) {
    const d1 = getBaseDeck(l1)!
    const d2 = getBaseDeck(l2)!
    for (const newSeat of ['player1', 'player2'] as const) {
      for (let i = 0; i < games; i++) {
        const seed = (newSeat === 'player1' ? 11_000 : 77_000) + i * 101 + l1.length * 7
        const g = gameId++
        const rows: { line: object; actor: string }[] = []
        const onSearch = log
          ? (info: MctsSearchInfo) => {
              const [chosen, ...rest] = info.children
              if (!chosen || chosen.visits < 8) return
              const c = featureVector(chosen.state, info.actor)
              rows.push({ line: { k: 'b', g, f: c, v: chosen.value }, actor: info.actor })
              for (const r of rest.filter((x) => x.visits >= 8).slice(0, 3)) {
                rows.push({
                  line: { k: 'p', g, c, r: featureVector(r.state, info.actor) },
                  actor: info.actor,
                })
              }
            }
          : undefined
        const mkNew = make(NEW, () => mulberry32(seed ^ 0xa5a5a5), onSearch)
        const mkOld = make(OLD, () => mulberry32(seed ^ 0x5a5a5a), onSearch)
        const record = runGame({
          deck1: d1,
          deck2: d2,
          agent1: newSeat === 'player1' ? mkNew() : mkOld(),
          agent2: newSeat === 'player1' ? mkOld() : mkNew(),
          seed,
        })
        if (record.winner === newSeat) newWins++
        else if (record.winner) oldWins++
        if (log) {
          for (const row of rows) {
            const w = record.winner === null ? 0.5 : record.winner === row.actor ? 1 : 0
            log(JSON.stringify({ ...row.line, w }) + '\n')
          }
        }
      }
    }
  }
  return { newWins, oldWins }
}
