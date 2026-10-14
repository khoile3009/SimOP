import { useState } from 'react'
import type { GameState, GameCard, PlayerId, PendingChoice } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getCardImageUrl } from '@/utils/images'

interface ChoicePromptProps {
  gameState: GameState
  onChoose: (instanceIds: string[]) => void
}

/**
 * Bottom-sheet picker for hidden-zone choices (deck reveals, trash, life, DON
 * piles) - the zones with nothing on the board to click. Renders the option
 * cards and enforces min/max/exact; the board stays visible above the sheet.
 * Field and hand choices never come here: they pick in place.
 *
 * DON!! choices get the CLASS picker: DON are fungible within (zone, carrier,
 * state), so the user picks counts per class, never "which physical DON".
 * Forced sets (options <= min) arrive pre-selected for a one-tap confirm.
 */
export default function ChoicePrompt({ gameState, onChoose }: ChoicePromptProps) {
  const choice = gameState.pendingChoice!
  const forced = choice.min > 0 && choice.options.length <= choice.min

  const [selected, setSelected] = useState<string[]>(forced ? [...choice.options] : [])
  // New choice while mounted: reset during render (React derive-state pattern)
  const [prevChoice, setPrevChoice] = useState<PendingChoice | null>(choice)
  if (choice !== prevChoice) {
    setPrevChoice(choice)
    setSelected(forced ? [...choice.options] : [])
  }

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < choice.max
          ? [...prev, id]
          : prev,
    )
  }

  const sizeOk =
    selected.length >= choice.min &&
    selected.length <= choice.max &&
    (!choice.exact || selected.length === choice.min || selected.length === choice.max)

  const confirm = () => {
    onChoose(selected)
    setSelected([])
  }

  // DON!! class picker: group fungible DON by (zone, state, carrier)
  const resolved = choice.options.map((id) => ({ id, card: findInstance(gameState, id) }))
  const allDon = resolved.every(
    ({ id, card }) => id.startsWith('attached:') || card?.cardId === 'DON',
  )
  const donClasses = allDon ? groupDonClasses(gameState, choice.options) : null

  const setClassCount = (ids: string[], count: number) => {
    setSelected((prev) => {
      const inClass = new Set(ids)
      const kept = prev.filter((x) => !inClass.has(x))
      const roomTotal = choice.max - kept.length
      return [...kept, ...ids.slice(0, Math.max(0, Math.min(count, roomTotal)))]
    })
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2 z-40 flex justify-center px-3">
      <div className="glass-panel pointer-events-auto flex max-h-[45vh] max-w-2xl flex-col items-center gap-3 overflow-y-auto border border-glass-border-hover bg-ocean-900/95 p-4 shadow-2xl">
        <p className="max-w-md text-center text-sm font-medium">{choice.prompt}</p>
        <p className="text-xs text-text-muted">
          {choice.min === choice.max
            ? `Choose ${choice.max}`
            : choice.exact
              ? `Choose ${choice.min} or ${choice.max}`
              : `Choose ${choice.min}-${choice.max}`}
          {` · ${gameState.pendingChoice!.playerId === 'player1' ? 'Player 1' : 'Player 2'} decides`}
        </p>

        {donClasses ? (
          <div className="flex w-full max-w-sm flex-col gap-2">
            {donClasses.map((cls) => {
              const picked = selected.filter((id) => cls.ids.includes(id)).length
              return (
                <div
                  key={cls.key}
                  className="flex items-center justify-between gap-3 rounded bg-ocean-800/70 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-don-gold">◆</span>
                    {cls.label}
                    <span className="text-xs text-text-muted">×{cls.ids.length}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <button
                      onClick={() => setClassCount(cls.ids, picked - 1)}
                      disabled={picked === 0}
                      className="h-7 w-7 rounded bg-ocean-700 text-sm font-bold hover:bg-ocean-600 disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm tabular-nums">{picked}</span>
                    <button
                      onClick={() => setClassCount(cls.ids, picked + 1)}
                      disabled={picked >= cls.ids.length || selected.length >= choice.max}
                      className="h-7 w-7 rounded bg-ocean-700 text-sm font-bold hover:bg-ocean-600 disabled:opacity-30"
                    >
                      +
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex max-w-xl flex-wrap justify-center gap-2">
            {resolved.map(({ id, card }) => {
              const isSelected = selected.includes(id)
              const border = isSelected ? 'ring-2 ring-action-green' : 'ring-1 ring-glass-border'
              if (!card) return null
              const data = getCardById(card.cardId)
              return (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  className={`w-20 overflow-hidden rounded ${border}`}
                >
                  <img
                    src={getCardImageUrl(card.cardId)}
                    alt={data?.name ?? ''}
                    className="w-full"
                    draggable={false}
                  />
                </button>
              )
            })}
          </div>
        )}

        <div className="flex gap-3">
          {choice.min === 0 && (
            <button
              onClick={() => {
                setSelected([])
                onChoose([])
              }}
              className="rounded bg-ocean-700 px-4 py-1.5 text-sm font-medium hover:bg-ocean-600"
            >
              Choose none
            </button>
          )}
          <button
            onClick={confirm}
            disabled={!sizeOk}
            className="rounded bg-action-green px-4 py-1.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-40"
          >
            Confirm ({selected.length})
          </button>
        </div>
      </div>
    </div>
  )
}

interface DonClass {
  key: string
  label: string
  ids: string[]
}

/** DON are fungible within (zone, state, carrier): one row per class. */
function groupDonClasses(state: GameState, options: string[]): DonClass[] {
  const classes = new Map<string, DonClass>()
  for (const id of options) {
    let key: string
    let label: string
    if (id.startsWith('attached:')) {
      const carrierId = id.split(':')[1]
      const carrier = findInstance(state, carrierId)
      const name = carrier ? (getCardById(carrier.cardId)?.name ?? 'a card') : 'a card'
      key = `attached:${carrierId}`
      label = `Given to ${name}`
    } else {
      const don = findInstance(state, id)
      const rested = don?.isRested === true
      key = rested ? 'cost:rested' : 'cost:active'
      label = rested ? 'Cost area · rested' : 'Cost area · active'
    }
    const cls = classes.get(key) ?? { key, label, ids: [] }
    cls.ids.push(id)
    classes.set(key, cls)
  }
  return [...classes.values()]
}

function findInstance(state: GameState, instanceId: string): GameCard | null {
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    for (const zone of [
      [p.leader],
      p.characters,
      p.hand,
      p.trash,
      p.donArea,
      p.lifeCards,
      p.deck,
    ]) {
      const card = zone.find((c) => c.instanceId === instanceId)
      if (card) return card
    }
  }
  return null
}
